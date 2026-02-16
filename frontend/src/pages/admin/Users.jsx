import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { useToast } from "../../context/ToastContext";

const inputCls =
    "w-full rounded-lg bg-zinc-950 border border-white/10 text-white placeholder:text-white/40 p-2 " +
    "focus:outline-none focus:ring-2 focus:ring-white/20";

const btnPrimary =
    "px-3 py-2 rounded-lg bg-white text-white font-medium hover:opacity-90 transition disabled:opacity-60";

const btnSoft =
    "px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/15 transition disabled:opacity-60";

const badge = "inline-flex items-center px-2 py-1 rounded-full text-xs border";

function RoleBadge({ role }) {
    const r = String(role || "user").toLowerCase();

    if (r === "super_admin") {
        return (
            <span className={`${badge} bg-emerald-500/15 border-emerald-500/30 text-emerald-200`}>
        super_admin
      </span>
        );
    }

    if (r === "admin") {
        return (
            <span className={`${badge} bg-indigo-500/15 border-indigo-500/30 text-indigo-200`}>
        admin
      </span>
        );
    }

    return <span className={`${badge} bg-white/5 border-white/10 text-white/70`}>user</span>;
}

export default function Users() {
    const toast = useToast();

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [items, setItems] = useState([]);

    const [q, setQ] = useState("");
    const [savingId, setSavingId] = useState(null);

    async function load() {
        setErr("");
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (q.trim()) params.set("search", q.trim());
            params.set("per_page", "50");

            const res = await api(`/api/admin/users?${params.toString()}`);

            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            setItems(list);
        } catch (e) {
            setErr(e?.message || "Failed to load users");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
    }, [q]);

    async function setRole(userId, role) {
        setSavingId(userId);
        try {
            const res = await api(`/api/admin/users/${userId}/role`, {
                method: "PATCH",
                body: JSON.stringify({ role }),
            });

            const updated = res?.user || res;

            setItems((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, role: updated?.role ?? role } : u))
            );

            toast.push({
                type: "success",
                title: "Updated",
                message: `User role is now ${role}`,
            });
        } catch (e) {
            toast.push({
                type: "error",
                title: "Failed",
                message: e?.message || "Role update failed",
            });
        } finally {
            setSavingId(null);
        }
    }

    const list = useMemo(() => items || [], [items]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-white">Users</h1>
                    <p className="text-white/50 text-sm mt-1">Manage user roles</p>
                </div>

                <button onClick={load} className={btnSoft} type="button" disabled={loading}>
                    {loading ? "Loading..." : "Refresh"}
                </button>
            </div>

            {err && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-200 p-3 rounded-lg">
                    {err}
                </div>
            )}

            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl shadow p-5">
                <label className="block text-sm mb-1 text-white/80">Search (name / email)</label>
                <input
                    className={inputCls}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="amir@gmail.com"
                />
            </div>

            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl shadow p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-white">List</h2>
                    <span className="text-sm text-white/50">{list.length} items</span>
                </div>

                {loading ? (
                    <div className="text-white/70">Loading...</div>
                ) : list.length === 0 ? (
                    <div className="text-white/60">No users.</div>
                ) : (
                    <div className="overflow-auto rounded-xl border border-white/10">
                        <table className="min-w-250 w-full text-sm text-white/90">
                            <thead>
                            <tr className="text-left border-b border-white/10 text-white/70 bg-white/5">
                                <th className="py-3 px-3">ID</th>
                                <th className="py-3 px-3">Name</th>
                                <th className="py-3 px-3">Email</th>
                                <th className="py-3 px-3">Role</th>
                                <th className="py-3 px-3 w-56">Actions</th>
                            </tr>
                            </thead>

                            <tbody>
                            {list.map((u) => {
                                const saving = savingId === u.id;
                                const role = String(u.role || "user").toLowerCase();

                                const isSuper = role === "super_admin";
                                const isAdmin = role === "admin";


                                const disabledAll = saving || isSuper;

                                return (
                                    <tr key={u.id} className="border-b border-white/10 hover:bg-white/5 transition">
                                        <td className="py-3 px-3">{u.id}</td>
                                        <td className="py-3 px-3 font-medium">{u.name ?? "-"}</td>
                                        <td className="py-3 px-3 text-white/80">{u.email ?? "-"}</td>
                                        <td className="py-3 px-3">
                                            <RoleBadge role={role} />
                                        </td>

                                        <td className="py-3 px-3">
                                            {isSuper ? (
                                                <span className="text-xs text-white/50">Super admin cannot be changed</span>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        className={btnPrimary}
                                                        type="button"
                                                        disabled={disabledAll || isAdmin}
                                                        onClick={() => setRole(u.id, "admin")}
                                                    >
                                                        {saving && !isAdmin ? "Saving..." : "Make Admin"}
                                                    </button>

                                                    <button
                                                        className={btnSoft}
                                                        type="button"
                                                        disabled={disabledAll || !isAdmin}
                                                        onClick={() => setRole(u.id, "user")}
                                                    >
                                                        {saving && isAdmin ? "Saving..." : "Make User"}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
