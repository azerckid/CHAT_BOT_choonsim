import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, useNavigate, useNavigation, Form, useActionData, useRevalidator } from "react-router";
import { useState, useEffect } from "react";
import { AdminLayout } from "~/components/admin/AdminLayout";
import { requireAdmin } from "~/lib/auth.server";
import { prisma } from "~/lib/db.server";
import { cn } from "~/lib/utils";
import { z } from "zod";
import { toast } from "sonner";

export async function loader({ params, request }: LoaderFunctionArgs) {
    await requireAdmin(request);
    const { id } = params;
    if (!id) throw new Response("User ID missing", { status: 400 });

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            UserInventory: {
                include: { item: true }
            }
        }
    });

    if (!user) throw new Response("User not found", { status: 404 });

    const allItems = await prisma.item.findMany({ where: { isActive: true } });

    return { user, allItems };
}

export async function action({ params, request }: ActionFunctionArgs) {
    await requireAdmin(request);
    const formData = await request.formData();
    const actionType = formData.get("_action");
    const id = params.id;

    if (!id) return Response.json({ error: "ID missing" }, { status: 400 });

    if (actionType === "update_user") {
        const role = formData.get("role") as string;
        const tier = formData.get("tier") as string;
        const status = formData.get("subscriptionStatus") as string;
        const credits = Number(formData.get("credits"));

        await prisma.user.update({
            where: { id },
            data: {
                role,
                subscriptionTier: tier,
                subscriptionStatus: status,
                credits: isNaN(credits) ? undefined : credits,
            }
        });
        return { success: true, message: "User updated successfully" };
    }

    if (actionType === "grant_item") {
        const itemId = formData.get("itemId") as string;
        const quantity = Number(formData.get("quantity"));

        if (!itemId || isNaN(quantity) || quantity <= 0) return Response.json({ error: "Invalid data" }, { status: 400 });

        const existing = await prisma.userInventory.findFirst({
            where: { userId: id, itemId }
        });

        if (existing) {
            await prisma.userInventory.update({
                where: { id: existing.id },
                data: { quantity: { increment: quantity } }
            });
        } else {
            await prisma.userInventory.create({
                data: { userId: id, itemId, quantity }
            });
        }
        return { success: true, message: "Item granted successfully" };
    }

    if (actionType === "remove_item") {
        const inventoryId = formData.get("inventoryId") as string;
        await prisma.userInventory.delete({ where: { id: inventoryId } });
        return { success: true, message: "Item removed from inventory" };
    }

    if (actionType === "delete_user") {
        await prisma.user.delete({ where: { id } });
        return { success: true, deleted: true, message: "User deleted" };
    }

    return null;
}

export default function UserDetail() {
    const { user, allItems } = useLoaderData<typeof loader>();
    const actionData = useActionData() as { success?: boolean; error?: string; deleted?: boolean; message?: string };
    const navigate = useNavigate();
    const navigation = useNavigation();
    const revalidator = useRevalidator();
    const isSubmitting = navigation.state !== "idle";

    const [activeTab, setActiveTab] = useState<"profile" | "inventory">("profile");

    useEffect(() => {
        if (actionData?.success) {
            toast.success(actionData.message || "Success");
            if (actionData.deleted) navigate("/admin/users");
            else revalidator.revalidate();
        } else if (actionData?.error) {
            toast.error(actionData.error);
        }
    }, [actionData, navigate]);

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase truncate max-w-md">
                            User: <span className="text-primary">{user.name || user.email}</span>
                        </h1>
                        <p className="text-white/40 text-sm font-medium">Manage permissions, credits, and inventory.</p>
                    </div>

                    <button
                        onClick={() => navigate("/admin/users")}
                        className="px-6 py-3 bg-white/5 text-white/60 rounded-xl font-bold text-sm hover:text-white transition-all underline decoration-primary/30 underline-offset-4"
                    >
                        BACK TO LIST
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-[#1A1821] rounded-2xl w-fit border border-white/5">
                    {(["profile", "inventory"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                activeTab === tab
                                    ? "bg-primary text-black shadow-lg shadow-primary/20"
                                    : "text-white/40 hover:text-white"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Sidebar: Profile Summary */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-[#1A1821] border border-white/5 rounded-[40px] p-8 text-center space-y-4">
                            <div className="w-24 h-24 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center font-black text-primary italic text-3xl mx-auto border-dashed">
                                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-black italic text-white uppercase tracking-tighter truncate">{user.name || "N/A"}</h2>
                                <p className="text-white/40 text-xs font-medium truncate">{user.email}</p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                                <span className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                    user.role === "admin" ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white/10 text-white/40"
                                )}>
                                    {user.role}
                                </span>
                                <span className={cn(
                                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary text-black"
                                )}>
                                    {user.subscriptionTier || "FREE"}
                                </span>
                            </div>
                        </div>

                        <div className="bg-[#1A1821]/60 border border-white/5 rounded-[32px] p-6 space-y-4">
                            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Quick Stats</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-white/40">Credits</span>
                                    <span className="text-primary font-black italic">{user.credits?.toLocaleString()} CR</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-white/40">Inventory</span>
                                    <span className="text-white font-medium">{user.UserInventory.length} items</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-white/40">Status</span>
                                    <span className={cn("font-black capitalize", user.subscriptionStatus === "active" ? "text-primary" : "text-white/20")}>
                                        {user.subscriptionStatus || "inactive"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {activeTab === "profile" && (
                            <Form method="post" onSubmit={(e) => {
                                if (!confirm("Are you sure? This action cannot be undone.")) e.preventDefault();
                            }}>
                                <input type="hidden" name="_action" value="delete_user" />
                                <button
                                    type="submit"
                                    className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black italic text-xs uppercase hover:bg-red-500 hover:text-white transition-all tracking-widest shadow-xl shadow-red-500/5"
                                >
                                    DELETE ACCOUNT
                                </button>
                            </Form>
                        )}
                    </div>

                    {/* Main: Content Area */}
                    <div className="md:col-span-2">
                        {activeTab === "profile" ? (
                            <div className="bg-[#1A1821] border border-white/5 rounded-[40px] p-8">
                                <Form method="post" className="space-y-8">
                                    <input type="hidden" name="_action" value="update_user" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 block italic">User Role</label>
                                            <select
                                                name="role"
                                                defaultValue={user.role || "user"}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                                            >
                                                <option value="user">Standard User</option>
                                                <option value="moderator">Moderator</option>
                                                <option value="admin">Administrator</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 block italic">Credit Balance (CR)</label>
                                            <div className="relative">
                                                <input
                                                    name="credits"
                                                    type="number"
                                                    defaultValue={user.credits || 0}
                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold pr-12"
                                                />
                                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black text-[10px] uppercase">CR</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 block italic">Subscription Tier</label>
                                            <select
                                                name="tier"
                                                defaultValue={user.subscriptionTier || "FREE"}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                                            >
                                                <option value="FREE">FREE</option>
                                                <option value="BASIC">BASIC</option>
                                                <option value="PREMIUM">PREMIUM</option>
                                                <option value="ULTIMATE">ULTIMATE</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 block italic">Subscription Status</label>
                                            <select
                                                name="subscriptionStatus"
                                                defaultValue={user.subscriptionStatus || "inactive"}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold appearance-none cursor-pointer"
                                            >
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="expired">Expired</option>
                                                <option value="canceled">Canceled</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={cn(
                                                "w-full py-6 bg-primary text-[#0B0A10] rounded-[32px] font-black italic text-xl tracking-tighter transition-all hover:scale-[1.02] shadow-[0_10px_40px_rgba(255,0,255,0.4)] flex items-center justify-center gap-3",
                                                isSubmitting && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            {isSubmitting ? (
                                                <span className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined font-bold">save</span>
                                                    APPLY CHANGES
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </Form>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                {/* Grant Item Form */}
                                <div className="bg-[#1A1821] border border-white/5 rounded-[40px] p-8 space-y-6">
                                    <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-sm font-bold">card_giftcard</span>
                                        Manual Item Grant
                                    </h3>
                                    <Form method="post" className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                        <input type="hidden" name="_action" value="grant_item" />
                                        <div className="md:col-span-1 space-y-2">
                                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Select Item</label>
                                            <select name="itemId" className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold">
                                                {allItems.map(item => (
                                                    <option key={item.id} value={item.id}>{item.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">Quantity</label>
                                            <input name="quantity" type="number" defaultValue={1} min={1} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-primary/50 transition-all font-bold" />
                                        </div>
                                        <button type="submit" className="py-4 bg-primary text-black rounded-2xl font-black italic uppercase tracking-tighter hover:scale-105 transition-all">GRANT</button>
                                    </Form>
                                </div>

                                {/* Inventory List */}
                                <div className="bg-[#1A1821] border border-white/5 rounded-[40px] overflow-hidden">
                                    <h3 className="p-8 pb-4 text-xs font-black text-white/60 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-sm font-bold">inventory</span>
                                        Current Inventory
                                    </h3>
                                    <div className="divide-y divide-white/5">
                                        {user.UserInventory.length === 0 ? (
                                            <div className="p-12 text-center text-white/20 italic text-xs font-bold uppercase tracking-widest">Inventory is empty.</div>
                                        ) : (
                                            user.UserInventory.map(inv => (
                                                <div key={inv.id} className="p-6 flex items-center justify-between group hover:bg-white/2 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center">
                                                            {inv.item.iconUrl ? <img src={inv.item.iconUrl} alt={inv.item.name} className="w-8 h-8 object-contain" /> : <span className="material-symbols-outlined text-primary/40">token</span>}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-white uppercase tracking-tight">{inv.item.name}</p>
                                                            <p className="text-[10px] text-white/40 font-black italic">{inv.quantity} UNITS</p>
                                                        </div>
                                                    </div>
                                                    <Form method="post" onSubmit={e => !confirm("Remove this item?") && e.preventDefault()}>
                                                        <input type="hidden" name="_action" value="remove_item" />
                                                        <input type="hidden" name="inventoryId" value={inv.id} />
                                                        <button className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white">
                                                            <span className="material-symbols-outlined text-sm">delete</span>
                                                        </button>
                                                    </Form>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
