import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCart, setCart, clearCart } from "../lib/cart";

const CartCtx = createContext(null);

export function CartProvider({ children }) {
    const [items, setItems] = useState(() => getCart() || []);
    // item shape: { product_id, title, price, qty }

    useEffect(() => {
        setCart(items);
    }, [items]);

    function add(item) {
        setItems((prev) => {
            const found = prev.find((x) => x.product_id === item.product_id);
            if (found) {
                return prev.map((x) =>
                    x.product_id === item.product_id
                        ? {
                            ...x,
                            // اگر قیمت/عنوان تغییر کرده، همگام کنیم
                            title: item.title ?? x.title,
                            price: item.price ?? x.price,
                            qty: Number(x.qty || 0) + 1,
                        }
                        : x
                );
            }
            return [
                ...prev,
                {
                    product_id: item.product_id,
                    title: item.title,
                    price: item.price,
                    qty: 1,
                },
            ];
        });
    }

    function remove(product_id) {
        setItems((prev) => prev.filter((x) => x.product_id !== product_id));
    }

    function inc(product_id) {
        setItems((prev) =>
            prev.map((x) =>
                x.product_id === product_id ? { ...x, qty: Number(x.qty || 0) + 1 } : x
            )
        );
    }

    function dec(product_id) {
        setItems((prev) =>
            prev
                .map((x) =>
                    x.product_id === product_id
                        ? { ...x, qty: Math.max(1, Number(x.qty || 1) - 1) }
                        : x
                )
                .filter((x) => Number(x.qty || 0) > 0)
        );
    }

    function updateQty(product_id, qty) {
        const q = Math.max(1, Math.floor(Number(qty || 1)));
        setItems((prev) =>
            prev.map((x) => (x.product_id === product_id ? { ...x, qty: q } : x))
        );
    }

    function clear() {
        clearCart();
        setItems([]);
    }

    const total = useMemo(
        () => items.reduce((sum, x) => sum + Number(x.price) * Number(x.qty), 0),
        [items]
    );

    const value = { items, total, add, remove, inc, dec, updateQty, clear };

    return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
    const ctx = useContext(CartCtx);
    if (!ctx) throw new Error("useCart must be used inside CartProvider");
    return ctx;
}
