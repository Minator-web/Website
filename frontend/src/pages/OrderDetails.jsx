import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

const STATUS_META = {
    paid:      { label: "paid",      cls: "bg-emerald-500/15 border-emerald-500/30 text-emerald-200" },
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

export default function OrderDetails() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        let alive = true;

        async function load() {
            setLoading(true);
            setErr("");
            try {
                const res = await api(`/api/orders/me/${id}`);
                if (!alive) return;
                setOrder(res);
            } catch (e) {
                if (!alive) return;
                setErr(e?.message || "Failed to load order");
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        }

        load();
        return () => {
            alive = false;
        };
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black p-6 text-white">
                <div className="max-w-xl mx-auto bg-zinc-900/70 border border-white/10 rounded-2xl p-6">
                    Loading...
                </div>
            </div>
        );
    }

    if (err) {
        return (
            <div className="min-h-screen bg-black p-6 text-white">
                <div className="max-w-xl mx-auto bg-zinc-900/70 border border-red-500/30 rounded-2xl p-6">
                    <div className="text-red-200">{err}</div>
                    <Link to="/my-orders" className="mt-4 inline-block text-white underline">
                        Back to My Orders
                    </Link>
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

    return (
        <div className="min-h-screen bg-black p-6 text-white">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-3xl font-extrabold">Order #{order.order_code ?? order.id}</h1>
                    <StatusBadge status={order.status} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4">
                        <div className="text-white/60 text-sm">City</div>
                        <div className="mt-1 font-medium">{order.city ?? "-"}</div>
                    </div>

                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4">
                        <div className="text-white/60 text-sm">Shipping address</div>
                        <div className="mt-1">{order.shipping_address ?? "-"}</div>
                    </div>
                </div>

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

                <Link
                    to="/my-orders"
                    className="inline-block px-4 py-2 rounded-lg bg-white text-black font-semibold"
                >
                    Back to My Orders
                </Link>
            </div>
        </div>
    );
}
