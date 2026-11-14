import { useState } from "react";
import { Play, SkipBack, SkipForward } from "lucide-react";
import { Header } from "../components/Header.jsx";
import { Sidebar } from "../components/Sidebar.jsx";
import PictureWindow from "../components/PictureWindow.jsx";

const TABS = ["Science", "IR color", "Difference", "Deep stack", "Noise"];
const DATES = ["2025-05", "2025-11", "2026-05"];

function Badge({ children }) {
    return (
        <span className="rounded-sm border border-accent/40 bg-accent/15 px-2 py-1 text-xs">{children}</span>
    );
}

function Home() {
    const [tab, setTab] = useState("Science");

    return (
        <div className="flex min-h-screen flex-col bg-bg text-text lg:h-screen lg:overflow-hidden">
            <Header />

            <div className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[260px_minmax(0,1fr)]">
                <Sidebar />

                <main className="min-w-0 p-4 lg:overflow-y-auto">
                    {/* Заголовок робочої області */}
                    <div className="flex flex-col justify-between gap-1 sm:flex-row">
                        <div>
                            <h1 className="text-base">Sky position &amp; spectrum</h1>
                            <p className="text-xs text-muted">RA 133.786245° / Dec -7.244372° · 0.10° field</p>
                        </div>
                        <p className="text-xs text-muted">Sample dates, catalog and measurements</p>
                    </div>

                    {/* Дві колонки: знімок | спектр */}
                    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                        {/* Знімок і керування */}
                        <section aria-label="Sky image" className="flex min-w-0 flex-col gap-3">
                            <div className="rounded-sm border border-accent/40 bg-accent/15 p-3 text-xs">
                                <p>Demo · Candidate · No counterpart in sample Gaia DR3 catalog</p>
                                <p className="mt-2 text-muted">IR signal · SNR 5.9σ</p>
                            </div>

                            <div role="tablist" className="flex gap-1 text-xs">
                                {TABS.map((t) => (
                                    <button
                                        key={t}
                                        role="tab"
                                        aria-selected={tab === t}
                                        onClick={() => setTab(t)}
                                        className={`h-8 flex-1 rounded-sm border px-2 transition-hover ${
                                            tab === t ? "border-accent bg-accent/15" : "border-transparent text-muted hover:bg-raised"
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            <div className="aspect-square w-full overflow-hidden rounded-sm border border-border bg-surface">
                                <PictureWindow />
                            </div>
                            <p className="text-xs text-muted">Move over the image for pixel and sky coordinates.</p>

                            <div className="flex items-center justify-between text-xs text-muted">
                                <span>− &nbsp; 100% &nbsp; +</span>
                                <span>Wheel to zoom · Drag to pan</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button aria-label="Play" className="grid h-10 w-10 place-items-center rounded-sm border border-accent bg-accent/15"><Play size={16} /></button>
                                <button aria-label="Previous" className="grid h-10 w-10 place-items-center rounded-sm border border-border transition-hover hover:bg-raised"><SkipBack size={16} /></button>
                                <button aria-label="Next" className="grid h-10 w-10 place-items-center rounded-sm border border-border transition-hover hover:bg-raised"><SkipForward size={16} /></button>
                            </div>

                            <div className="flex gap-2">
                                {DATES.map((d, i) => (
                                    <button key={d} className={`h-10 rounded-sm border px-4 text-xs transition-hover ${i === 0 ? "border-accent bg-accent/15" : "border-border hover:bg-raised"}`}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-muted">Demo date · 2025-05-06 02:34 UTC · 6 detector frames</p>
                        </section>

                        {/* Спектр */}
                        <section aria-label="Object spectrum" className="min-w-0 rounded-sm border border-border bg-surface p-4">
                            <div className="flex items-start justify-between gap-2">
                                <h2 className="text-2xl">Object spectrum</h2>
                                <Badge>Illustrative data</Badge>
                            </div>
                            <p className="mt-2 text-xs text-muted">Sparse measurements · Vertical error bars show ± flux_error</p>
                            <p className="mt-2 text-xs text-accent">RA 133.786245° / Dec -7.244372°</p>

                            <div className="mt-4 flex flex-wrap gap-4 text-xs">
                                {["Hide noisy / defective points", "Show molecular bands", "Connect points"].map((t) => (
                                    <label key={t} className="flex items-center gap-2"><input type="checkbox" className="accent-accent" /> {t}</label>
                                ))}
                            </div>

                            {/* TODO: графік (recharts / visx / d3) */}
                            <div className="mt-4 grid h-80 place-items-center rounded-sm bg-bg text-xs text-muted">
                                Spectrum chart
                            </div>

                            <ul className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted sm:grid-cols-3">
                                <li>Band 1 · 0.75–1.10 µm · D1</li>
                                <li>Band 2 · 1.10–1.60 µm · D2</li>
                                <li>Band 3 · 1.60–2.40 µm · D3</li>
                                <li>Band 4 · 2.40–3.80 µm · D4</li>
                                <li>Band 5 · 3.80–4.40 µm · D5</li>
                                <li>Band 6 · 4.40–5.00 µm · D6</li>
                            </ul>
                            <p className="mt-4 text-xs text-muted">Sample spectrum for design review. Click a different sky position to compare illustrative measurements.</p>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Home;