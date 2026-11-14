import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useId } from "react";

export function Select({
                           label,
                           ariaLabel,
                           options,
                           value,
                           defaultValue,
                           onValueChange,
                           disabled = false,
                           className = "",
                       }) {
    const id = useId();

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && (
                <label htmlFor={id} className="text-xs text-muted">
                    {label}
                </label>
            )}

            <RadixSelect.Root
                value={value}
                defaultValue={defaultValue ?? options[0]?.value}
                onValueChange={onValueChange}
                disabled={disabled}
            >
                <RadixSelect.Trigger
                    id={id}
                    aria-label={label ? undefined : ariaLabel}
                    className={[
                        "flex h-10 w-full items-center justify-between gap-2",
                        "rounded-sm border border-border bg-bg px-3",
                        "font-ui text-xs text-text outline-none",
                        "transition-hover transition-state",
                        "hover:bg-raised",
                        "data-[state=open]:border-accent",
                        "focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        "data-disabled:cursor-not-allowed data-disabled:opacity-40 data-disabled:hover:bg-bg",
                    ].join(" ")}
                >
                    <RadixSelect.Value />
                    <RadixSelect.Icon>
                        <ChevronDown size={16} className="text-muted" aria-hidden />
                    </RadixSelect.Icon>
                </RadixSelect.Trigger>

                <RadixSelect.Portal>
                    <RadixSelect.Content
                        position="popper"
                        sideOffset={4}
                        className="z-50 w-(--radix-select-trigger-width) overflow-hidden rounded-sm border border-border bg-surface"
                    >
                        <RadixSelect.Viewport>
                            {options.map((o) => (
                                <RadixSelect.Item
                                    key={o.value}
                                    value={o.value}
                                    className={[
                                        "flex h-9 cursor-pointer select-none items-center justify-between gap-2 px-3",
                                        "font-ui text-xs text-text outline-none",
                                        "transition-hover",
                                        "data-highlighted:bg-raised",
                                        "data-[state=checked]:text-accent",
                                        "data-disabled:cursor-not-allowed data-disabled:opacity-40",
                                    ].join(" ")}
                                >
                                    <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                                    <RadixSelect.ItemIndicator>
                                        <Check size={16} aria-hidden />
                                    </RadixSelect.ItemIndicator>
                                </RadixSelect.Item>
                            ))}
                        </RadixSelect.Viewport>
                    </RadixSelect.Content>
                </RadixSelect.Portal>
            </RadixSelect.Root>
        </div>
    );
}