import { useId } from "react";

export function CoordinateInput({
                                    label,
                                    hint,
                                    error,          // рядок з текстом помилки
                                    loading = false,
                                    loadingHint,    // підказка під полем у стані loading
                                    disabled = false,
                                    className = "",
                                    ...rest
                                }) {
    const id = useId();
    const msgId = `${id}-msg`;
    const message = error ?? (loading ? loadingHint ?? hint : hint);

    const lineColor = error
        ? "border-b-error"
        : "border-b-accent placeholder-shown:border-b-border";

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <label htmlFor={id} className="text-xs text-muted">
                {label}
            </label>

            <input
                id={id}
                {...rest}
                disabled={disabled}
                readOnly={loading || rest.readOnly}
                aria-invalid={!!error || undefined}
                aria-busy={loading || undefined}
                aria-describedby={message ? msgId : undefined}
                className={[
                    "h-10 w-full rounded-sm border-0 border-b-2 bg-surface px-3",
                    "font-ui text-base text-text outline-none",
                    "placeholder:text-muted/60",
                    "transition-hover transition-state",
                    lineColor,
                    // hover / active
                    "hover:bg-raised active:bg-raised active:border-b-text",
                    // focus
                    "focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent",
                    // loading
                    loading ? "cursor-progress" : "",
                    // disabled
                    "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface",
                ].join(" ")}
            />

            {message && (
                <p
                    id={msgId}
                    className={`text-xs ${error ? "text-error" : "text-muted"}`}
                >
                    {message}
                </p>
            )}
        </div>
    );
}