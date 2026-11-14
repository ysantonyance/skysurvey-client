import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import App from './App.jsx';

async function enableMocking() {
    if (import.meta.env.VITE_USE_MOCK !== 'true') {
        return;
    }
    try {
        const { worker } = await import('./mocks/browser');
        await worker.start({ onUnhandledRequest: 'bypass' });
    } catch (err) {
        console.warn('MSW не запустився:', err);
    }
}

enableMocking().finally(() => {
    createRoot(document.getElementById('root')).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
    );
});