'use client';

import { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

export default function Clock() {
    const [time, setTime] = useState<string>('');
    const [date, setDate] = useState<string>('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();

            // WITA Time (UTC+8)
            const timeString = new Intl.DateTimeFormat('id-ID', {
                timeZone: 'Asia/Makassar',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).format(now);

            const dateString = new Intl.DateTimeFormat('id-ID', {
                timeZone: 'Asia/Makassar',
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            }).format(now);

            setTime(timeString);
            setDate(dateString);
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // Prevent hydration mismatch by not rendering until client-side
    if (!time) return null;

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 text-xs font-medium border border-slate-200">
            <ClockIcon className="w-3.5 h-3.5 text-blue-500" />
            <span>{date}, {time} WITA</span>
        </div>
    );
}
