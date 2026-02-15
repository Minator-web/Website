import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../lib/api";

const WishlistCtx = createContext(null);

export function WishlistProvider({ children }) {
    const [likedIds, setLikedIds] = useState(() => new Set());
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("token");

    const hydrate = useCallback(async () => {
        if (!token) {
            setLikedIds(new Set());
            return;
        }

        setLoading(true);
        try {
            const ids = await api("/api/wishlist/ids");
            setLikedIds(new Set((ids || []).map(Number)));
        } catch {
            // اگر خطا خورد، فعلاً خالی می‌ذاریم (UI خراب نشه)
            setLikedIds(new Set());
        } finally {
            setLoading(false);
        }
    }, [token]);

    // وقتی توکن عوض شد (login/logout) sync کن
    useEffect(() => {
        hydrate();
    }, [hydrate]);

    const isLiked = useCallback(
        (productId) => likedIds.has(Number(productId)),
        [likedIds]
    );

    // toggle با optimistic UI
    const toggle = useCallback(
        async (productId) => {
            if (!token) throw new Error("اول لاگین کن");

            const id = Number(productId);

            // optimistic update
            setLikedIds((prev) => {
                const n = new Set(prev);
                if (n.has(id)) n.delete(id);
                else n.add(id);
                return n;
            });

            try {
                const res = await api(`/api/wishlist/${id}/toggle`, { method: "POST" });

                // سرور منبع حقیقته: اگر نتیجه خلاف optimistic بود اصلاح می‌کنیم
                setLikedIds((prev) => {
                    const n = new Set(prev);
                    if (res?.liked) n.add(id);
                    else n.delete(id);
                    return n;
                });

                return !!res?.liked;
            } catch (e) {
                // rollback
                setLikedIds((prev) => {
                    const n = new Set(prev);
                    if (n.has(id)) n.delete(id);
                    else n.add(id);
                    return n;
                });
                throw e;
            }
        },
        [token]
    );

    const count = useMemo(() => likedIds.size, [likedIds]);

    const value = useMemo(
        () => ({ likedIds, count, loading, hydrate, isLiked, toggle }),
        [likedIds, count, loading, hydrate, isLiked, toggle]
    );

    return <WishlistCtx.Provider value={value}>{children}</WishlistCtx.Provider>;
}

export function useWishlist() {
    const ctx = useContext(WishlistCtx);
    if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
    return ctx;
}
