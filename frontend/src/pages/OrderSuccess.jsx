import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import UserLayout from "../layouts/UserLayout";
import Skeleton from "../components/Skeleton";

const STATUS_META = {
    pending:   { label: "pending",   cls: "bg-amber-500/15 border-amber-500/30 text-amber-200" },
    confirmed: { label: "confirmed", cls: "bg-blue-500/15 border-blue-500/30 text-blue-200" },
    shipped:   { label: "shipped",   cls: "bg-sky-500/15 border-sky-500/30 text-sky-200" },
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

function SuccessSkeleton() {
    return (
        <div className="space-y-6">
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-28 rounded-full" />
                    <Skeleton className="h-8 w-40 rounded-lg" />
                </div>
            </div>

            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl overflow-hidden">
                {[1,2,3].map((k) => (
                    <div key={k} className="p-4 border-b border-white/10 flex items-center justify-between">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-52" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-5 w-24" />
                    </div>
                ))}
            </div>

            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-8 w-36" />
                </div>
            </div>
        </div>
    );
}

export default function OrderSuccess() {
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    async function load() {
        setLoading(true);
        setErr("");
        try {
            const res = await api(`/api/orders/me/${id}`);
            setOrder(res);
        } catch (e) {
            setOrder(null);
            setErr(e?.message || "Failed to load order");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    return (
        <UserLayout>
            <div className="max-w-3xl mx-auto text-white space-y-6">
                {loading ? (
                    <SuccessSkeleton />
                ) : err ? (
                    <div className="bg-zinc-900/70 border border-red-500/30 rounded-2xl p-6">
                        <div className="text-red-200 font-semibold">Could not load order</div>
                        <div className="text-white/60 mt-2">{err}</div>

                        <div className="mt-5 flex gap-2">
                            <button
                                onClick={load}
                                className="px-4 py-2 rounded-lg bg-white text-black font-semibold"
                                type="button"
                            >
                                Retry
                            </button>
                            <Link
                                to="/my-orders"
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10"
                            >
                                My Orders
                            </Link>
                        </div>
                    </div>
                ) : !order ? (
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 text-white/70">
                        Order not found.
                    </div>
                ) : (
                    <>
                        {/* Success header */}
                        <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-2xl font-extrabold">✅ Order placed successfully</div>
                                    <div className="text-white/60 mt-2">
                                        Order: <span className="text-white font-semibold">{order.order_code ?? `#${order.id}`}</span>
                                    </div>
                                    <div className="text-white/60 mt-1">
                                        We’ll process your order soon.
                                    </div>
                                </div>
                                <StatusBadge status={order.status} />
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                                <Link
                                    to="/my-orders"
                                    className="px-4 py-2 rounded-lg bg-white text-black font-semibold"
                                >
                                    View My Orders
                                </Link>

                                <Link
                                    to={`/orders/${order.id}`}
                                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                >
                                    Order details
                                </Link>

                                <Link
                                    to="/"
                                    className="px-4 py-2 rounded-lg bg-black text-white border border-white/10 hover:bg-white/5"
                                >
                                    Continue shopping
                                </Link>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="bg-zinc-900/70 border border-white/10 rounded-2xl overflow-hidden">
                            {(order.items ?? []).map((it) => (
                                <div
                                    key={it.id}
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

                        {/* Totals */}
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

                        {/* Shipping info */}
                        <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4 space-y-2">
                            <div className="text-white/60 text-sm">City</div>
                            <div className="font-medium">{order.city ?? "-"}</div>

                            <div className="text-white/60 text-sm mt-3">Shipping address</div>
                            <div className="text-white/90 whitespace-pre-line">{order.shipping_address ?? "-"}</div>
                        </div>
                    </>
                )}
            </div>
        </UserLayout>
    );
}
