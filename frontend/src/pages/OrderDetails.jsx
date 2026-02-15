import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import Skeleton from "../components/Skeleton";
import { useToast } from "../context/ToastContext";

const STATUS_META = {
    pending: { label: "pending", cls: "bg-amber-500/15 border-amber-500/30 text-amber-200" },
    confirmed: { label: "confirmed", cls: "bg-blue-500/15 border-blue-500/30 text-blue-200" },
    shipped: { label: "shipped", cls: "bg-sky-500/15 border-sky-500/30 text-sky-200" },
    delivered: { label: "delivered", cls: "bg-emerald-500/15 border-emerald-500/30 text-emerald-200" },
    cancelled: { label: "cancelled", cls: "bg-red-500/15 border-red-500/30 text-red-200" },
};

function StatusBadge({ status }) {
    const s = String(status || "").toLowerCase();
    const meta = STATUS_META[s];
    const cls = meta?.cls ?? "bg-zinc-500/15 border-white/10 text-white/70";
    const label = meta?.label ?? (status ?? "unknown");
    return <span className={`px-3 py-1 rounded-full border text-sm ${cls}`}>{label}</span>;
}

function money(x) {
    const n = Number(x);
    if (Number.isNaN(n)) return x ?? "-";
    return n.toLocaleString();
}

function OrderDetailsSkeleton() {
    return (
        <div className="min-h-screen bg-black p-6 text-white">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-10 w-64 rounded-2xl" />
                    <Skeleton className="h-8 w-28 rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4 space-y-2">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-6 w-40" />
                    </div>

                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-6 w-full" />
                    </div>
                </div>

                <div className="bg-zinc-900/70 border border-white/10 rounded-2xl overflow-hidden">
                    {[1, 2, 3].map((k) => (
                        <div key={k} className="p-4 border-b border-white/10 flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-44" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-5 w-24" />
                        </div>
                    ))}
                </div>

                <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-28" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-28" />
                    </div>
                    <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-8 w-36" />
                    </div>
                </div>

                <Skeleton className="h-10 w-44 rounded-lg" />
            </div>
        </div>
    );
}

export default function OrderDetails() {
    const { id } = useParams();
    const toast = useToast();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);

    const [cancelLoading, setCancelLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadFailed(false);

        try {
            const res = await api(`/api/orders/me/${id}`);
            setOrder(res);
        } catch (e) {
            setOrder(null);
            setLoadFailed(true);
            toast.push({
                type: "error",
                title: "Failed to load order",
                message: e?.message || "Failed to load order",
            });
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    useEffect(() => {
        let alive = true;
        (async () => {
            if (!alive) return;
            await load();
        })();
        return () => {
            alive = false;
        };
    }, [load]);

    const canCancel = ["pending", "confirmed"].includes(String(order?.status || "").toLowerCase());

    async function cancelOrder() {
        if (!order?.id) return;

        const ok = window.confirm("سفارش لغو شود؟");
        if (!ok) return;

        setCancelLoading(true);

        try {
            const res = await api(`/api/orders/me/${order.id}/cancel`, { method: "POST" });
            setOrder(res.order ?? res);

            toast.push({
                type: "success",
                title: "Order cancelled",
                message: "Your order was cancelled successfully.",
            });
        } catch (e) {
            toast.push({
                type: "error",
                title: "Cancel failed",
                message: e?.message || "Failed to cancel order",
            });
        } finally {
            setCancelLoading(false);
        }
    }

    if (loading) return <OrderDetailsSkeleton />;

    // اگر لود شکست خورد، یک UI تمیز با Retry
    if (loadFailed) {
        return (
            <div className="min-h-screen bg-black p-6 text-white">
                <div className="max-w-xl mx-auto bg-zinc-900/70 border border-white/10 rounded-2xl p-6">
                    <div className="text-white/80 font-semibold">Could not load order</div>
                    <div className="text-white/60 mt-2 text-sm">Please try again.</div>

                    <div className="mt-5 flex items-center gap-3">
                        <button
                            onClick={load}
                            className="px-4 py-2 rounded-lg bg-white text-black font-semibold"
                            type="button"
                        >
                            Retry
                        </button>

                        <Link to="/my-orders" className="text-white/80 underline">
                            Back to My Orders
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-black p-6 text-white">
                <div className="max-w-xl mx-auto bg-zinc-900/70 border border-white/10 rounded-2xl p-6">
                    <div className="text-white/70">Order not found.</div>
                    <Link to="/my-orders" className="mt-4 inline-block text-white underline">
                        Back to My Orders
                    </Link>
                </div>
            </div>
        );
    }

    const items = Array.isArray(order.items) ? order.items : [];

    return (
        <div className="min-h-screen bg-black p-6 text-white">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-3xl font-extrabold">Order #{order.order_code ?? order.id}</h1>
                    <StatusBadge status={order.status} />
                    {order.tracking_code && (
                        <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4">
                            <div className="text-white/60 text-sm">Tracking code</div>
                            <div className="mt-1 font-mono text-lg">{order.tracking_code}</div>
                        </div>
                    )}

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4">
                        <div className="text-white/60 text-sm">City</div>
                        <div className="mt-1 font-medium">{order.city ?? "-"}</div>
                    </div>

                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4">
                        <div className="text-white/60 text-sm">Shipping address</div>
                        <div className="mt-1">{order.shipping_address ?? "-"}</div>
                        {order.shipping_method && (
                            <div className="text-white/60 text-sm mt-2">
                                Shipping method: <span className="text-white">{order.shipping_method}</span>
                            </div>
                        )}

                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 text-white/70">
                        No items found for this order.
                    </div>
                ) : (
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl overflow-hidden">
                        {items.map((it) => (
                            <div
                                key={it.id ?? `${it.product_id}_${it.qty}`}
                                className="p-4 border-b border-white/10 flex items-center justify-between"
                            >
                                <div>
                                    <div className="font-medium">{it.product_title ?? it.product?.title ?? "-"}</div>
                                    <div className="text-white/60 text-sm">Qty: {it.qty}</div>
                                </div>
                                <div className="font-semibold">
                                    {money(Number(it.unit_price ?? 0) * Number(it.qty ?? 1))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-white/60">Subtotal</div>
                        <div className="font-semibold">{money(order.subtotal ?? 0)}</div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-white/60">Shipping</div>
                        <div className="font-semibold">{money(order.shipping_fee ?? 0)}</div>
                    </div>

                    <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                        <div className="text-white/60">Total</div>
                        <div className="text-2xl font-extrabold">{money(order.total_price ?? 0)}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {canCancel && (
                        <button
                            onClick={cancelOrder}
                            disabled={cancelLoading}
                            className="inline-block px-4 py-2 rounded-lg border border-red-500/40 text-red-200 font-semibold hover:bg-red-500/10 disabled:opacity-60"
                            type="button"
                        >
                            {cancelLoading ? "Cancelling..." : "Cancel Order"}
                        </button>
                    )}

                    <Link
                        to="/my-orders"
                        className="inline-block px-4 py-2 rounded-lg bg-white text-black font-semibold"
                    >
                        Back to My Orders
                    </Link>
                </div>
            </div>
        </div>
    );
}
