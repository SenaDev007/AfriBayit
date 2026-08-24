// AfriBayit — Service Worker Registration (CDC §3.1.6 — PWA)
//
// Registers `/sw.js` in production only, and surfaces `updatefound` /
// `controllerchange` events to the rest of the app via window CustomEvents
// so the UI can prompt the user to refresh.

'use client';

import { useEffect } from 'react';

const UPDATE_FOUND_EVENT = 'afribayit:sw-update-found';
const CONTROLLER_CHANGED_EVENT = 'afribayit:sw-controller-change';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    // Only register in production — dev mode pollutes the console with
    // HMR conflicts and the SW would cache stale dev assets.
    if (process.env.NODE_ENV !== 'production') return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          window.dispatchEvent(new CustomEvent(UPDATE_FOUND_EVENT, {
            detail: { registration },
          }));

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // A new SW has finished installing and is waiting to activate.
              window.dispatchEvent(new CustomEvent(CONTROLLER_CHANGED_EVENT, {
                detail: { registration, waitingWorker: newWorker },
              }));
            }
          });
        });

        // Listen for controller changes (the new SW took over).
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.dispatchEvent(new CustomEvent(CONTROLLER_CHANGED_EVENT, {
            detail: { controllerChanged: true },
          }));
        });

        // Periodically check for updates (every 60 min).
        const interval = setInterval(() => {
          registration.update().catch(() => {
            /* ignore — network may be offline */
          });
        }, 60 * 60 * 1000);

        return () => clearInterval(interval);
      } catch (err) {
        console.warn('[ServiceWorkerRegistration] Registration failed:', err);
      }
    };

    // Register only after window load to avoid competing with first paint.
    if (document.readyState === 'complete') {
      void register();
    } else {
      window.addEventListener('load', () => void register(), { once: true });
    }
  }, []);

  return null;
}
