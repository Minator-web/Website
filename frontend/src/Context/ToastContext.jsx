import { createContext, useContext, useMemo, useState, useCallback } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const remove = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const push = useCallback((toast) => {
        const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const item = {
            id,
            type: toast.type || "info", // info | success | error
            title: toast.title || "",
            message: toast.message || "",
            duration: Number.isFinite(toast.duration) ? toast.duration : 3000,
        };

        setToasts((prev) => [item, ...prev]);

        // auto close
        window.setTimeout(() => remove(id), item.duration);

        return id;
    }, [remove]);

    const api = useMemo(() => ({ push, remove }), [push, remove]);

    return (
        <ToastCtx.Provider value={api}>
            {children}

            {/* UI */}
            <div className="fixed top-4 right-4 z-[9999] w-[min(92vw,420px)] space-y-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={[
                            "rounded-2xl border p-4 shadow-lg bg-zinc-900/90 backdrop-blur text-white",
                            t.type === "success" ? "border-emerald-500/30" : "",
                            t.type === "error" ? "border-red-500/30" : "",
                            t.type === "info" ? "border-white/10" : "",
                        ].join(" ")}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                {t.title ? (
                                    <div className="font-semibold">
                                        {t.title}
                                    </div>
                                ) : null}
                                <div className="text-white/80 text-sm mt-1">{t.message}</div>
                            </div>

                            <button
                                onClick={() => remove(t.id)}
                                className="text-white/60 hover:text-white"
                                aria-label="Close"
                                type="button"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastCtx.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastCtx);
    if (!ctx) throw new Error("useToast must be used inside ToastProvider");
    return ctx;
}
