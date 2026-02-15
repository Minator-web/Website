import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import CartDrawer from "../components/CartDrawer";
import { useDrawer } from "../context/DrawerContext";
import { useToast } from "../context/ToastContext";
import { useWishlist } from "../context/WishlistContext";

export default function UserLayout({ children }) {
    const navigate = useNavigate();
    const toast = useToast();
    const { count: wishlistCount } = useWishlist();

    const { items } = useCart();
    const { toggleCart } = useDrawer();

    // ✅ بهتر از اینکه هر بار مستقیم localStorage بخونیم
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [me, setMe] = useState(null);

    // ✅ تعداد واقعی (جمع qty)
    const cartCount = useMemo(
        () => items.reduce((sum, it) => sum + Number(it.qty ?? 1), 0),
        [items]
    );

    useEffect(() => {
        // اگر token نیست، اطلاعات me رو پاک کن
        if (!token) {
            setMe(null);
            return;
        }

        api("/api/me")
            .then(setMe)
            .catch(() => {
                localStorage.removeItem("token");
                setToken(null);
                setMe(null);

                toast.push({
                    type: "error",
                    title: "Session expired",
                    message: "Please login again.",
                });

                navigate("/login");
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    async function handleLogout() {
        try {
            await api("/api/logout", { method: "POST" });
        } catch (_) {}

        localStorage.removeItem("token");
        setToken(null);
        setMe(null);

        toast.push({ type: "success", title: "Logged out", message: "You have been logged out." });

        navigate("/");
    }

    return (
        <div className="min-h-screen bg-black">
            <div className="border-b border-white/10">
                <div className="max-w-6xl mx-auto flex items-center justify-between p-4 text-white">
                    {/* LEFT */}
                    <div className="flex items-center gap-3">
                        <Link to="/" className="text-xl font-bold hover:opacity-80">
                            Shop
                        </Link>

                        {token && (
                            <>
                                <button
                                    onClick={toggleCart}
                                    className="relative px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                    type="button"
                                >
                                    Cart
                                    {cartCount > 0 && (
                                        <span className="absolute -top-2 -right-2 text-xs bg-white text-black rounded-full px-2 py-0.5">
                      {cartCount}
                    </span>
                                    )}
                                </button>

                                <Link to="/my-orders" className="px-3 py-1 rounded-lg bg-white/10 border border-white/10">
                                    My Orders
                                </Link>

                                <Link
                                    to="/wishlist"
                                    className="relative px-3 py-1 rounded-lg bg-white/10 border border-white/10"
                                >
                                    Wishlist
                                    {wishlistCount > 0 && (
                                        <span className="absolute -top-2 -right-2 text-xs bg-white text-black rounded-full px-2 py-0.5">
      {wishlistCount}
    </span>
                                    )}
                                </Link>

                                <Link to="/profile" className="px-3 py-1 rounded-lg bg-white/10 border border-white/10">
                                    Profile
                                </Link>

                            </>
                        )}

                        {me?.is_admin && (
                            <Link to="/admin" className="px-3 py-1 rounded-lg bg-emerald-500 text-black font-semibold">
                                Admin Panel
                            </Link>
                        )}
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-3">
                        {!token ? (
                            <>
                                <Link to="/login" className="px-3 py-1 rounded-lg bg-white/10 border border-white/10">
                                    Login
                                </Link>

                                <Link to="/register" className="px-3 py-1 rounded-lg bg-white text-black font-semibold">
                                    Register
                                </Link>
                            </>
                        ) : (
                            <button
                                onClick={handleLogout}
                                className="px-3 py-1 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15"
                                type="button"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6">{children}</div>

            {/* ✅ Drawer فقط یکبار اینجا */}
            <CartDrawer />
        </div>
    );
}
