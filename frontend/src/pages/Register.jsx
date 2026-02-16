import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
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
            const reg = await api("/api/register", {
                method: "POST",
                body: JSON.stringify({ name, email, password }),
            });

            let token =
                reg.token ||
                reg.access_token ||
                reg?.token?.plainTextToken ||
                reg?.data?.token;

            if (!token) {
                const login = await api("/api/login", {
                    method: "POST",
                    body: JSON.stringify({ email, password }),
                });

                token =
                    login.token ||
                    login.access_token ||
                    login?.token?.plainTextToken ||
                    login?.data?.token;
            }

            if (!token) {
                setError("Token not received from server");
                return;
            }

            localStorage.setItem("token", token);

            navigate("/", { replace: true });
        } catch (err) {
            const msg =
                err?.message ||
                (err?.errors ? Object.values(err.errors)?.[0]?.[0] : null) ||
                "Register failed";
            setError(msg);
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
                            Create account
                        </h1>
                        <p className="text-sm text-white/60">
                            Sign up to start shopping
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-1.5">
                                Name
                            </label>
                            <input
                                className={inputCls}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                type="text"
                                placeholder="Your name"
                                autoComplete="name"
                                required
                            />
                        </div>

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
                                    autoComplete="new-password"
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

                            <p className="mt-2 text-xs text-white/50">
                                Use at least 8 characters.
                            </p>
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white border border-white/10 hover:bg-white/15 transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating..." : "Register"}
                    </button>

                    <p className="text-center text-xs text-white/60">
                        Already have an account?{" "}
                        <Link to="/login" className="text-white underline">
                            Login
                        </Link>
                    </p>
                </form>

                <p className="mt-4 text-center text-xs text-white/40">
                    © {new Date().getFullYear()} Shop
                </p>
            </div>
        </div>
    );
}
