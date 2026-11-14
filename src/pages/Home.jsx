import { useState, useEffect, useRef } from "react";
import { Header } from "../components/Header.jsx";
import { Sidebar } from "../components/Sidebar.jsx";

const TABS = ["Science", "IR color", "Difference", "Deep stack", "Noise"];

function Badge({ children }) {
    return (
        <span className="rounded-sm border border-accent/40 bg-accent/15 px-2 py-1 text-xs">{children}</span>
    );
}

function Home() {
    const [tab, setTab] = useState("Science");

    const [frameData, setFrameData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [intervalMs, setIntervalMs] = useState(100);

    const [hideNoisy, setHideNoisy] = useState(false);
    const [connectPoints, setConnectPoints] = useState(true);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [showBands, setShowBands] = useState(true);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/v1/target?ra=269.4485&dec=4.7394&fov=0.1&band=all')
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                setFrameData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error loading data from backend:', err);
                setLoading(false);
            });
    }, []);

    const frames = frameData?.epochs?.map(
        (epoch) => epoch.layers?.image
    ).filter(Boolean) || [];

    const totalFrames = frames.length;
    const preloadedImagesRef = useRef([]);

    useEffect(() => {
        preloadedImagesRef.current = frames.map((src) => {
            const img = new Image();
            img.src = src;
            return img;
        });
    }, [frames]);

    useEffect(() => {
        if (!isPlaying || totalFrames <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % totalFrames);
        }, intervalMs);

        return () => clearInterval(timer);
    }, [isPlaying, intervalMs, totalFrames]);

    const handlePlayToggle = () => setIsPlaying((prev) => !prev);
    const handlePrevFrame = () => {
        setIsPlaying(false);
        setCurrentIndex((prev) => (prev - 1 + totalFrames) % totalFrames);
    };
    const handleNextFrame = () => {
        setIsPlaying(false);
        setCurrentIndex((prev) => (prev + 1) % totalFrames);
    };

    const handleSpeedChange = (e) => {
        const val = e.target.value;
        if (val === '500ms') setIntervalMs(500);
        else if (val === '100ms') setIntervalMs(100);
        else setIntervalMs(50);
    };

    const spectrumData = frameData?.spectrum;

    const rawSpectrum = (Array.isArray(spectrumData)
            ? spectrumData
            : (spectrumData?.points ?? spectrumData?.data ?? [])
    )
        .filter((p) => p.flux !== null && p.flux !== undefined)
        .map((p) => ({
            ...p,
            wavelength: p.wavelength_um,
            flux_error: p.error ?? 0,
            is_flagged: p.is_flagged ?? false,
            band: `Band ${p.detector}`,
        }));

    const spectrumPoints = rawSpectrum
        .filter(p => !(hideNoisy && p.is_flagged))
        .sort((a, b) => a.wavelength - b.wavelength);

    const minWavelength = 0.75;
    const maxWavelength = 5.0;
    const chartWidth = 700;
    const chartHeight = 280;
    const padding = { top: 35, right: 30, bottom: 40, left: 65 };
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const allFluxes = rawSpectrum.length > 0 ? rawSpectrum.flatMap(p => [p.flux + (p.flux_error ?? 0), p.flux - (p.flux_error ?? 0)]) : [-50, 250];
    const minY = Math.min(0, ...allFluxes) * 1.1;
    const maxY = Math.max(10, ...allFluxes) * 1.1;

    const scaleX = (w) => padding.left + ((w - minWavelength) / (maxWavelength - minWavelength)) * plotWidth;
    const scaleY = (f) => padding.top + plotHeight - ((f - minY) / (maxY - minY)) * plotHeight;

    const findBands = (node) => {
        if (!node || typeof node !== "object") return null;
        if (Array.isArray(node) && node[0]?.range_um) return node;
        for (const v of Object.values(node)) {
            const found = findBands(v);
            if (found) return found;
        }
        return null;
    };
    const bands = findBands(frameData) ?? [];

    const detectorBands = [
        { code: "D1", name: "Band 1", min: 0.75, max: 1.1, color: "var(--color-accent)" },
        { code: "D2", name: "Band 2", min: 1.1, max: 1.6, color: "var(--color-accent)" },
        { code: "D3", name: "Band 3", min: 1.6, max: 2.4, color: "var(--color-accent)" },
        { code: "D4", name: "Band 4", min: 2.4, max: 3.8, color: "var(--color-accent)" },
        { code: "D5", name: "Band 5", min: 3.8, max: 4.4, color: "var(--color-accent)" },
        { code: "D6", name: "Band 6", min: 4.4, max: 5.0, color: "var(--color-accent)" },
    ];

    const sub = (s) => s.replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[d]);

    const getDetectorForWavelength = (w) => {
        const found = detectorBands.find(b => w >= b.min && w <= b.max);
        return found || detectorBands[0];
    };

    return (
        <div className="flex min-h-screen flex-col bg-bg text-text lg:h-screen lg:overflow-hidden">
            <Header />

            <div className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[260px_minmax(0,1fr)]">
                <Sidebar />

                <main className="min-w-0 p-4 lg:overflow-y-auto">
                    <div className="flex flex-col justify-between gap-1 sm:flex-row">
                        <div>
                            <h1 className="text-base">Sky position &amp; spectrum</h1>
                            <p className="text-xs text-muted">RA 133.786245° / Dec -7.244372° · 0.10° field</p>
                        </div>
                        <p className="text-xs text-muted">Sample dates, catalog and measurements</p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
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

                            <div className="relative aspect-square w-full overflow-hidden rounded-sm border border-border bg-surface">
                                {loading ? (
                                    <div className="flex h-full items-center justify-center text-xs text-muted">
                                        Loading sky patch...
                                    </div>
                                ) : (
                                    <img
                                        src={frames[currentIndex]}
                                        alt={`Observation frame ${currentIndex + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                )}

                                <div className="absolute top-[8px] left-[8px] px-2 py-1 pointer-events-none">
                                    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0.5 32V0.5H32" stroke="#D5B6FF" strokeWidth="1.5"/>
                                    </svg>
                                </div>

                                <div className="absolute bottom-[20px] right-[20px] px-2 py-1 pointer-events-none">
                                    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 31.5H31.5V0" stroke="#D5B6FF" strokeWidth="1.5"/>
                                    </svg>
                                </div>
                            </div>

                            <p className="text-xs text-muted">Move over the image for pixel and sky coordinates.</p>

                            <div className="flex items-center justify-between text-xs text-muted">
                                <span>− &nbsp; 100% &nbsp; +</span>
                                <span>Wheel to zoom · Drag to pan</span>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handlePlayToggle}
                                        className="w-10 h-10 p-3 bg-accent hover:bg-accent-hover text-[var(--color-on-accent)] rounded-[var(--radius-panel)] flex items-center justify-center transition cursor-pointer"
                                        aria-label="Play or Stop">
                                        {isPlaying ? (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <rect x="6" y="4" width="4" height="16"/>
                                                <rect x="14" y="4" width="4" height="16"/>
                                            </svg>
                                        ) : (
                                            <svg width="24" height="24" viewBox="0 0 32 35" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M0.729492 4.42729C0.7293 3.7768 0.900767 3.13777 1.22658 2.57473C1.55239 2.01169 2.02102 1.54458 2.58514 1.22055C3.14925 0.896526 3.78889 0.727061 4.43946 0.729269C5.09004 0.731478 5.72851 0.905281 6.29041 1.23313L28.4694 14.1688C29.0291 14.4935 29.4938 14.9594 29.817 15.52C30.1402 16.0806 30.3106 16.7161 30.3111 17.3632C30.3117 18.0102 30.1424 18.6461 29.8202 19.2072C29.498 19.7683 29.0341 20.2351 28.4749 20.5608L6.29041 33.5001C5.72851 33.828 5.09004 34.0018 4.43946 34.004C3.78889 34.0062 3.14925 33.8367 2.58514 33.5127C2.02102 33.1887 1.55239 32.7215 1.22658 32.1585C0.900767 31.5955 0.7293 30.9564 0.729492 30.3059V4.42729Z" strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/>
                                            </svg>
                                        )}
                                    </button>

                                    <button
                                        onClick={handlePrevFrame}
                                        className="w-10 h-10 flex items-center justify-center transition cursor-pointer text-muted hover:text-text rounded-sm hover:bg-raised"
                                        aria-label="Previous frame">
                                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M14.9757 3.57083C15.2286 3.41908 15.5172 3.33717 15.8121 3.33345C16.1071 3.32972 16.3977 3.40433 16.6543 3.54965C16.911 3.69497 17.1245 3.90579 17.273 4.16059C17.4216 4.4154 17.4998 4.70506 17.4998 5V15C17.4998 15.2949 17.4216 15.5846 17.273 15.8394C17.1245 16.0942 16.911 16.305 16.6543 16.4503C16.3977 16.5957 16.1071 16.6703 15.8121 16.6665C15.5172 16.6628 15.2286 16.5809 14.9757 16.4292L6.64484 11.4308C6.39753 11.2831 6.19275 11.0737 6.05047 10.8232C5.90818 10.5727 5.83326 10.2896 5.83301 10.0015C5.83276 9.71345 5.90718 9.43022 6.04903 9.17947C6.19087 8.92872 6.39529 8.71902 6.64234 8.57083L14.9757 3.57083Z" strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/>
                                            <path d="M2.5 16.6666V3.33331" strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/>
                                        </svg>
                                    </button>

                                    <button
                                        onClick={handleNextFrame}
                                        className="w-10 h-10 flex items-center justify-center transition cursor-pointer text-muted hover:text-text rounded-sm hover:bg-raised"
                                        aria-label="Next frame">
                                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17.5 3.33331V16.6666" strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/>
                                            <path d="M5.02417 3.57083C4.77126 3.41908 4.48261 3.33717 4.18769 3.33345C3.89278 3.32972 3.60216 3.40433 3.3455 3.54965C3.08884 3.69497 2.87534 3.90579 2.7268 4.16059C2.57826 4.4154 2.5 4.70506 2.5 5V15C2.5 15.2949 2.57826 15.5846 2.7268 15.8394C2.87534 16.0942 3.08884 16.305 3.3455 16.4503C3.60216 16.5957 3.89278 16.6703 4.18769 16.6665C4.48261 16.6628 4.77126 16.5809 5.02417 16.4292L13.355 11.4308C13.6023 11.2831 13.8071 11.0737 13.9494 10.8232C14.0917 10.5727 14.1666 10.2896 14.1668 10.0015C14.1671 9.71345 14.0927 9.43022 13.9508 9.17947C13.809 8.92872 13.6045 8.71902 13.3575 8.57083L5.02417 3.57083Z" strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/>
                                        </svg>
                                    </button>

                                    <select
                                        defaultValue="100ms"
                                        onChange={handleSpeedChange}
                                        className="bg-bg text-text border border-border h-10 px-3 text-xs rounded-sm focus:outline-none cursor-pointer"
                                    >
                                        <option value="50ms">50ms</option>
                                        <option value="100ms">100ms</option>
                                        <option value="500ms">500ms</option>
                                    </select>
                                </div>

                                <div className="text-right text-xs">
                                    <div className="font-medium text-accent">
                                        Frame {currentIndex + 1} / {totalFrames}
                                    </div>
                                    <div className="text-muted text-[10px]">Observation player</div>
                                </div>
                            </div>

                            <div className="relative flex items-center mt-1">
                                <input
                                    type="range"
                                    min="0"
                                    max={totalFrames > 0 ? totalFrames - 1 : 0}
                                    value={currentIndex}
                                    onChange={(e) => {
                                        setIsPlaying(false);
                                        setCurrentIndex(Number(e.target.value));
                                    }}
                                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none bg-[var(--color-muted)] accent-[var(--color-accent)]"
                                />
                            </div>

                            <div className="flex gap-2 mt-2">
                                {frameData?.epochs ? (
                                    frameData.epochs.map((ep, i) => (
                                        <button
                                            key={ep.label}
                                            onClick={() => {
                                                setIsPlaying(false);
                                                setCurrentIndex(i);
                                            }}
                                            className={`h-10 rounded-sm border px-4 text-xs transition-hover cursor-pointer ${
                                                currentIndex === i ? "border-accent bg-accent/15 text-accent" : "border-border hover:bg-raised text-muted"
                                            }`}
                                        >
                                            {ep.label}
                                        </button>
                                    ))
                                ) : (
                                    <span className="text-xs text-muted">Loading dates...</span>
                                )}
                            </div>
                            <p className="text-xs text-muted">
                                {frameData?.epochs?.[currentIndex]?.date_obs
                                    ? `Observation date · ${frameData.epochs[currentIndex].date_obs}`
                                    : "Demo date · 2025-05-06 02:34 UTC · 6 detector frames"}
                            </p>
                        </section>

                        <section aria-label="Object spectrum" className="min-w-0 rounded-sm border border-border bg-surface p-4 flex flex-col">
                            <div className="flex items-start justify-between gap-2">
                                <h2 className="text-2xl">Object spectrum</h2>
                                <Badge>Illustrative data</Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted">Sparse measurements · Vertical error bars show ± flux_error</p>
                            <p className="mt-1 text-xs text-accent">RA 133.786245° / Dec -7.244372°</p>

                            <div className="mt-3 flex flex-wrap gap-4 text-xs">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hideNoisy}
                                        onChange={(e) => setHideNoisy(e.target.checked)}
                                        className="accent-accent"
                                    />
                                    Hide noisy / defective points
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={connectPoints}
                                        onChange={(e) => setConnectPoints(e.target.checked)}
                                        className="accent-accent"
                                    />
                                    Connect points
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showBands}
                                        onChange={(e) => setShowBands(e.target.checked)}
                                        className="accent-accent"
                                    />
                                    Show molecular bands
                                </label>
                            </div>

                            <div className="relative mt-3 w-full rounded-sm bg-bg border border-border p-2 select-none overflow-hidden">
                                <svg
                                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                                    className="w-full h-auto overflow-visible"
                                >

                                    {/* Полосы поглощения молекул */}
                                    {showBands && bands.map((b, i) => {
                                        const x1 = scaleX(b.range_um[0]);
                                        const x2 = scaleX(b.range_um[1]);
                                        return (
                                            <g key={`${b.molecule}-${i}`}>
                                                <title>{b.label}</title>
                                                <rect x={x1} y={padding.top} width={x2 - x1} height={plotHeight} fill="currentColor" opacity={0.12} />
                                                {/* маленькая скобка над полосой */}
                                                <path
                                                    d={`M ${x1} ${padding.top - 6} V ${padding.top - 12} H ${x2} V ${padding.top - 6}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeOpacity={0.4}
                                                    strokeLinejoin="round"
                                                />
                                                <text x={(x1 + x2) / 2} y={padding.top - 18} textAnchor="middle" className="text-[9px] fill-muted">
                                                    {sub(b.molecule)}
                                                </text>
                                            </g>
                                        );
                                    })}

                                    {/* Горизонтальные линии сетки */}
                                    {[0.25, 0.5, 0.75, 1].map((ratio, i) => {
                                        const yVal = minY + (maxY - minY) * ratio;
                                        const yPos = scaleY(yVal);
                                        return (
                                            <g key={`grid-${i}`}>
                                                <line
                                                    x1={padding.left}
                                                    y1={yPos}
                                                    x2={chartWidth - padding.right}
                                                    y2={yPos}
                                                    stroke="currentColor"
                                                    strokeOpacity={0.08}
                                                />
                                                <text
                                                    x={padding.left - 8}
                                                    y={yPos + 3}
                                                    textAnchor="end"
                                                    className="text-[9px] fill-muted font-mono"
                                                >
                                                    {yVal.toFixed(0)}
                                                </text>
                                            </g>
                                        );
                                    })}

                                    {minY <= 0 && maxY >= 0 && (
                                        <g>
                                            <line
                                                x1={padding.left}
                                                y1={scaleY(0)}
                                                x2={chartWidth - padding.right}
                                                y2={scaleY(0)}
                                                stroke="currentColor"
                                                strokeDasharray="4,4"
                                                strokeOpacity={0.4}
                                            />
                                            <text
                                                x={padding.left - 8}
                                                y={scaleY(0) + 3}
                                                textAnchor="end"
                                                className="text-[9px] fill-accent font-mono font-medium"
                                            >
                                                0 µJy
                                            </text>
                                        </g>
                                    )}

                                    {[0.75, 1.5, 2.5, 3.5, 4.5, 5.0].filter(w => w >= minWavelength && w <= maxWavelength).map((w) => (
                                        <g key={`tick-${w}`}>
                                            <line
                                                x1={scaleX(w)}
                                                y1={padding.top + plotHeight}
                                                x2={scaleX(w)}
                                                y2={padding.top + plotHeight + 4}
                                                stroke="currentColor"
                                                strokeOpacity={0.3}
                                            />
                                            <text
                                                x={scaleX(w)}
                                                y={padding.top + plotHeight + 14}
                                                textAnchor="middle"
                                                className="text-[9px] fill-muted font-mono"
                                            >
                                                {w.toFixed(2)}
                                            </text>
                                        </g>
                                    ))}

                                    <text
                                        x={padding.left + plotWidth / 2}
                                        y={chartHeight - 4}
                                        textAnchor="middle"
                                        className="text-[10px] fill-muted"
                                    >
                                        Wavelength (µm)
                                    </text>

                                    {connectPoints && spectrumPoints.length > 1 && (
                                        <path
                                            d={spectrumPoints.reduce((acc, pt, idx) => {
                                                const x = scaleX(pt.wavelength);
                                                const y = scaleY(pt.flux);
                                                return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
                                            }, "")}
                                            fill="none"
                                            stroke="var(--color-accent)"
                                            strokeWidth="1.5"
                                            strokeOpacity={0.7}
                                        />
                                    )}

                                    {spectrumPoints.map((pt, idx) => {
                                        const cx = scaleX(pt.wavelength);
                                        const cy = scaleY(pt.flux);
                                        const yTop = scaleY(pt.flux + (pt.flux_error || 0));
                                        const yBottom = scaleY(pt.flux - (pt.flux_error || 0));
                                        const detector = getDetectorForWavelength(pt.wavelength);
                                        const isFlagged = pt.is_flagged;

                                        return (
                                            <g
                                                key={`pt-${idx}`}
                                                className="cursor-pointer transition-all hover:opacity-100"
                                                opacity={isFlagged ? 0.35 : 1}
                                                onMouseEnter={() => {
                                                    setHoveredPoint({ ...pt, detector });
                                                }}
                                                onMouseLeave={() => setHoveredPoint(null)}
                                            >
                                                <line
                                                    x1={cx}
                                                    y1={yTop}
                                                    x2={cx}
                                                    y2={yBottom}
                                                    stroke={detector.color}
                                                    strokeWidth="1.2"
                                                />
                                                <line x1={cx - 3} y1={yTop} x2={cx + 3} y2={yTop} stroke={detector.color} strokeWidth="1.2" />
                                                <line x1={cx - 3} y1={yBottom} x2={cx + 3} y2={yBottom} stroke={detector.color} strokeWidth="1.2" />

                                                <circle
                                                    cx={cx}
                                                    cy={cy}
                                                    r={isFlagged ? 3 : 4}
                                                    fill={isFlagged ? "#6b7280" : detector.color}
                                                    stroke="#1e1e24"
                                                    strokeWidth="1"
                                                />

                                                {isFlagged && (
                                                    <text x={cx} y={cy + 3} textAnchor="middle" className="text-[8px] fill-bg font-bold pointer-events-none">×</text>
                                                )}
                                            </g>
                                        );
                                    })}
                                </svg>

                                {hoveredPoint && (
                                    <div
                                        className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 rounded-sm border border-border bg-surface px-3 py-2 text-xs shadow-lg"
                                        style={{ left: '50%', bottom: '40px' }}
                                    >
                                        <div className="font-medium text-accent">
                                            Wavelength: {hoveredPoint.wavelength.toFixed(3)} µm ({hoveredPoint.band || "Band"}, {hoveredPoint.detector?.code || "D1"})
                                        </div>
                                        <div className="mt-1 text-text">
                                            Flux: {hoveredPoint.flux.toFixed(1)} ± {(hoveredPoint.flux_error ?? 0).toFixed(1)} µJy
                                        </div>
                                        <div className="text-muted">
                                            Signal-to-noise ratio: SNR: {(hoveredPoint.snr ?? (hoveredPoint.flux_error ? Math.abs(hoveredPoint.flux / hoveredPoint.flux_error) : 0)).toFixed(2)}
                                        </div>
                                        {hoveredPoint.is_flagged && (
                                            <div className="mt-1 text-rose-400 font-medium">
                                                ⚠ Warning: Point is flagged as noisy / defective (is_flagged: true).
                                            </div>
                                        )}
                                    </div>
                                )}
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