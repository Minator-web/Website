const KEY = "cart_v1";

export function getCart() {
    try {
        return JSON.parse(localStorage.getItem(KEY) || "[]");
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
