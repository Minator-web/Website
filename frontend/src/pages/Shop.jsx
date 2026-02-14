import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import UserLayout from "../layouts/UserLayout";
import { Link } from "react-router-dom";

const card =
    "bg-zinc-900/70 border border-white/10 rounded-2xl p-4 text-white " +
    "hover:bg-white/5 transition";

export default function Shop() {
    const { add } = useCart();
    const [products, setProducts] = useState([]);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(true);

    async function load() {
        setErr("");
        setLoading(true);
        try {
            const res = await api("/api/products");
            const list = res?.data || res || [];
            setProducts(list);
            console.log("products sample:", list[0]);
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
        <UserLayout>
            <div className="max-w-5xl mx-auto space-y-6 text-white">
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
                            <Link key={p.id} to={`/products/${p.id}`} className="block">
                                <div className={card}>
                                    {p.image_url ? (
                                        <img
                                            src={p.image_url}
                                            alt={p.title}
                                            className="w-full h-40 object-cover rounded-xl border border-white/10 mb-3"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-40 rounded-xl border border-white/10 mb-3 bg-white/5 flex items-center justify-center text-white/40 text-sm">
                                            No image
                                        </div>
                                    )}

                                    <div className="font-semibold text-lg">{p.title}</div>
                                    <div className="text-white/60 text-sm mt-1">Stock: {p.stock}</div>
                                    <div className="text-white font-extrabold text-xl mt-2">
                                        {Number(p.price).toLocaleString()}
                                    </div>

                                    <button
                                        disabled={!p.is_active || p.stock <= 0}
                                        onClick={(e) => {
                                            e.preventDefault(); // نره صفحه جزئیات وقتی Add to cart زدی
                                            add({ product_id: p.id, title: p.title, price: p.price });
                                        }}
                                        className="mt-4 w-full px-4 py-2 rounded-lg bg-black text-white font-semibold disabled:opacity-50 border border-white/10 hover:bg-white/5"
                                    >
                                        Add to cart
                                    </button>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
