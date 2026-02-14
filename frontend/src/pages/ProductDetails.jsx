import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import UserLayout from "../layouts/UserLayout";

export default function ProductDetails() {
    const { id } = useParams();
    const { add } = useCart();

    const [p, setP] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    async function load() {
        setErr("");
        setLoading(true);
        try {
            const res = await api(`/api/products/${id}`);
            setP(res?.data || res);
        } catch (e) {
            // اگر 404 باشه معمولاً message میاد یا خالیه
            setErr(e?.message || "Product not found");
            setP(null);
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
            <div className="max-w-4xl mx-auto text-white space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-extrabold">Product</h1>
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
                ) : !p ? (
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 text-white/70">
                        Product not found.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-900/70 border border-white/10 rounded-2xl p-6">
                        {/* Image */}
                        <div>
                            {p.image_url ? (
                                <img
                                    src={p.image_url}
                                    alt={p.title}
                                    className="w-full h-80 object-cover rounded-2xl border border-white/10"
                                />
                            ) : (
                                <div className="w-full h-80 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40">
                                    No image
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-2xl font-extrabold">{p.title}</h2>
                                <div className="text-white/60 mt-1">
                                    Stock: <span className="text-white">{p.stock}</span>
                                </div>
                            </div>

                            {p.description ? (
                                <div className="text-white/80 leading-relaxed whitespace-pre-line">
                                    {p.description}
                                </div>
                            ) : (
                                <div className="text-white/50">No description.</div>
                            )}

                            <div className="text-3xl font-extrabold">
                                {Number(p.price).toLocaleString()}
                            </div>

                            <button
                                disabled={!p.is_active || p.stock <= 0}
                                onClick={() => add({ product_id: p.id, title: p.title, price: p.price })}
                                className="w-full px-4 py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-50 border border-white/10 hover:bg-white/5"
                            >
                                Add to cart
                            </button>

                            <div className="text-xs text-white/40">
                                Product ID: {p.id}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
