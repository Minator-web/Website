import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

const card = "bg-zinc-900/70 border border-white/10 rounded-2xl p-4 text-white";

export default function Shop() {
    const { add, items } = useCart();
    const [products, setProducts] = useState([]);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);
    const cartCount = items.reduce((sum, it) => sum + Number(it.qty ?? 1), 0);

    async function load() {
        setErr("");
        setLoading(true);
        try {
            const res = await api("/api/products"); // ✅ فقط public
            setProducts(res?.data || res || []);
        } catch (e) {
            setErr(e?.message || "Failed to load products");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between text-white">
                    <h1 className="text-3xl font-extrabold">Shop</h1>
                    <Link to="/cart" className="px-4 py-2 rounded-lg bg-white/10 border border-white/10">
                        Cart ({cartCount})
                    </Link>
                    <Link to="/my-orders" className="px-4 py-2 rounded-lg bg-white/10 border border-white/10">
                        My Orders
                    </Link>
                </div>

                {err && (
                    <div className="text-red-200 bg-red-500/15 border border-red-500/30 p-3 rounded-lg">
                        {err}
                    </div>
                )}

                {loading ? (
                    <div className="text-white/70">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {products.map((p) => (
                            <div key={p.id} className={card}>
                                <div className="font-semibold text-lg">{p.title}</div>
                                <div className="text-white/60 text-sm mt-1">Stock: {p.stock}</div>
                                <div className="text-white font-extrabold text-xl mt-2">{p.price}</div>

                                <button
                                    disabled={!p.is_active || p.stock <= 0}
                                    onClick={() => add({ product_id: p.id, title: p.title, price: p.price })}
                                    className="mt-4 w-full px-4 py-2 rounded-lg bg-black text-white font-semibold disabled:opacity-50"
                                >
                                    Add to cart
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
