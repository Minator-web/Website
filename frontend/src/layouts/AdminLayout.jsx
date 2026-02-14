import {Link, NavLink, Outlet, useNavigate} from "react-router-dom";
import { api } from "../lib/api";

const linkBase =
    "block px-3 py-2 rounded-lg transition border border-transparent";
const linkActive =
    "bg-white/10 border-white/10 text-white";
const linkInactive =
    "text-white/70 hover:text-white hover:bg-white/5";

export default function AdminLayout() {
    const navigate = useNavigate();

    async function handleLogout() {
        try {
            await api("/api/logout", { method: "POST" });
        } catch (_) {}
        localStorage.removeItem("token");
        navigate("/login");
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="font-extrabold text-xl">Admin Panel</div>

                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15"
                    >
                        Logout
                    </button>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar */}
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

                                <NavLink to="/profile"
                                         className={({ isActive }) =>
                                             '${linkBase} ${isActive ? linkActive : linkInactive}'
                                         }
                                             >
                                    Profile
                                </NavLink>
                            </nav>
                        </div>
                    </aside>

                    {/* Page content */}
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
