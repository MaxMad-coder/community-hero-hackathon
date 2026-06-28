import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Cleanly capture and prevent generic third-party or CDN "Script error." logs
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    const msg = String(event.message || "");
    if (msg === "Script error." || msg.toLowerCase().includes("script error") || msg.toLowerCase().includes("leaflet")) {
      event.preventDefault();
      event.stopPropagation();
      console.log("[Info Filter] Suppressed cross-origin or leaflet script warning.");
    }
  }, true);

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = String((reason && (reason.message || reason)) || "");
    if (msg === "Script error." || msg.toLowerCase().includes("script error") || msg.toLowerCase().includes("leaflet")) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

