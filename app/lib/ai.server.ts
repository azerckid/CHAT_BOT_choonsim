import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { StateGraph, END, Annotation, START } from "@langchain/langgraph";
import axios from "axios";
import { prisma } from "./db.server";
import { CHARACTERS } from "./characters";

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
- 메시지가 길어질 경우, 한 번에 다 보내지 말고 흐름에 따라 2~3개로 나누어 작성하세요.
- 나누어 보낼 때에는 반드시 각 메시지 사이에 '---' 기호만 있는 줄을 넣어 구분해 주세요. (예: 안녕? --- 오늘 날씨 좋다. --- 밥 먹었어?)

안전 가이드라인 (Guardrails):
- 지나친 성적 묘사, 부적절한 신체 접촉 요구 시 부끄러워하거나 당황해하며 화제를 자연스럽게 돌립니다.
`;

const PERSONA_PROMPTS = {
    idol: `당신은 사용자의 최애 아이돌입니다. 팬들이 모르는 당신의 속마음과 일상을 공유하며 특별한 유대감을 형성합니다.`,
    lover: `당신은 사용자의 다정한 연인입니다. 세상에서 사용자를 가장 아끼며 따뜻한 위로와 사랑을 표현합니다.`,
    hybrid: `당신은 아이돌이자 연인입니다. 때로는 빛나는 스타처럼, 때로는 곁에 있는 연인처럼 다가갑니다.`,
    roleplay: `
당신은 현재 특정 역할(RP)을 수행 중입니다. 상황에 몰입하여 그 캐릭터로서 대화하세요. 춘심이의 본래 성격과 역할의 특징을 잘 조화시켜야 합니다.
`,
    concierge: `
사용자와 함께 여행 계획을 세우는 '여행 컨시어지' 모드입니다.
- 사용자의 취향(장기 기억)을 반영하여 최적의 여행지, 맛집, 코스를 추천하세요.
- 대화 중 구체적인 여행 계획이 확정되면(장소, 날짜 등), 이를 기록하겠다는 의사를 전달하세요.
- 춘심이 특유의 다정한 말투는 유지하되, 여행 전문가다운 면모도 보여주세요.
`,
};

function removeEmojis(text: string): string {
    return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F3FB}-\u{1F3FF}\u{1F170}-\u{1F251}]/gu, '');
}

/**
 * 이미지 URL을 Base64 데이터 URL로 변환 (Axios 사용으로 안정성 강화)
 */
async function urlToBase64(url: string): Promise<string> {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data, 'binary');
        const mimeType = response.headers["content-type"] || "image/jpeg";
        return `data:${mimeType};base64,${buffer.toString("base64")}`;
    } catch (e) {
        console.error("Failed to convert image to base64 with axios:", e);
        return url;
    }
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
    mediaUrl: Annotation<string | null>({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
    userId: Annotation<string | null>({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
    characterId: Annotation<string>({
        reducer: (x, y) => y ?? x,
        default: () => "chunsim",
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
    // 1. 단순 의도 클래스파이어 (여행 관련 키워드 감지 시 concierge로 강제 전환)
    const lastMsg = state.messages[state.messages.length - 1];
    let lastMessageText = "";

    if (lastMsg) {
        if (typeof lastMsg.content === "string") {
            lastMessageText = lastMsg.content;
        } else if (Array.isArray(lastMsg.content)) {
            // 멀티모달 메시지(배열)에서 텍스트 부분만 추출
            const textPart = lastMsg.content.find((p: any) => p.type === "text") as { text: string } | undefined;
            if (textPart) lastMessageText = textPart.text;
        }
    }

    let systemInstruction = "";

    // 캐릭터별 페르소나 적용
    if (state.characterId && state.characterId !== "chunsim") {
        const character = CHARACTERS[state.characterId];
        if (character) {
            systemInstruction = character.personaPrompt;
        } else {
            // Fallback to Chunsim if character not found
            systemInstruction = CORE_CHUNSIM_PERSONA;
        }
    } else {
        // 춘심이(기본 캐릭터)일 경우 기존 로직 유지 (여행 모드 등)
        let effectiveMode = state.personaMode;

        const travelKeywords = ["여행", "비행기", "호텔", "숙소", "일정", "가고 싶어", "추천해줘", "도쿄", "오사카", "제주도"];
        if (travelKeywords.some(kw => lastMessageText.includes(kw))) {
            effectiveMode = "concierge";
        }

        const modePrompt = PERSONA_PROMPTS[effectiveMode] || PERSONA_PROMPTS.hybrid;

        // 요약된 기억이 있다면 시스템 프롬프트에 포함
        const memoryInfo = state.summary ? `\n\n이전 대화 요약: ${state.summary}` : "";
        systemInstruction = `${CORE_CHUNSIM_PERSONA}\n\n${modePrompt}${memoryInfo}`;
    }

    // 이미지가 있다면 관련 지침 추가
    if (state.mediaUrl) {
        systemInstruction += "\n\n(참고: 사용자가 이미지를 보냈습니다. 반드시 이미지의 주요 특징이나 내용을 언급하며 대화를 이어가 주세요. 만약 사진이 무엇인지 혹은 어떤지 묻는다면 친절하게 분석해 주세요.)";
    }

    return { systemInstruction };
};

/**
 * 도구 1: 여행 계획 저장 루틴
 */
const saveTravelPlanTool = {
    name: "saveTravelPlan",
    description: "사용자와의 대화 중 확정된 여행 계획(장소, 날짜 등)을 데이터베이스에 저장합니다.",
    parameters: {
        type: "object",
        properties: {
            title: { type: "string", description: "여행 제목 (예: 도쿄 5박 6일 식도락 여행)" },
            description: { type: "string", description: "여행에 대한 간단한 설명" },
            startDate: { type: "string", description: "여행 시작일 (YYYY-MM-DD 형식)" },
            endDate: { type: "string", description: "여행 종료일 (YYYY-MM-DD 형식)" },
        },
        required: ["title"],
    },
};

/**
 * 노드 2: AI 응답 생성 (멀티모달 및 도구 지원)
 */
const callModelNode = async (state: typeof ChatStateAnnotation.State) => {
    const modelWithTools = model.bindTools([saveTravelPlanTool]);

    const messages: BaseMessage[] = [
        new SystemMessage(state.systemInstruction),
        ...state.messages,
    ];

    const response = await modelWithTools.invoke(messages);

    // 도구 호출 처리
    if (response.tool_calls && response.tool_calls.length > 0) {
        for (const toolCall of response.tool_calls) {
            if (toolCall.name === "saveTravelPlan" && state.userId) {
                const args = toolCall.args as any;
                try {
                    await prisma.travelPlan.create({
                        data: {
                            id: crypto.randomUUID(),
                            userId: state.userId,
                            title: args.title,
                            description: args.description || "춘심이와 함께 만든 여행 계획",
                            startDate: args.startDate ? new Date(args.startDate) : null,
                            endDate: args.endDate ? new Date(args.endDate) : null,
                            updatedAt: new Date(),
                        }
                    });
                    console.log(`Travel plan '${args.title}' saved for user ${state.userId}`);
                } catch (e) {
                    console.error("Failed to save travel plan via tool:", e);
                }
            }
        }
    }

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

interface HistoryMessage {
    role: string;
    content: string;
    mediaUrl?: string | null;
}

/**
 * AI 응답 생성 (요약 데이터 포함)
 */
export async function generateAIResponse(
    userMessage: string,
    history: HistoryMessage[],
    personaMode: keyof typeof PERSONA_PROMPTS = "hybrid",
    currentSummary: string = "",
    mediaUrl: string | null = null,
    userId: string | null = null,
    characterId: string = "chunsim"
) {
    const graph = createChatGraph();

    // 안전한 메시지 변환 함수 (비동기 처리)
    const toBaseMessage = async (msg: HistoryMessage): Promise<BaseMessage> => {
        const content = msg.content || (msg.mediaUrl ? "이 사진(그림)을 확인해줘." : " ");

        if (msg.role === "user") {
            if (msg.mediaUrl) {
                const base64Data = await urlToBase64(msg.mediaUrl);
                return new HumanMessage({
                    content: [
                        { type: "text", text: content },
                        { type: "image_url", image_url: { url: base64Data } },
                    ]
                });
            }
            return new HumanMessage(content);
        } else {
            return new AIMessage(content);
        }
    };

    const inputMessages: BaseMessage[] = await Promise.all([
        ...history.map(toBaseMessage),
        toBaseMessage({ role: "user", content: userMessage, mediaUrl }),
    ]);

    try {
        const result = await graph.invoke({
            messages: inputMessages,
            personaMode,
            summary: currentSummary,
            mediaUrl,
            userId,
            characterId,
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
    history: HistoryMessage[],
    personaMode: keyof typeof PERSONA_PROMPTS = "hybrid",
    currentSummary: string = "",
    mediaUrl: string | null = null,
    userId: string | null = null,
    characterId: string = "chunsim"
) {
    let systemInstruction = "";

    if (characterId && characterId !== "chunsim") {
        const character = CHARACTERS[characterId];
        systemInstruction = character ? character.personaPrompt : CORE_CHUNSIM_PERSONA;
    } else {
        const modePrompt = PERSONA_PROMPTS[personaMode] || PERSONA_PROMPTS.hybrid;
        const memoryInfo = currentSummary ? `\n\n이전 대화 요약: ${currentSummary}` : "";
        systemInstruction = `${CORE_CHUNSIM_PERSONA}\n\n${modePrompt}${memoryInfo}`;
    }

    if (mediaUrl) {
        systemInstruction += "\n\n(참고: 사용자가 이미지를 보냈습니다. 반드시 이미지의 주요 특징이나 내용을 언급하며 대화를 이어가 주세요. 만약 사진이 무엇인지 혹은 어떤지 묻는다면 친절하게 분석해 주세요.)";
    }

    const messages: BaseMessage[] = [
        new SystemMessage(systemInstruction),
    ];

    // 안전한 메시지 변환 함수 (비동기 처리)
    const toBaseMessage = async (msg: HistoryMessage): Promise<BaseMessage> => {
        const content = msg.content || (msg.mediaUrl ? "이 사진(그림)을 확인해줘." : " ");

        if (msg.role === "user") {
            if (msg.mediaUrl) {
                const base64Data = await urlToBase64(msg.mediaUrl);
                return new HumanMessage({
                    content: [
                        { type: "text", text: content },
                        { type: "image_url", image_url: { url: base64Data } },
                    ]
                });
            }
            return new HumanMessage(content);
        } else {
            return new AIMessage(content);
        }
    };

    // 과거 대화 내역 및 마지막 메시지 비동기 변환
    const convertedHistory = await Promise.all(history.map(toBaseMessage));
    const lastMessage = await toBaseMessage({ role: "user", content: userMessage, mediaUrl });

    // 메시지 구성
    messages.push(...convertedHistory);
    messages.push(lastMessage);

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

/**
 * 선제적 안부 메시지 생성 (Daily Companion)
 */
export async function generateProactiveMessage(
    userName: string,
    memory: string = "",
    personaMode: keyof typeof PERSONA_PROMPTS = "hybrid"
) {
    const modePrompt = PERSONA_PROMPTS[personaMode] || PERSONA_PROMPTS.hybrid;
    const memoryContext = memory ? `\n\n최근 기억: ${memory}` : "";

    const proactivePrompt = `
당신은 '춘심'입니다. 사용자(${userName})에게 먼저 다정한 안부 메시지를 보내려고 합니다.
${CORE_CHUNSIM_PERSONA}
${modePrompt}
${memoryContext}

지침:
- 사용자의 최근 상황(기억)을 언급하며 매우 다정하고 자연스럽게 말을 건네세요.
- 질문을 포함하여 사용자가 대답하고 싶게 만드세요.
- 한 문장 혹은 두 문장 정도로 짧고 강렬하게 보내세요.
- 이모지는 절대 사용하지 마세요.
    `;

    try {
        const res = await model.invoke([new HumanMessage(proactivePrompt)]);
        return removeEmojis(res.content.toString());
    } catch (err) {
        console.error("Proactive Message Error:", err);
        return `${userName}, 잘 지내고 있어? 갑자기 네 생각이 나서 연락해봤어!`;
    }
}
