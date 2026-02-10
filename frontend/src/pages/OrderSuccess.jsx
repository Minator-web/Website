import { useParams, Link } from "react-router-dom";

export default function OrderSuccess() {
    const { id } = useParams();

    return (
        <div className="min-h-screen bg-black p-6 text-white">
            <div className="max-w-xl mx-auto bg-zinc-900/70 border border-white/10 rounded-2xl p-6 text-center space-y-4">
                <h1 className="text-3xl font-extrabold">🎉 Order Placed!</h1>

                <div className="text-white/70">
                    Your order #{id} has been created successfully.
                </div>

                <div className="flex gap-3 justify-center pt-2">
                    <Link
                        to={`/orders/${id}`}
                        className="px-4 py-2 rounded-lg bg-white text-black font-semibold"
                    >
                        View Order
                    </Link>

                    <Link
                        to="/"
                        className="px-4 py-2 rounded-lg bg-white/10 border border-white/10"
                    >
                        Back to shop
                    </Link>
                </div>
            </div>
        </div>
    );
}
