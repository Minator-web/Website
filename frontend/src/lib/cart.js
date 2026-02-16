const KEY = "cart_v1";

export function getCart() {
    try {
        const raw = localStorage.getItem("cart");
        const arr = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(arr)) return [];
        return arr
            .map((it) => ({ ...it, product_id: Number(it.product_id), qty: Number(it.qty || 1) }))
            .filter((it) => Number.isInteger(it.product_id) && it.product_id > 0 && it.qty > 0);
    } catch {
        return [];
    }
}

export function setCart(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
}

export function clearCart() {
    localStorage.removeItem(KEY);
}
