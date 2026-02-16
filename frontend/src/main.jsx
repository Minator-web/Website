import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { CartProvider } from "./context/CartContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import { WishlistProvider } from "./context/WishlistContext.jsx";
import { DrawerProvider } from "./context/DrawerContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ToastProvider>
            <DrawerProvider>
                <CartProvider>
                    <WishlistProvider>
                        <App />
                    </WishlistProvider>
                </CartProvider>
            </DrawerProvider>
        </ToastProvider>
    </React.StrictMode>
);
