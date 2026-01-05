import { db } from "~/lib/db.server";
import { auth } from "~/lib/auth.server";
import { z } from "zod";
import type { ActionFunctionArgs } from "react-router";
import { deleteImage } from "~/lib/cloudinary.server";
import * as schema from "~/db/schema";
import { eq, isNotNull, and } from "drizzle-orm";

const deleteSchema = z.object({
    conversationId: z.string().uuid(),
    resetMemory: z.boolean().optional().default(false),
});

export async function action({ request }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    const body = await request.json();
    const result = deleteSchema.safeParse(body);

    if (!result.success) {
        return Response.json({ error: result.error.flatten() }, { status: 400 });
    }

    const { conversationId, resetMemory } = result.data;

    try {
        // 1. 해당 대화방의 이미지 메시지 찾기
        const messagesWithMedia = await db.query.message.findMany({
            where: and(
                eq(schema.message.conversationId, conversationId),
                isNotNull(schema.message.mediaUrl)
            ),
            columns: { mediaUrl: true }
        });

        // 2. Cloudinary에서 이미지 삭제
        for (const msg of messagesWithMedia) {
            if (msg.mediaUrl) {
                await deleteImage(msg.mediaUrl);
            }
        }

        // 3. DB 데이터 삭제 (트랜잭션 권장)
        await db.transaction(async (tx) => {
            // 메시지 삭제
            await tx.delete(schema.message)
                .where(eq(schema.message.conversationId, conversationId));

            // 대화방 삭제 (기억 초기화가 아닐 때만)
            if (!resetMemory) {
                await tx.delete(schema.conversation)
                    .where(eq(schema.conversation.id, conversationId));
            }

            // 기억 초기화 요청이 있는 경우
            if (resetMemory) {
                const user = await tx.query.user.findFirst({
                    where: eq(schema.user.id, session.user.id),
                    columns: { bio: true }
                });

                if (user?.bio) {
                    try {
                        const bioData = JSON.parse(user.bio);
                        delete bioData.memory;
                        delete bioData.lastMemoryUpdate;

                        await tx.update(schema.user)
                            .set({ bio: JSON.stringify(bioData), updatedAt: new Date() })
                            .where(eq(schema.user.id, session.user.id));
                    } catch (e) {
                        console.error("Failed to reset memory:", e);
                    }
                }
            }
        });

        return Response.json({ success: true });
    } catch (error) {
        console.error("Delete conversation error:", error);
        return Response.json({ error: "Failed to delete conversation" }, { status: 500 });
    }
}

