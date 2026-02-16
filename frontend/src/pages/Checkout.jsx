import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import { useToast } from "../context/ToastContext";

const input =
    "w-full rounded-lg bg-zinc-950 border border-white/10 text-white placeholder:text-white/40 p-2 focus:outline-none focus:ring-2 focus:ring-white/20";
const label = "block text-sm mb-1 text-white/80";

function calcShipping(city, subtotal) {
    const c = String(city || "").trim().toLowerCase();
    if (!subtotal) return 0;
    if (subtotal >= 1_000_000) return 0;
    if (c === "Tehran" || c === "tehran") return 30_000;
    return 60_000;
}

export default function Checkout() {
    const { items, clear } = useCart();
    const toast = useToast();
    const navigate = useNavigate();

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
                    <Link to="/" className="mt-4 inline-block text-white underline">
                        Back to shop
                    </Link>
                </div>
            </div>
        );
    }

    async function submit(e) {
        e.preventDefault();
        if (loading) return;
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
                        disabled={loading}
                        className="w-full px-5 py-2 rounded-lg bg-white text-black font-semibold disabled:opacity-60"
                    >
                        {loading ? "Placing order..." : "Place Order"}
                    </button>

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

                    <div className="space-y-3">
                        {items.map((it) => (
                            <div key={it.product_id} className="flex items-center justify-between text-sm">
                                <div>
                                    <div className="font-medium">{it.title}</div>
                                    <div className="text-white/60">Qty: {it.qty}</div>
                                </div>
                                <div>{(it.price * it.qty).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="text-white/70">Subtotal</div>
                            <div className="font-semibold">{subtotal.toLocaleString()}</div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="text-white/70">Shipping (preview)</div>
                            <div className="font-semibold">{shippingPreview.toLocaleString()}</div>
                        </div>

                        <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                            <div className="text-white/70">Total (preview)</div>
                            <div className="text-2xl font-extrabold">
                                {totalPreview.toLocaleString()}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}