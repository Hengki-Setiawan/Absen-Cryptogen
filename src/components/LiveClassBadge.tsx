'use client';

import { useState, useEffect } from 'react';
import { Video, X, ExternalLink, Clock } from 'lucide-react';

type Schedule = {
    id: string;
    course: string;
    lecturer: string;
    day: string;
    startTime: string;
    endTime: string;
    room: string;
    type: 'offline' | 'online';
    meeting_link?: string;
};

export default function LiveClassBadge() {
    const [activeClass, setActiveClass] = useState<Schedule | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const res = await fetch('/api/schedules');
                const schedules: Schedule[] = await res.json();

                // Get current time in WITA (UTC+8)
                const now = new Date();
                const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
                const witaTime = new Date(utc + (3600000 * 8));

                const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const currentDay = days[witaTime.getDay()];

                const currentHour = witaTime.getHours();
                const currentMinute = witaTime.getMinutes();
                const currentTimeValue = currentHour * 60 + currentMinute;

                const active = schedules.find(s => {
                    if (s.day !== currentDay || s.type !== 'online' || !s.meeting_link) return false;

                    const [startH, startM] = s.startTime.split(':').map(Number);
                    const [endH, endM] = s.endTime.split(':').map(Number);

                    const startValue = startH * 60 + startM;
                    const endValue = endH * 60 + endM;

                    // Show 1 hour before start
                    const showTime = startValue - 60;
                    // Hide 30 mins after end
                    const hideTime = endValue + 30;

                    return currentTimeValue >= showTime && currentTimeValue <= hideTime;
                });

                if (active) {
                    setActiveClass(active);
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }

            } catch (error) {
                console.error('Error checking live class:', error);
            }
        };

        fetchSchedules();
        const interval = setInterval(fetchSchedules, 60000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    if (!isVisible || !activeClass) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
            <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-4 max-w-sm w-full relative overflow-hidden group">
                {/* Background Pulse Effect */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 animate-pulse" />

                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Video className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full animate-pulse">
                                LIVE NOW
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {activeClass.startTime} - {activeClass.endTime} WITA
                            </span>
                        </div>

                        <h4 className="font-bold text-slate-900 leading-tight mb-1">
                            {activeClass.course}
                        </h4>
                        <p className="text-xs text-slate-500 mb-3">
                            {activeClass.lecturer}
                        </p>

                        <a
                            href={activeClass.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all w-full justify-center group-hover:shadow-lg group-hover:shadow-blue-500/30"
                        >
                            Gabung Meeting
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
