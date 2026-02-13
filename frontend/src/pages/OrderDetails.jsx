import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

export default function OrderDetails() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        async function load() {
            try {
                const res = await api(`/api/orders/me/${id}`);
                setOrder(res);
            } catch (e) {
                setErr(e?.message || "Failed to load order");
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    if (loading) {
        return <div className="min-h-screen bg-black p-6 text-white">Loading...</div>;
    }

    if (err) {
        return (
            <div className="min-h-screen bg-black p-6 text-red-300">
                {err}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black p-6 text-white">
            <div className="max-w-3xl mx-auto space-y-6">

                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-extrabold">
                        Order #{order.id}
                    </h1>
                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm">
            {order.status}
          </span>
                </div>

                <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4">
                    <div className="text-white/60 text-sm">Shipping address</div>
                    <div className="mt-1">{order.shipping_address}</div>
                </div>

                <div className="bg-zinc-900/70 border border-white/10 rounded-2xl">
                    {order.items.map((it) => (
                        <div
                            key={it.id}
                            className="p-4 border-b border-white/10 flex items-center justify-between"
                        >
                            <div>
                                <div className="font-medium">{it.product_title}</div>
                                <div className="text-white/60 text-sm">Qty: {it.qty}</div>
                            </div>
                            <div className="font-semibold">
                                {(it.unit_price * it.qty).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                    <div className="text-white/60">Total</div>
                    <div className="text-2xl font-extrabold">
                        {order.total_price.toLocaleString()}
                    </div>
                </div>

                <Link
                    to="/my-orders"
                    className="inline-block px-4 py-2 rounded-lg bg-white text-black font-semibold"
                >
                    Back to MyOrders
                </Link>
            </div>
        </div>
    );
}
