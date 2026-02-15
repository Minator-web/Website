import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDrawer } from "../context/DrawerContext";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import Skeleton from "./Skeleton";
import { useToast } from "../context/ToastContext";

function money(x) {
    const n = Number(x);
    if (Number.isNaN(n)) return x ?? "-";
    return n.toLocaleString();
}

export default function CartDrawer() {
    const { cartOpen, closeCart } = useDrawer();
    const { items, total, inc, dec, remove, clear } = useCart();
    const toast = useToast();
    const navigate = useNavigate();

    const [stockMap, setStockMap] = useState({});
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

    // فقط وقتی Drawer بازه، استوک رو چک کن (بهینه‌تر)
    useEffect(() => {
        if (!cartOpen) return;
        loadStock();
    }, [cartOpen, idsKey, loadStock]);

    // ESC برای بستن
    useEffect(() => {
        if (!cartOpen) return;
        function onKeyDown(e) {
            if (e.key === "Escape") closeCart();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [cartOpen, closeCart]);

    const hasStockProblem = useMemo(() => {
        return items.some((it) => {
            const meta = stockMap[it.product_id];
            if (!meta) return false;
            if (!meta.is_active) return true;
            return Number(it.qty) > Number(meta.stock);
        });
    }, [items, stockMap]);

    const canCheckout = useMemo(() => {
        if (items.length === 0) return false;
        if (stockLoading) return false;
        if (stockFailed) return false;
        return !hasStockProblem;
    }, [items.length, stockLoading, stockFailed, hasStockProblem]);

    function canInc(it) {
        const meta = stockMap[it.product_id];
        if (!meta) return false;
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
        if (!meta.is_active) return "inactive";
        if (meta.stock <= 0) return "out of stock";
        if (it.qty > meta.stock) return `only ${meta.stock} left`;
        return `stock: ${meta.stock}`;
    }

    function onRemove(it) {
        remove(it.product_id);
        toast.push({ type: "success", title: "Removed", message: `"${it.title}" removed.` });
    }

    function onClear() {
        if (items.length === 0) return;
        const ok = window.confirm("Clear cart?");
        if (!ok) return;
        clear();
        toast.push({ type: "success", title: "Cart cleared", message: "Your cart is now empty." });
    }

    function goCheckout() {
        if (!canCheckout) return;
        closeCart();
        navigate("/checkout");
    }

    function goCartPage() {
        closeCart();
        navigate("/cart");
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/70 transition-opacity ${
                    cartOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                }`}
                onClick={closeCart}
            />

            {/* Panel */}
            <div
                className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-zinc-950 border-l border-white/10 transform transition-transform ${
                    cartOpen ? "translate-x-0" : "translate-x-full"
                }`}
                role="dialog"
                aria-modal="true"
            >
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <div>
                            <div className="text-lg font-extrabold text-white">Your Cart</div>
                            <div className="text-xs text-white/50">{items.length} items</div>
                        </div>

                        <button
                            onClick={closeCart}
                            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10"
                            type="button"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-auto p-4 space-y-3">
                        {items.length === 0 ? (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white/70">
                                Cart is empty.
                                <div className="mt-4">
                                    <Link
                                        to="/"
                                        onClick={closeCart}
                                        className="inline-block px-4 py-2 rounded-lg bg-white text-black font-semibold"
                                    >
                                        Go shopping
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <>
                                {hasStockProblem && (
                                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-3 rounded-lg text-sm">
                                        Fix stock issues before checkout.
                                    </div>
                                )}

                                {stockLoading ? (
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="text-white/70 text-sm">Checking stock...</div>
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                    </div>
                                ) : stockFailed ? (
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                                        <div className="text-white/80 font-semibold text-sm">Could not check stock</div>
                                        <button
                                            onClick={loadStock}
                                            className="mt-2 px-3 py-2 rounded-lg bg-white text-black font-semibold"
                                            type="button"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                ) : null}

                                <div className="space-y-3">
                                    {items.map((it) => {
                                        const meta = stockMap[it.product_id];
                                        const hint = qtyHint(it);
                                        const bad = meta && (!meta.is_active || it.qty > meta.stock);

                                        return (
                                            <div
                                                key={it.product_id}
                                                className={`rounded-2xl border border-white/10 p-3 ${bad ? "bg-amber-500/5" : "bg-white/5"}`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-white truncate">{it.title}</div>
                                                        <div className="text-white/60 text-sm">{money(it.price)}</div>
                                                        {hint && (
                                                            <div className={`text-xs mt-1 ${bad ? "text-amber-200" : "text-white/40"}`}>
                                                                {hint}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => onRemove(it)}
                                                        className="px-3 py-2 rounded-lg bg-red-600 text-white"
                                                        type="button"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => dec(it.product_id)}
                                                            disabled={!canDec(it)}
                                                            className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 disabled:opacity-50"
                                                            type="button"
                                                        >
                                                            -
                                                        </button>

                                                        <div className="min-w-10 text-center text-white">{it.qty}</div>

                                                        <button
                                                            onClick={() => inc(it.product_id)}
                                                            disabled={!canInc(it)}
                                                            className="px-3 py-2 rounded-lg bg-white/10 border border-white/10 disabled:opacity-50"
                                                            type="button"
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <div className="font-semibold text-white">
                                                        {money(Number(it.price) * Number(it.qty))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="text-white/60">Total</div>
                            <div className="text-2xl font-extrabold text-white">{money(total)}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={goCartPage}
                                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                type="button"
                            >
                                View Cart
                            </button>

                            <button
                                onClick={goCheckout}
                                disabled={!canCheckout}
                                className="px-4 py-2 rounded-lg bg-white text-black font-semibold disabled:opacity-60"
                                type="button"
                                title={!canCheckout ? "Fix stock issues first" : "Checkout"}
                            >
                                Checkout
                            </button>
                        </div>

                        <button
                            onClick={onClear}
                            disabled={items.length === 0}
                            className="w-full px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-60"
                            type="button"
                        >
                            Clear cart
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
