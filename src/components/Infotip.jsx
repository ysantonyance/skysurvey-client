import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

const WIDTH = 208;
const GAP = 8;

export function InfoTip({ title, children }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);
    const tipRef = useRef(null);
    const id = useId();

    const place = () => {
        const r = btnRef.current?.getBoundingClientRect();
        if (!r) return;
        const left = Math.min(Math.max(GAP, r.left), window.innerWidth - WIDTH - GAP);
        setPos({ top: r.bottom + GAP, left });
    };

    useLayoutEffect(() => {
        if (open) place();
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onDown = (e) => {
            if (btnRef.current?.contains(e.target) || tipRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        const onKey = (e) => e.key === "Escape" && setOpen(false);
        const close = () => setOpen(false);

        document.addEventListener("mousedown", onDown);
        document.addEventListener("keydown", onKey);
        window.addEventListener("resize", close);
        window.addEventListener("scroll", close, true); // і прокрутка бічної панелі
        return () => {
            document.removeEventListener("mousedown", onDown);
            document.removeEventListener("keydown", onKey);
            window.removeEventListener("resize", close);
            window.removeEventListener("scroll", close, true);
        };
    }, [open]);

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                aria-label={`What is ${title}?`}
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setOpen((o) => !o)}
                className="grid h-4 w-4 cursor-pointer place-items-center rounded-full text-muted transition-hover hover:text-text focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
                <Info size={14} aria-hidden />
            </button>

            {open &&
                createPortal(
                    <div
                        ref={tipRef}
                        id={id}
                        role="note"
                        style={{ position: "fixed", top: pos.top, left: pos.left, width: WIDTH }}
                        className="z-[1000] rounded-sm border border-border bg-raised p-3 text-xs text-text"
                    >
                        <p className="mb-1 text-[#D5B6FF]">{title}</p>
                        <div className="flex flex-col gap-1 text-muted">{children}</div>
                    </div>,
                    document.body
                )}
        </>
    );
}