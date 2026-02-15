import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserLayout from "../layouts/UserLayout";
import { api } from "../lib/api";
import { useToast } from "../context/ToastContext";
import Skeleton from "../components/Skeleton";
import { useCart } from "../context/CartContext";
import { useDrawer } from "../context/DrawerContext";

const card =
    "bg-zinc-900/70 border border-white/10 rounded-2xl p-4 text-white hover:bg-white/5 transition";

function WishlistSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((k) => (
                <div key={k} className={card}>
                    <Skeleton className="w-full h-40 rounded-xl border border-white/10 mb-3" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-28 mt-2" />
                    <Skeleton className="h-7 w-32 mt-3" />
                    <Skeleton className="h-10 w-full rounded-lg mt-4" />
                </div>
            ))}
        </div>
    );
}

export default function Wishlist() {
    const token = localStorage.getItem("token");
    const navigate = useNavigate();
    const toast = useToast();

    const { add } = useCart();
    const { openCart, toggleCart } = useDrawer();
    const showCart = openCart || toggleCart;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    useEffect(() => {
        if (!token) navigate("/login");
    }, [token, navigate]);

    const load = useCallback(async () => {
        setLoading(true);
        setErr("");
        try {
            const res = await api("/api/wishlist");
            setItems(Array.isArray(res?.data) ? res.data : []);
        } catch (e) {
            setErr(e?.message || "Failed to load wishlist");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function removeFromWishlist(e, productId) {
        e.preventDefault();
        e.stopPropagation();

        try {
            // از همون toggle استفاده می‌کنیم
            await api(`/api/wishlist/${productId}/toggle`, { method: "POST" });
            setItems((prev) => prev.filter((p) => p.id !== productId));
            toast.push({ type: "info", message: "از علاقه‌مندی‌ها حذف شد" });
        } catch (e2) {
            toast.push({ type: "error", message: e2?.message || "خطا در حذف" });
        }
    }

    function addToCart(e, p) {
        e.preventDefault();
        e.stopPropagation();

        const isActive = !!p.is_active;
        const stock = Number(p.stock ?? 0);

        if (!isActive) {
            toast.push({ type: "error", title: "Unavailable", message: "This product is not active." });
            return;
        }
        if (stock <= 0) {
            toast.push({ type: "error", title: "Out of stock", message: "This product is out of stock." });
            return;
        }

        add({ product_id: p.id, title: p.title, price: p.price });
        toast.push({ type: "success", title: "Added to cart", message: "Product added to your cart." });
        if (showCart) showCart();
    }

    return (
        <UserLayout>
            <div className="max-w-5xl mx-auto space-y-6 text-white">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-extrabold">Wishlist</h1>
                    <button
                        onClick={load}
                        className="px-3 py-2 rounded-lg bg-black text-white border border-white/10 hover:bg-white/5"
                        type="button"
                        disabled={loading}
                    >
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>

                {err && (
                    <div className="bg-red-500/15 border border-red-500/30 text-red-200 p-3 rounded-lg">
                        {err}
                    </div>
                )}

                {loading ? (
                    <WishlistSkeleton />
                ) : items.length === 0 ? (
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-8">
                        <div className="text-xl font-bold">Wishlist is empty</div>
                        <div className="mt-2 text-white/60">Go add some products ❤️</div>
                        <Link
                            to="/"
                            className="inline-block mt-5 px-4 py-2 rounded-lg bg-white text-black font-semibold"
                        >
                            Back to shop
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {items.map((p) => {
                            const isActive = !!p.is_active;
                            const stock = Number(p.stock ?? 0);

                            return (
                                <Link key={p.id} to={`/products/${p.id}`} className="block">
                                    <div className={card}>
                                        <div className="relative">
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

                                            <button
                                                type="button"
                                                onClick={(e) => removeFromWishlist(e, p.id)}
                                                className="absolute top-2 right-2 px-2 py-1 rounded-lg border border-white/10 bg-black/50 hover:bg-black/70"
                                                title="Remove"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <div className="font-semibold text-lg">{p.title}</div>

                                        <div className="text-white/60 text-sm mt-1">
                                            Stock: <span className="text-white/80">{stock}</span>{" "}
                                            {!isActive ? <span className="ml-2 text-red-200">(inactive)</span> : null}
                                        </div>

                                        <div className="text-white font-extrabold text-xl mt-2">
                                            {Number(p.price).toLocaleString()}
                                        </div>

                                        <button
                                            disabled={!isActive || stock <= 0}
                                            onClick={(e) => addToCart(e, p)}
                                            className="mt-4 w-full px-4 py-2 rounded-lg bg-black text-white font-semibold disabled:opacity-50 border border-white/10 hover:bg-white/5"
                                            type="button"
                                        >
                                            {stock <= 0 ? "Out of stock" : !isActive ? "Unavailable" : "Add to cart"}
                                        </button>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
