import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import UserLayout from "../layouts/UserLayout";
import { Link } from "react-router-dom";
import Skeleton from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import { useDrawer } from "../context/DrawerContext";
import { useWishlist } from "../context/WishlistContext";



const card =
    "bg-zinc-900/70 border border-white/10 rounded-2xl p-4 text-white hover:bg-white/5 transition";

const input =
    "w-full rounded-lg bg-zinc-950 border border-white/10 text-white placeholder:text-white/40 p-2 focus:outline-none focus:ring-2 focus:ring-white/20";

const select =
    "rounded-lg bg-zinc-950 border border-white/10 text-white p-2 focus:outline-none focus:ring-2 focus:ring-white/20";

function ShopSkeleton() {
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

export default function Shop() {
    const { add } = useCart();
    const toast = useToast();
    const { isLiked, toggle } = useWishlist();


    const token = localStorage.getItem("token");

    const { openCart, toggleCart } = useDrawer();
    const showCart = openCart || toggleCart;

    const [likedIds, setLikedIds] = useState(() => new Set());
    const [likeLoadingId, setLikeLoadingId] = useState(null);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);

    // UI controls
    const [q, setQ] = useState("");
    const [onlyInStock, setOnlyInStock] = useState(false);
    const [onlyActive, setOnlyActive] = useState(true);
    const [sortBy, setSortBy] = useState("newest"); // newest | price_asc | price_desc

    const load = useCallback(async () => {
        setLoading(true);
        setLoadFailed(false);

        try {
            const res = await api("/api/products");
            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            setProducts(list);

            // ✅ wishlist ids فقط برای لاگین‌شده‌ها
            if (token) {
                try {
                    const ids = await api("/api/wishlist/ids");
                    setLikedIds(new Set((ids || []).map(Number)));
                } catch {
                    setLikedIds(new Set());
                }
            } else {
                setLikedIds(new Set());
            }
        } catch (e) {
            setProducts([]);
            setLoadFailed(true);
            toast.push({
                type: "error",
                title: "Failed to load products",
                message: e?.message || "Failed to load products",
            });
        } finally {
            setLoading(false);
        }
    }, [toast, token]);

    useEffect(() => {
        load();
    }, [load]);

    async function toggleLike(e, productId) {
        e.preventDefault();
        e.stopPropagation();

        if (!token) {
            toast.push({ type: "info", message: "اول لاگین کن" });
            return;
        }

        if (likeLoadingId === productId) return;

        setLikeLoadingId(productId);

        try {
            const res = await api(`/api/wishlist/${productId}/toggle`, { method: "POST" });

            setLikedIds((prev) => {
                const n = new Set(prev);
                if (res?.liked) n.add(Number(productId));
                else n.delete(Number(productId));
                return n;
            });

            toast.push({
                type: res?.liked ? "success" : "info",
                title: res?.liked ? "Added to Wishlist" : "Deleted from Wishlist",
            });
        } catch (err) {
            toast.push({ type: "error", message: err?.message || "خطا در Wishlist" });
        } finally {
            setLikeLoadingId(null);
        }
    }

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();
        let list = [...products];

        if (onlyActive) list = list.filter((p) => !!p.is_active);
        if (onlyInStock) list = list.filter((p) => Number(p.stock ?? 0) > 0);

        if (query) {
            list = list.filter((p) => String(p.title || "").toLowerCase().includes(query));
        }

        if (sortBy === "price_asc") {
            list.sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
        } else if (sortBy === "price_desc") {
            list.sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
        } else {
            list.sort((a, b) => {
                const ad = a.created_at ? new Date(a.created_at).getTime() : Number(a.id ?? 0);
                const bd = b.created_at ? new Date(b.created_at).getTime() : Number(b.id ?? 0);
                return bd - ad;
            });
        }

        return list;
    }, [products, q, onlyActive, onlyInStock, sortBy]);

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
                {/* Toolbar */}
                <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4">
                    <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                        <div className="flex-1">
                            <input
                                className={input}
                                placeholder="Search products..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 items-center">
                            <label className="flex items-center gap-2 text-sm text-white/80">
                                <input
                                    type="checkbox"
                                    checked={onlyActive}
                                    onChange={(e) => setOnlyActive(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                Active only
                            </label>

                            <label className="flex items-center gap-2 text-sm text-white/80">
                                <input
                                    type="checkbox"
                                    checked={onlyInStock}
                                    onChange={(e) => setOnlyInStock(e.target.checked)}
                                    className="h-4 w-4"
                                />
                                In stock
                            </label>

                            <select className={select} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="newest">Newest</option>
                                <option value="price_asc">Price: low to high</option>
                                <option value="price_desc">Price: high to low</option>
                            </select>

                            <button
                                onClick={load}
                                className="px-3 py-2 rounded-lg bg-black text-white border border-white/10 hover:bg-white/5 transition disabled:opacity-60"
                                disabled={loading}
                                type="button"
                            >
                                {loading ? "Loading..." : "Refresh"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 text-sm text-white/50">
                        Showing <span className="text-white/80 font-semibold">{filtered.length}</span> products
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <ShopSkeleton />
                ) : loadFailed ? (
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-8">
                        <div className="text-xl font-bold">Could not load products</div>
                        <div className="mt-2 text-white/60">Please try again.</div>
                        <button
                            onClick={load}
                            className="mt-5 px-4 py-2 rounded-lg bg-black text-white font-semibold"
                            type="button"
                        >
                            Retry
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-8">
                        <div className="text-xl font-bold">No products found</div>
                        <div className="mt-2 text-white/60">Try changing filters or clearing the search.</div>

                        <div className="mt-5 flex gap-2">
                            <button
                                onClick={() => {
                                    setQ("");
                                    setOnlyActive(true);
                                    setOnlyInStock(false);
                                    setSortBy("newest");
                                }}
                                className="px-4 py-2 rounded-lg bg-black text-white font-semibold"
                                type="button"
                            >
                                Reset filters
                            </button>

                            <button
                                onClick={load}
                                className="px-4 py-2 rounded-lg bg-black text-white border border-white/10 hover:bg-white/5"
                                type="button"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {filtered.map((p) => {
                            const isActive = !!p.is_active;
                            const stock = Number(p.stock ?? 0);
                            const likeBusy = likeLoadingId === p.id;
                            const liked = isLiked(p.id);

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
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    toggle(p.id)
                                                        .then((likedNow) => {
                                                            toast.push({
                                                                type: likedNow ? "success" : "info",
                                                                message: likedNow ? "Added to Wishlist" : "Deleted from Wishlist",
                                                            });
                                                        })
                                                        .catch((err) => toast.push({ type: "error", message: err?.message || "خطا در Wishlist" }));
                                                }}
                                                className="absolute top-2 right-2 px-2 py-1 rounded-lg border border-white/10 bg-black/50 hover:bg-black/70 backdrop-blur disabled:opacity-60"
                                                title="Wishlist"
                                            >
                                                {liked ? "❤️" : "🤍"}
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
