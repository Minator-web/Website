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

    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [role, setRole] = useState(() => localStorage.getItem("role") || "");
    const [me, setMe] = useState(null);
    const roleLower = String(role || "").toLowerCase();
    const canAccessAdmin = roleLower === "admin" || roleLower === "super_admin";

    const cartCount = useMemo(
        () => items.reduce((sum, it) => sum + Number(it.qty ?? 1), 0),
        [items]
    );

    useEffect(() => {
        function syncAuth() {
            setToken(localStorage.getItem("token"));
            setRole(localStorage.getItem("role") || "");
        }

        window.addEventListener("auth:changed", syncAuth);
        return () => window.removeEventListener("auth:changed", syncAuth);
    }, []);

    useEffect(() => {
        if (!token) {
            setMe(null);
            return;
        }

        api("/api/me")
            .then((u) => {
                setMe(u);

                const r = u?.role || (u?.is_admin ? "admin" : "user");
                localStorage.setItem("role", r);
                setRole(r);
            })
            .catch(() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                setToken(null);
                setRole("");
                setMe(null);

                toast.push({
                    type: "error",
                    title: "Session expired",
                    message: "Please login again.",
                });

                navigate("/login");
            });
    }, [token]);

    async function handleLogout() {
        try {
            await api("/api/logout", { method: "POST" });
        } catch (_) {}

        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.dispatchEvent(new Event("auth:changed"));

        setToken(null);
        setRole("");
        setMe(null);

        toast.push({
            type: "success",
            title: "Logged out",
            message: "You have been logged out.",
        });

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

                                <Link
                                    to="/my-orders"
                                    className="px-3 py-1 rounded-lg bg-white/10 border border-white/10"
                                >
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

                                <Link
                                    to="/profile"
                                    className="px-3 py-1 rounded-lg bg-white/10 border border-white/10"
                                >
                                    Profile
                                </Link>
                            </>
                        )}

                        {token && canAccessAdmin && (
                            <Link
                                to="/admin"
                                className="px-4 py-2 rounded-xl
      bg-indigo-500/15
      border border-indigo-500/30
      text-indigo-300
      hover:bg-indigo-500/25
      transition"
                            >
                                Admin Panel
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {!token ? (
                            <>
                                <Link
                                    to="/login"
                                    className="px-3 py-1 rounded-lg bg-white/10 border border-white/10"
                                >
                                    Login
                                </Link>

                                <Link
                                    to="/register"
                                    className="px-3 py-1 rounded-lg bg-white text-black font-semibold"
                                >
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

            <CartDrawer />
        </div>
    );
}
