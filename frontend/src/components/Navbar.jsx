import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { logout } from "../lib/auth";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Navbar() {
    const { items } = useCart();
    const cartCount = items.reduce((sum, it) => sum + Number(it.qty ?? 1), 0);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        async function checkAdmin() {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const me = await api("/api/me");
                setIsAdmin(!!me?.is_admin);
            } catch {
                setIsAdmin(false);
            }
        }

        checkAdmin();
    }, []);

    async function handleLogout() {
        await logout();
        navigate("/login", { replace: true });
    }

    const linkCls = (active) =>
        `px-4 py-2 rounded-lg border border-white/10 ${
            active
                ? "bg-white text-black font-semibold"
                : "bg-white/10 text-white hover:bg-white/15"
        }`;

    return (
        <div className="w-full border-b border-white/10 bg-black/40 backdrop-blur">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-2 text-white">
                <Link to="/" className="text-2xl font-extrabold mr-2">
                    Shop
                </Link>

                <div className="flex items-center gap-2">
                    <Link to="/cart" className={linkCls(pathname === "/cart")}>
                        Cart ({cartCount})
                    </Link>

                    <Link to="/my-orders" className={linkCls(pathname === "/my-orders")}>
                        My Orders
                    </Link>

                    <Link to="/profile" className={linkCls(pathname === "/profile")}>
                        Profile
                    </Link>

                    {isAdmin && (
                        <Link
                            to="/admin"
                            className="px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold hover:opacity-90 transition"
                        >
                            Admin Panel
                        </Link>
                    )}
                </div>

                <div className="ml-auto">
                    <button onClick={handleLogout} className={linkCls(false)}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
