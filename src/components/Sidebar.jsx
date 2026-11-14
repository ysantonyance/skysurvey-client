import { SlidersHorizontal, ChevronDown, Check, RefreshCw } from "lucide-react";
import { CoordinateInput } from "./CoordinateInput.jsx";
import { Action } from "./Action.jsx";
import {Select} from "./Select.jsx";
import {useState} from "react";

function Section({ title, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <details
            open={open}
            onToggle={(e) => setOpen(e.currentTarget.open)}
            className="group border-b border-border"
        >
            <summary className="font-normal flex cursor-pointer list-none items-center justify-between px-4 py-3 text-base transition-hover hover:text-text">
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

function DualRange({ min, max, step, low, high, onChange }) {
    const pct = (v) => ((v - min) / (max - min)) * 100;
    return (
        <div className="relative h-5">
            <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-sm bg-accent/20" />
            <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-sm bg-accent/55"
                 style={{ left: `${pct(low)}%`, width: `${pct(high) - pct(low)}%` }} />
            <input type="range" className="dual" aria-label="Black cut"
                   min={min} max={max} step={step} value={low}
                   onChange={(e) => onChange(Math.min(Number(e.target.value), high - step), high)} />
            <input type="range" className="dual" aria-label="White cut"
                   min={min} max={max} step={step} value={high}
                   onChange={(e) => onChange(low, Math.max(Number(e.target.value), low + step))} />
        </div>
    );
}

function ProgressBar({ stage, percent }) {
    const known = typeof percent === "number";
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs text-muted">
                <span>{stage ?? "Loading"}</span>
                {known && <span className="text-[#D5B6FF]">{percent}%</span>}
            </div>
            <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={known ? percent : undefined}
                aria-label="Loading sky patch"
                className="relative h-1 w-full overflow-hidden rounded-sm bg-accent/20"
            >
                <div
                    className={`h-full rounded-sm bg-[#C79AFF] ${known ? "transition-[width] duration-200 ease-[cubic-bezier(0.2,0,0,1)]" : "w-1/3 animate-pulse"}`}
                    style={known ? { width: `${percent}%` } : undefined}
                />
            </div>
        </div>
    );
}

export function Sidebar({ form, onChange, errors, canLoad, loading, progress, onLoad, presets = [], onPreset, view, onViewChange, dataRange, autoCut }) {
    const span = dataRange ? dataRange.p99_5 - dataRange.p0_5 : 1;
    const sliderMin = dataRange ? dataRange.p0_5 - span : -1;
    const sliderMax = dataRange ? dataRange.p99_5 + span : 1;
    const cut = view.cut ?? autoCut ?? (dataRange ? [dataRange.p0_5, dataRange.p99_5] : [-1, 1]);
    const step = span / 200;

    return (
        <aside aria-label="Sky controls"
               className="border-b border-border bg-surface lg:overflow-y-auto lg:border-b-0 lg:border-r [scrollbar:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-[#D5B6FF] text-muted">
                <SlidersHorizontal size={16} aria-hidden /> Sky controls
            </div>

            <Section title="Sky position">
                <div className="grid grid-cols-2 gap-2">
                    <CoordinateInput label="RA · degrees" value={form.ra} error={errors.ra}
                                     onChange={(e) => onChange({ ra: e.target.value })}
                                     placeholder=" " inputClassName="!text-xs !px-2" />
                    <CoordinateInput label="Dec · degrees" value={form.dec} error={errors.dec}
                                     onChange={(e) => onChange({ dec: e.target.value })}
                                     placeholder=" " inputClassName="!text-xs !px-2" />
                </div>

                <Select label="Field of view" value={form.fov}
                        onValueChange={(v) => onChange({ fov: v })}
                        options={[
                            { value: "0.10", label: "0.10° · Standard" },
                            { value: "0.25", label: "0.25° · Wide" },
                        ]} />

                <Select label="Infrared filter" value={form.band}
                        onValueChange={(v) => onChange({ band: v })}
                        options={[
                            { value: "all",  label: "All channels" },
                            { value: "blue", label: "Blue" },
                            { value: "red",  label: "Red" },
                            { value: "D1",   label: "Band 1" },
                            { value: "D2",   label: "Band 2" },
                            { value: "D3",   label: "Band 3" },
                            { value: "D4",   label: "Band 4" },
                            { value: "D5",   label: "Band 5" },
                            { value: "D6",   label: "Band 6" }
                        ]} />

                <Action icon={null} loading={loading} disabled={!canLoad} onClick={onLoad}
                        className="w-full text-bg! hover:bg-accent/90! bg-[#C79AFF]!">
                    Load patch
                </Action>
                {loading && <ProgressBar stage={progress?.stage} percent={progress?.percent} />}
                <p className="text-xs text-muted">Long IR emphasizes cool sources. Larger fields take longer to load.</p>
            </Section>

            <Section title="Image layers">
                <div className="flex flex-col gap-4">
                    <Checkbox label="Gaia DR3 catalog" checked={view.gaia}
                              onChange={(e) => onViewChange({ gaia: e.target.checked })} />
                    <Checkbox label="Motion & variability" checked={view.motion}
                              onChange={(e) => onViewChange({ motion: e.target.checked })} />
                    <Checkbox label="Center crosshair · 10″ radius" checked={view.crosshair}
                              onChange={(e) => onViewChange({ crosshair: e.target.checked })} />
                </div>

                <div className="flex flex-col gap-4 rounded-sm border border-border p-3">
                    <Checkbox label="Defect mask" checked={view.defect}
                              onChange={(e) => onViewChange({ defect: e.target.checked })} />

                    <div className={`flex flex-col gap-3 transition-state ${view.defect ? "" : "opacity-40"}`}>
                        <div className="flex items-center justify-between text-xs text-muted">
                            <label htmlFor="mask-opacity">Mask opacity</label>
                            <span className="text-[#D5B6FF]">{view.opacity}%</span>
                        </div>
                        <input id="mask-opacity" type="range" min={0} max={100}
                               value={view.opacity} disabled={!view.defect}
                               onChange={(e) => onViewChange({ opacity: Number(e.target.value) })}
                               style={{ "--pct": `${view.opacity}%` }}
                               className="range disabled:cursor-not-allowed" />

                        <div className="flex flex-wrap gap-x-4 gap-y-3">
                            <Swatch color="var(--color-error)">Bad/saturated</Swatch>
                            <Swatch color="#7FD99A">Source core</Swatch>
                        </div>
                    </div>
                </div>
            </Section>

            <Section title="Brightness & contrast">
                <Select label="Stretch algorithm" value={view.stretch}
                        onValueChange={(v) => onViewChange({ stretch: v })}
                        options={[
                            { value: "asinh", label: "Asinh" },
                            { value: "linear", label: "Linear" },
                            { value: "sqrt", label: "Sqrt" },
                            { value: "log", label: "Log" },
                            { value: "zscale", label: "ZScale" },
                        ]} />

                <div className="flex flex-col gap-3 rounded-sm border border-border p-3">
                    <p className="text-xs text-muted">Black / white cut</p>
                    <div className="flex justify-between text-xs">
                        <span className="text-muted">Black <span className="text-[#D5B6FF]">{cut[0].toFixed(3)}</span></span>
                        <span className="text-muted">White <span className="text-[#D5B6FF]">{cut[1].toFixed(3)}</span></span>
                    </div>
                    <DualRange min={sliderMin} max={sliderMax} step={step} low={cut[0]} high={cut[1]}
                               onChange={(l, h) => onViewChange({ cut: [l, h] })} />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-xs text-muted">
                        <label htmlFor="softness">Asinh softness</label>
                        <span className="text-[#D5B6FF]">{view.softness}</span>
                    </div>
                    <input id="softness" type="range" min={0.01} max={1} step={0.01} value={view.softness}
                           onChange={(e) => onViewChange({ softness: Number(e.target.value) })}
                           style={{ "--pct": `${view.softness * 100}%` }} className="range" />
                </div>

                <Checkbox label="Invert base image" checked={view.invert} onChange={(e) => onViewChange({ invert: e.target.checked })} />

                <Action icon={<RefreshCw size={16} />} className="w-full text-xs! bg-[#C79AFF]! text-black!"
                        onClick={() => onViewChange({ cut: null, softness: 0.1, stretch: "asinh", invert: false })}>
                    Reset contrast · Auto
                </Action>
                <p className="text-xs text-muted">Calculated from simulated pixel values.</p>
            </Section>

            <Section title="Sample case">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                        {presets.map((p) => (
                            <button
                                key={p.label}
                                type="button"
                                disabled={loading}
                                onClick={() => onPreset(p)}
                                className="h-8 rounded-sm border border-border px-3 text-xs text-text transition-hover hover:bg-raised disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Section>
        </aside>
    );
}