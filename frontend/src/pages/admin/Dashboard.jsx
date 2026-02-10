import { useEffect, useState } from "react";
import { api } from "../../lib/api";

function money(n) {
    const x = Number(n ?? 0);
    return x.toLocaleString("fa-IR");
}

function Badge({ children }) {
    return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/10 border border-white/10 text-white/80">
      {children}
    </span>
    );
}

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");
    const [data, setData] = useState(null);

    async function load() {
        setErr("");
        setLoading(true);
        try {
            const res = await api("/api/admin/dashboard");
            setData(res);
        } catch (e) {
            setErr(e?.message || "Failed to load dashboard");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const stats = data?.stats || {};
    const latest = data?.latest_orders || [];
    const byStatus = data?.orders_by_status || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>
                    <p className="text-white/60 mt-1">Overview of store performance</p>
                </div>

                <button
                    onClick={load}
                    className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 text-white"
                >
                    Refresh
                </button>
            </div>

            {err && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-xl">
                    {err}
                </div>
            )}

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <StatCard
                    title="Total Orders"
                    value={stats.total_orders}
                    sub={`Today: ${stats.today_orders ?? 0}`}
                    loading={loading}
                />
                <StatCard
                    title="Total Revenue"
                    value={money(stats.total_revenue)}
                    sub={`Today: ${money(stats.today_revenue)}`}
                    loading={loading}
                />
                <StatCard
                    title="Products"
                    value={stats.total_products}
                    sub={`Users: ${stats.total_users ?? 0}`}
                    loading={loading}
                />
            </div>

            {/* Status + Latest */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-lg">Orders by status</h2>
                        <Badge>{byStatus.reduce((a, b) => a + Number(b.count || 0), 0)} total</Badge>
                    </div>

                    {loading ? (
                        <SkeletonRows />
                    ) : byStatus.length === 0 ? (
                        <div className="text-white/60">No data.</div>
                    ) : (
                        <div className="space-y-3">
                            {byStatus.map((s) => (
                                <div key={s.status} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge>{s.status}</Badge>
                                        <div className="text-white/70 text-sm">count</div>
                                    </div>
                                    <div className="font-semibold">{s.count}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-lg">Latest orders</h2>
                        <Badge>{latest.length} items</Badge>
                    </div>

                    {loading ? (
                        <SkeletonRows />
                    ) : latest.length === 0 ? (
                        <div className="text-white/60">No orders yet.</div>
                    ) : (
                        <div className="overflow-auto rounded-xl border border-white/10">
                            <table className="min-w-[700px] w-full text-sm text-white/90">
                                <thead>
                                <tr className="text-left border-b border-white/10 text-white/70 bg-white/5">
                                    <th className="py-3 px-3">ID</th>
                                    <th className="py-3 px-3">Customer</th>
                                    <th className="py-3 px-3">Email</th>
                                    <th className="py-3 px-3">Total</th>
                                    <th className="py-3 px-3">Status</th>
                                </tr>
                                </thead>
                                <tbody>
                                {latest.map((o) => (
                                    <tr key={o.id} className="border-b border-white/10 hover:bg-white/5 transition">
                                        <td className="py-3 px-3">{o.id}</td>
                                        <td className="py-3 px-3 font-medium">
                                            {o.user?.name ?? o.customer_name ?? "-"}
                                        </td>
                                        <td className="py-3 px-3 text-white/70">
                                            {o.user?.email ?? o.customer_email ?? "-"}
                                        </td>
                                        <td className="py-3 px-3">{money(o.total_price ?? o.total ?? o.amount)}</td>
                                        <td className="py-3 px-3">
                                            <Badge>{o.status}</Badge>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, sub, loading }) {
    return (
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="text-white/60 text-sm">{title}</div>
            <div className="mt-2 text-3xl font-extrabold">
                {loading ? <span className="inline-block w-28 h-8 bg-white/10 rounded" /> : (value ?? 0)}
            </div>
            <div className="mt-2 text-white/60 text-sm">
                {loading ? <span className="inline-block w-40 h-4 bg-white/10 rounded" /> : sub}
            </div>
        </div>
    );
}

function SkeletonRows() {
    return (
        <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-white/5 border border-white/10 rounded-xl" />
            ))}
        </div>
    );
}
