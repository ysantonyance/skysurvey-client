import { http, HttpResponse } from 'msw';

const generateFramesData = () => {
    const frames = Array.from({ length: 102 }, (_, index) => {
        const stripNum = index + 1;
        const formattedId = `fr_${String(stripNum).padStart(3, '0')}`;

        return {
            frame_id: formattedId,
            strip_number: stripNum,
            date: stripNum % 3 === 0 ? null : "2026-06-06T12:00:00Z",
            image_url: `https://via.placeholder.com/300?text=Strip+${stripNum}`
        };
    });

    return {
        status: "success",
        stage: "main",
        is_simulation: true,
        center_icrs: {
            ra: 185.235,
            dec: 12.129,
            unit: "deg"
        },
        strip_range: [1, 102],
        frames: frames,
        missing_frames: ["fr_015", "fr_016"]
    };
};

export const handlers = [
    http.get('/api/v1/frames', () => {
        return HttpResponse.json(generateFramesData());
    }),

    http.post('/api/v1/frames/retry', async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
            status: "retry_initiated",
            received_missing: body.missing_frames,
            message: "Successfully queued missing frames for reload."
        });
    }),
];