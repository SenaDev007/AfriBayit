'use client';

import { useEffect } from 'react';

/**
 * PWA Service Worker Registration
 * Registers the service worker from /sw.js for offline support.
 */
export default function PWARegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Every hour

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'activated' &&
                navigator.serviceWorker.controller
              ) {
                // New service worker activated — could show update notification
                console.info('[PWA] Service worker updated');
              }
            });
          }
        });

        console.info('[PWA] Service worker registered');
      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
      }
    };

    // Register after page load for better performance
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, []);

  return null;
}
