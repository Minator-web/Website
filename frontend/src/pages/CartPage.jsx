import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import UserLayout from "../layouts/UserLayout";
import Skeleton from "../components/Skeleton";
import { useToast } from "../context/ToastContext";

function money(x) {
    const n = Number(x);
    if (Number.isNaN(n)) return x ?? "-";
    return n.toLocaleString();
}

export default function CartPage() {
    const { items, total, inc, dec, remove, clear } = useCart();
    const toast = useToast();
    const navigate = useNavigate();

    const [stockMap, setStockMap] = useState({}); // { [product_id]: { stock, is_active } }
    const [stockLoading, setStockLoading] = useState(false);
    const [stockFailed, setStockFailed] = useState(false);

    const ids = useMemo(() => items.map((x) => x.product_id), [items]);
    const idsKey = useMemo(() => ids.join(","), [ids]);

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

            const m = {};
            (Array.isArray(res) ? res : []).forEach((p) => {
                m[p.id] = {
                    stock: Number(p.stock ?? 0),
                    is_active: !!p.is_active,
                };
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
        let alive = true;
        (async () => {
            if (!alive) return;
            await loadStock();
        })();
        return () => {
            alive = false;
        };
    }, [idsKey, loadStock]);

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
        if (items.length === 0) return false;
        if (stockLoading) return false;
        if (stockFailed) return false;
        return !hasStockProblem;
    }, [items.length, stockLoading, stockFailed, hasStockProblem]);

    function canInc(it) {
        const meta = stockMap[it.product_id];
        if (!meta) return false; // تا موجودی نیومده
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

    function onRemove(it) {
        remove(it.product_id);
        toast.push({
            type: "success",
            title: "Removed",
            message: `"${it.title}" removed from cart.`,
        });
    }

    function onClear() {
        if (items.length === 0) return;
        const ok = window.confirm("Clear cart?");
        if (!ok) return;
        clear();
        toast.push({ type: "success", title: "Cart cleared", message: "Your cart is now empty." });
    }

    return (
        <UserLayout>
            <div className="max-w-3xl mx-auto space-y-6 text-white">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-3xl font-extrabold">Cart</h1>

                    {items.length > 0 ? (
                        <button
                            onClick={loadStock}
                            className="px-3 py-2 rounded-lg bg-black text-white border border-white/10 hover:bg-white/5 transition disabled:opacity-60"
                            disabled={stockLoading}
                            type="button"
                        >
                            {stockLoading ? "Checking..." : "Recheck stock"}
                        </button>
                    ) : null}
                </div>

                {items.length === 0 ? (
                    <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-8">
                        <div className="text-xl font-bold">Your cart is empty</div>
                        <div className="mt-2 text-white/60">Add some products to continue.</div>
                        <Link
                            to="/"
                            className="mt-5 inline-block px-4 py-2 rounded-lg bg-white text-black font-semibold"
                        >
                            Go shopping
                        </Link>
                    </div>
                ) : (
                    <>
                        {hasStockProblem && (
                            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-3 rounded-lg">
                                بعضی آیتم‌ها موجودی کافی ندارند یا غیرفعال شده‌اند. لطفاً تعداد را اصلاح کنید یا Remove بزنید.
                            </div>
                        )}

                        {stockLoading ? (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="text-white/70">Checking stock...</div>
                                    <Skeleton className="h-4 w-28" />
                                </div>
                            </div>
                        ) : stockFailed ? (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                <div className="text-white/80 font-semibold">Could not check stock</div>
                                <div className="text-white/60 text-sm mt-1">Please try again.</div>
                                <button onClick={loadStock} className="mt-3 px-4 py-2 rounded-lg bg-white text-black font-semibold" type="button">
                                    Retry
                                </button>
                            </div>
                        ) : null}

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
                                                Price: {money(it.price)}
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
                                                type="button"
                                            >
                                                -
                                            </button>

                                            <div className="min-w-10 text-center">{it.qty}</div>

                                            <button
                                                onClick={() => inc(it.product_id)}
                                                disabled={incDisabled}
                                                className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 disabled:opacity-50"
                                                title={incDisabled ? "Stock limit" : "Increase"}
                                                type="button"
                                            >
                                                +
                                            </button>

                                            <button
                                                onClick={() => onRemove(it)}
                                                className="ml-2 px-3 py-2 rounded-lg bg-red-600 text-white disabled:opacity-60"
                                                type="button"
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
                            <div className="text-2xl font-extrabold">{money(total)}</div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={onClear}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                                type="button"
                            >
                                Clear
                            </button>

                            <button
                                onClick={() => navigate("/checkout")}
                                disabled={!canCheckout}
                                className="px-5 py-2 rounded-lg bg-white text-black font-semibold disabled:opacity-60"
                                type="button"
                                title={!canCheckout ? "Fix stock issues first" : "Checkout"}
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
