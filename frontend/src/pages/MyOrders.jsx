import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

function money(x) {
    const n = Number(x);
    if (Number.isNaN(n)) return x ?? "-";
    return n.toLocaleString();
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
            setOrders(res?.data || res || []);
        } catch (e) {
            setErr(e?.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="min-h-screen bg-black p-6 text-white">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-extrabold">My Orders</h1>
                    <Link to="/" className="text-white/70 hover:text-white">
                        ← Back to shop
                    </Link>
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
                                <div className="flex items-center justify-between">
                                    <div className="font-semibold">Order #{o.id}</div>
                                    <div className="text-white/70 text-sm">
                                        {new Date(o.created_at).toLocaleString()}
                                    </div>
                                </div>

                                <div className="mt-2 flex items-center justify-between">
                                    <div className="text-white/60 text-sm">
                                        Status: <span className="text-white">{o.status}</span>
                                    </div>
                                    <div className="text-lg font-extrabold">
                                        {money(o.total_price)}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
