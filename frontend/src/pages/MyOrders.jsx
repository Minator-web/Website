import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import UserLayout from "../layouts/UserLayout";
import Skeleton from "../components/Skeleton";
import { useToast } from "../context/ToastContext";

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

function OrdersSkeleton() {
    return (
        <div className="bg-zinc-900/70 border border-white/10 rounded-2xl overflow-hidden">
            {[1, 2, 3, 4].map((k) => (
                <div key={k} className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between gap-3">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-14" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-6 w-24" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function MyOrders() {
    const toast = useToast();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    async function load() {
        setLoading(true);
        try {
            const res = await api("/api/orders/me"); // paginate
            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            setOrders(list);
        } catch (e) {
            setOrders([]);
            toast.push({
                type: "error",
                title: "Failed to load orders",
                message: e?.message || "Failed to load orders",
            });
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

                        {!loading && (
                            <button
                                onClick={load}
                                className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white/80"
                                type="button"
                            >
                                Refresh
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <OrdersSkeleton />
                    ) : orders.length === 0 ? (
                        <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-8">
                            <div className="text-xl font-bold">No orders yet</div>
                            <div className="mt-2 text-white/60">
                                When you place an order, it will show up here.
                            </div>
                            <Link
                                to="/"
                                className="mt-5 inline-block px-4 py-2 rounded-lg bg-white text-black font-semibold"
                            >
                                Go shopping
                            </Link>
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
