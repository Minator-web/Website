import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Shop from "./pages/Shop";
import CartPage from "./pages/CartPage";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import OrderDetails from "./pages/OrderDetails";
import GuestRoute from "./routes/GuestRoute";


import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import MyOrders from "./pages/MyOrders";


import AdminRoute from "./routes/AdminRoute";
import AuthRoute from "./routes/AuthRoute";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* ---------- Public ---------- */}
                <Route path="/" element={<Shop />} />
                <Route path="/cart" element={<CartPage />} />


                {/* ---------- User Protected ---------- */}
                <Route
                    path="/checkout"
                    element={
                        <AuthRoute>
                            <Checkout />
                        </AuthRoute>
                    }
                />


                <Route
                    path="/my-orders"
                    element={
                        <AuthRoute>
                            <MyOrders />
                        </AuthRoute>
                    }
                />


                <Route
                    path="/order-success/:id"
                    element={
                        <AuthRoute>
                            <OrderSuccess />
                        </AuthRoute>
                    }
                />

                <Route
                    path="/login"
                    element={
                        <GuestRoute>
                            <Login />
                        </GuestRoute>
                    }
                />

                <Route
                    path="/register"
                    element={
                        <GuestRoute>
                            <Register />
                        </GuestRoute>
                    }
                />


                <Route
                    path="/orders/:id"
                    element={
                        <AuthRoute>
                            <OrderDetails />
                        </AuthRoute>
                    }
                />

                {/* ---------- Admin ---------- */}
                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminLayout />
                        </AdminRoute>
                    }
                >
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<Products />} />
                    <Route path="orders" element={<Orders />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </BrowserRouter>
    );
}
