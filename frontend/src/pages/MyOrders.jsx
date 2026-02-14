import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import UserLayout from "../layouts/UserLayout";

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
    return <span className={`px-2 py-1 rounded-full border text-xs ${cls}`}>{label}</span>;
}

function money(x) {
    const n = Number(x);
    if (Number.isNaN(n)) return x ?? "-";
    return n.toLocaleString();
}

function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString();
}

export default function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    async function load() {
        setErr("");
        setLoading(true);
        try {
            const res = await api("/api/orders/me"); // paginate
            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            setOrders(list);
        } catch (e) {
            setErr(e?.message || "Failed to load orders");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <UserLayout>
            <div className="min-h-screen bg-black p-6 text-white">
                <div className="max-w-4xl mx-auto space-y-6 text-white">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-extrabold">My Orders</h1>
                    </div>

                    {err && (
                        <div className="text-red-200 bg-red-500/15 border border-red-500/30 p-3 rounded-lg">
                            {err}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-white/70">Loading...</div>
                    ) : orders.length === 0 ? (
                        <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 text-white/70">
                            You have no orders yet.
                        </div>
                    ) : (
                        <div className="bg-zinc-900/70 border border-white/10 rounded-2xl overflow-hidden">
                            {orders.map((o) => (
                                <Link
                                    key={o.id}
                                    to={`/orders/${o.id}`}
                                    className="block p-4 border-b border-white/10 hover:bg-white/5 transition"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="font-semibold">
                                            Order #{o.order_code ?? o.id}
                                        </div>
                                        <div className="text-white/70 text-sm">{formatDate(o.created_at)}</div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white/60 text-sm">Status:</span>
                                            <StatusBadge status={o.status} />
                                        </div>

                                        <div className="text-lg font-extrabold">{money(o.total_price)}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
