import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import NotFound from "../pages/NotFound";

export default function AdminRoute({ children }) {
    const [ok, setOk] = useState(null);
    const location = useLocation();
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    useEffect(() => {
        if (!token) {
            setOk(false);
            return;
        }

        if (role === "admin" || role === "super_admin") {
            setOk(true);
            return;
        }

        setOk(false);
    }, [token, role, location.pathname]);

    if (ok === null) {
        return (
            <div className="min-h-screen bg-black text-white p-6">
                Loading...
            </div>
        );
    }

    if (!ok) {
        return <NotFound />;
    }

    return children;
}
