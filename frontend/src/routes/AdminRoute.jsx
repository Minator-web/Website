import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api";
import NotFound from "../pages/NotFound";

export default function AdminRoute({ children }) {
    const [ok, setOk] = useState(null); // null=loading, true/false=done
    const token = localStorage.getItem("token");

    useEffect(() => {
        let mounted = true;

        async function check() {
            if (!token) {
                mounted && setOk(false);
                return;
            }
            try {
                const me = await api("/api/me");
                mounted && setOk(!!me?.is_admin);
            } catch (e) {
                mounted && setOk(false);
            }
        }

        check();
        return () => (mounted = false);
    }, [token]);

    if (ok === null) return <div className="min-h-screen bg-black text-white p-6">Loading...</div>;

    if (!ok) return <NotFound />;

    return children;
}
