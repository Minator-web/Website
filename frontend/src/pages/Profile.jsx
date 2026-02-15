import { useEffect, useState } from "react";
import { api } from "../lib/api";
import UserLayout from "../layouts/UserLayout";
import Skeleton from "../components/Skeleton";

const input =
    "w-full rounded-lg bg-zinc-950 border border-white/10 text-white placeholder:text-white/40 p-2 " +
    "focus:outline-none focus:ring-2 focus:ring-white/20";

const label = "block text-sm mb-1 text-white/80";

const card =
    "bg-zinc-900/70 border border-white/10 rounded-2xl p-6";

const btn =
    "px-5 py-2 rounded-lg bg-white text-black font-semibold disabled:opacity-60";

const btnGhost =
    "px-5 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 disabled:opacity-60";

export default function Profile() {
    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);

    const [cp, setCp] = useState("");
    const [np, setNp] = useState("");
    const [changing, setChanging] = useState(false);

    const [okMsg, setOkMsg] = useState("");
    const [errMsg, setErrMsg] = useState("");

    async function load() {
        setErrMsg("");
        setOkMsg("");
        setLoading(true);
        try {
            const data = await api("/api/me");
            setMe(data);
            setName(data?.name || "");
        } catch (e) {
            setMe(null);
            setErrMsg(e?.message || "Failed to load profile");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function saveProfile(e) {
        e.preventDefault();
        setOkMsg("");
        setErrMsg("");
        setSaving(true);
        try {
            const updated = await api("/api/me", {
                method: "PATCH",
                body: JSON.stringify({ name: name.trim() }),
            });
            setMe(updated);
            setName(updated?.name || "");
            setOkMsg("Profile updated ✅");
        } catch (e2) {
            const m =
                e2?.message ||
                (e2?.errors ? Object.values(e2.errors)?.[0]?.[0] : null) ||
                "Update failed";
            setErrMsg(m);
        } finally {
            setSaving(false);
        }
    }

    async function changePassword(e) {
        e.preventDefault();
        setOkMsg("");
        setErrMsg("");
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
            setOkMsg("Password changed ✅");
        } catch (e2) {
            const m =
                e2?.message ||
                (e2?.errors ? Object.values(e2.errors)?.[0]?.[0] : null) ||
                "Change password failed";
            setErrMsg(m);
        } finally {
            setChanging(false);
        }
    }

    return (
        <UserLayout>
            <div className="max-w-3xl mx-auto space-y-6 text-white">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold">Profile</h1>
                        <p className="text-white/50 text-sm mt-1">Manage your account settings</p>
                    </div>

                    <button onClick={load} className={btnGhost} type="button" disabled={loading}>
                        {loading ? "Refreshing..." : "Refresh"}
                    </button>
                </div>

                {/* Alerts */}
                {errMsg && (
                    <div className="bg-red-500/15 border border-red-500/30 text-red-200 p-3 rounded-lg">
                        {errMsg}
                    </div>
                )}
                {okMsg && (
                    <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 p-3 rounded-lg">
                        {okMsg}
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="space-y-4">
                        <div className={card}>
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-7 w-64 mt-2" />
                            <Skeleton className="h-4 w-24 mt-3" />
                        </div>
                        <div className={card}>
                            <Skeleton className="h-6 w-36" />
                            <Skeleton className="h-10 w-full mt-4 rounded-lg" />
                            <Skeleton className="h-10 w-28 mt-4 rounded-lg" />
                        </div>
                        <div className={card}>
                            <Skeleton className="h-6 w-44" />
                            <Skeleton className="h-10 w-full mt-4 rounded-lg" />
                            <Skeleton className="h-10 w-full mt-3 rounded-lg" />
                            <Skeleton className="h-10 w-44 mt-4 rounded-lg" />
                        </div>
                    </div>
                ) : !me ? (
                    <div className={card}>
                        <div className="text-white/70">Not logged in / failed to load.</div>
                    </div>
                ) : (
                    <>
                        {/* Account Info */}
                        <div className={card}>
                            <div className="text-white/60 text-sm">Signed in as</div>
                            <div className="text-xl font-semibold mt-1">{me.email}</div>

                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/50">
                <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
                  User ID: {me.id}
                </span>

                                {me?.is_admin ? (
                                    <span className="px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-200">
                    Admin
                  </span>
                                ) : (
                                    <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">
                    User
                  </span>
                                )}
                            </div>
                        </div>

                        {/* Edit profile */}
                        <form onSubmit={saveProfile} className={`${card} space-y-4`}>
                            <h2 className="text-xl font-bold">Edit profile</h2>

                            <div>
                                <label className={label}>Name</label>
                                <input
                                    className={input}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={saving}
                                    placeholder="Your name"
                                />
                            </div>

                            <button disabled={saving} className={btn}>
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </form>

                        {/* Change password */}
                        <form onSubmit={changePassword} className={`${card} space-y-4`}>
                            <h2 className="text-xl font-bold">Change password</h2>

                            <div>
                                <label className={label}>Current password</label>
                                <input
                                    className={input}
                                    type="password"
                                    value={cp}
                                    onChange={(e) => setCp(e.target.value)}
                                    disabled={changing}
                                />
                            </div>

                            <div>
                                <label className={label}>New password</label>
                                <input
                                    className={input}
                                    type="password"
                                    value={np}
                                    onChange={(e) => setNp(e.target.value)}
                                    disabled={changing}
                                />
                            </div>

                            <button disabled={changing} className={btn}>
                                {changing ? "Updating..." : "Update password"}
                            </button>
                        </form>

                        {/* Future: quick actions */}
                        <div className={`${card} flex items-center justify-between`}>
                            <div>
                                <div className="font-semibold">Quick actions</div>
                                <div className="text-white/50 text-sm mt-1">
                                    Next steps: Notifications & Wishlist pages
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className={btnGhost} type="button">
                                    Notifications
                                </button>
                                <button className={btnGhost} type="button">
                                    Wishlist
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </UserLayout>
    );
}
