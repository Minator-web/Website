const BASE_URL = "http://127.0.0.1:8000"; // فقط دامنه. /api رو توی path بده

export async function api(path, options = {}) {
    const token = localStorage.getItem("token");

    // اگر کسی اشتباهی بدون / شروع کرد
    const fixedPath = path.startsWith("/") ? path : `/${path}`;


    const res = await fetch(`${BASE_URL}${fixedPath}`, {
        ...options,
        // برای اینکه درخواست‌های لاگین/CSRF/کوکی هم درست کار کنن
        // اگر Sanctum با cookie کار نمی‌کنی، مشکلی ایجاد نمی‌کنه
        credentials: "include",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),

        },
    });
    if (res.status === 401) {
        localStorage.removeItem("token");
    }

    // اگر پاسخ خالی بود (مثلاً 204)
    const text = await res.text();
    let data = {};
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { message: text || "Invalid JSON response" };
    }

    if (!res.ok) {
        throw data;
    }

    return data;
}
