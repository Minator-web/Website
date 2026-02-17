export default function StockBadge({ stock = 0, isActive = true, lowThreshold = 5 }) {
    const s = Number(stock ?? 0);

    if (!isActive) {
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-red-500/30 bg-red-500/10 text-red-200">
        Inactive
      </span>
        );
    }

    if (s <= 0) {
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-red-500/30 bg-red-500/10 text-red-200">
        Out of stock
      </span>
        );
    }

    if (s <= lowThreshold) {
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-amber-500/30 bg-amber-500/10 text-amber-200">
        Low stock ({s})
      </span>
        );
    }

    return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
      In stock ({s})
    </span>
    );
}
