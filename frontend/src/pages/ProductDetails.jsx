import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import UserLayout from "../layouts/UserLayout";
import Skeleton from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import { useDrawer } from "../context/DrawerContext";
import { useWishlist } from "../context/WishlistContext";

function ProductDetailsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-900/70 border border-white/10 rounded-2xl p-6">
            <div>
                <Skeleton className="w-full h-80 rounded-2xl" />
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-32" />
                </div>

                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-10/12" />
                </div>

                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-4 w-24" />
            </div>
        </div>
    );
}

export default function ProductDetails() {
    const { id } = useParams();
    const { add } = useCart();
    const toast = useToast();

    const { openCart } = useDrawer();

    const { isLiked, toggle, loading: wishlistHydrating } = useWishlist();
    const [likeLoading, setLikeLoading] = useState(false);

    const [p, setP] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadFailed(false);
        try {
            const res = await api(`/api/products/${id}`);
            setP(res?.data || res);
        } catch (e) {
            setP(null);
            setLoadFailed(true);
            toast.push({
                type: "error",
                title: "Product load failed",
                message: e?.message || "Product not found",
            });
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    useEffect(() => {
        load();
    }, [load]);

    const isActive = !!p?.is_active;
    const stock = Number(p?.stock ?? 0);

    const liked = !!(p?.id && isLiked(p.id));

    async function toggleLike() {
        if (!p?.id) return;

        setLikeLoading(true);
        try {
            const likedNow = await toggle(p.id);

            toast.push({
                type: likedNow ? "success" : "info",
                message: likedNow ? "Added to WishList" : "Deleted From WishList",
            });
        } catch (e) {
            toast.push({ type: "error", message: e?.message || "Error in Wishlist" });
        } finally {
            setLikeLoading(false);
        }
    }

    function addToCart() {
        if (!p) return;

        if (!isActive) {
            toast.push({ type: "error", title: "Unavailable", message: "This product is not active." });
            return;
        }

        if (stock <= 0) {
            toast.push({ type: "error", title: "Out of stock", message: "This product is out of stock." });
            return;
        }

        add({ product_id: p.id, title: p.title, price: p.price });

        toast.push({
            type: "success",
            title: "Added to cart",
            message: "Product added to your cart.",
        });
        openCart();
    }

    return (
        <UserLayout>
            <div className="max-w-4xl mx-auto text-white space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-extrabold">Product</h1>
                    <Link to="/" className="text-white/70 hover:text-white">
                        ← Back to shop
                    </Link>
                </div>

                {loading ? (
                    <ProductDetailsSkeleton />
                ) : loadFailed ? (
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6">
                        <div className="text-xl font-bold">Could not load product</div>
                        <div className="mt-2 text-white/60">Please try again.</div>

                        <div className="mt-5 flex items-center gap-3">
                            <button
                                onClick={load}
                                className="px-4 py-2 rounded-lg bg-white text-black font-semibold"
                                type="button"
                            >
                                Retry
                            </button>
                            <Link to="/" className="text-white/80 underline">
                                Back to shop
                            </Link>
                        </div>
                    </div>
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
                                    Stock: <span className="text-white">{stock}</span>
                                    {!isActive ? <span className="ml-2 text-red-200">(inactive)</span> : null}
                                </div>
                            </div>

                            {p.description ? (
                                <div className="text-white/80 leading-relaxed whitespace-pre-line">{p.description}</div>
                            ) : (
                                <div className="text-white/50">No description.</div>
                            )}

                            <div className="text-3xl font-extrabold">{Number(p.price).toLocaleString()}</div>

                            <div className="flex gap-2">
                                <button
                                    disabled={!isActive || stock <= 0}
                                    onClick={addToCart}
                                    className="w-full px-4 py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-50 border border-white/10 hover:bg-white/5"
                                    type="button"
                                >
                                    {stock <= 0 ? "Out of stock" : !isActive ? "Unavailable" : "Add to cart"}
                                </button>

                                <button
                                    onClick={toggleLike}
                                    disabled={likeLoading || wishlistHydrating}
                                    className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-60"
                                    title="Wishlist"
                                    type="button"
                                >
                                    {liked ? "❤️" : "🤍"}
                                </button>
                            </div>

                            <div className="text-xs text-white/40">Product ID: {p.id}</div>
                        </div>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
