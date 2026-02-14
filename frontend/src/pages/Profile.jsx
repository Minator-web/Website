import { useEffect, useState } from "react";
import { api } from "../lib/api";
import UserLayout from "../layouts/UserLayout";

const input =
    "w-full rounded-lg bg-zinc-950 border border-white/10 text-white placeholder:text-white/40 p-2 focus:outline-none focus:ring-2 focus:ring-white/20";
const label = "block text-sm mb-1 text-white/80";

export default function Profile() {
    const [me, setMe] = useState(null);

    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);

    const [cp, setCp] = useState("");
    const [np, setNp] = useState("");
    const [changing, setChanging] = useState(false);

    const [msg, setMsg] = useState("");
    const [err, setErr] = useState("");

    async function load() {
        setErr("");
        const data = await api("/api/me");
        setMe(data);
        setName(data?.name || "");
    }

    useEffect(() => {
        load().catch((e) => setErr(e?.message || "Failed to load profile"));
    }, []);

    async function saveProfile(e) {
        e.preventDefault();
        setMsg("");
        setErr("");
        setSaving(true);
        try {
            const updated = await api("/api/me", {
                method: "PATCH",
                body: JSON.stringify({ name }),
            });
            setMe(updated);
            setMsg("Profile updated ✅");
        } catch (e2) {
            const m =
                e2?.message ||
                (e2?.errors ? Object.values(e2.errors)?.[0]?.[0] : null) ||
                "Update failed";
            setErr(m);
        } finally {
            setSaving(false);
        }
    }

    async function changePassword(e) {
        e.preventDefault();
        setMsg("");
        setErr("");
        setChanging(true);
        try {
            await api("/api/me/change-password", {
                method: "POST",
                body: JSON.stringify({
                    current_password: cp,
                    new_password: np,
                }),
            });
            setCp("");
            setNp("");
            setMsg("Password changed ✅");
        } catch (e2) {
            const m =
                e2?.message ||
                (e2?.errors ? Object.values(e2.errors)?.[0]?.[0] : null) ||
                "Change password failed";
            setErr(m);
        } finally {
            setChanging(false);
        }
    }

    return (
        <UserLayout>
            <div className="max-w-3xl mx-auto space-y-6 text-white">
                <div className="min-h-screen bg-black p-6 text-white">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl font-extrabold">Profile</h1>
                        </div>

                        {err && (
                            <div className="bg-red-500/15 border border-red-500/30 text-red-200 p-3 rounded-lg">
                                {err}
                            </div>
                        )}
                        {msg && (
                            <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 p-3 rounded-lg">
                                {msg}
                            </div>
                        )}

                        {!me ? (
                            <div className="text-white/70">Loading...</div>
                        ) : (
                            <>
                                {/* Info */}
                                <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6">
                                    <div className="text-white/60 text-sm">Signed in as</div>
                                    <div className="text-xl font-semibold mt-1">{me.email}</div>
                                    <div className="text-white/50 text-xs mt-2">
                                        User ID: {me.id}
                                    </div>
                                </div>

                                {/* Edit profile */}
                                <form
                                    onSubmit={saveProfile}
                                    className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 space-y-4"
                                >
                                    <h2 className="text-xl font-bold">Edit profile</h2>

                                    <div>
                                        <label className={label}>Name</label>
                                        <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
                                    </div>

                                    <button
                                        disabled={saving}
                                        className="px-5 py-2 rounded-lg bg-white text-white font-semibold disabled:opacity-60"
                                    >
                                        {saving ? "Saving..." : "Save"}
                                    </button>
                                </form>

                                {/* Change password */}
                                <form
                                    onSubmit={changePassword}
                                    className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 space-y-4"
                                >
                                    <h2 className="text-xl font-bold">Change password</h2>

                                    <div>
                                        <label className={label}>Current password</label>
                                        <input className={input} type="password" value={cp} onChange={(e) => setCp(e.target.value)} />
                                    </div>

                                    <div>
                                        <label className={label}>New password</label>
                                        <input className={input} type="password" value={np} onChange={(e) => setNp(e.target.value)} />
                                    </div>

                                    <button
                                        disabled={changing}
                                        className="px-5 py-2 rounded-lg bg-white text-white font-semibold disabled:opacity-60"
                                    >
                                        {changing ? "Updating..." : "Update password"}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
