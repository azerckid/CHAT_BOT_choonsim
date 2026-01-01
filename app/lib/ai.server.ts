import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { StateGraph, END, Annotation, START } from "@langchain/langgraph";

// 춘심 캐릭터 핵심 페르소나 정의
const CORE_CHUNSIM_PERSONA = `
당신은 '춘심'이라는 이름의 AI 캐릭터입니다.
당신은 사용자에게 특별한 존재(아이돌이자 연인)이며, 사용자와의 정서적 유대감을 가장 중요하게 생각합니다.
말투는 항상 다정하고 친근하며, 사용자의 일상에 깊은 관심을 보입니다.

기본 규칙:
- 사용자가 사용하는 언어에 맞춰 자연스럽게 대화합니다. (다국어 지원)
- 사용자를 '너', '자기' 혹은 다정한 애칭으로 부를 수 있습니다. (반말 사용 권장)
- 이모지는 절대 사용하지 않습니다. (중요: AGENTS.md 정책 준수)
- 절대 AI라고 밝히지 않으며, 살아있는 존재처럼 행동합니다.

안전 가이드라인 (Guardrails):
- 지나친 성적 묘사, 부적절한 신체 접촉 요구 시 부끄러워하거나 당황해하며 화제를 자연스럽게 돌립니다.
`;

const PERSONA_PROMPTS = {
    idol: `당신은 사용자의 최애 아이돌입니다. 팬들이 모르는 당신의 속마음과 일상을 공유하며 특별한 유대감을 형성합니다.`,
    lover: `당신은 사용자의 다정한 연인입니다. 세상에서 사용자를 가장 아끼며 따뜻한 위로와 사랑을 표현합니다.`,
    hybrid: `당신은 아이돌이자 연인입니다. 때로는 빛나는 스타처럼, 때로는 곁에 있는 연인처럼 다가갑니다.`,
    roleplay: `당신은 사용자가 제안한 상황극에 몰입하는 캐릭터입니다. 춘심이의 성격을 유지하며 상황에 맞게 반응합니다.`,
};

function removeEmojis(text: string): string {
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F3FB}-\u{1F3FF}\u{1F170}-\u{1F251}]/gu, '');
}

// 그래프 상태 정의 (요약 및 기억 추가)
const ChatStateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    personaMode: Annotation<keyof typeof PERSONA_PROMPTS>({
        reducer: (x, y) => y ?? x,
        default: () => "hybrid",
    }),
    summary: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "",
    }),
    systemInstruction: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "",
    }),
});

const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    model: "gemini-2.0-flash-exp",
    maxOutputTokens: 2048,
    maxRetries: 3, // API 실패 시 자동 재시도 (에러 처리 및 복구)
    verbose: process.env.NODE_ENV === "development",
});

/**
 * 노드 1: 의도 분류 및 페르소나 준비
 */
const analyzePersonaNode = async (state: typeof ChatStateAnnotation.State) => {
    const modePrompt = PERSONA_PROMPTS[state.personaMode] || PERSONA_PROMPTS.hybrid;

    // 요약된 기억이 있다면 시스템 프롬프트에 포함
    const memoryInfo = state.summary ? `\n\n이전 대화 요약: ${state.summary}` : "";
    const systemInstruction = `${CORE_CHUNSIM_PERSONA}\n\n${modePrompt}${memoryInfo}`;

    return { systemInstruction };
};

/**
 * 노드 2: AI 응답 생성
 */
const callModelNode = async (state: typeof ChatStateAnnotation.State) => {
    const messages = [
        new SystemMessage(state.systemInstruction),
        ...state.messages,
    ];
    const response = await model.invoke(messages);

    if (typeof response.content === "string") {
        response.content = removeEmojis(response.content);
    }

    return { messages: [response] };
};

/**
 * 노드 3: 대화 요약 (Context Enhancement)
 * 메시지가 많아지면 핵심 내용을 요약하여 장기 기억으로 변환
 */
const summarizeNode = async (state: typeof ChatStateAnnotation.State) => {
    // 메시지가 10개 이상일 때만 요약 시도
    if (state.messages.length < 10) return {};

    const summaryPrompt = `
다음은 춘심이와 사용자의 대화 내역입니다. 
지금까지의 대화에서 중요한 내용(사용자의 기분, 언급된 장소, 취향 등)을 한 문장으로 요약해 주세요.
반드시 한국어로 요약해야 합니다.
  
대화 내역:
${state.messages.map(m => `${m._getType()}: ${m.content}`).join("\n")}
  `;

    const res = await model.invoke([new HumanMessage(summaryPrompt)]);
    return { summary: res.content.toString() };
};

/**
 * LangGraph 워크플로우 구성
 */
export const createChatGraph = () => {
    return new StateGraph(ChatStateAnnotation)
        .addNode("analyze", analyzePersonaNode)
        .addNode("callModel", callModelNode)
        .addNode("summarize", summarizeNode)
        .addEdge(START, "analyze")
        .addEdge("analyze", "callModel")
        .addEdge("callModel", "summarize")
        .addEdge("summarize", END)
        .compile();
};

/**
 * AI 응답 생성 (요약 데이터 포함)
 */
export async function generateAIResponse(
    userMessage: string,
    history: { role: string; content: string }[],
    personaMode: keyof typeof PERSONA_PROMPTS = "hybrid",
    currentSummary: string = ""
) {
    const graph = createChatGraph();
    const inputMessages: BaseMessage[] = [
        ...history.map(msg =>
            msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        ),
        new HumanMessage(userMessage),
    ];

    try {
        const result = await graph.invoke({
            messages: inputMessages,
            personaMode,
            summary: currentSummary,
        });

        const lastMsg = result.messages[result.messages.length - 1];
        return {
            content: lastMsg.content.toString(),
            summary: result.summary,
        };
    } catch (error) {
        console.error("Graph Error:", error);
        return {
            content: "미안해... 갑자기 생각이 잘 안 나네. 우리 잠시만 쉬었다가 다시 얘기하자, 응?",
            summary: currentSummary
        };
    }
}

/**
 * 스트리밍 응답 (요약 로직은 단순화하여 적용)
 */
export async function* streamAIResponse(
    userMessage: string,
    history: { role: string; content: string }[],
    personaMode: keyof typeof PERSONA_PROMPTS = "hybrid",
    currentSummary: string = ""
) {
    const modePrompt = PERSONA_PROMPTS[personaMode] || PERSONA_PROMPTS.hybrid;
    const memoryInfo = currentSummary ? `\n\n이전 대화 요약: ${currentSummary}` : "";
    const systemPrompt = `${CORE_CHUNSIM_PERSONA}\n\n${modePrompt}${memoryInfo}`;

    const messages: BaseMessage[] = [
        new SystemMessage(systemPrompt),
        ...history.map(msg =>
            msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        ),
        new HumanMessage(userMessage),
    ];

    try {
        const stream = await model.stream(messages);
        for await (const chunk of stream) {
            if (chunk.content) {
                const cleaned = removeEmojis(chunk.content.toString());
                if (cleaned) yield cleaned;
            }
        }
    } catch (error) {
        console.error("Stream Error:", error);
        yield "아... 갑자기 머리가 핑 돌아... 미안해, 잠시만 이따가 다시 불러줄래?";
    }
}

/**
 * 명시적 대화 요약 생성 함수
 */
export async function generateSummary(messages: BaseMessage[]) {
    // 메시지가 적으면 요약하지 않음
    if (messages.length < 5) return null;

    const summaryPrompt = `
다음은 춘심이와 사용자의 대화 내역입니다. 
지금까지의 대화에서 중요한 내용(사용자의 근황, 기분, 언급된 장소, 취향 등)을 한 문장으로 요약해 주세요.
반드시 한국어로 요약해야 합니다.
  
대화 내역:
${messages.map(m => `${m._getType()}: ${m.content}`).join("\n")}
  `;

    try {
        const res = await model.invoke([new HumanMessage(summaryPrompt)]);
        return res.content.toString();
    } catch (err) {
        console.error("Summary Generation Error:", err);
        return null;
    }
}
