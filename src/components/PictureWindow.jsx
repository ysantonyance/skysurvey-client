import { useEffect, useState, useRef } from 'react';

function PictureWindow({ imageUrl }) {
    const [frameData, setFrameData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [intervalMs, setIntervalMs] = useState(100);

    const frames = frameData?.epochs?.map(
        (epoch) => epoch.layers?.image
    ).filter(Boolean) || [];

    const totalFrames = frames.length;
    const preloadedImagesRef = useRef([]);

    useEffect(() => {
        const ra = 133.7951;
        const dec = -7.2451;
        const fov = 0.1;

        setLoading(true);
        fetch(`http://127.0.0.1:8000/api/v1/target?ra=269.4485&dec=4.7394&fov=0.1&band=all`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`Ошибка HTTP: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                console.log("Данные от бэка получены:", data);
                setFrameData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Ошибка при получении данных от бэка:', err);
                setLoading(false);
            });
    }, []);

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

    if (loading) {
        return (
            <div className="bg-[var(--color-background)] text-[var(--color-muted)] font-[family-name:var(--font-body)] min-h-screen flex items-center justify-center">
                Loading data...
            </div>
        );
    }

    return (
        <div className="bg-[var(--color-background)] text-[var(--color-foreground)] font-[family-name:var(--font-body)] min-h-screen p-8 flex flex-col items-center">

            <div className="w-[620px] flex items-center justify-between mb-4">
                <div className="flex flex-col gap-0.5">
                    <span className="text-lg text-[var(--color-foreground)]">Current sky patch</span>
                    <span className="text-xs text-[var(--color-muted)] flex items-center gap-2">
                        <span>RA 133.786245° / Dec -7.244372°</span>
                        <svg width="3" height="3" viewBox="0 0 3 3" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                            <circle cx="1.5" cy="1.5" r="1.5" fill="#ACA3B7"/>
                        </svg>
                        <span>176° field</span>
                    </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_60_17051)">
                            <path d="M14.6663 8.00004C14.6663 11.6819 11.6816 14.6667 7.99967 14.6667C4.31778 14.6667 1.33301 11.6819 1.33301 8.00004C1.33301 4.31814 4.31778 1.33337 7.99967 1.33337C11.6816 1.33337 14.6663 4.31814 14.6663 8.00004Z" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" stroke="#BAACCB"/>
                            <path d="M8 10.6667V8" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" stroke="#BAACCB"/>
                            <path d="M8 5.33337H8.00667" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" stroke="#BAACCB"/>
                        </g>
                        <defs>
                            <clipPath id="clip0_60_17051">
                                <rect width="16" height="16" fill="white"/>
                            </clipPath>
                        </defs>
                    </svg>
                    <span>Simulated images</span>
                </div>
            </div>

            <div className="relative w-[620px] h-[620px] bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden shadow-sm">
                <img
                    src={frames[currentIndex]}
                    alt={`Observation frame ${currentIndex + 1}`}
                    className="w-full h-full object-cover"
                />

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

            <div className="w-[620px] flex items-center justify-between text-xs mt-3 text-[var(--color-accent)]">
                <div className="flex items-center gap-2">
                    <span className="text-[var(--color-muted)]">SPHEREx design preview</span>
                    <svg width="3" height="3" viewBox="0 0 3 3" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                        <circle cx="1.5" cy="1.5" r="1.5" fill="#AD96C5"/>
                    </svg>
                    <span className="text-[var(--color-muted)]">Band 3</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--color-muted)]">
                    <span>North up</span>
                    <svg width="3" height="3" viewBox="0 0 3 3" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                        <circle cx="1.5" cy="1.5" r="1.5" fill="#ACA3B7"/>
                    </svg>
                    <span>East left</span>
                    <svg width="3" height="3" viewBox="0 0 3 3" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                        <circle cx="1.5" cy="1.5" r="1.5" fill="#ACA3B7"/>
                    </svg>
                    <span>Illustrative alignment</span>
                </div>
            </div>

            <div className="w-[620px] flex items-center justify-between mt-6">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePlayToggle}
                        className="w-[var(--spacing-target)] h-[var(--spacing-target)] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-[var(--radius-control)] flex items-center justify-center transition cursor-pointer"
                        aria-label="Play or Stop">
                        {isPlaying ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#170D26"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                        ) : (
                            <svg width="15" height="17" viewBox="0 0 15 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0.729492 2.39635C0.729405 2.10309 0.806697 1.815 0.953562 1.56117C1.10043 1.30734 1.31167 1.09676 1.56595 0.950678C1.82024 0.8046 2.10856 0.728201 2.40182 0.729197C2.69507 0.730192 2.98287 0.808546 3.23616 0.956348L13.2337 6.78801C13.486 6.93441 13.6954 7.14447 13.8411 7.39718C13.9868 7.6499 14.0636 7.93643 14.0639 8.22813C14.0641 8.51983 13.9878 8.80649 13.8426 9.05946C13.6973 9.31243 13.4882 9.52284 13.2362 9.66968L3.23616 15.503C2.98287 15.6508 2.69507 15.7292 2.40182 15.7302C2.10856 15.7312 1.82024 15.6548 1.56595 15.5087C1.31167 15.3626 1.10043 15.152 0.953562 14.8982C0.806697 14.6444 0.729405 14.3563 0.729492 14.063V2.39635Z" fill="#170D26"/>
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={handlePrevFrame}
                        className="w-[var(--spacing-target)] h-[var(--spacing-target)] flex items-center justify-center transition cursor-pointer text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                        aria-label="Previous frame">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.9757 3.57083C15.2286 3.41908 15.5172 3.33717 15.8121 3.33345C16.1071 3.32972 16.3977 3.40433 16.6543 3.54965C16.911 3.69497 17.1245 3.90579 17.273 4.16059C17.4216 4.4154 17.4998 4.70506 17.4998 5V15C17.4998 15.2949 17.4216 15.5846 17.273 15.8394C17.1245 16.0942 16.911 16.305 16.6543 16.4503C16.3977 16.5957 16.1071 16.6703 15.8121 16.6665C15.5172 16.6628 15.2286 16.5809 14.9757 16.4292L6.64484 11.4308C6.39753 11.2831 6.19275 11.0737 6.05047 10.8232C5.90818 10.5727 5.83326 10.2896 5.83301 10.0015C5.83276 9.71345 5.90718 9.43022 6.04903 9.17947C6.19087 8.92872 6.39529 8.71902 6.64234 8.57083L14.9757 3.57083Z" strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/>
                            <path d="M2.5 16.6666V3.33331" strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/>
                        </svg>
                    </button>

                    <button
                        onClick={handleNextFrame}
                        className="w-[var(--spacing-target)] h-[var(--spacing-target)] flex items-center justify-center transition cursor-pointer text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                        aria-label="Next frame">
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.5 3.33331V16.6666" strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/>
                            <path d="M5.02417 3.57083C4.77126 3.41908 4.48261 3.33717 4.18769 3.33345C3.89278 3.32972 3.60216 3.40433 3.3455 3.54965C3.08884 3.69497 2.87534 3.90579 2.7268 4.16059C2.57826 4.4154 2.5 4.70506 2.5 5V15C2.5 15.2949 2.57826 15.5846 2.7268 15.8394C2.87534 16.0942 3.08884 16.305 3.3455 16.4503C3.60216 16.5957 3.89278 16.6703 4.18769 16.6665C4.48261 16.6628 4.77126 16.5809 5.02417 16.4292L13.355 11.4308C13.6023 11.2831 13.8071 11.0737 13.9494 10.8232C14.0917 10.5727 14.1666 10.2896 14.1668 10.0015C14.1671 9.71345 14.0927 9.43022 13.9508 9.17947C13.809 8.92872 13.6045 8.71902 13.3575 8.57083L5.02417 3.57083Z" strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"/>
                        </svg>
                    </button>

                    <select
                        onChange={handleSpeedChange}
                        className="bg-[var(--color-background)] text-[var(--color-foreground)] border border-[var(--color-border)] h-[var(--spacing-target)] px-3 text-sm focus:outline-none focus:ring-[var(--color-focus)] cursor-pointer">
                        <option value="50ms">50ms</option>
                        <option value="100ms">100ms</option>
                        <option value="500ms">500ms</option>
                    </select>
                </div>

                <div className="text-right text-sm">
                    <div className="text-sm font-medium text-[var(--color-accent)]">
                        Demo observation {currentIndex + 1} / {totalFrames}
                    </div>
                    <div className="text-[var(--color-muted)] text-xs">Observation date unavailable in demo</div>
                </div>
            </div>

            <div className="w-[620px] mt-6">
                <div className="relative flex items-center">
                    <input
                        type="range"
                        min="0"
                        max={totalFrames - 1}
                        value={currentIndex}
                        onChange={(e) => {
                            setIsPlaying(false);
                            setCurrentIndex(Number(e.target.value));
                        }}
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none"
                        style={{
                            background: '#78668D',
                            accentColor: '#D5B6FF'
                        }}
                    />
                </div>
            </div>

            <div className="w-[620px] flex justify-between items-center mt-3 text-sm text-[var(--color-muted)]">
                <span>First observation</span>
                <span>Loop playback</span>
                <span>Latest observation</span>
            </div>

            <hr className="w-[620px] border-[var(--color-border)] my-6"/>

            <div className="w-[620px] flex justify-between items-center text-xs text-[var(--color-muted)]">
                <span className="text-[var(--color-muted)]">Look for a point that shifts between frames.</span>
                <div className="flex items-center gap-2">
                    <span>Skypatch</span>
                    <svg width="3" height="3" viewBox="0 0 3 3" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                        <circle cx="1.5" cy="1.5" r="1.5" fill="#AD96C5"/>
                    </svg>
                    <span>Infrared sky explorer</span>
                </div>
            </div>

        </div>
    );
}

export default PictureWindow;