'use client';

import { useEffect } from 'react';
import NotificationBanner from './NotificationBanner';

export default function PWAProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Register service worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((registration) => {
                        console.log('SW registered:', registration.scope);
                    })
                    .catch((error) => {
                        console.log('SW registration failed:', error);
                    });
            });
        }
    }, []);

    return (
        <>
            {children}
            <NotificationBanner />
        </>
    );
}
