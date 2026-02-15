export function toastInfo(toast, message, title = "") {
    toast.push({ type: "info", title, message });
}

export function toastSuccess(toast, message, title = "") {
    toast.push({ type: "success", title, message });
}

export function toastError(toast, message, title = "") {
    toast.push({ type: "error", title, message });
}
