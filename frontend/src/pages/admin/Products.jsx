import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const inputCls =
    "w-full rounded-lg bg-zinc-950 border border-white/10 text-white placeholder:text-white/40 p-2 " +
    "focus:outline-none focus:ring-2 focus:ring-white/20";

const labelCls = "block text-sm mb-1 text-white/80";

const btnPrimary =
    "px-4 py-2 rounded-lg bg-black text-white font-medium hover:opacity-90 transition disabled:opacity-60";

const btnDark =
    "px-3 py-2 rounded-lg bg-black text-white border border-white/10 hover:bg-white/5 transition";

const btnDanger =
    "px-3 py-2 rounded-lg bg-red-600 text-white hover:opacity-90 transition";

export default function Products() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // فرم افزودن محصول
    const [title, setTitle] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [image, setImage] = useState(null);


    // Edit modal
    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editTitle, setEditTitle] = useState("");
    const [editPrice, setEditPrice] = useState("");
    const [editStock, setEditStock] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editIsActive, setEditIsActive] = useState(true);
    const [editImage, setEditImage] = useState(null);



    async function load() {
        setErr("");
        setLoading(true);
        try {
            const data = await api("/api/admin/products"); // paginate برمیگردونه
            setItems(data?.data || []);
        } catch (e) {
            setErr(e?.message || "Failed to load products");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function handleCreate(e) {
        e.preventDefault();
        setErr("");

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

            setTitle("");
            setPrice("");
            setStock("");
            setDescription("");
            setIsActive(true);
            setImage(null);

            load();
        } catch (e) {
            if (e?.errors) {
                const firstKey = Object.keys(e.errors)[0];
                setErr(e.errors[firstKey]?.[0] || e.message || "Create failed");
            } else {
                setErr(e?.message || "Create failed");
            }
        }
    }


    function openEdit(p) {
        setErr("");
        setEditId(p.id);
        setEditTitle(p.title ?? "");
        setEditPrice(String(p.price ?? ""));
        setEditStock(String(p.stock ?? ""));
        setEditDescription(p.description ?? "");
        setEditIsActive(!!p.is_active);
        setEditOpen(true);
        setEditImage(null);
    }

    async function handleUpdate(e) {
        e.preventDefault();
        setErr("");

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

            setEditOpen(false);
            setEditId(null);
            load();
        } catch (e) {
            if (e?.errors) {
                const firstKey = Object.keys(e.errors)[0];
                setErr(e.errors[firstKey]?.[0] || e.message || "Update failed");
            } else {
                setErr(e?.message || "Update failed");
            }
        }
    }



    async function handleDelete(id) {
        if (!confirm("Delete this product?")) return;
        setErr("");
        try {
            await api(`/api/admin/products/${id}`, { method: "DELETE" });
            setItems((prev) => prev.filter((x) => x.id !== id));
        } catch (e) {
            setErr(e?.message || "Delete failed");
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-white">Products</h1>
                    <p className="text-white/50 text-sm mt-1">
                        Create, edit and manage your products
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
                        />
                    </div>

                    <div>
                        <label className={labelCls}>Price</label>
                        <input
                            className={inputCls}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="100000"
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            required
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
                        />
                    </div>

                    <div className="flex items-center gap-2 mt-7">
                        <input
                            id="active"
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="h-4 w-4"
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
                    />
                </div>

                <div>
                    <label className={labelCls}>Image</label>
                    <input
                        className={inputCls}
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImage(e.target.files?.[0] || null)}
                    />
                </div>


                <div className="pt-1">
                    <button className={btnPrimary}>Create</button>
                </div>
            </form>

            {/* List */}
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl shadow p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-white">List</h2>
                    <span className="text-sm text-white/50">{items.length} items</span>
                </div>

                {loading ? (
                    <div className="text-white/70">Loading...</div>
                ) : items.length === 0 ? (
                    <div className="text-white/60">No products yet.</div>
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
                            {items.map((p) => (
                                <tr
                                    key={p.id}
                                    className="border-b border-white/10 hover:bg-white/5 transition"
                                >
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
                                    <td className="py-3 px-3">{p.price}</td>
                                    <td className="py-3 px-3">{p.stock}</td>
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
                                            <button
                                                onClick={() => openEdit(p)}
                                                className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white hover:bg-white/15 transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(p.id)}
                                                className={btnDanger}
                                            >
                                                Delete
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

            {/* Edit Modal */}
            {editOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* overlay */}
                    <div
                        className="absolute inset-0 bg-black/70"
                        onClick={() => setEditOpen(false)}
                    />

                    {/* modal */}
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl shadow p-5 space-y-4 w-full max-w-xl relative">                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">Edit Product</h3>
                            <button
                                onClick={() => setEditOpen(false)}
                                className="text-white/70 hover:text-white"
                            >
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
                                        required
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
                                />
                            </div>
                            <div>
                                <label className={labelCls}>New Image (optional)</label>
                                <input
                                    className={inputCls}
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setEditImage(e.target.files?.[0] || null)}
                                />
                            </div>


                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditOpen(false)}
                                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition"
                                >
                                    Cancel
                                </button>
                                <button className={btnPrimary}>Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
