import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'
import App from "./App.jsx";

async function enableMocking() {
    if (import.meta.env.VITE_USE_MOCK !== 'true') {
        return;
    }
    const { worker } = await import('./mocks/browser');
    return worker.start();
}

enableMocking().then(() => {
    createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
});
