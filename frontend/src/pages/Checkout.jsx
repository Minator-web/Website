import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { useRef } from "react";

const input =
    "w-full rounded-lg bg-zinc-950 border border-white/10 text-white placeholder:text-white/40 p-2 focus:outline-none focus:ring-2 focus:ring-white/20";
const label = "block text-sm mb-1 text-white/80";


function money(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
    }).format(Number(value ?? 0));
}

function calcShipping(city, subtotal) {
    return 0; // server will calculate
}

export default function Checkout() {
    const { items, clear } = useCart();
    const toast = useToast();
    const navigate = useNavigate();
    const submittingRef = useRef(false);

    const [stockMap, setStockMap] = useState({});
    const [stockLoading, setStockLoading] = useState(false);
    const [stockFailed, setStockFailed] = useState(false);

    const ids = useMemo(() => items.map((x) => x.product_id), [items]);
    const idsKey = useMemo(() => ids.join(","), [ids]);


    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);

    const [clientRequestId, setClientRequestId] = useState(() => {
        if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
        return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    });

    const subtotal = useMemo(
        () => items.reduce((sum, it) => sum + Number(it.price) * Number(it.qty), 0),
        [items]
    );

    const shippingPreview = useMemo(
        () => calcShipping(city, subtotal),
        [city, subtotal]
    );

    const totalPreview = useMemo(
        () => subtotal + shippingPreview,
        [subtotal, shippingPreview]
    );

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-black p-6 text-white">
                <div className="max-w-xl mx-auto bg-zinc-900/70 border border-white/10 rounded-2xl p-6">
                    <div className="text-white/70">Your cart is empty.</div>
                    <div className="text-4xl mb-3">🛒</div>
                    <Link to="/" className="mt-4 inline-block text-white underline">
                        Back to shop
                    </Link>
                </div>
            </div>
        );
    }

    const loadStock = useCallback(async () => {
        if (ids.length === 0) {
            setStockMap({});
            setStockFailed(false);
            return;
        }

        setStockLoading(true);
        setStockFailed(false);

        try {
            const res = await api("/api/products/stock", {
                method: "POST",
                body: JSON.stringify({ ids }),
            });

            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

            const m = {};
            list.forEach((p) => {
                m[p.id] = { stock: Number(p.stock ?? 0), is_active: !!p.is_active };
            });

            setStockMap(m);
        } catch (e) {
            setStockMap({});
            setStockFailed(true);
            toast.push({
                type: "error",
                title: "Stock check failed",
                message: e?.message || "Failed to load stock",
            });
        } finally {
            setStockLoading(false);
        }
    }, [ids, toast]);

    useEffect(() => {
        loadStock();
    }, [idsKey, loadStock]);


    const stockProblems = useMemo(() => {
        return items
            .map((it) => {
                const meta = stockMap[it.product_id];
                if (!meta) return null;

                if (!meta.is_active) {
                    return { product_id: it.product_id, title: it.title, message: "Product is inactive" };
                }

                if (meta.stock <= 0) {
                    return { product_id: it.product_id, title: it.title, message: "Out of stock" };
                }

                if (Number(it.qty) > Number(meta.stock)) {
                    return { product_id: it.product_id, title: it.title, message: `Only ${meta.stock} left` };
                }

                return null;
            })
            .filter(Boolean);
    }, [items, stockMap]);

    const canPlaceOrder = useMemo(() => {
        if (items.length === 0) return false;
        if (loading) return false;
        if (stockLoading) return false;
        if (stockFailed) return false;
        return stockProblems.length === 0;
    }, [items.length, loading, stockLoading, stockFailed, stockProblems.length]);


    async function submit(e) {
        e.preventDefault();

        if (submittingRef.current) return;
        submittingRef.current = true;

        if (!canPlaceOrder) {
            toast.push({
                type: "error",
                title: "Cannot checkout",
                message: "Fix stock issues before placing order.",
            });
            submittingRef.current = false;
            return;
        }
        setLoading(true);

        try {
            const payload = {
                client_request_id: clientRequestId,
                customer_name: name.trim(),
                customer_email: email.trim().toLowerCase(),
                customer_phone: phone.trim() || null,
                city: city.trim(),
                shipping_address: address.trim(),
                items: items.map((it) => ({
                    product_id: it.product_id,
                    qty: it.qty,
                })),
            };

            const res = await api("/api/checkout", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            const orderId = res?.order?.id;
            if (!orderId) {
                throw { message: "Invalid server response (missing order id)" };
            }

            toast.push({
                type: "success",
                title: "Order placed",
                message: "Your order was created successfully.",
            });

            clear();

            setClientRequestId(() => {
                if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
                return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
            });

            navigate(`/order-success/${orderId}`);
        } catch (e2) {
            toast.push({
                type: "error",
                title: "Checkout failed",
                message: e2?.message || "Checkout failed",
            });
        } finally {
            setLoading(false);
            submittingRef.current = false;
        }
    }

    return (
        <div className="min-h-screen bg-black p-6 text-white">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form */}

                <form
                    onSubmit={submit}
                    className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 space-y-4"
                >
                    <h1 className="text-2xl font-extrabold">Checkout</h1>

                    <div>
                        <label className={label}>Name</label>
                        <input
                            className={input}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className={label}>Email</label>
                        <input
                            className={input}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className={label}>Phone</label>
                        <input
                            className={input}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className={label}>City</label>
                        <input
                            className={input}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            required
                            disabled={loading}
                            placeholder="Tehran"
                        />
                    </div>

                    <div>
                        <label className={label}>Address</label>
                        <textarea
                            className={input}
                            rows={4}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        disabled={!canPlaceOrder || loading}
                        className="w-full px-5 py-2 rounded-lg bg-black text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading && (
                            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {loading ? "Placing order..." : "Place Order"}
                    </button>

                    {stockLoading && (
                        <div className="text-xs text-white/50 mt-2">
                            Checking availability...
                        </div>
                    )}

                    {stockProblems.length > 0 && (
                        <div className="text-xs text-amber-200 mt-2">
                            Resolve stock issues before placing order.
                        </div>
                    )}



                    <div className="text-xs text-white/50">
                        Shipping fee and totals will be finalized by the server.
                    </div>

                    <div className="text-[10px] text-white/30 break-all">
                        request_id: {clientRequestId}
                    </div>
                </form>




                {/* Summary */}
                <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6">
                    <h2 className="font-semibold mb-4">Order Summary</h2>

                    {/* Stock status */}
                    {stockLoading ? (
                        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                            Checking stock...
                        </div>
                    ) : stockFailed ? (
                        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3">
                            <div className="text-sm text-white/80 font-semibold">Could not check stock</div>
                            <button
                                onClick={loadStock}
                                className="mt-2 px-3 py-2 rounded-lg bg-black text-white font-semibold"
                                type="button"
                            >
                                Retry
                            </button>
                        </div>
                    ) : stockProblems.length ? (
                        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                            <div className="font-semibold mb-2">Fix these issues before checkout:</div>
                            <ul className="list-disc pl-5 space-y-1">
                                {stockProblems.map((p) => (
                                    <li key={p.product_id}>
                                        <span className="font-semibold">{p.title}</span>: {p.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                            All items are available.
                        </div>
                    ) }

                    <div className="space-y-3">
                        {items.map((it) => (
                            <div key={it.product_id} className="flex items-center justify-between text-sm transition-all duration-200 hover:bg-white/5 p-2 rounded-lg"
                            >
                                <div>
                                    <div className="font-medium">{it.title}</div>
                                    <div className="text-white/60">Qty: {it.qty}</div>
                                </div>
                                <div className="font-semibold">{money(it.price * it.qty)}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="text-white/70">Subtotal</div>
                            <div className="font-semibold">{money(subtotal)}</div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="text-white/70">Shipping (preview)</div>
                            <div className="font-semibold">{shippingPreview === 0 ? "Free" : money(shippingPreview)}</div>
                        </div>

                        <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                            <div className="text-white/70">Total (preview)</div>
                            <div className="text-2xl font-extrabold">
                                {money(totalPreview)}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}