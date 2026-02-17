const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ---- Helpers
const ME_CACHE_KEY = "me_cache_v1";
const ME_TTL_MS = 60 * 1000; // 60s

function now() {
    return Date.now();
}

function firstValidationError(errors) {
    if (!errors || typeof errors !== "object") return "";
    const firstKey = Object.keys(errors)[0];
    const firstMsg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : "";
    return firstMsg || "";
}

export function clearMeCache() {
    try {
        localStorage.removeItem(ME_CACHE_KEY);
    } catch {}
}

function readMeCache() {
    try {
        const raw = localStorage.getItem(ME_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.data || !parsed?.ts) return null;
        if (now() - parsed.ts > ME_TTL_MS) return null;
        return parsed.data;
    } catch {
        return null;
    }
}

function writeMeCache(data) {
    try {
        localStorage.setItem(ME_CACHE_KEY, JSON.stringify({ ts: now(), data }));
    } catch {}
}

export function normalizeRole(role) {
    return String(role || "").trim().toLowerCase();
}

export function isAdminRole(role) {
    const r = normalizeRole(role);
    return r === "admin" || r === "super_admin";
}

// ---- API client
export async function api(path, options = {}) {
    const token = localStorage.getItem("token");
    const fixedPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${BASE_URL}${fixedPath}`;

    const body = options.body;
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");

    if (token) headers.set("Authorization", `Bearer ${token}`);

    if (!isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    let res;
    try {
        res = await fetch(url, { ...options, headers });
    } catch (err) {
        throw { message: err?.message || "Network error", status: 0 };
    }

    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();

    let data = {};
    if (contentType.includes("application/json")) {
        try {
            data = text ? JSON.parse(text) : {};
        } catch {
            data = { message: "Invalid JSON response" };
        }
    } else {
        const short = (text || "").slice(0, 300);
        data = { message: short || `Request failed (${res.status})` };
    }

    if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        clearMeCache();
        try {
            window.dispatchEvent(new Event("auth:changed"));
        } catch {}
        throw { message: data?.message || "Please login again", status: 401 };
    }

    if (res.status === 422) {
        const msg = firstValidationError(data.errors) || data.message || "Invalid data";
        throw { ...data, message: msg, status: 422 };
    }

    if (res.status === 429) {
        throw {
            ...data,
            status: 429,
            message: data?.message || "Too many requests. Please try again later.",
        };
    }

    if (!res.ok) {
        throw { ...data, status: res.status, message: data?.message || "Request failed" };
    }

    return data;
}

// ---- Business API
export async function fetchStockMap(productIds) {
    const ids = (productIds || [])
        .map(Number)
        .filter((x) => Number.isInteger(x) && x > 0);

    if (!ids.length) return [];
    return api("/api/products/stock", {
        method: "POST",
        body: JSON.stringify({ ids }),
    });
}

// ---- Auth actions
export async function getMe({ force = false } = {}) {
    if (!force) {
        const cached = readMeCache();
        if (cached) return cached;
    }
    const token = localStorage.getItem("token");
    if (!token) return null;

    const me = await api("/api/me");
    writeMeCache(me);
    return me;
}

export async function logout() {
    try {
        await api("/api/logout", { method: "POST" });
    } catch {
    } finally {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        clearMeCache();
        try {
            window.dispatchEvent(new Event("auth:changed"));
        } catch {}
    }
}
