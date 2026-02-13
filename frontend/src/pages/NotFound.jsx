import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <div className="text-center space-y-4">
                <h1 className="text-6xl font-extrabold">404</h1>
                <p className="text-white/60">Page not found</p>
                <Link
                    to="/"
                    className="inline-block mt-4 px-5 py-2 rounded-lg bg-white text-black font-semibold"
                >
                    Back to shop
                </Link>
            </div>
        </div>
    );
}
