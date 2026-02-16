import { api } from "./api";

export async function logout() {
    try {
        await api("/api/logout", { method: "POST" });
    } catch {
    } finally {
        localStorage.removeItem("token");
    }
}
