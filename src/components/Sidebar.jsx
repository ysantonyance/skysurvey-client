import { SlidersHorizontal, ChevronDown, Check, RefreshCw } from "lucide-react";
import { CoordinateInput } from "./CoordinateInput.jsx";
import { Action } from "./Action.jsx";
import {Select} from "./Select.jsx";
import {useState} from "react";

function Section({ title, children, defaultOpen = true }) {
    return (
        <details open={defaultOpen} className="group border-b border-border">
            <summary className="font-normal flex cursor-pointer list-none items-center justify-between px-4 py-3 xs transition-hover hover:text-text">
                {title}
                <ChevronDown size={16} className="transition-state group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-3 px-4 pb-4">{children}</div>
        </details>
    );
}
function Checkbox({ label, ...rest }) {
    return (
        <label className="flex cursor-pointer items-center gap-2 text-xs text-text">
            <span className="relative grid h-4 w-4 shrink-0 place-items-center">
                <input
                    type="checkbox"
                    {...rest}
                    className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-sm border border-border bg-bg transition-hover checked:border-[#C79AFF] checked:bg-[#C79AFF] focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
                />
                <Check size={12} aria-hidden className="pointer-events-none relative text-bg opacity-0 peer-checked:opacity-100" />
            </span>
            {label}
        </label>
    );
}

function Swatch({ color, children }) {
    return (
        <span className="flex items-center gap-1 text-xs text-muted">
            <span className="h-2.5 w-2.5" style={{ background: color }} aria-hidden />
            {children}
        </span>
    );
}

function DualRange({ min, max, low, high, onChange }) {
    const pct = (v) => ((v - min) / (max - min)) * 100;
    return (
        <div className="relative h-5">
            <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-sm bg-accent/20" />
            <div
                className="absolute top-1/2 h-1 -translate-y-1/2 rounded-sm bg-accent/55"
                style={{ left: `${pct(low)}%`, width: `${pct(high) - pct(low)}%` }}
            />
            <input
                type="range" className="dual" aria-label="Black cut"
                min={min} max={max} value={low}
                onChange={(e) => onChange(Math.min(Number(e.target.value), high - 1), high)}
            />
            <input
                type="range" className="dual" aria-label="White cut"
                min={min} max={max} value={high}
                onChange={(e) => onChange(low, Math.max(Number(e.target.value), low + 1))}
            />
        </div>
    );
}

export function Sidebar() {
    const [opacity, setOpacity] = useState(50);
    const [cut, setCut] = useState([-50, 500]);
    const [softness, setSoftness] = useState(0.1);

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
                <div className="flex flex-col gap-5">
                    <Checkbox label="Gaia DR3 catalog" defaultChecked />
                    <Checkbox label="Motion & variability" />
                    <Checkbox label="Defect mask" />
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between text-xs text-muted">
                        <label htmlFor="mask-opacity">Mask opacity</label>
                        <span className="text-[#D5B6FF]">{opacity}%</span>
                    </div>
                    <input
                        id="mask-opacity"
                        type="range"
                        min={0}
                        max={100}
                        value={opacity}
                        onChange={(e) => setOpacity(Number(e.target.value))}
                        style={{ "--pct": `${opacity}%` }}
                        className="range"
                    />
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-3">
                    <Swatch color="var(--color-error)">Bad / saturated</Swatch>
                    <Swatch color="var(--color-warning)">Cosmic ray</Swatch>
                    <Swatch color="#8FDADA">Source core</Swatch>
                </div>

                <Checkbox label="Center crosshair · 10″ radius" defaultChecked />
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

                <div className="flex flex-col gap-3 rounded-sm border border-border p-3">
                    <p className="text-xs text-muted">Black / white cut</p>
                    <div className="flex justify-between text-xs">
                        <span className="text-muted">Black <span className="text-[#D5B6FF]">{cut[0]}</span></span>
                        <span className="text-muted">White <span className="text-[#D5B6FF]">{cut[1]}</span></span>
                    </div>
                    <DualRange min={-100} max={600} low={cut[0]} high={cut[1]} onChange={(l, h) => setCut([l, h])} />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs text-muted">
                        <label htmlFor="softness">Asinh softness</label>
                        <span className="text-[#D5B6FF]">{softness}</span>
                    </div>
                    <input
                        id="softness"
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={softness}
                        onChange={(e) => setSoftness(Number(e.target.value))}
                        style={{ "--pct": `${softness * 100}%` }}
                        className="range"
                    />
                </div>

                <Checkbox label="Invert base image" />

                <Action
                    icon={<RefreshCw size={16} />}
                    className="w-full text-xs!"
                    onClick={() => { setCut([-50, 500]); setSoftness(0.1); }}
                >
                    Reset contrast · Auto
                </Action>

                <p className="text-xs text-muted">Calculated from simulated pixel values.</p>
            </Section>

            <Section title="Sample case" defaultOpen={false}>
                <p className="text-xs text-muted">TODO</p>
            </Section>
        </aside>
    );
}