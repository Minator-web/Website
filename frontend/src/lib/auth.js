import { api } from "./api";

export async function logout() {
    try {
        await api("/api/logout", { method: "POST" });
    } catch {
        // اگر توکن expire شده بود هم مهم نیست
    } finally {
        localStorage.removeItem("token");
    }
}
