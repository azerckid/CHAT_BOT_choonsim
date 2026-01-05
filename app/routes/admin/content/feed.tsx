import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Form, useSubmit, useRevalidator, Link } from "react-router";
import { AdminLayout } from "~/components/admin/AdminLayout";
import { requireAdmin } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { cn } from "~/lib/utils";
import { toast } from "sonner";
import { useEffect } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
    await requireAdmin(request);

    const tweets = await prisma.tweet.findMany({
        include: {
            User: { select: { name: true, email: true, image: true } },
            Media: true,
            _count: { select: { Like: true, Retweet: true } }
        },
        orderBy: { createdAt: "desc" },
        take: 50
    });

    return { tweets };
}

export async function action({ request }: ActionFunctionArgs) {
    await requireAdmin(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "delete_tweet") {
        const id = formData.get("id") as string;
        await prisma.tweet.delete({ where: { id } });
        return { success: true, message: "Tweet deleted successfully" };
    }

    return null;
}

export default function AdminFeedManagement() {
    const { tweets } = useLoaderData<typeof loader>();
    const revalidator = useRevalidator();

    const handleDelete = (id: string) => {
        if (!confirm("Are you sure you want to remove this post? This cannot be undone.")) return;

        const formData = new FormData();
        formData.append("intent", "delete_tweet");
        formData.append("id", id);

        // Manual form submission
        fetch(window.location.pathname, {
            method: "POST",
            body: formData
        }).then(async (res) => {
            if (res.ok) {
                toast.success("Post removed from feed");
                revalidator.revalidate();
            } else {
                toast.error("Failed to delete post");
            }
        });
    };

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:row justify-between items-start md:items-end gap-4">
                    <div className="space-y-2">
                        <Link to="/admin/content" className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all group mb-2">
                            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                            Back to Studio
                        </Link>
                        <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">
                            Fan <span className="text-primary">Feed</span> Moderation
                        </h1>
                        <p className="text-white/40 text-sm font-medium">Monitor and manage user-generated posts and interactions.</p>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-bold text-white/40">
                        <span className="material-symbols-outlined text-sm">info</span>
                        Displaying last 50 public posts
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tweets.length === 0 ? (
                        <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-4">
                            <span className="material-symbols-outlined text-white/10 text-6xl">rss_feed</span>
                            <p className="text-white/20 font-black italic uppercase tracking-widest">No social activity recorded</p>
                        </div>
                    ) : (
                        tweets.map((tweet) => (
                            <div key={tweet.id} className="bg-[#1A1821] border border-white/5 rounded-[32px] overflow-hidden flex flex-col group hover:border-white/10 transition-all">
                                {/* Header */}
                                <div className="p-6 pb-4 flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary font-black italic text-sm">
                                            {tweet.User?.image ? (
                                                <img src={tweet.User.image} alt="" className="w-full h-full object-cover rounded-xl" />
                                            ) : (
                                                tweet.User?.name?.[0] || "?"
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white italic group-hover:text-primary transition-colors">{tweet.User?.name || "Suspended User"}</p>
                                            <p className="text-[10px] text-white/20">{tweet.User?.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(tweet.id)}
                                        className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="px-6 space-y-4 flex-1">
                                    <p className="text-xs text-white/60 leading-relaxed line-clamp-4">{tweet.content}</p>

                                    {tweet.Media && tweet.Media.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-white/5">
                                            {tweet.Media.map((m) => (
                                                <div key={m.id} className="aspect-square bg-black/40 relative">
                                                    <img src={m.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Actions & Footer */}
                                <div className="p-6 pt-4 mt-auto">
                                    <div className="flex items-center gap-6 border-t border-white/5 pt-4">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-white/20 italic">
                                            <span className="material-symbols-outlined text-[16px] text-primary/40">favorite</span>
                                            {tweet._count.Like}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-white/20 italic">
                                            <span className="material-symbols-outlined text-[16px] text-blue-400/40">repeat</span>
                                            {tweet._count.Retweet}
                                        </div>
                                        <div className="flex-1 text-right text-[8px] font-black text-white/10 uppercase tracking-widest italic">
                                            {new Date(tweet.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
