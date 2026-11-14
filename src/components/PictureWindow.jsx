import { useEffect, useState } from 'react';

function PictureWindow() {
    const [frameData, setFrameData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/v1/frames')
            .then((res) => res.json())
            .then((data) => {
                setFrameData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error loading data:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div>Loading data...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>Astronomical Complex (102 strips)</h1>

            {frameData && (
                <div>
                    <p>Stage: <strong>{frameData.stage}</strong></p>
                    <p>Simulation: <strong>{String(frameData.is_simulation)}</strong></p>
                    <p>Total number of frames received: {frameData.frames.length}</p>
                </div>
            )}
        </div>
    );
}

export default PictureWindow;