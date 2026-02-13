import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";

const input =
    "w-full rounded-lg bg-zinc-950 border border-white/10 text-white placeholder:text-white/40 p-2 focus:outline-none focus:ring-2 focus:ring-white/20";
const label = "block text-sm mb-1 text-white/80";

export default function Checkout() {
    const { items, total, clear } = useCart();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-black p-6 text-white">
                <div className="max-w-xl mx-auto bg-zinc-900/70 border border-white/10 rounded-2xl p-6">
                    <div className="text-white/70">Your cart is empty.</div>
                    <Link to="/" className="mt-4 inline-block text-white underline">Back to shop</Link>
                </div>
            </div>
        );
    }

    async function submit(e) {
        e.preventDefault();
        setErr("");
        setLoading(true);

        try {
            const payload = {
                customer_name: name,
                customer_email: email,
                customer_phone: phone || null,
                shipping_address: address,
                items: items.map((it) => ({
                    product_id: it.product_id,
                    qty: it.qty,
                })),
            };

            const res = await api("/api/checkout", {
                method: "POST",
                body: JSON.stringify(payload),
            });

            clear();
            navigate(`/order-success/${res.order.id}`);
        } catch (e) {
            setErr(e?.message || "Checkout failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-black p-6 text-white">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form */}
                <form onSubmit={submit} className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 space-y-4">
                    <h1 className="text-2xl font-extrabold">Checkout</h1>

                    {err && (
                        <div className="bg-red-500/15 border border-red-500/30 text-red-200 p-3 rounded-lg">
                            {err}
                        </div>
                    )}

                    <div>
                        <label className={label}>Name</label>
                        <input className={input} value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>

                    <div>
                        <label className={label}>Email</label>
                        <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>

                    <div>
                        <label className={label}>Phone</label>
                        <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>

                    <div>
                        <label className={label}>Address</label>
                        <textarea className={input} rows={4} value={address} onChange={(e) => setAddress(e.target.value)} required />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full px-5 py-2 rounded-lg bg-white text-white font-semibold disabled:opacity-60"
                    >
                        {loading ? "Placing order..." : "Place Order"}
                    </button>
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

                    <div className="mt-4 border-t border-white/10 pt-4 flex items-center justify-between">
                        <div className="text-white/70">Total</div>
                        <div className="text-2xl font-extrabold">{total.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
