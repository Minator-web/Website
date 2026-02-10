import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

const inputCls =
    "w-full rounded-lg bg-zinc-950 border border-white/10 text-white placeholder:text-white/40 p-2 " +
    "focus:outline-none focus:ring-2 focus:ring-white/20";

const labelCls = "block text-sm mb-1 text-white/80";

const btnPrimary =
    "px-4 py-2 rounded-lg bg-white text-black font-medium hover:opacity-90 transition disabled:opacity-60";

const btnDark =
    "px-3 py-2 rounded-lg bg-black text-white border border-white/10 hover:bg-white/5 transition";

function StatusBadge({ status }) {
    const s = String(status || "").toLowerCase();

    const cls = useMemo(() => {
        if (["paid", "success", "completed"].includes(s))
            return "bg-emerald-500/15 border-emerald-500/30 text-emerald-200";
        if (["pending", "waiting"].includes(s))
            return "bg-amber-500/15 border-amber-500/30 text-amber-200";
        if (["shipped", "sent", "delivered"].includes(s))
            return "bg-sky-500/15 border-sky-500/30 text-sky-200";
        if (["cancelled", "canceled", "failed"].includes(s))
            return "bg-red-500/15 border-red-500/30 text-red-200";
        return "bg-zinc-500/15 border-white/10 text-white/70";
    }, [s]);

    return (
        <span className={`px-2 py-1 rounded-full border text-xs ${cls}`}>
      {status ?? "unknown"}
    </span>
    );
}

function formatDate(iso) {
    if (!iso) return "-";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}

function money(x) {
    if (x === null || x === undefined) return "-";
    const n = Number(x);
    if (Number.isNaN(n)) return String(x);
    return n.toLocaleString();
}

export default function Orders() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // فیلتر ساده
    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // View modal
    const [viewOpen, setViewOpen] = useState(false);
    const [viewOrder, setViewOrder] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewErr, setViewErr] = useState("");

    // Update status modal
    const [statusOpen, setStatusOpen] = useState(false);
    const [statusOrder, setStatusOrder] = useState(null);
    const [newStatus, setNewStatus] = useState("pending");


    async function load() {
        setErr("");
        setLoading(true);
        try {
            const data = await api("/api/admin/orders");
            setItems(data?.data || []);
        } catch (e) {
            setErr(e?.message || "Failed to load orders");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const filtered = useMemo(() => {
        const text = q.trim().toLowerCase();
        return (items || []).filter((o) => {
            const stOk =
                statusFilter === "all"
                    ? true
                    : String(o.status || "").toLowerCase() === statusFilter;

            if (!stOk) return false;
            if (!text) return true;

            const idStr = String(o.id ?? "");
            const email = o.user?.email ? String(o.user.email) : "";
            const name = o.user?.name ? String(o.user.name) : "";

            return (
                idStr.includes(text) ||
                email.toLowerCase().includes(text) ||
                name.toLowerCase().includes(text)
            );
        });
    }, [items, q, statusFilter]);

    async function openView(orderId) {
        setViewErr("");
        setViewLoading(true);
        setViewOpen(true);

        try {
            const data = await api(`/api/admin/orders/${orderId}`);
            setViewOrder(data);
        } catch (e) {
            setViewErr(e?.message || "Failed to load order");
            setViewOrder(null);
        } finally {
            setViewLoading(false);
        }
    }

    function openStatus(order) {
        setStatusOrder(order);
        setNewStatus(String(order?.status || "pending"));
        setStatusOpen(true);
    }

    async function handleUpdateStatus(e) {
        e.preventDefault();
        if (!statusOrder?.id) return;

        setErr("");
        try {
            // 🔧 اگر روتت فرق داره اینو عوض کن:
            // PATCH /api/admin/orders/{id}/status
            // یا PUT /api/admin/orders/{id}
            await api(`/api/admin/orders/${statusOrder.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            });

            await load();     // لیست رفرش

            setStatusOpen(false);
            setStatusOrder(null);

            // رفرش لیست
            load();
        } catch (e2) {
            setErr(e2?.message || "Update status failed");
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-white">Orders</h1>
                    <p className="text-white/50 text-sm mt-1">
                        View and manage customer orders
                    </p>
                </div>

                <button onClick={load} className={btnDark}>
                    Refresh
                </button>
            </div>

            {/* Error */}
            {err && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-200 p-3 rounded-lg">
                    {err}
                </div>
            )}

            {/* Filters */}
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl shadow p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className={labelCls}>Search (order id / user name / email)</label>
                        <input
                            className={inputCls}
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="مثلا 12 یا amir@gmail.com"
                        />
                    </div>

                    <div>
                        <label className={labelCls}>Status</label>
                        <select
                            className={inputCls}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All</option>
                            <option value="pending">pending</option>
                            <option value="paid">paid</option>
                            <option value="shipped">shipped</option>
                            <option value="delivered">delivered</option>
                            <option value="cancelled">cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl shadow p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-white">List</h2>
                    <span className="text-sm text-white/50">{filtered.length} items</span>
                </div>

                {loading ? (
                    <div className="text-white/70">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-white/60">No orders.</div>
                ) : (
                    <div className="overflow-auto rounded-xl border border-white/10">
                        <table className="min-w-363.75 w-full text-sm text-white/90">
                            <thead>
                            <tr className="text-left border-b border-white/10 text-white/70 bg-white/5">
                                <th className="py-3 px-3">ID</th>
                                <th className="py-3 px-3">Customer</th>
                                <th className="py-3 px-3">Email</th>
                                <th className="py-3 px-3">Total</th>
                                <th className="py-3 px-3">Status</th>
                                <th className="py-3 px-3">Created</th>
                                <th className="py-3 px-3 w-56">Actions</th>
                            </tr>
                            </thead>

                            <tbody>
                            {filtered.map((o) => (
                                <tr
                                    key={o.id}
                                    className="border-b border-white/10 hover:bg-white/5 transition"
                                >
                                    <td className="py-3 px-3">{o.id}</td>

                                    <td className="py-3 px-3 font-medium">
                                        {o.user?.name ?? o.customer_name ?? "-"}
                                    </td>

                                    <td className="py-3 px-3 text-white/80">
                                        {o.user?.email ?? o.customer_email ?? "-"}
                                    </td>

                                    <td className="py-3 px-3">{money(o.total_price ?? o.total ?? o.amount)}</td>

                                    <td className="py-3 px-3">
                                        <StatusBadge status={o.status} />
                                    </td>

                                    <td className="py-3 px-3 text-white/70">
                                        {formatDate(o.created_at)}
                                    </td>

                                    <td className="py-3 px-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openView(o.id)}
                                                className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/15 transition"
                                            >
                                                View
                                            </button>

                                            <button onClick={() => openStatus(o)} className={btnDark}>
                                                Change Status
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* View Modal */}
            {viewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70"
                        onClick={() => setViewOpen(false)}
                    />

                    <div className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 text-white rounded-2xl shadow-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-lg">Order #{viewOrder?.id}</h3>
                                <div className="mt-1">
                                    <StatusBadge status={viewOrder?.status} />
                                </div>
                            </div>

                            <button
                                onClick={() => setViewOpen(false)}
                                className="text-white/70 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="text-white/60 text-xs">Customer</div>
                                <div className="font-medium mt-1">
                                    {viewOrder?.user?.name ?? viewOrder?.customer_name ?? "-"}
                                </div>
                                <div className="text-white/70 text-sm mt-1">
                                    {viewOrder?.user?.email ?? viewOrder?.customer_email ?? "-"}
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <div className="text-white/60 text-xs">Total</div>
                                <div className="font-extrabold text-2xl mt-1">
                                    {money(viewOrder?.total_price ?? viewOrder?.total ?? viewOrder?.amount)}
                                </div>
                                <div className="text-white/60 text-xs mt-2">Created</div>
                                <div className="text-white/80 text-sm mt-1">
                                    {formatDate(viewOrder?.created_at)}
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="mt-4">
                            <h4 className="font-semibold mb-2">Items</h4>

                            {viewLoading ? (
                                <div className="text-white/60 bg-white/5 border border-white/10 rounded-xl p-4">
                                    Loading...
                                </div>
                            ) : viewErr ? (
                                <div className="text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                    {viewErr}
                                </div>
                            ) : Array.isArray(viewOrder?.items) && viewOrder.items.length > 0 ? (
                                <div className="overflow-auto rounded-xl border border-white/10">
                                    <table className="min-w-363.75 w-full text-sm text-white/90">
                                        <thead>
                                        <tr className="text-left border-b border-white/10 text-white/70 bg-white/5">
                                            <th className="py-3 px-3">Product</th>
                                            <th className="py-3 px-3">Qty</th>
                                            <th className="py-3 px-3">Price</th>
                                            <th className="py-3 px-3">Subtotal</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {viewOrder.items.map((it, idx) => {
                                            const qty = Number(it.qty ?? it.quantity ?? 1);
                                            const pr = Number(it.price ?? it.unit_price ?? 0);
                                            const sub = qty * pr;

                                            return (
                                                <tr
                                                    key={it.id ?? idx}
                                                    className="border-b border-white/10 hover:bg-white/5 transition"
                                                >
                                                    <td className="py-3 px-3 font-medium">
                                                        {it.product?.title ?? it.product_title ?? it.title ?? "-"}
                                                    </td>
                                                    <td className="py-3 px-3">{qty}</td>
                                                    <td className="py-3 px-3">{money(pr)}</td>
                                                    <td className="py-3 px-3">{money(sub)}</td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-white/60 bg-white/5 border border-white/10 rounded-xl p-4">
                                    No items found (اگر API آیتم‌ها رو نمی‌فرسته، باید تو بک‌اند load کنیم)
                                </div>
                            )}
                        </div>


                        <div className="flex justify-end mt-5">
                            <button className={btnPrimary} onClick={() => setViewOpen(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Status Modal */}
            {statusOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/70"
                        onClick={() => setStatusOpen(false)}
                    />

                    <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 text-white rounded-2xl shadow-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">
                                Change Status (Order #{statusOrder?.id})
                            </h3>

                            <button
                                onClick={() => setStatusOpen(false)}
                                className="text-white/70 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdateStatus} className="space-y-4">
                            <div>
                                <label className={labelCls}>New Status</label>
                                <select
                                    className={inputCls}
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                >
                                    <option value="pending">pending</option>
                                    <option value="paid">paid</option>
                                    <option value="shipped">shipped</option>
                                    <option value="delivered">delivered</option>
                                    <option value="cancelled">cancelled</option>
                                </select>
                                <div className="mt-2">
                                    <StatusBadge status={newStatus} />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStatusOpen(false)}
                                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                                >
                                    Cancel
                                </button>
                                <button type="submit">Save</button>
                            </div>
                        </form>

                        <div className="text-white/50 text-xs mt-4">
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
