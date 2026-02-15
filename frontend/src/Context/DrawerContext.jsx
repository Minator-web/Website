import { createContext, useContext, useMemo, useState } from "react";

const DrawerCtx = createContext(null);

export function DrawerProvider({ children }) {
    const [cartOpen, setCartOpen] = useState(false);

    const value = useMemo(
        () => ({
            cartOpen,
            openCart: () => setCartOpen(true),
            closeCart: () => setCartOpen(false),
            toggleCart: () => setCartOpen((v) => !v),
            setCartOpen,
        }),
        [cartOpen]
    );

    return <DrawerCtx.Provider value={value}>{children}</DrawerCtx.Provider>;
}

export function useDrawer() {
    const ctx = useContext(DrawerCtx);
    if (!ctx) throw new Error("useDrawer must be used inside DrawerProvider");
    return ctx;
}
