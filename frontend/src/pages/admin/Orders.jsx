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

const btnGhost =
    "px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition disabled:opacity-60";

// ✅ فاز ۱ بدون پرداخت
const STATUS = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const STATUS_META = {
    pending:   { label: "pending",   cls: "bg-amber-500/15 border-amber-500/30 text-amber-200" },
    confirmed: { label: "confirmed", cls: "bg-blue-500/15 border-blue-500/30 text-blue-200" },
    shipped:   { label: "shipped",   cls: "bg-sky-500/15 border-sky-500/30 text-sky-200" },
    delivered: { label: "delivered", cls: "bg-emerald-500/15 border-emerald-500/30 text-emerald-200" },
    cancelled: { label: "cancelled", cls: "bg-red-500/15 border-red-500/30 text-red-200" },
};

const FLOW = {
    pending:   ["pending", "confirmed", "cancelled"],
    confirmed: ["confirmed", "shipped", "cancelled"],
    shipped:   ["shipped", "delivered", "cancelled"],
    delivered: ["delivered"],
    cancelled: ["cancelled"],
};

function StatusBadge({ status }) {
    const s = String(status || "").toLowerCase();
    const meta = STATUS_META[s];
    const cls = meta?.cls ?? "bg-zinc-500/15 border-white/10 text-white/70";
    const label = meta?.label ?? (status ?? "unknown");
    return <span className={`px-2 py-1 rounded-full border text-xs ${cls}`}>{label}</span>;
}

function formatDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString();
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
    const [saving, setSaving] = useState(false);

    const [q, setQ] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // View modal
    const [viewOpen, setViewOpen] = useState(false);
    const [viewOrder, setViewOrder] = useState(null);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewErr, setViewErr] = useState("");

    // Tracking edit (Option B)
    const [trackingInput, setTrackingInput] = useState("");
    const [trackingSaving, setTrackingSaving] = useState(false);
    const [trackingErr, setTrackingErr] = useState("");

    // Update status modal
    const [statusOpen, setStatusOpen] = useState(false);
    const [statusOrder, setStatusOrder] = useState(null);
    const [newStatus, setNewStatus] = useState("pending");

    async function load({ status = statusFilter, search = q } = {}) {
        setErr("");
        setLoading(true);

        try {
            const params = new URLSearchParams();
            if (status && status !== "all") params.set("status", status);

            const s = (search || "").trim();
            if (s) params.set("search", s);

            params.set("per_page", "50");

            const data = await api(`/api/admin/orders?${params.toString()}`);
            setItems(data?.data || []);
        } catch (e) {
            setErr(e?.message || "Failed to load orders");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const t = setTimeout(() => {
            load({ status: statusFilter, search: q });
        }, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, q]);

    const list = useMemo(() => items || [], [items]);

    async function openView(orderId) {
        setViewErr("");
        setTrackingErr("");
        setViewLoading(true);
        setViewOpen(true);
        setViewOrder(null);
        setTrackingInput(""); // ✅ قبل از لود خالی کن

        try {
            const data = await api(`/api/admin/orders/${orderId}`);
            setViewOrder(data);

            // ✅ اینجا data وجود داره
            setTrackingInput(data?.tracking_code ?? "");
        } catch (e) {
            setViewErr(e?.message || "Failed to load order");
            setViewOrder(null);
        } finally {
            setViewLoading(false);
        }
    }

    function closeView() {
        setViewOpen(false);
        setViewOrder(null);
        setViewErr("");
        setTrackingInput("");
        setTrackingErr("");
        setTrackingSaving(false);
    }

    function openStatus(order) {
        setStatusOrder(order);

        const cur = String(order?.status || "pending").toLowerCase();
        const allowed = FLOW[cur] || ["pending"];
        setNewStatus(allowed.includes(cur) ? cur : allowed[0]);

        setStatusOpen(true);
    }

    async function saveTracking() {
        if (!viewOrder?.id) return;

        setTrackingErr("");
        setTrackingSaving(true);

        try {
            const res = await api(`/api/admin/orders/${viewOrder.id}/tracking`, {
                method: "PATCH",
                body: JSON.stringify({ tracking_code: trackingInput.trim() || null }),
            });

            const updated = res?.order ?? res;

            // ✅ مودال رو با دیتای جدید آپدیت کن
            setViewOrder(updated);

            // ✅ لیست جدول هم آپدیت شه
            setItems((prev) =>
                prev.map((x) => (x.id === updated.id ? { ...x, tracking_code: updated.tracking_code } : x))
            );
        } catch (e) {
            setTrackingErr(e?.message || "Failed to update tracking");
        } finally {
            setTrackingSaving(false);
        }
    }

    async function handleUpdateStatus(e) {
        e.preventDefault();
        if (!statusOrder?.id) return;

        const from = String(statusOrder?.status || "").toLowerCase();
        const allowed = FLOW[from] || [];
        if (!allowed.includes(newStatus)) {
            setErr(`Invalid status change: ${from} -> ${newStatus}`);
            return;
        }

        setErr("");
        setSaving(true);

        try {
            await api(`/api/admin/orders/${statusOrder.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            });

            setItems((prev) =>
                prev.map((x) => (x.id === statusOrder.id ? { ...x, status: newStatus } : x))
            );

            setViewOrder((prev) =>
                prev && prev.id === statusOrder.id ? { ...prev, status: newStatus } : prev
            );

            setStatusOpen(false);
            setStatusOrder(null);
        } catch (e2) {
            setErr(e2?.message || "Update status failed");
        } finally {
            setSaving(false);
        }
    }

    const allowedStatusOptions = useMemo(() => {
        const cur = String(statusOrder?.status || "pending").toLowerCase();
        return FLOW[cur] || STATUS;
    }, [statusOrder]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-white">Orders</h1>
                    <p className="text-white/50 text-sm mt-1">View and manage customer orders</p>
                </div>

                <button onClick={() => load()} className={btnDark} type="button">
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
                            {STATUS.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl shadow p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-white">List</h2>
                    <span className="text-sm text-white/50">{list.length} items</span>
                </div>

                {loading ? (
                    <div className="text-white/70">Loading...</div>
                ) : list.length === 0 ? (
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
                            {list.map((o) => (
                                <tr key={o.id} className="border-b border-white/10 hover:bg-white/5 transition">
                                    <td className="py-3 px-3">{o.order_code ?? o.id}</td>

                                    <td className="py-3 px-3 font-medium">
                                        {o.user?.name ?? o.customer_name ?? "-"}
                                    </td>

                                    <td className="py-3 px-3 text-white/80">
                                        {o.user?.email ?? o.customer_email ?? "-"}
                                    </td>

                                    <td className="py-3 px-3">{money(o.total_price)}</td>

                                    <td className="py-3 px-3">
                                        <StatusBadge status={o.status} />
                                    </td>

                                    <td className="py-3 px-3 text-white/70">{formatDate(o.created_at)}</td>

                                    <td className="py-3 px-3">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openView(o.id)}
                                                className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/15 transition"
                                                type="button"
                                            >
                                                View
                                            </button>

                                            <button onClick={() => openStatus(o)} className={btnDark} type="button">
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
                    <div className="absolute inset-0 bg-black/70" onClick={closeView} />

                    <div className="relative w-full max-w-3xl bg-zinc-900 border border-white/10 text-white rounded-2xl shadow-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-lg">
                                    Order #{viewOrder?.order_code ?? viewOrder?.id ?? ""}
                                </h3>
                                <div className="mt-1">
                                    <StatusBadge status={viewOrder?.status} />
                                </div>
                            </div>

                            <button onClick={closeView} className="text-white/70 hover:text-white" type="button">
                                ✕
                            </button>
                        </div>

                        {viewLoading ? (
                            <div className="text-white/60 bg-white/5 border border-white/10 rounded-xl p-4">
                                Loading...
                            </div>
                        ) : viewErr ? (
                            <div className="text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                {viewErr}
                            </div>
                        ) : !viewOrder ? (
                            <div className="text-white/60 bg-white/5 border border-white/10 rounded-xl p-4">
                                No data
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Customer */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="text-white/60 text-xs">Customer</div>
                                        <div className="font-medium mt-1">
                                            {viewOrder?.user?.name ?? viewOrder?.customer_name ?? "-"}
                                        </div>
                                        <div className="text-white/70 text-sm mt-1">
                                            {viewOrder?.user?.email ?? viewOrder?.customer_email ?? "-"}
                                        </div>
                                        {viewOrder?.customer_phone ? (
                                            <div className="text-white/70 text-sm mt-1">{viewOrder.customer_phone}</div>
                                        ) : null}
                                    </div>

                                    {/* Created + Totals */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="text-white/60 text-xs">Created</div>
                                        <div className="text-white/80 text-sm mt-1">{formatDate(viewOrder?.created_at)}</div>

                                        <div className="mt-3 space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="text-white/60">Subtotal</div>
                                                <div className="font-semibold">{money(viewOrder?.subtotal ?? 0)}</div>
                                            </div>

                                            <div className="flex items-center justify-between text-sm">
                                                <div className="text-white/60">Shipping</div>
                                                <div className="font-semibold">{money(viewOrder?.shipping_fee ?? 0)}</div>
                                            </div>

                                            <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                                                <div className="text-white/60">Total</div>
                                                <div className="font-extrabold text-xl">{money(viewOrder?.total_price ?? 0)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* City */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="text-white/60 text-xs">City</div>
                                        <div className="font-medium mt-1">{viewOrder?.city ?? "-"}</div>
                                    </div>

                                    {/* Address */}
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                        <div className="text-white/60 text-xs">Shipping address</div>
                                        <div className="text-white/80 text-sm mt-1 whitespace-pre-wrap">
                                            {viewOrder?.shipping_address ?? "-"}
                                        </div>
                                    </div>
                                </div>

                                {/* ✅ Tracking (Option B: editable) */}
                                <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
                                    <div className="text-white/60 text-xs">Tracking code</div>

                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            className={inputCls}
                                            value={trackingInput}
                                            onChange={(e) => setTrackingInput(e.target.value)}
                                            placeholder="Enter tracking code..."
                                            disabled={trackingSaving}
                                        />

                                        <button
                                            onClick={saveTracking}
                                            disabled={trackingSaving}
                                            className={btnPrimary}
                                            type="button"
                                        >
                                            {trackingSaving ? "Saving..." : "Save"}
                                        </button>
                                    </div>

                                    {trackingErr && (
                                        <div className="mt-2 text-xs text-red-300">{trackingErr}</div>
                                    )}

                                    <div className="text-white/60 text-xs mt-3">Shipping method</div>
                                    <div className="mt-1">{viewOrder?.shipping_method ?? "-"}</div>

                                    {viewOrder?.tracking_code && (
                                        <div className="mt-2 text-xs text-emerald-300">
                                            Current: {viewOrder.tracking_code}
                                        </div>
                                    )}
                                </div>

                                {/* Items */}
                                <div className="mt-5">
                                    <h4 className="font-semibold mb-2">Items</h4>

                                    {Array.isArray(viewOrder?.items) && viewOrder.items.length > 0 ? (
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
                                            No items found
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end mt-5">
                                    <button className={btnPrimary} onClick={closeView} type="button">
                                        Close
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Change Status Modal */}
            {statusOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70" onClick={() => setStatusOpen(false)} />

                    <div className="relative w-full max-w-lg bg-zinc-900 border border-white/10 text-white rounded-2xl shadow-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">
                                Change Status (Order #{statusOrder?.order_code ?? statusOrder?.id})
                            </h3>

                            <button
                                onClick={() => setStatusOpen(false)}
                                className="text-white/70 hover:text-white"
                                type="button"
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
                                    {allowedStatusOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>

                                <div className="mt-2">
                                    <StatusBadge status={newStatus} />
                                </div>

                                <div className="text-xs text-white/50 mt-2">
                                    Allowed: {allowedStatusOptions.join(" → ")}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStatusOpen(false)}
                                    className={btnGhost}
                                >
                                    Cancel
                                </button>

                                <button type="submit" className={btnPrimary} disabled={saving}>
                                    {saving ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
