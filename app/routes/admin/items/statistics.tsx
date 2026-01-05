import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { AdminLayout } from "~/components/admin/AdminLayout";
import { requireAdmin } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { cn } from "~/lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
    await requireAdmin(request);

    // Get character stats with naming info
    const characterStats = await prisma.characterStat.findMany({
        include: {
            character: {
                select: { name: true }
            }
        },
        orderBy: { totalHearts: "desc" }
    });

    // Get aggregate statistics
    const totalHearts = characterStats.reduce((sum, stat) => sum + stat.totalHearts, 0);
    const totalGifts = await prisma.giftLog.count();
    const uniqueGivers = await prisma.giftLog.groupBy({
        by: ["fromUserId"],
        _count: true
    });

    // Item popularity
    const itemPopularity = await prisma.giftLog.groupBy({
        by: ["itemId"],
        _count: true,
        orderBy: { _count: { itemId: "desc" } },
        take: 5
    });

    // Populate item names for popularity
    const items = await prisma.item.findMany({
        where: { id: { in: itemPopularity.map(p => p.itemId) } },
        select: { id: true, name: true }
    });

    const itemStats = itemPopularity.map(p => ({
        name: items.find(i => i.id === p.itemId)?.name || "Unknown Item",
        count: p._count
    }));

    return { characterStats, totalHearts, totalGifts, giversCount: uniqueGivers.length, itemStats };
}

export default function GiftStatistics() {
    const { characterStats, totalHearts, totalGifts, giversCount, itemStats } = useLoaderData<typeof loader>();

    return (
        <AdminLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">
                        Gift <span className="text-primary">Intelligence</span>
                    </h1>
                    <p className="text-white/40 text-sm font-medium">Analyze giving patterns and character popularity.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#1A1821] border border-white/5 rounded-[32px] p-8 space-y-2 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[60px] group-hover:bg-primary/20 transition-colors" />
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] relative z-10">Total Hearts Given</p>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-4xl font-black italic text-white tracking-tighter">{totalHearts.toLocaleString()}</span>
                            <span className="material-symbols-outlined text-primary font-bold">favorite</span>
                        </div>
                    </div>
                    <div className="bg-[#1A1821] border border-white/5 rounded-[32px] p-8 space-y-2 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-[60px] group-hover:bg-white/10 transition-colors" />
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] relative z-10">Total Gift Transactions</p>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-4xl font-black italic text-white tracking-tighter">{totalGifts.toLocaleString()}</span>
                            <span className="material-symbols-outlined text-white/40 font-bold">redeem</span>
                        </div>
                    </div>
                    <div className="bg-[#1A1821] border border-white/5 rounded-[32px] p-8 space-y-2 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[60px] group-hover:bg-primary/20 transition-colors" />
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] relative z-10">Unique Givers</p>
                        <div className="flex items-baseline gap-2 relative z-10">
                            <span className="text-4xl font-black italic text-white tracking-tighter">{giversCount.toLocaleString()}</span>
                            <span className="material-symbols-outlined text-primary/60 font-bold">group</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Character Ranking */}
                    <div className="bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-6">
                        <h2 className="text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm font-bold">trophy</span>
                            Character Heart Ranking
                        </h2>

                        <div className="space-y-4">
                            {characterStats.map((stat, index) => (
                                <div key={stat.id} className="group flex items-center gap-4 p-4 bg-black/20 border border-white/5 rounded-2xl hover:border-primary/30 transition-all">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center font-black italic text-xs",
                                        index === 0 ? "bg-primary text-black" : "bg-white/5 text-white/40"
                                    )}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-white uppercase tracking-tight">{stat.character.name}</p>
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="flex items-center gap-1 text-[10px] text-white/40">
                                                <span className="material-symbols-outlined text-[12px]">favorite</span>
                                                {stat.totalHearts.toLocaleString()}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-white/40">
                                                <span className="material-symbols-outlined text-[12px]">group</span>
                                                {stat.totalUniqueGivers} givers
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-white/20 uppercase font-black">Last Gift</p>
                                        <p className="text-[10px] text-white/40 font-medium">
                                            {stat.lastGiftAt ? new Date(stat.lastGiftAt).toLocaleDateString() : 'Never'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Popular Items */}
                    <div className="bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-6">
                        <h2 className="text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-sm font-bold">trending_up</span>
                            Item Popularity (Sales Vol)
                        </h2>

                        <div className="space-y-4">
                            {itemStats.map((item, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-white uppercase tracking-tight">{item.name}</span>
                                        <span className="text-[10px] font-black text-primary uppercase">{item.count} Sold</span>
                                    </div>
                                    <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className="h-full bg-primary shadow-[0_0_10px_rgba(255,0,255,0.4)] transition-all duration-1000"
                                            style={{ width: `${(item.count / totalGifts * 100) || 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
