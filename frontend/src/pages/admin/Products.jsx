import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../../lib/api";
import Skeleton from "../../components/Skeleton";
import { useToast } from "../../context/ToastContext";
import { formatUSD } from "../../lib/format";
import StockBadge from "../../components/StockBadge";
import EmptyState from "../../components/EmptyState";


const inputCls =
    "w-full rounded-lg bg-zinc-950 border border-white/10 text-white placeholder:text-white/40 p-2 " +
    "focus:outline-none focus:ring-2 focus:ring-white/20";

const labelCls = "block text-sm mb-1 text-white/80";

const btnPrimary =
    "px-4 py-2 rounded-lg bg-white text-white font-medium hover:opacity-90 transition disabled:opacity-60";

const btnDark =
    "px-3 py-2 rounded-lg bg-black text-white border border-white/10 hover:bg-white/5 transition disabled:opacity-60";

const btnDanger =
    "px-3 py-2 rounded-lg bg-red-600 text-white hover:opacity-90 transition disabled:opacity-60";

const btnSoft =
    "px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/15 transition disabled:opacity-60";

function TableSkeleton() {
    return (
        <div className="overflow-auto rounded-xl border border-white/10">
            <table className="min-w-225 w-full text-sm text-white/90">
                <thead>
                <tr className="text-left border-b border-white/10 text-white/70 bg-white/5">
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Image</th>
                    <th className="py-3 px-3">Title</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-3">Stock</th>
                    <th className="py-3 px-3">Active</th>
                    <th className="py-3 px-3 w-40">Actions</th>
                </tr>
                </thead>
                <tbody>
                {[1, 2, 3, 4, 5].map((k) => (
                    <tr key={k} className="border-b border-white/10">
                        <td className="py-3 px-3">
                            <Skeleton className="h-4 w-10" />
                        </td>
                        <td className="py-3 px-3">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                        </td>
                        <td className="py-3 px-3">
                            <Skeleton className="h-4 w-48" />
                        </td>
                        <td className="py-3 px-3">
                            <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="py-3 px-3">
                            <Skeleton className="h-4 w-12" />
                        </td>
                        <td className="py-3 px-3">
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </td>
                        <td className="py-3 px-3">
                            <div className="flex gap-2">
                                <Skeleton className="h-9 w-16 rounded-lg" />
                                <Skeleton className="h-9 w-16 rounded-lg" />
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

function getFirstValidationError(errors) {
    if (!errors || typeof errors !== "object") return "";
    const firstKey = Object.keys(errors)[0];
    const firstMsg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : "";
    return firstMsg || "";
}

export default function Products() {
    const toast = useToast();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);

    // Create form
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [image, setImage] = useState(null);
    const [createLoading, setCreateLoading] = useState(false);

    // Edit modal
    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [editStock, setEditStock] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editIsActive, setEditIsActive] = useState(true);
    const [editImage, setEditImage] = useState(null);
    const [updateLoading, setUpdateLoading] = useState(false);

    // Delete loading per row
    const [deletingId, setDeletingId] = useState(null);

    const countLabel = useMemo(() => `${items.length} items`, [items.length]);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadFailed(false);

        try {
            const data = await api("/api/admin/products"); // paginate
            setItems(Array.isArray(data?.data) ? data.data : []);
        } catch (e) {
            setItems([]);
            setLoadFailed(true);
            toast.push({
                type: "error",
                title: "Failed to load products",
                message: e?.message || "Failed to load products",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        load();
    }, [load]);

    async function handleCreate(e) {
        e.preventDefault();
        if (createLoading) return;

        setCreateLoading(true);
        try {
            const fd = new FormData();
            fd.append("title", title);
            fd.append("price", String(Number(price)));
            fd.append("stock", String(Number(stock)));
            fd.append("description", description || "");
            fd.append("is_active", isActive ? "1" : "0");
            if (image) fd.append("image", image);

            await api("/api/admin/products", {
                method: "POST",
                body: fd,
            });

            toast.push({
                type: "success",
                title: "Product created",
                message: "New product has been created successfully.",
            });

            setTitle("");
            setPrice("");
            setStock("");
            setDescription("");
            setIsActive(true);
            setImage(null);

            await load();
        } catch (e2) {
            const msg = getFirstValidationError(e2?.errors) || e2?.message || "Create failed";
            toast.push({ type: "error", title: "Create failed", message: msg });
        } finally {
            setCreateLoading(false);
        }
    }

    function openEdit(p) {
        setEditId(p.id);
        setEditTitle(p.title ?? "");
        setEditPrice(String(p.price ?? ""));
        setEditStock(String(p.stock ?? ""));
        setEditDescription(p.description ?? "");
        setEditIsActive(!!p.is_active);
        setEditOpen(true);
        setEditImage(null);
    }

    function closeEdit() {
        if (updateLoading) return;
        setEditOpen(false);
        setEditId(null);
        setEditImage(null);
    }

    useEffect(() => {
        if (!editOpen) return;

        function onKeyDown(e) {
            if (e.key === "Escape") closeEdit();
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [editOpen, updateLoading]);

    async function handleUpdate(e) {
        e.preventDefault();
        if (!editId) return;
        if (updateLoading) return;

        setUpdateLoading(true);
        try {
            const fd = new FormData();
            fd.append("title", editTitle);
            fd.append("price", String(Number(editPrice)));
            fd.append("stock", String(Number(editStock)));
            fd.append("description", editDescription || "");
            fd.append("is_active", editIsActive ? "1" : "0");
            if (editImage) fd.append("image", editImage);

            await api(`/api/admin/products/${editId}`, {
                method: "POST",
                body: fd,
                headers: { "X-HTTP-Method-Override": "PUT" },
            });

            toast.push({
                type: "success",
                title: "Product updated",
                message: "Changes saved successfully.",
            });

            closeEdit();
            await load();
        } catch (e2) {
            const msg = getFirstValidationError(e2?.errors) || e2?.message || "Update failed";
            toast.push({ type: "error", title: "Update failed", message: msg });
        } finally {
            setUpdateLoading(false);
        }
    }

    async function handleDelete(id) {
        if (deletingId) return;
        const ok = window.confirm("Delete this product?");
        if (!ok) return;

        setDeletingId(id);
        try {
            await api(`/api/admin/products/${id}`, { method: "DELETE" });

            toast.push({
                type: "success",
                title: "Product deleted",
                message: "Product removed successfully.",
            });

            setItems((prev) => prev.filter((x) => x.id !== id));
        } catch (e2) {
            toast.push({
                type: "error",
                title: "Delete failed",
                message: e2?.message || "Delete failed",
            });
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-white">Products</h1>
                    <p className="text-white/50 text-sm mt-1">Create, edit and manage your products</p>
                </div>

                <div className="flex items-center gap-2">
                    <button onClick={load} className={btnDark} disabled={loading}>
                        {loading ? "Loading..." : "Refresh"}
                    </button>
                </div>
            </div>

            {/* Create Form */}
            <form
                onSubmit={handleCreate}
                className="bg-zinc-900/70 border border-white/10 rounded-2xl shadow p-5 space-y-4 w-full"
            >
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-white">Add Product</h2>
                    <span className="text-xs text-white/50">Admin only</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Title</label>
                        <input
                            className={inputCls}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Product title"
                            required
                            disabled={createLoading}
                        />
                    </div>

                    <div>
                        <label className={labelCls}>Price</label>
                        <input
                            className={inputCls}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="19.99"
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            required
                            disabled={createLoading}
                        />
                    </div>

                    <div>
                        <label className={labelCls}>Stock</label>
                        <input
                            className={inputCls}
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            placeholder="10"
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            required
                            disabled={createLoading}
                        />
                    </div>

                    <div className="flex items-center gap-2 mt-7">
                        <input
                            id="active"
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="h-4 w-4"
                            disabled={createLoading}
                        />
                        <label htmlFor="active" className="text-sm text-white/80">
                            Active
                        </label>
                    </div>
                </div>

                <div>
                    <label className={labelCls}>Description</label>
                    <textarea
                        className={inputCls}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optional..."
                        rows={3}
                        disabled={createLoading}
                    />
                </div>

                <div>
                    <label className={labelCls}>Image</label>
                    <input
                        className={inputCls}
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files?.[0] || null)}
                        disabled={createLoading}
                    />
                </div>

                <div className="pt-1">
                    <button className={btnPrimary} disabled={createLoading}>
                        {createLoading ? "Creating..." : "Create"}
                    </button>
                </div>
            </form>

            {/* List */}
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl shadow p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-white">List</h2>
                    <span className="text-sm text-white/50">{countLabel}</span>
                </div>

                {loading ? (
                    <TableSkeleton />
                ) : loadFailed ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <div className="text-white font-semibold">Could not load products</div>
                        <div className="text-white/60 mt-2 text-sm">Please try again.</div>
                        <button onClick={load} className={`${btnDark} mt-4`} type="button">
                            Retry
                        </button>
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState
                        icon="📦"
                        title="No products yet"
                        description="Create your first product using the form above."
                    />
                ) : (
                    <div className="overflow-auto rounded-xl border border-white/10">
                        <table className="min-w-225 w-full text-sm text-white/90">
                            <thead>
                            <tr className="text-left border-b border-white/10 text-white/70 bg-white/5">
                                <th className="py-3 px-3">ID</th>
                                <th className="py-3 px-3">Image</th>
                                <th className="py-3 px-3">Title</th>
                                <th className="py-3 px-3">Price</th>
                                <th className="py-3 px-3">Stock</th>
                                <th className="py-3 px-3">Active</th>
                                <th className="py-3 px-3 w-40">Actions</th>
                            </tr>
                            </thead>

                            <tbody>
                            {items.map((p) => {
                                const isDeleting = deletingId === p.id;
                                return (
                                    <tr key={p.id} className="border-b border-white/10 hover:bg-white/5 transition">
                                        <td className="py-3 px-3">{p.id}</td>

                                        <td className="py-3 px-3">
                                            {p.image_url ? (
                                                <img
                                                    src={p.image_url}
                                                    alt=""
                                                    className="h-10 w-10 rounded-lg object-cover border border-white/10"
                                                />
                                            ) : (
                                                <span className="text-white/40 text-xs">-</span>
                                            )}
                                        </td>

                                        <td className="py-3 px-3 font-medium">{p.title}</td>
                                        <td className="py-3 px-3">{formatUSD(p.price)}</td>
                                        <td className="py-3 px-3">{p.stock}</td>

                                        <td className="py-3 px-3">
                                            <StockBadge stock={p.stock} isActive={true} />
                                        </td>

                                        <td className="py-3 px-3">
                                            {p.is_active ? (
                                                <span className="px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs">
      Active
    </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full bg-zinc-500/15 border border-white/10 text-white/70 text-xs">
      Disabled
    </span>
                                            )}
                                        </td>


                                        <td className="py-3 px-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => openEdit(p)} className={btnSoft} disabled={isDeleting}>
                                                    Edit
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className={btnDanger}
                                                    disabled={isDeleting}
                                                >
                                                    {isDeleting ? "Deleting..." : "Delete"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* overlay */}
                    <div className="absolute inset-0 bg-black/70" onClick={closeEdit} />

                    {/* modal */}
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl shadow p-5 space-y-4 w-full max-w-xl relative">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg text-white">Edit Product</h3>
                            <button onClick={closeEdit} className="text-white/70 hover:text-white" disabled={updateLoading}>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className={labelCls}>Title</label>
                                <input
                                    className={inputCls}
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    required
                                    disabled={updateLoading}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Price</label>
                                    <input
                                        className={inputCls}
                                        value={editPrice}
                                        onChange={(e) => setEditPrice(e.target.value)}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        inputMode="decimal"
                                        required
                                        disabled={updateLoading}
                                    />
                                </div>

                                <div>
                                    <label className={labelCls}>Stock</label>
                                    <input
                                        className={inputCls}
                                        value={editStock}
                                        onChange={(e) => setEditStock(e.target.value)}
                                        type="number"
                                        min="0"
                                        required
                                        disabled={updateLoading}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    id="editActive"
                                    type="checkbox"
                                    checked={editIsActive}
                                    onChange={(e) => setEditIsActive(e.target.checked)}
                                    className="h-4 w-4"
                                    disabled={updateLoading}
                                />
                                <label htmlFor="editActive" className="text-sm text-white/80">
                                    Active
                                </label>
                            </div>

                            <div>
                                <label className={labelCls}>Description</label>
                                <textarea
                                    className={inputCls}
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={3}
                                    disabled={updateLoading}
                                />
                            </div>

                            <div>
                                <label className={labelCls}>New Image (optional)</label>
                                <input
                                    className={inputCls}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setEditImage(e.target.files?.[0] || null)}
                                    disabled={updateLoading}
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeEdit}
                                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition disabled:opacity-60"
                                    disabled={updateLoading}
                                >
                                    Cancel
                                </button>
                                <button className={btnPrimary} disabled={updateLoading}>
                                    {updateLoading ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
