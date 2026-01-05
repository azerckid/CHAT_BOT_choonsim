import { prisma } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import { z } from "zod";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

const messageSchema = z.object({
    content: z.string().min(1),
    conversationId: z.string().uuid(),
});

export async function loader({ request }: LoaderFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const conversationId = url.searchParams.get("conversationId");

    if (!conversationId) {
        return new Response("Missing conversationId", { status: 400 });
    }

    const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
    });

    return Response.json({ messages });
}

export async function action({ request }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    const body = await request.json();
    const result = messageSchema.safeParse(body);

    if (!result.success) {
        return Response.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { content, conversationId } = result.data;

    // 1. 사용자 메시지 저장
    const userMessage = await prisma.message.create({
        data: {
            id: crypto.randomUUID(),
            role: "user",
            content,
            conversationId,
            senderId: session.user.id,
            createdAt: new Date(),
        },
    });

    // 2. 미션 진행도 업데이트 (채팅 미션)
    const chatMissions = await prisma.mission.findMany({
        where: {
            isActive: true,
            OR: [
                { title: { contains: "Chat" } },
                { title: { contains: "Message" } },
                { title: { contains: "채팅" } },
                { description: { contains: "chat" } }
            ]
        }
    });

    for (const mission of chatMissions) {
        const userMission = await prisma.userMission.findUnique({
            where: { userId_missionId: { userId: session.user.id, missionId: mission.id } }
        });

        if (!userMission || (userMission.status === "IN_PROGRESS" && userMission.progress < 100)) {
            const newProgress = Math.min((userMission?.progress || 0) + 20, 100);
            await prisma.userMission.upsert({
                where: { userId_missionId: { userId: session.user.id, missionId: mission.id } },
                create: {
                    userId: session.user.id,
                    missionId: mission.id,
                    progress: newProgress,
                    status: newProgress === 100 ? "COMPLETED" : "IN_PROGRESS"
                },
                update: {
                    progress: newProgress,
                    status: newProgress === 100 ? "COMPLETED" : "IN_PROGRESS"
                }
            });
        }
    }

    return Response.json({ message: userMessage });
}

