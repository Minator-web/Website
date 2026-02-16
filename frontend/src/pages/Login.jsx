import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const data = await api("/api/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            const token =
                data.token ||
                data.access_token ||
                data?.token?.plainTextToken ||
                data?.data?.token;

            if (!token) {
                setError("Token not received from server");
                return;
            }

            localStorage.setItem("token", token);

            const me = await api("/api/me");
            const role = (me?.role || (me?.is_admin ? "admin" : "user")).toLowerCase();
            localStorage.setItem("role", role);

            window.dispatchEvent(new Event("auth:changed"));

            if (role === "admin") navigate("/admin");
            else navigate("/");
        } catch (err) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            window.dispatchEvent(new Event("auth:changed"));

            setError(err?.message || "Network error / API not reachable");
        } finally {
            setLoading(false);
        }
    }

    const inputCls =
        "w-full rounded-xl bg-zinc-950 border border-white/10 px-3 py-2.5 text-sm text-white " +
        "placeholder:text-white/40 outline-none " +
        "focus:border-white/20 focus:ring-4 focus:ring-white/10";

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
            <div className="w-full max-w-md">
                <form
                    onSubmit={handleSubmit}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 shadow-xl backdrop-blur p-7 space-y-5"
                >
                    <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

                    <div className="space-y-1">
                        <h1 className="text-2xl font-extrabold tracking-tight text-white">
                            Welcome back
                        </h1>
                        <p className="text-sm text-white/60">Sign in to continue</p>
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-1.5">
                                Email
                            </label>
                            <input
                                className={inputCls}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-1.5">
                                Password
                            </label>

                            <div className="relative">
                                <input
                                    className={`${inputCls} pr-12`}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    type={showPass ? "text" : "password"}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPass((s) => !s)}
                                    className="absolute top-1/2 -translate-y-1/2 right-2 rounded-md px-2 py-0.5 text-[10px] font-medium text-white/60 hover:bg-white/10 bg-transparent border-0 leading-none"
                                >
                                    {showPass ? "Hide" : "Show"}
                                </button>
                            </div>

                            <div className="mt-2 flex items-center justify-between">
                                <label className="flex items-center gap-2 text-xs text-white/60">
                                    <input type="checkbox" className="h-4 w-4" />
                                    Remember me
                                </label>

                                <button
                                    type="button"
                                    className="text-xs font-semibold text-white/60 hover:text-white bg-transparent border-0 p-0"
                                    onClick={() => alert("Add reset password flow")}
                                >
                                    Forgot password?
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white border border-white/10 hover:bg-white/15 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>

                    <p className="text-center text-xs text-white/60">
                        Don’t have an account?{" "}
                        <a href="/register" className="text-white underline">
                            Register
                        </a>
                    </p>

                    <p className="text-center text-xs text-white/50">
                        Tip: use a strong password 🙂
                    </p>
                </form>

                <p className="mt-4 text-center text-xs text-white/40">
                    © {new Date().getFullYear()} Admin Panel
                </p>
            </div>
        </div>
    );
}
