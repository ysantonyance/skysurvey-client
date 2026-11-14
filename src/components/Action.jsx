import { ArrowRight, RefreshCw, Scan } from "lucide-react";

const STATE_STYLES = {
    idle: [
        "text-text",
        "hover:bg-raised",
        "active:border-accent active:bg-transparent active:text-accent",
    ].join(" "),
    error: "border-error text-error hover:bg-error/10 active:bg-error/20",
    loading: "text-text cursor-progress",
    disabled: "text-muted/50 cursor-not-allowed",
};

export function Action({
                           children,
                           icon,
                           loading = false,
                           error = false,
                           disabled = false,
                           className = "",
                           ...rest
                       }) {
    const state = disabled ? "disabled" : loading ? "loading" : error ? "error" : "idle";

    let glyph = icon;
    if (icon === undefined) {
        glyph = loading ? <Scan size={16} className="animate-pulse" />
            : error   ? <RefreshCw size={16} />
                :           <ArrowRight size={16} />;
    }

    return (
        <button
            {...rest}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={[
                "inline-flex h-10 items-center justify-center gap-2 px-4",
                "rounded-sm border border-transparent bg-transparent",
                "font-ui text-base transition-hover transition-state",
                "focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent",
                STATE_STYLES[state],
                className,
            ].join(" ")}
        >
            {glyph}
            {children}
        </button>
    );
}