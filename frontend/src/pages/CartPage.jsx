import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function CartPage() {
    const { items, total, inc, dec, remove, clear } = useCart();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black p-6 text-white">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-extrabold">Cart</h1>
                    <Link to="/" className="text-white/70 hover:text-white">← Back to shop</Link>
                </div>

                {items.length === 0 ? (
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 text-white/70">
                        Cart is empty.
                    </div>
                ) : (
                    <>
                        <div className="bg-zinc-900/70 border border-white/10 rounded-2xl overflow-hidden">
                            {items.map((it) => (
                                <div key={it.product_id} className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold">{it.title}</div>
                                        <div className="text-white/60 text-sm">Price: {it.price}</div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button onClick={() => dec(it.product_id)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/10">-</button>
                                        <div className="min-w-10 text-center">{it.qty}</div>
                                        <button onClick={() => inc(it.product_id)} className="px-3 py-2 rounded-lg bg-white/10 border border-white/10">+</button>

                                        <button onClick={() => remove(it.product_id)} className="ml-2 px-3 py-2 rounded-lg bg-red-600 text-white">Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between bg-zinc-900/70 border border-white/10 rounded-2xl p-4">
                            <div className="text-white/70">Total</div>
                            <div className="text-2xl font-extrabold">{total}</div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button onClick={clear} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10">Clear</button>
                            <button
                                onClick={() => navigate("/checkout")}
                                className="px-5 py-2 rounded-lg bg-white text-black font-semibold"
                            >
                                Checkout
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
