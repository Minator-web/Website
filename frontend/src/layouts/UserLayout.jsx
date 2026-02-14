import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";

export default function UserLayout({ children }) {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const { items } = useCart();
    const cartCount = items.reduce((sum, it) => sum + Number(it.qty ?? 1), 0);

    const [me, setMe] = useState(null);

    useEffect(() => {
        if (!token) return;

        api("/api/me")
            .then(setMe)
            .catch(() => {
                localStorage.removeItem("token");
                setMe(null);
            });
    }, [token]);

    async function handleLogout() {
        try {
            await api("/api/logout", { method: "POST" });
        } catch (_) {}
        localStorage.removeItem("token");
        setMe(null);
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
                                <Link
                                    to="/cart"
                                    className="px-3 py-1 rounded-lg bg-white/10 border border-white/10"
                                >
                                    Cart ({cartCount})
                                </Link>

                                <Link to="/my-orders" className="px-3 py-1 rounded-lg bg-white/10 border border-white/10">
                                    My Orders
                                </Link>

                                <Link to="/profile" className="px-3 py-1 rounded-lg bg-white/10 border border-white/10">
                                    Profile
                                </Link>
                            </>
                        )}

                        {me?.is_admin && (
                            <Link
                                to="/admin"
                                className="px-3 py-1 rounded-lg bg-emerald-500 text-black font-semibold"
                            >
                                Admin Panel
                            </Link>
                        )}
                    </div>

                    {/* RIGHT */}
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
                            >
                                Logout
                            </button>
                        )}
                    </div>

                </div>
            </div>

            <div className="p-6">{children}</div>
        </div>
    );
}
