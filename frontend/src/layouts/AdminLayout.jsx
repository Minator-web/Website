import {Link, NavLink, Outlet, useNavigate} from "react-router-dom";
import { api } from "../lib/api";
import {useToast} from "../context/ToastContext.jsx";

const linkBase =
    "block px-3 py-2 rounded-lg transition border border-transparent";
const linkActive =
    "bg-white/10 border-white/10 text-white";
const linkInactive =
    "text-white/70 hover:text-white hover:bg-white/5";

export default function AdminLayout() {
    const navigate = useNavigate();
    const toast = useToast();
    const role = (localStorage.getItem("role") || "").toLowerCase();
    const isSuperAdmin = role === "super_admin";

    async function handleLogout() {
        try {
            await api("/api/logout", { method: "POST" });
        } catch (_) {}
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        window.dispatchEvent(new Event("auth:changed"));


        toast.push({ type: "success", title: "Logged out", message: "You have been logged out." });

        navigate("/login");
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="font-extrabold text-xl">Admin Panel</div>

                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className="px-4 py-2 rounded-xl border border-white/20 text-white hover:bg-white/10 transition"
                        >
                            ← View Store
                        </Link>


                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15"
                        >
                            Logout
                        </button>
                    </div>
                </div>


                <div className="grid grid-cols-12 gap-6">
                    <aside className="col-span-12 md:col-span-3 xl:col-span-2">
                        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-3">
                            <nav className="space-y-1">
                                <NavLink
                                    to="/admin"
                                    end
                                    className={({ isActive }) =>
                                        `${linkBase} ${isActive ? linkActive : linkInactive}`
                                    }
                                >
                                    Dashboard
                                </NavLink>

                                <NavLink
                                    to="/admin/products"
                                    className={({ isActive }) =>
                                        `${linkBase} ${isActive ? linkActive : linkInactive}`
                                    }
                                >
                                    Products
                                </NavLink>

                                <NavLink
                                    to="/admin/orders"
                                    className={({ isActive }) =>
                                        `${linkBase} ${isActive ? linkActive : linkInactive}`
                                    }
                                >
                                    Orders
                                </NavLink>

                                {isSuperAdmin && (
                                    <NavLink to="/admin/users" className={({isActive}) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
                                        Users
                                    </NavLink>
                                    )}

                                <NavLink
                                    to="/profile"
                                    className={({ isActive }) =>
                                        `${linkBase} ${isActive ? linkActive : linkInactive}`
                                    }
                                >
                                    Profile
                                </NavLink>
                            </nav>
                        </div>
                    </aside>

                    <main className="col-span-12 md:col-span-9 xl:col-span-10">
                        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
