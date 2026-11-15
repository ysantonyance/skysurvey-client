import { useState, useEffect, useRef, useMemo } from "react";
import { Check } from "lucide-react";
import { Header } from "../components/Header.jsx";
import { Sidebar } from "../components/Sidebar.jsx";
import { Select } from "../components/Select.jsx";

const API = import.meta.env.API_URL || "http://127.0.0.1:8000";

const TABS = ["Science", "IR color", "Difference", "Deep stack", "Noise"];

const CENTER = { ra: 269.4485, dec: 4.7394, fov: 0.1 };

const NOISY_SNR = 1;

// Цвет шумных / дефектных точек
const NOISY_COLOR = "#A49DAF";

// Подписи молекул идут в два ряда, чтобы не налезать друг на друга
const LABEL_ROW = { CH4: 1 };

const PALETTE = ["#E8D9FF", "#D2B0F8", "#B99BEB", "#D29BD2", "#B7A7EE", "#DAB5E7"];

const PRESETS = [
    { label: "WISE 0855", ra: "133.7951", dec: "-7.2451" },
    { label: "248.18 +66.75", ra: "248.1795", dec: "66.7542" },
    { label: "269.45 +4.74", ra: "269.4485", dec: "4.7394" },
];

const DEFAULT_VIEW = {
    gaia: false, motion: false, defect: false, crosshair: true,
    opacity: 50,
    stretch: "asinh", cut: null, softness: 0.1,
    invert: false,
};

const CLASS_LABEL = {
    known_star: "Known star",
    candidate: "Candidate",
    no_detection: "No detection",
    unknown: "Unknown",
};

function Badge({ children }) {
    return (
        <span className="rounded-sm border border-accent/40 bg-accent/15 px-2 py-1 text-xs">{children}</span>
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

function pixelToRaDec(pixelX, pixelY, wcs) {
    const crval1 = Number(wcs.CRVAL1);
    const crval2 = Number(wcs.CRVAL2);
    const crpix1 = Number(wcs.CRPIX1);
    const crpix2 = Number(wcs.CRPIX2);
    const cdelt1 = Number(wcs.CDELT1);
    const cdelt2 = Number(wcs.CDELT2);

    const dx = pixelX + 1.0 - crpix1;
    const dy = pixelY + 1.0 - crpix2;

    const dec = crval2 + dy * cdelt2;
    const cosDec = Math.cos((crval2 * Math.PI) / 180.0) || 1.0;
    const ra = (crval1 + (dx * cdelt1) / cosDec + 360.0) % 360.0;

    return { ra: Number(ra.toFixed(6)), dec: Number(dec.toFixed(6)) };
}

function Home() {
    const [tab, setTab] = useState("Science");

    const [frameData, setFrameData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [intervalMs, setIntervalMs] = useState(100);

    const [hideNoisy, setHideNoisy] = useState(false);
    const [connectPoints, setConnectPoints] = useState(false);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [showBands, setShowBands] = useState(true);

    const [form, setForm] = useState({ ra: "269.4485", dec: "4.7394", fov: "0.10", band: "all" });
    const [query, setQuery] = useState(form);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(null);

    const [view, setView] = useState(DEFAULT_VIEW);
    const [stretched, setStretched] = useState(null);
    const onViewChange = (patch) => setView((v) => ({ ...v, ...patch }));

    const [selected, setSelected] = useState(null);
    const [pointData, setPointData] = useState(null);
    const [pointLoading, setPointLoading] = useState(false);
    const [pointError, setPointError] = useState(false);
    const pointReqRef = useRef(0);

    const raNum = Number(form.ra);
    const decNum = Number(form.dec);
    const errors = {
        ra: form.ra === "" || isNaN(raNum) || raNum < 0 || raNum >= 360 ? "Enter RA from 0° to under 360°." : null,
        dec: form.dec === "" || isNaN(decNum) || decNum < -90 || decNum > 90 ? "Enter Dec from -90° to 90°." : null,
    };
    const canLoad = !errors.ra && !errors.dec && !loading;

    const loadPreset = (p) => {
        const next = { ...form, ra: p.ra, dec: p.dec, fov: "0.10", band: "all" };
        setForm(next);
        setQuery(next);
    };

    useEffect(() => {
        const ctrl = new AbortController();
        let timer;

        setLoading(true);
        setError(null);
        setProgress({ stage: "Contacting archive…", percent: null });

        const run = async () => {
            try {
                const params = new URLSearchParams({ ...query, sync: "false" });
                const res = await fetch(`${API}/api/v1/target?${params}`, { signal: ctrl.signal });
                if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
                const data = await res.json();
                if (ctrl.signal.aborted) return;

                if (data.progress) setProgress(data.progress);

                if (data.status === "failed") throw new Error(data.error || "Processing failed");
                if (data.status === "no_data") throw new Error("No SPHEREx data for this position");

                if (data.status === "ready" || data.status === "partial") {
                    setFrameData(data);
                    setLoading(false);
                }

                if (data.status === "processing" || data.status === "partial") {
                    timer = setTimeout(run, data.poll_after_ms ?? 1500);
                    return;
                }

                setProgress(null);
            } catch (err) {
                if (err.name !== "AbortError") {
                    setError(err.message);
                    setLoading(false);
                    setProgress(null);
                }
            }
        };

        run();
        return () => { ctrl.abort(); clearTimeout(timer); };
    }, [query]);

    useEffect(() => {
        setStretched(null);
        setView((v) => ({ ...v, cut: null }));
        setSelected(null);
        setPointData(null);
        setPointError(false);
        setCurrentIndex(0);
        setIsPlaying(false);
    }, [frameData?.target_key]);

    useEffect(() => {
        if (frameData?.status !== "ready") return;
        const isAuto = view.cut === null && view.stretch === "asinh" && view.softness === 0.1;
        if (isAuto) { setStretched(null); return; }

        const ctrl = new AbortController();
        const t = setTimeout(async () => {
            try {
                const res = await fetch(`${API}/api/v1/target/restretch`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: ctrl.signal,
                    body: JSON.stringify({
                        ra: frameData.ra, dec: frameData.dec, fov: frameData.fov, band: frameData.band,
                        stretch_type: view.stretch,
                        asinh_a: Math.max(view.softness, 0.01),
                        min_cut: view.cut?.[0] ?? null,
                        max_cut: view.cut?.[1] ?? null,
                    }),
                });
                if (!res.ok) throw new Error(`restretch ${res.status}`);
                const json = await res.json();
                const byIndex = {};
                json.epochs.forEach((e) => { byIndex[e.index] = e.image; });
                setStretched(byIndex);
            } catch (e) {
                if (e.name !== "AbortError") console.error(e);
            }
        }, 300);

        return () => { clearTimeout(t); ctrl.abort(); };
    }, [view.stretch, view.cut, view.softness, frameData?.target_key, frameData?.status]);

    const frames = useMemo(
        () => (frameData?.epochs ?? []).map((e) => e.layers?.image).filter(Boolean),
        [frameData]
    );
    const totalFrames = frames.length;
    const epoch = frameData?.epochs?.[currentIndex];
    const layerUrl = {
        "Science": epoch?.layers?.image,
        "IR color": epoch?.layers?.rgb,
        "Difference": frameData?.difference?.diff_image_url,
        "Deep stack": frameData?.difference?.deep_stack_url,
        "Noise": epoch?.layers?.variance,
    }[tab];
    const baseUrl = tab === "Science" && stretched?.[epoch?.index] ? stretched[epoch.index] : layerUrl;
    const preloadedImagesRef = useRef([]);

    const disp = frameData?.display;
    const W = disp?.width ?? 512;
    const H = disp?.height ?? 512;
    const crosshairR = disp ? 10 / disp.pixel_scale_arcsec : 14;
    const gaiaSources = frameData?.crossmatch?.overlay ?? [];
    const cm = frameData?.crossmatch;
    const anomalies = frameData?.difference?.anomalies ?? [];
    const minorPlanets = epoch?.known_minor_planets ?? [];

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

    const handleImageClick = (e) => {
        const display = frameData?.display;
        if (!display?.wcs) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const fx = (e.clientX - rect.left) / rect.width;
        const fy = (e.clientY - rect.top) / rect.height;

        const px = fx * (display.width ?? 512);
        const py = fy * (display.height ?? 512);
        const { ra, dec } = pixelToRaDec(px, py, display.wcs);

        setSelected({ ra, dec, fx, fy });
        setPointLoading(true);
        setPointError(false);

        const reqId = ++pointReqRef.current;
        fetch(`${API}/api/v1/target/spectrum?ra=${ra}&dec=${dec}`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                if (reqId === pointReqRef.current) setPointData(data);
            })
            .catch((err) => {
                console.error('Error loading point spectrum:', err);
                if (reqId === pointReqRef.current) {
                    setPointData(null);
                    setPointError(true);
                }
            })
            .finally(() => {
                if (reqId === pointReqRef.current) setPointLoading(false);
            });
    };

    const rawPoints =
        pointData?.chart_data ??
        frameData?.spectrum_data?.chart_data ??
        frameData?.spectrum?.points ??
        [];

    const rawSpectrum = rawPoints
        .filter((p) => p.flux !== null && p.flux !== undefined)
        .map((p) => {
            const flux_error = p.flux_error ?? p.error ?? 0;
            const snr = p.snr ?? (flux_error ? Math.abs(p.flux / flux_error) : 0);
            return {
                ...p,
                wavelength: p.wavelength_um,
                flux_error,
                snr,
                band: p.band ?? `Band ${p.detector}`,
                is_noisy: p.is_flagged === true || snr < NOISY_SNR,
            };
        });

    const noisyCount = rawSpectrum.filter((p) => p.is_noisy).length;

    const spectrumPoints = rawSpectrum
        .filter((p) => !(hideNoisy && p.is_noisy))
        .sort((a, b) => a.wavelength - b.wavelength);

    const minWavelength = 0.75;
    const maxWavelength = 5.0;
    const chartWidth = 700;
    const chartHeight = 360;
    const padding = { top: 64, right: 16, bottom: 56, left: 64 };
    const plotWidth = chartWidth - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const allFluxes = rawSpectrum.length > 0 ? rawSpectrum.flatMap(p => [p.flux + (p.flux_error ?? 0), p.flux - (p.flux_error ?? 0)]) : [-50, 250];
    const minY = Math.min(0, ...allFluxes) * 1.1;
    const maxY = Math.max(10, ...allFluxes) * 1.1;

    const scaleX = (w) => padding.left + ((w - minWavelength) / (maxWavelength - minWavelength)) * plotWidth;
    const scaleY = (f) => padding.top + plotHeight - ((f - minY) / (maxY - minY)) * plotHeight;

    const niceStep = (range, target = 6) => {
        const raw = range / target;
        const pow = Math.pow(10, Math.floor(Math.log10(raw)));
        const n = raw / pow;
        return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow;
    };
    const yStep = niceStep(maxY - minY);
    const yTicks = [];
    for (let v = Math.ceil(minY / yStep) * yStep; v <= maxY; v += yStep) yTicks.push(Number(v.toFixed(6)));
    const fmtY = (t) => (yStep >= 1 ? String(Math.round(t)) : t.toFixed(2));
    const xTicks = [0.75, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

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

    const sub = (s) => s.replace(/\d/g, (d) => "₀₁₂₃₄₅₆₇₈₉"[d]);

    const bandGroups = (() => {
        const map = new Map();
        rawSpectrum.forEach((p) => {
            if (!map.has(p.band)) map.set(p.band, []);
            map.get(p.band).push(p);
        });
        return [...map.entries()]
            .map(([name, pts], i) => {
                const ws = pts.map((p) => p.wavelength);
                const det = pts[0].detector;
                return {
                    name,
                    code: det != null ? `D${det}` : "",
                    color: PALETTE[(det != null ? Number(det) - 1 : i) % PALETTE.length],
                    count: pts.length,
                    noisy: pts.filter((p) => p.is_noisy).length,
                    wMin: Math.min(...ws),
                    wMax: Math.max(...ws),
                };
            })
            .sort((a, b) => a.wMin - b.wMin);
    })();
    const bandColor = Object.fromEntries(bandGroups.map((g) => [g.name, g.color]));

    const shownRa = Number(selected?.ra ?? frameData?.ra ?? CENTER.ra).toFixed(6);
    const shownDec = Number(selected?.dec ?? frameData?.dec ?? CENTER.dec).toFixed(6);
    const shownFov = Number(frameData?.fov ?? CENTER.fov).toFixed(2);

    return (
        <div className="flex min-h-screen flex-col bg-bg text-text lg:h-screen lg:overflow-hidden">
            <Header />

            <div className="grid flex-1 grid-cols-1 lg:min-h-0 lg:grid-cols-[260px_minmax(0,1fr)]">
                <Sidebar
                    form={form}
                    onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
                    errors={errors}
                    canLoad={canLoad}
                    loading={loading}
                    progress={progress}
                    onLoad={() => setQuery({ ...form })}
                    presets={PRESETS}
                    onPreset={loadPreset}
                    view={view}
                    onViewChange={onViewChange}
                    dataRange={frameData?.display?.data_range}
                    autoCut={frameData?.display ? [frameData.display.stretch.vmin, frameData.display.stretch.vmax] : null}
                />

                <main className="min-w-0 p-4 lg:overflow-y-auto">
                    <div className="flex flex-col justify-between gap-1 sm:flex-row">
                        <div>
                            <h1 className="text-base">Sky position &amp; spectrum</h1>
                            <p className="text-xs text-muted">RA {shownRa}° / Dec {shownDec}° · {shownFov}° field</p>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] items-start">
                        <section aria-label="Sky image" className="flex min-w-0 flex-col gap-3">
                            <div className="rounded-sm border border-accent/40 bg-accent/15 p-3 text-xs">
                                {cm ? (
                                    <>
                                        <p>{CLASS_LABEL[cm.classification] ?? cm.classification} · {cm.reason}</p>
                                        <p className="mt-2 text-muted">
                                            IR signal · {cm.spherex_snr != null ? `SNR ${cm.spherex_snr.toFixed(1)}σ` : "SNR n/a"}
                                            {cm.wise_match?.w1_w2_color != null && ` · W1−W2 ${cm.wise_match.w1_w2_color.toFixed(2)} mag`}
                                        </p>
                                    </>
                                ) : (
                                    <p className="text-muted">Loading catalog match…</p>
                                )}
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

                            {error && <p className="text-xs text-error">Backend error: {error}</p>}

                            <div
                                onClick={handleImageClick}
                                className="relative aspect-square w-full overflow-hidden rounded-sm border border-border bg-surface cursor-crosshair"
                            >
                                {loading ? (
                                    <div className="flex h-full items-center justify-center text-xs text-muted">
                                        Loading sky patch...
                                    </div>
                                ) : (
                                    baseUrl ? (
                                        <>
                                            <img
                                                src={baseUrl}
                                                alt={`${tab}, frame ${currentIndex + 1}`}
                                                className="h-full w-full object-cover"
                                                style={{ filter: view.invert ? "invert(1)" : "none" }}
                                            />

                                            {view.defect && epoch?.layers?.flags && (
                                                <img
                                                    src={epoch.layers.flags}
                                                    alt="Defect mask"
                                                    className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                                                    style={{ opacity: view.opacity / 100 }}
                                                />
                                            )}

                                            <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 h-full w-full">
                                                {view.gaia && gaiaSources.map((s) => (
                                                    <circle key={s.source_id} cx={s.x} cy={s.y} r="7" fill="none"
                                                            stroke="#8FDADA" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                                                ))}

                                                {view.motion && (
                                                    <>
                                                        {anomalies.map((a, i) => (
                                                            <g key={i} stroke="#E7C58B" fill="none" strokeWidth="1.5" vectorEffect="non-scaling-stroke">
                                                                {a.x_from != null && <line x1={a.x_from} y1={a.y_from} x2={a.x} y2={a.y} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />}
                                                                <circle cx={a.x} cy={a.y} r="9" vectorEffect="non-scaling-stroke" />
                                                            </g>
                                                        ))}
                                                        {minorPlanets.map((m, i) => (
                                                            <g key={i}>
                                                                <rect x={m.x - 5} y={m.y - 5} width="10" height="10" fill="none" stroke="#F0A5B4" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                                                                <text x={m.x + 9} y={m.y + 4} fill="#F0A5B4" fontSize="11">{m.name}</text>
                                                            </g>
                                                        ))}
                                                    </>
                                                )}

                                                {view.crosshair && (
                                                    <g stroke="#D5B6FF" fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke">
                                                        <circle cx={W / 2} cy={H / 2} r={crosshairR} vectorEffect="non-scaling-stroke" />
                                                        <line x1={W / 2 - crosshairR - 6} y1={H / 2} x2={W / 2 + crosshairR + 6} y2={H / 2} vectorEffect="non-scaling-stroke" />
                                                        <line x1={W / 2} y1={H / 2 - crosshairR - 6} x2={W / 2} y2={H / 2 + crosshairR + 6} vectorEffect="non-scaling-stroke" />
                                                    </g>
                                                )}
                                            </svg>
                                        </>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-xs text-muted">No data for «{tab}»</div>
                                    )
                                )}

                                <div className="absolute top-2 left-2 px-2 py-1 pointer-events-none">
                                    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0.5 32V0.5H32" stroke="#D5B6FF" strokeWidth="1.5"/>
                                    </svg>
                                </div>

                                <div className="absolute bottom-5 right-5 px-2 py-1 pointer-events-none">
                                    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 31.5H31.5V0" stroke="#D5B6FF" strokeWidth="1.5"/>
                                    </svg>
                                </div>

                                {selected && (
                                    <div
                                        className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 h-4 w-4 rounded-full border border-accent"
                                        style={{ left: `${selected.fx * 100}%`, top: `${selected.fy * 100}%` }}
                                    />
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handlePlayToggle}
                                        className="w-10 h-10 p-3 bg-accent hover:bg-accent-hover text-(--color-on-accent) rounded-(--radius-panel) flex items-center justify-center transition cursor-pointer"
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

                                    <Select
                                        ariaLabel="Playback speed"
                                        className="w-24"
                                        value={String(intervalMs)}
                                        onValueChange={(v) => setIntervalMs(Number(v))}
                                        options={[
                                            { value: "50",  label: "50 ms" },
                                            { value: "100", label: "100 ms" },
                                            { value: "500", label: "500 ms" },
                                        ]}
                                    />
                                </div>

                                <div className="text-right text-xs">
                                    <div className="font-medium text-accent">
                                        Frame {totalFrames ? currentIndex + 1 : 0} / {totalFrames}
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
                                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none bg-(--color-muted) accent-(--color-accent)"
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

                        {/* Блок спектра со свойством self-start, чтобы он не растягивался на всю высоту родителя */}
                        <section aria-label="Object spectrum" className="min-w-0 rounded-sm border border-border bg-surface p-4 flex flex-col self-start">
                            <div className="flex items-start justify-between gap-2">
                                <h2 className="text-2xl">Object spectrum</h2>
                            </div>
                            <p className="mt-2 text-xs text-muted">Sparse measurements · Vertical error bars show ± flux_error</p>
                            <p className="mt-2 text-xs text-accent">RA {shownRa}° / Dec {shownDec}°</p>
                            {pointError && (
                                <p className="mt-1 text-xs text-error">
                                    Could not load spectrum for this position. Showing the field center instead.
                                </p>
                            )}

                            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                                <Checkbox
                                    label={<>Hide noisy / defective points <span className="text-muted">({noisyCount})</span></>}
                                    checked={hideNoisy}
                                    onChange={(e) => setHideNoisy(e.target.checked)}
                                />
                                <Checkbox
                                    label={<>Show molecular bands <span className="text-muted">({bands.length})</span></>}
                                    checked={showBands}
                                    onChange={(e) => setShowBands(e.target.checked)}
                                />
                                <Checkbox
                                    label="Connect points"
                                    checked={connectPoints}
                                    onChange={(e) => setConnectPoints(e.target.checked)}
                                />
                            </div>

                            <div className={`relative mt-4 w-full select-none ${pointLoading ? "opacity-50" : ""}`}>
                                <svg
                                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                                    className="w-full h-auto overflow-visible"
                                >
                                    <rect x={padding.left} y={padding.top} width={plotWidth} height={plotHeight} className="fill-bg" />

                                    {showBands && bands.map((b, i) => {
                                        const x1 = scaleX(b.range_um[0]);
                                        const x2 = scaleX(b.range_um[1]);
                                        const row = LABEL_ROW[b.molecule] ?? 0;
                                        return (
                                            <g key={`${b.molecule}-${i}`}>
                                                <title>{b.label}</title>
                                                <rect x={x1} y={padding.top} width={x2 - x1} height={plotHeight} fill="currentColor" opacity={0.12} />
                                                <path
                                                    d={`M ${x1} ${padding.top - 4} V ${padding.top - 10} H ${x2} V ${padding.top - 4}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeOpacity={0.4}
                                                    strokeLinejoin="round"
                                                />
                                                <text
                                                    x={(x1 + x2) / 2}
                                                    y={padding.top - (row === 1 ? 17 : 30)}
                                                    textAnchor="middle"
                                                    className="text-[9px] fill-muted"
                                                >
                                                    {sub(b.molecule)}
                                                </text>
                                            </g>
                                        );
                                    })}

                                    {yTicks.map((t) => (
                                        <g key={`grid-${t}`}>
                                            <line
                                                x1={padding.left}
                                                y1={scaleY(t)}
                                                x2={chartWidth - padding.right}
                                                y2={scaleY(t)}
                                                stroke="currentColor"
                                                strokeOpacity={0.08}
                                            />
                                            <text
                                                x={padding.left + 8}
                                                y={scaleY(t) + 3}
                                                textAnchor="end"
                                                className={`text-[9px] font-mono ${t === 0 ? "fill-text" : "fill-muted"}`}
                                            >
                                                {t === 0 ? "0 µJy" : fmtY(t)}
                                            </text>
                                        </g>
                                    ))}

                                    {minY <= 0 && maxY >= 0 && (
                                        <line
                                            x1={padding.left}
                                            y1={scaleY(0)}
                                            x2={chartWidth - padding.right}
                                            y2={scaleY(0)}
                                            stroke="currentColor"
                                            strokeDasharray="4,4"
                                            strokeOpacity={0.7}
                                        />
                                    )}

                                    {xTicks.map((w) => (
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
                                                y={padding.top + plotHeight + 16}
                                                textAnchor="middle"
                                                className="text-[9px] fill-muted font-mono"
                                            >
                                                {w === 0.75 ? "0.75" : w.toFixed(1)}
                                            </text>
                                        </g>
                                    ))}

                                    <text
                                        x={padding.left + plotWidth / 2}
                                        y={chartHeight - 6}
                                        textAnchor="middle"
                                        className="text-[10px] fill-muted"
                                    >
                                        Wavelength, µm
                                    </text>
                                    <text
                                        transform={`translate(12 ${padding.top + plotHeight / 2}) rotate(-90)`}
                                        textAnchor="middle"
                                        className="text-[10px] fill-muted"
                                    >
                                        Flux, µJy
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
                                        const detector = { code: pt.detector != null ? `D${pt.detector}` : "" };
                                        const bandCol = bandColor[pt.band] ?? PALETTE[0];
                                        const isFlagged = pt.is_noisy;
                                        const color = isFlagged ? NOISY_COLOR : bandCol;

                                        return (
                                            <g
                                                key={`pt-${idx}`}
                                                className="cursor-pointer"
                                                onMouseEnter={() => {
                                                    setHoveredPoint({ ...pt, detector });
                                                }}
                                                onMouseLeave={() => setHoveredPoint(null)}
                                            >
                                                <g stroke={color} strokeOpacity={0.6} strokeWidth="1">
                                                    <line x1={cx} y1={yTop} x2={cx} y2={yBottom} />
                                                    <line x1={cx - 3} y1={yTop} x2={cx + 3} y2={yTop} />
                                                    <line x1={cx - 3} y1={yBottom} x2={cx + 3} y2={yBottom} />
                                                </g>

                                                {isFlagged ? (
                                                    <>
                                                        <circle
                                                            cx={cx}
                                                            cy={cy}
                                                            r={4}
                                                            fill="none"
                                                            stroke={NOISY_COLOR}
                                                            strokeWidth="1"
                                                            pointerEvents="all"
                                                        />
                                                        <line
                                                            x1={cx - 6}
                                                            y1={cy + 6}
                                                            x2={cx + 6}
                                                            y2={cy - 6}
                                                            stroke={NOISY_COLOR}
                                                            strokeWidth="1"
                                                            strokeLinecap="round"
                                                            className="pointer-events-none"
                                                        />
                                                    </>
                                                ) : (
                                                    <circle cx={cx} cy={cy} r={4} fill={bandCol} />
                                                )}
                                            </g>
                                        );
                                    })}
                                </svg>

                                {hoveredPoint && (
                                    <div
                                        className="absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-full mb-2 rounded-sm border border-border bg-surface px-3 py-2 text-xs shadow-lg"
                                        style={{ left: '50%', bottom: '56px' }}
                                    >
                                        <div className="font-medium text-accent">
                                            Wavelength: {hoveredPoint.wavelength.toFixed(3)} µm ({hoveredPoint.band}{hoveredPoint.detector?.code ? `, ${hoveredPoint.detector.code}` : ""})
                                        </div>
                                        <div className="mt-1 text-text">
                                            Flux: {hoveredPoint.flux.toFixed(1)} ± {(hoveredPoint.flux_error ?? 0).toFixed(1)} µJy
                                        </div>
                                        <div className="text-muted">
                                            Signal-to-noise ratio: SNR: {(hoveredPoint.snr ?? 0).toFixed(2)}
                                        </div>
                                        {hoveredPoint.is_noisy && (
                                            <div className="mt-1 text-rose-400 font-medium">
                                                ⚠ Warning: {hoveredPoint.is_flagged
                                                ? "point is flagged as noisy / defective (is_flagged: true)."
                                                : `low signal-to-noise (SNR < ${NOISY_SNR}), large uncertainty.`}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 border-t border-border pt-4">
                                {bandGroups.length > 0 ? (
                                    <ul className="grid grid-cols-2 gap-x-3 gap-y-4 text-xs text-muted sm:grid-cols-3">
                                        {bandGroups.map((b) => (
                                            <li
                                                key={b.name}
                                                className="flex items-start gap-2"
                                                title={`${b.count} points${b.noisy ? `, ${b.noisy} noisy / defective` : ""}`}
                                            >
                                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: b.color }} />
                                                <div>
                                                    <div className="text-text">{b.name}</div>
                                                    <div className="mt-1">{b.wMin.toFixed(2)}–{b.wMax.toFixed(2)} µm{b.code ? ` · ${b.code}` : ""}</div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-muted">No measured bands for this pixel.</p>
                                )}

                                <div className="mt-5 flex items-center justify-between gap-3 text-xs text-muted">
                                    <span className="flex items-center gap-2">
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                                            <circle cx="7" cy="7" r="4" stroke={NOISY_COLOR} strokeWidth="1" />
                                            <line x1="2" y1="12" x2="12" y2="2" stroke={NOISY_COLOR} strokeWidth="1" strokeLinecap="round" />
                                        </svg>
                                        Flagged measurement
                                    </span>
                                    <span className="text-right">Molecular regions are reference intervals, not detections.</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Home;