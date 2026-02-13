import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api";

export default function GuestRoute({ children }) {
    const [status, setStatus] = useState("loading"); // loading | guest | user | admin
    const token = localStorage.getItem("token");

    useEffect(() => {
        let mounted = true;

        async function check() {
            if (!token) {
                mounted && setStatus("guest");
                return;
            }

            try {
                const me = await api("/api/me"); // اگر توکن معتبر باشه
                if (!mounted) return;
                setStatus(me?.is_admin ? "admin" : "user");
            } catch {
                // توکن نامعتبر/expire
                localStorage.removeItem("token");
                mounted && setStatus("guest");
            }
        }

        check();
        return () => (mounted = false);
    }, [token]);

    if (status === "loading") {
        return <div className="min-h-screen bg-black text-white p-6">Loading...</div>;
    }

    // اگر لاگین بود، نذار وارد login/register بشه
    if (status === "admin") return <Navigate to="/admin" replace />;
    if (status === "user") return <Navigate to="/" replace />;

    // guest → اجازه ورود
    return children;
}
