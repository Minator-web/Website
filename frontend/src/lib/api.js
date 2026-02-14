const BASE_URL = "http://127.0.0.1:8000";

function firstValidationError(errors) {
    if (!errors || typeof errors !== "object") return "";
    const firstKey = Object.keys(errors)[0];
    const firstMsg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : "";
    return firstMsg || "";
}

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
        // HTML/Plain text -> پیام کوتاه
        const short = (text || "").slice(0, 300);
        data = { message: short || `Request failed (${res.status})` };
    }

    // 401: پاک کردن توکن + پیام واضح
    if (res.status === 401) {
        localStorage.removeItem("token");
        throw { message: data?.message || "Please login again", status: 401 };
    }

    // 422: Validation -> پیام بهتر
    if (res.status === 422) {
        const msg = firstValidationError(data.errors) || data.message || "Invalid data";
        throw { ...data, message: msg, status: 422 };
    }

    if (!res.ok) {
        throw { ...data, status: res.status, message: data?.message || "Request failed" };
    }

    return data;
}
