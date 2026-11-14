import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export function useSkyTarget(initialParams) {
    const [params, setParams] = useState(initialParams); // застосовані параметри
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const ctrl = new AbortController();
        let timer;

        const run = async () => {
            try {
                const q = new URLSearchParams({
                    ra: params.ra, dec: params.dec, fov: params.fov, band: params.band,
                });
                const res = await fetch(`${API}/api/v1/target?${q}`, { signal: ctrl.signal });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                setData(json);
                if (json.status !== "ready" && json.poll_after_ms) {
                    timer = setTimeout(run, json.poll_after_ms); // бекенд ще рахує
                } else {
                    setLoading(false);
                }
            } catch (e) {
                if (e.name !== "AbortError") { setError(e.message); setLoading(false); }
            }
        };

        setLoading(true);
        setError(null);
        run();
        return () => { ctrl.abort(); clearTimeout(timer); };
    }, [params]);

    return { data, loading, error, load: setParams };
}