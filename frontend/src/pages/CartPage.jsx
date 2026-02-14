import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import UserLayout from "../layouts/UserLayout";

export default function CartPage() {
    const { items, total, inc, dec, remove, clear } = useCart();
    const navigate = useNavigate();

    const [stockMap, setStockMap] = useState({}); // { [product_id]: { stock, is_active } }
    const [stockLoading, setStockLoading] = useState(false);
    const [stockErr, setStockErr] = useState("");

    const ids = useMemo(() => items.map((x) => x.product_id), [items]);

    useEffect(() => {
        let alive = true;

        async function loadStock() {
            if (ids.length === 0) {
                setStockMap({});
                setStockErr("");
                return;
            }

            setStockErr("");
            setStockLoading(true);

            try {
                const res = await api("/api/products/stock", {
                    method: "POST",
                    body: JSON.stringify({ ids }),
                });

                const m = {};
                (res || []).forEach((p) => {
                    m[p.id] = {
                        stock: Number(p.stock ?? 0),
                        is_active: !!p.is_active,
                    };
                });

                if (!alive) return;
                setStockMap(m);
            } catch (e) {
                if (!alive) return;
                setStockErr(e?.message || "Failed to load stock");
                setStockMap({});
            } finally {
                if (!alive) return;
                setStockLoading(false);
            }
        }

        loadStock();
        return () => {
            alive = false;
        };
    }, [ids.join(",")]);

    // مشکل موجودی: qty بیشتر از stock یا محصول غیرفعال
    const hasStockProblem = useMemo(() => {
        return items.some((it) => {
            const meta = stockMap[it.product_id];
            if (!meta) return false; // هنوز نیومده
            if (!meta.is_active) return true;
            return Number(it.qty) > Number(meta.stock);
        });
    }, [items, stockMap]);

    // اجازه رفتن به checkout؟
    const canCheckout = useMemo(() => {
        // اگر هنوز موجودی‌ها لود نشده، بهتره نذاریم بره جلو (UX بهتر)
        if (stockLoading) return false;
        return !hasStockProblem;
    }, [stockLoading, hasStockProblem]);

    function canInc(it) {
        const meta = stockMap[it.product_id];
        if (!meta) return false; // تا موجودی نیومده، + رو غیر فعال کنیم
        if (!meta.is_active) return false;
        return Number(it.qty) < Number(meta.stock);
    }

    function canDec(it) {
        const meta = stockMap[it.product_id];
        if (meta && !meta.is_active) return false;
        return Number(it.qty) > 1;
    }

    function qtyHint(it) {
        const meta = stockMap[it.product_id];
        if (!meta) return null;
        if (!meta.is_active) return "این محصول غیرفعال شده";
        if (meta.stock <= 0) return "ناموجود";
        if (it.qty > meta.stock) return `فقط ${meta.stock} عدد موجوده`;
        return `موجودی: ${meta.stock}`;
    }

    return (
        <UserLayout>
            <div className="max-w-3xl mx-auto space-y-6 text-white">
                <h1 className="text-3xl font-extrabold">Cart</h1>

                {stockErr && (
                    <div className="bg-red-500/15 border border-red-500/30 text-red-200 p-3 rounded-lg">
                        {stockErr}
                    </div>
                )}

                {items.length === 0 ? (
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-6 text-white/70">
                        Cart is empty.
                    </div>
                ) : (
                    <>
                        {hasStockProblem && (
                            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-3 rounded-lg">
                                بعضی آیتم‌ها موجودی کافی ندارند یا غیرفعال شده‌اند. لطفاً تعداد را اصلاح کنید یا Remove بزنید.
                            </div>
                        )}

                        {stockLoading && (
                            <div className="bg-white/5 border border-white/10 text-white/70 p-3 rounded-lg">
                                Checking stock...
                            </div>
                        )}

                        <div className="bg-zinc-900/70 border border-white/10 rounded-2xl overflow-hidden">
                            {items.map((it) => {
                                const meta = stockMap[it.product_id];
                                const hint = qtyHint(it);
                                const incDisabled = !canInc(it);
                                const decDisabled = !canDec(it);
                                const bad = meta && (!meta.is_active || it.qty > meta.stock);

                                return (
                                    <div
                                        key={it.product_id}
                                        className={`p-4 border-b border-white/10 flex items-center justify-between gap-4 ${
                                            bad ? "bg-amber-500/5" : ""
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <div className="font-semibold truncate">{it.title}</div>
                                            <div className="text-white/60 text-sm">
                                                Price: {Number(it.price).toLocaleString()}
                                            </div>

                                            {hint && (
                                                <div className={`mt-1 text-xs ${bad ? "text-amber-200" : "text-white/50"}`}>
                                                    {hint}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => dec(it.product_id)}
                                                disabled={decDisabled}
                                                className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 disabled:opacity-50"
                                            >
                                                -
                                            </button>

                                            <div className="min-w-10 text-center">{it.qty}</div>

                                            <button
                                                onClick={() => inc(it.product_id)}
                                                disabled={incDisabled}
                                                className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 disabled:opacity-50"
                                                title={incDisabled ? "Stock limit" : "Increase"}
                                            >
                                                +
                                            </button>

                                            <button
                                                onClick={() => remove(it.product_id)}
                                                className="ml-2 px-3 py-2 rounded-lg bg-red-600 text-white"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between bg-zinc-900/70 border border-white/10 rounded-2xl p-4">
                            <div className="text-white/70">Total</div>
                            <div className="text-2xl font-extrabold">{total.toLocaleString()}</div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={clear}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10"
                            >
                                Clear
                            </button>

                            <button
                                onClick={() => navigate("/checkout")}
                                disabled={!canCheckout}
                                className="px-5 py-2 rounded-lg bg-white text-white font-semibold disabled:opacity-60"
                            >
                                Checkout
                            </button>
                        </div>
                    </>
                )}
            </div>
        </UserLayout>
    );
}
