'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Calendar, Clock, MapPin, Video, BookOpen, Loader2, CalendarDays, List, Bell } from 'lucide-react';

const InteractiveCalendar = dynamic(() => import('@/components/InteractiveCalendar'), {
    ssr: false,
    loading: () => <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div>
});

type Schedule = {
    id: string;
    course: string;
    lecturer: string;
    day: string;
    startTime: string;
    endTime: string;
    room: string;
    type: 'offline' | 'online';
    color: string;
};

type Task = {
    id: string;
    title: string;
    deadline: string;
    course_name: string;
};

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function JadwalPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

    useEffect(() => {
        async function fetchData() {
            try {
                const [schedulesRes, tasksRes] = await Promise.all([
                    fetch('/api/schedules'),
                    fetch('/api/tasks')
                ]);
                const schedulesData = await schedulesRes.json();
                const tasksData = await tasksRes.json();
                setSchedules(schedulesData);
                setTasks(tasksData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const filteredSchedules = selectedDay
        ? schedules.filter(s => s.day === selectedDay)
        : schedules;

    const getTaskCount = (courseName: string) => {
        return tasks.filter(t =>
            t.course_name?.toLowerCase().includes(courseName?.toLowerCase()) ||
            courseName?.toLowerCase().includes(t.course_name?.toLowerCase())
        ).length;
    };

    return (
        <div className="min-h-screen py-12">
            {isLoading ? (
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                </div>
            ) : (
                <section className="py-8 md:py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-600 text-sm font-medium mb-6">
                                <Calendar className="w-4 h-4" />
                                Jadwal Perkuliahan
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-slate-800">
                                Jadwal <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Kuliah</span>
                            </h1>
                            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                                Jadwal mata kuliah semester ini untuk kelas Bisnis Digital 2023
                            </p>
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center justify-center gap-2 mb-8">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${viewMode === 'list'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                    }`}
                            >
                                <List className="w-4 h-4" />
                                Daftar
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 ${viewMode === 'calendar'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                    }`}
                            >
                                <CalendarDays className="w-4 h-4" />
                                Kalender
                            </button>
                        </div>

                        {/* Calendar View */}
                        {viewMode === 'calendar' && (
                            <InteractiveCalendar />
                        )}

                        {/* List View */}
                        {viewMode === 'list' && (
                            <>
                                {/* Day Filter */}
                                <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                                    <button
                                        onClick={() => setSelectedDay(null)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!selectedDay
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                            }`}
                                    >
                                        Semua
                                    </button>
                                    {days.map(day => (
                                        <button
                                            key={day}
                                            onClick={() => setSelectedDay(day)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedDay === day
                                                ? 'bg-blue-600 text-white shadow-lg'
                                                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>

                                {/* Schedule Cards */}
                                <div className="grid gap-4">
                                    {filteredSchedules.map((schedule, index) => {
                                        const taskCount = getTaskCount(schedule.course);
                                        return (
                                            <div
                                                key={schedule.id}
                                                className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow"
                                                style={{ animationDelay: `${index * 50}ms` }}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                                    <div className={`w-1.5 h-full sm:h-16 ${schedule.color} rounded-full hidden sm:block`} />
                                                    <div className={`h-1.5 w-full sm:hidden ${schedule.color} rounded-full`} />

                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className="font-bold text-lg text-slate-800">{schedule.course}</h3>
                                                                    {taskCount > 0 && (
                                                                        <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium flex items-center gap-1">
                                                                            <Bell className="w-3 h-3" />
                                                                            {taskCount}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-slate-500">{schedule.lecturer}</p>
                                                            </div>
                                                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${schedule.type === 'online'
                                                                ? 'bg-green-100 text-green-600'
                                                                : 'bg-blue-100 text-blue-600'
                                                                }`}>
                                                                {schedule.type === 'online' ? '🌐 Online' : '🏫 Offline'}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                                                            <div className="flex items-center gap-1.5">
                                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                                {schedule.day}
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="w-4 h-4 text-green-500" />
                                                                {schedule.startTime} - {schedule.endTime}
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                {schedule.type === 'online' ? (
                                                                    <Video className="w-4 h-4 text-purple-500" />
                                                                ) : (
                                                                    <MapPin className="w-4 h-4 text-orange-500" />
                                                                )}
                                                                {schedule.room}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* Legend */}
                        <div className="mt-12 p-6 bg-slate-50 rounded-2xl">
                            <h3 className="font-semibold mb-4 flex items-center gap-2 text-slate-700">
                                <BookOpen className="w-5 h-5 text-blue-500" />
                                Keterangan
                            </h3>
                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="text-sm text-slate-600">Online (Zoom/Meet)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    <span className="text-sm text-slate-600">Offline (Kampus)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">📌 N</span>
                                    <span className="text-sm text-slate-600">Jumlah tugas aktif</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
