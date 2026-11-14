import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { CoordinateInput } from "./CoordinateInput.jsx";
import { Action } from "./Action.jsx";
import {Select} from "./Select.jsx";

function Section({ title, children, defaultOpen = true }) {
    return (
        <details open={defaultOpen} className="group border-b border-border">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-s transition-hover hover:text-text">
                {title}
                <ChevronDown size={16} className="transition-state group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-3 px-4 pb-4">{children}</div>
        </details>
    );
}

export function Sidebar() {
    return (
        <aside aria-label="Sky controls"
               className="border-b border-border bg-surface lg:overflow-y-auto lg:border-b-0 lg:border-r [scrollbar:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-[#D5B6FF] text-muted">
                <SlidersHorizontal size={16} aria-hidden /> Sky controls
            </div>

            <Section title="Sky position">
                <div className="grid grid-cols-2 gap-2">
                    <CoordinateInput label="RA · degrees" defaultValue="133.786245" placeholder=" " inputClassName="!text-xs !px-2"/>
                    <CoordinateInput label="Dec · degrees" defaultValue="-7.244372" placeholder=" " inputClassName="!text-xs !px-2"/>
                </div>
                <Action
                    icon={null}
                    className="w-full text-bg! hover:bg-accent/90! bg-[#C79AFF]!">Load patch</Action>
                <Select
                    label="Field of view"
                    options={[
                        { value: "0.10", label: "0.10° · Standard" },
                        { value: "0.25", label: "0.25° · Wide" },
                    ]}
                />

                <Select
                    label="Infrared filter"
                    options={[
                        { value: "all", label: "All channels" },
                        { value: "short", label: "Short IR" },
                        { value: "long", label: "Long IR" },
                    ]}
                />
                <p className="text-xs text-muted">Long IR emphasizes cool sources. Larger fields take longer to load.</p>
            </Section>

            <Section title="Image layers">
                {["Gaia DR3 catalog", "Motion & variability", "Defect mask", "Center crosshair · 10″ radius"].map((t) => (
                    <label key={t} className="flex items-center gap-2 text-xs">
                        <input type="checkbox" className="accent-accent" /> {t}
                    </label>
                ))}
                <label className="flex flex-col gap-1 text-xs text-muted">
                    Mask opacity
                    <input type="range" className="accent-accent" />
                </label>
            </Section>

            <Section title="Brightness & contrast">
                <Select
                    label="Stretch algorithm"
                    options={[
                        { value: "asinh", label: "Asinh" },
                        { value: "linear", label: "Linear" },
                        { value: "log", label: "Log" },
                    ]}
                />
                <label className="flex flex-col gap-1 text-xs text-muted">
                    Asinh softness
                    <input type="range" className="accent-accent" />
                </label>
                <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" className="accent-accent" /> Invert base image
                </label>
                <Action className="w-full">Reset contrast · Auto</Action>
            </Section>

            <Section title="Sample case" defaultOpen={false}>
                <p className="text-xs text-muted">TODO</p>
            </Section>
        </aside>
    );
}