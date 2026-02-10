import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
    `block rounded-lg px-3 py-2 text-sm transition ${
        isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
    }`;

export default function Sidebar() {
    return (
        <aside className="w-64 border-r bg-white p-4">
            <div className="mb-6 text-lg font-bold">Admin Panel</div>

            <nav className="space-y-1">
                <NavLink to="/admin" end className={linkClass}>
                    Dashboard
                </NavLink>
                <NavLink to="/admin/products" className={linkClass}>
                    Products
                </NavLink>
                <NavLink to="/admin/orders" className={linkClass}>
                    Orders
                </NavLink>
            </nav>
        </aside>
    );
}
