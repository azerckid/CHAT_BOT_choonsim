import { prisma } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import type { ActionFunctionArgs } from "react-router";
import { z } from "zod";

const likeSchema = z.object({
    messageId: z.string().uuid(),
});

export async function action({ request, params }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (request.method !== "POST" && request.method !== "DELETE") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const { id: messageId } = params;
    if (!messageId) {
        return Response.json({ error: "Message ID is required" }, { status: 400 });
    }

    const userId = session.user.id;

    try {
        // 메시지 존재 확인
        const message = await prisma.message.findUnique({
            where: { id: messageId },
        });

        if (!message) {
            return Response.json({ error: "Message not found" }, { status: 404 });
        }

        // 기존 좋아요 확인
        const existingLike = await prisma.messageLike.findUnique({
            where: {
                messageId_userId: {
                    messageId,
                    userId,
                },
            },
        });

        if (request.method === "POST") {
            // 좋아요 추가
            if (existingLike) {
                return Response.json({ liked: true, message: "Already liked" });
            }

            await prisma.messageLike.create({
                data: {
                    id: crypto.randomUUID(),
                    messageId,
                    userId,
                },
            });

            return Response.json({ liked: true });
        } else {
            // 좋아요 제거
            if (!existingLike) {
                return Response.json({ liked: false, message: "Not liked" });
            }

            await prisma.messageLike.delete({
                where: {
                    messageId_userId: {
                        messageId,
                        userId,
                    },
                },
            });

            return Response.json({ liked: false });
        }
    } catch (error) {
        console.error("Like error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}

