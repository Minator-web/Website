export default function EmptyState({
                                       title = "Nothing here",
                                       description = "",
                                       icon = "🧺",
                                       actions = null,
                                   }) {
    return (
        <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-8 text-white">
            <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                    {icon}
                </div>

                <div className="flex-1">
                    <div className="text-xl font-bold">{title}</div>
                    {description ? <div className="mt-2 text-white/60">{description}</div> : null}

                    {actions ? <div className="mt-5 flex flex-wrap gap-2">{actions}</div> : null}
                </div>
            </div>
        </div>
    );
}
