import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api"; // همون api helper

export default function AdminRoute({ children }) {
    const [status, setStatus] = useState("loading"); // loading | ok | forbidden

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setStatus("forbidden");
            return;
        }

        api("/api/me")
            .then((me) => {
                if (me?.is_admin) setStatus("ok");
                else setStatus("forbidden");
            })
            .catch(() => setStatus("forbidden"));
    }, []);

    if (status === "loading") return <div className="p-6">Loading...</div>;
    if (status === "forbidden") return <Navigate to="/login" replace />;
    return children;
}
