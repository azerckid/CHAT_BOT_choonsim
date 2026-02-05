/**
 * PUT /api/context/:characterId/identity
 * Identity 계층 수정 (명세 11.1 - 본인 권한)
 */

import type { ActionFunctionArgs } from "react-router";
import { auth } from "~/lib/auth.server";
import { updateUserIdentity, type IdentityDoc } from "~/lib/context";
import { z } from "zod";
import { CHARACTERS } from "~/lib/characters";

const identityPutSchema = z.object({
    nickname: z.string().max(100).optional(),
    honorific: z.enum(["반말", "존댓말", "혼합"]).optional(),
    relationshipType: z.enum(["팬", "친구", "연인", "동생", "오빠/언니"]).optional(),
    customTitle: z.string().max(50).optional().nullable(),
    inferredTraits: z.array(z.string().max(200)).optional(),
});

export async function action({ request, params }: ActionFunctionArgs) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (request.method !== "PUT") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const characterId = params.characterId;
    if (!characterId) {
        return Response.json({ error: "characterId is required" }, { status: 400 });
    }

    if (!Object.prototype.hasOwnProperty.call(CHARACTERS, characterId)) {
        return Response.json({ error: "Unsupported character" }, { status: 400 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = identityPutSchema.safeParse(body);
    if (!parsed.success) {
        return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updates = parsed.data;
    if (Object.keys(updates).length === 0) {
        return Response.json({ error: "At least one identity field is required" }, { status: 400 });
    }

    const normalized = { ...updates } as Record<string, unknown>;
    if (normalized.customTitle === null) {
        normalized.customTitle = undefined;
    }

    try {
        await updateUserIdentity(session.user.id, characterId, normalized as Partial<IdentityDoc>);
        return Response.json({ ok: true });
    } catch (e) {
        return Response.json({ error: "Failed to update identity" }, { status: 500 });
    }
}
