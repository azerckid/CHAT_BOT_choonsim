import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Form, Link, redirect } from "react-router";
import { AdminLayout } from "~/components/admin/AdminLayout";
import { requireAdmin } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { cn } from "~/lib/utils";
import { z } from "zod";

const noticeSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    type: z.enum(["NOTICE", "NEWS", "EVENT"]),
    isActive: z.boolean().default(true),
    isPinned: z.boolean().default(false),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
    await requireAdmin(request);
    const { id } = params;

    if (id === "new" || !id) return { notice: null };

    const notice = await prisma.notice.findUnique({ where: { id } });
    if (!notice) throw new Response("Not Found", { status: 404 });

    return { notice };
}

export async function action({ request, params }: ActionFunctionArgs) {
    await requireAdmin(request);
    const { id } = params;
    const formData = await request.formData();

    const validated = noticeSchema.parse({
        title: formData.get("title"),
        content: formData.get("content"),
        type: formData.get("type"),
        isActive: formData.get("isActive") === "on",
        isPinned: formData.get("isPinned") === "on",
    });

    if (id === "new" || !id) {
        await prisma.notice.create({ data: validated });
    } else {
        await prisma.notice.update({
            where: { id },
            data: validated
        });
    }

    return redirect("/admin/content/notices");
}

export default function EditNotice() {
    const { notice } = useLoaderData<typeof loader>();
    const isNew = !notice;

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-2">
                    <Link to="/admin/content/notices" className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all group mb-2">
                        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                        Back to List
                    </Link>
                    <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">
                        {isNew ? "Create" : "Edit"} <span className="text-primary">Notice</span>
                    </h1>
                </div>

                <Form method="post" className="space-y-8">
                    <div className="bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Classification</label>
                            <div className="grid grid-cols-3 gap-4">
                                {["NOTICE", "NEWS", "EVENT"].map((t) => (
                                    <label key={t} className="relative">
                                        <input
                                            type="radio"
                                            name="type"
                                            value={t}
                                            defaultChecked={notice?.type === t || (isNew && t === "NOTICE")}
                                            className="peer sr-only"
                                        />
                                        <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-center text-[10px] font-black uppercase tracking-widest text-white/20 peer-checked:bg-primary/20 peer-checked:border-primary peer-checked:text-primary transition-all cursor-pointer">
                                            {t}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Headline</label>
                            <input
                                name="title"
                                type="text"
                                defaultValue={notice?.title}
                                placeholder="Enter announcement title..."
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-primary/50 transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Detailed Content</label>
                            <textarea
                                name="content"
                                defaultValue={notice?.content}
                                rows={10}
                                placeholder="Write the full message here..."
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-6 text-sm font-medium text-white/80 focus:border-primary/50 transition-all leading-relaxed"
                                required
                            />
                        </div>

                        <div className="flex gap-8 px-1">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input type="checkbox" name="isActive" defaultChecked={notice?.isActive ?? true} className="peer sr-only" />
                                    <div className="w-10 h-6 bg-white/5 rounded-full border border-white/10 peer-checked:bg-primary/40 peer-checked:border-primary transition-all" />
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white/20 rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-white" />
                                </div>
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors">Publish Immediately</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input type="checkbox" name="isPinned" defaultChecked={notice?.isPinned} className="peer sr-only" />
                                    <div className="w-10 h-6 bg-white/5 rounded-full border border-white/10 peer-checked:bg-primary/40 peer-checked:border-primary transition-all" />
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white/20 rounded-full transition-all peer-checked:translate-x-4 peer-checked:bg-white" />
                                </div>
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors">Pin to Top</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Link
                            to="/admin/content/notices"
                            className="px-8 py-4 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="bg-primary text-black px-12 py-4 rounded-2xl font-black italic text-sm hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,0,255,0.4)]"
                        >
                            {isNew ? "PUBLISH NOW" : "UPDATE RECORD"}
                        </button>
                    </div>
                </Form>
            </div>
        </AdminLayout>
    );
}

// Fixed closing Form tag issue in JSX
