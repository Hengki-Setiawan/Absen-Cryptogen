'use client';

import { useEffect, useState } from 'react';
import { Bell, BellRing, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationBanner() {
    const { permission, requestPermission, checkUpcomingClass } = useNotifications();
    const [showBanner, setShowBanner] = useState(false);
    const [upcomingClass, setUpcomingClass] = useState<any>(null);

    useEffect(() => {
        // Check if user has already dismissed the banner or granted permission
        const dismissed = localStorage.getItem('notification-banner-dismissed');
        if (dismissed === 'true' || permission === 'granted') {
            setShowBanner(false);
            return;
        }
        // Show banner only if permission is 'default' (not yet asked)
        if (permission === 'default') {
            setShowBanner(true);
        }
    }, [permission]);

    useEffect(() => {
        // Check for upcoming class on mount
        const upcoming = checkUpcomingClass();
        if (upcoming) {
            setUpcomingClass(upcoming);
        }
    }, [checkUpcomingClass]);

    const handleEnableNotifications = async () => {
        const granted = await requestPermission();
        if (granted) {
            // User enabled notifications, remember this
            localStorage.setItem('notification-banner-dismissed', 'true');
            setShowBanner(false);
        }
    };

    const handleDismiss = () => {
        // User clicked "Nanti", remember this so we don't ask again
        localStorage.setItem('notification-banner-dismissed', 'true');
        setShowBanner(false);
    };

    if (!showBanner && !upcomingClass) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            {/* Permission Request Banner */}
            {showBanner && permission === 'default' && (
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl shadow-lg flex items-start gap-3">
                    <Bell className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="font-bold text-sm">Aktifkan Notifikasi</h4>
                        <p className="text-xs opacity-90 mt-1">Dapatkan pengingat sebelum kelas dimulai.</p>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleEnableNotifications}
                                className="px-3 py-1 bg-white text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50"
                            >
                                Aktifkan
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-3 py-1 bg-white/20 text-white text-xs rounded-lg hover:bg-white/30"
                            >
                                Nanti
                            </button>
                        </div>
                    </div>
                    <button onClick={handleDismiss}>
                        <X className="w-4 h-4 opacity-70 hover:opacity-100" />
                    </button>
                </div>
            )}

            {/* Upcoming Class Alert */}
            {upcomingClass && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-xl shadow-lg mt-3 flex items-start gap-3 animate-pulse">
                    <BellRing className="w-6 h-6 flex-shrink-0" />
                    <div className="flex-1">
                        <h4 className="font-bold text-sm">📚 {upcomingClass.course}</h4>
                        <p className="text-xs opacity-90 mt-1">
                            Dimulai pukul {upcomingClass.time} di {upcomingClass.room}
                        </p>
                    </div>
                    <button onClick={() => setUpcomingClass(null)}>
                        <X className="w-4 h-4 opacity-70 hover:opacity-100" />
                    </button>
                </div>
            )}
        </div>
    );
}
