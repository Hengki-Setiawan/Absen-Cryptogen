'use client';

import { useEffect, useState, useCallback } from 'react';

type Schedule = {
    id: string;
    course: string;
    day: string;
    startTime: string;
    endTime: string;
    room: string;
    type: string;
};

const dayMap: { [key: string]: number } = {
    'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6
};

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [schedules, setSchedules] = useState<Schedule[]>([]);

    // Request notification permission
    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) {
            console.log('Browser does not support notifications');
            return false;
        }

        const result = await Notification.requestPermission();
        setPermission(result);
        return result === 'granted';
    }, []);

    // Fetch schedules
    useEffect(() => {
        async function fetchSchedules() {
            try {
                const res = await fetch('/api/schedules');
                if (!res.ok) return;
                const data = await res.json();
                setSchedules(data);
            } catch (error) {
                console.error('Failed to fetch schedules for notifications:', error);
            }
        }
        fetchSchedules();
    }, []);

    // Check and show notification for upcoming class
    const checkUpcomingClass = useCallback(() => {
        if (permission !== 'granted' || schedules.length === 0) return null;

        const now = new Date();
        const currentDay = now.getDay();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeInMinutes = currentHours * 60 + currentMinutes;

        for (const schedule of schedules) {
            const scheduleDay = dayMap[schedule.day];
            if (scheduleDay !== currentDay) continue;

            const [startHour, startMin] = schedule.startTime.split(':').map(Number);
            const scheduleStartInMinutes = startHour * 60 + startMin;

            // Notify 15 minutes before class starts
            const diff = scheduleStartInMinutes - currentTimeInMinutes;
            if (diff >= 0 && diff <= 15) {
                return {
                    course: schedule.course,
                    time: schedule.startTime,
                    room: schedule.room,
                    type: schedule.type
                };
            }
        }
        return null;
    }, [permission, schedules]);

    // Show local notification
    const showNotification = useCallback((title: string, body: string) => {
        if (permission !== 'granted') return;

        new Notification(title, {
            body,
            icon: '/logo.jpg',
            badge: '/logo.jpg'
        });
    }, [permission]);

    // Auto-check for upcoming classes every minute
    useEffect(() => {
        if (permission !== 'granted') return;

        const checkInterval = setInterval(() => {
            const upcoming = checkUpcomingClass();
            if (upcoming) {
                showNotification(
                    `📚 ${upcoming.course}`,
                    `Kelas dimulai pukul ${upcoming.time} di ${upcoming.room}`
                );
            }
        }, 60000); // Check every minute

        return () => clearInterval(checkInterval);
    }, [permission, checkUpcomingClass, showNotification]);

    return {
        permission,
        requestPermission,
        checkUpcomingClass,
        showNotification
    };
}
