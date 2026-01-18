'use client';

import { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { X, Clock, MapPin, BookOpen, ClipboardList, Bell } from 'lucide-react';

type Schedule = {
    id: string;
    course: string;
    day: string;
    startTime: string;
    endTime: string;
    room: string;
    type: string;
};

type Task = {
    id: string;
    course_id: string;
    title: string;
    description: string;
    deadline: string;
    course_name: string;
};

// Indonesian Public Holidays 2026 (Tanggal Merah)
const holidays2026 = [
    { date: '2026-01-01', name: 'Tahun Baru 2026' },
    { date: '2026-01-29', name: 'Tahun Baru Imlek 2577' },
    { date: '2026-03-20', name: 'Isra Miraj Nabi Muhammad SAW' },
    { date: '2026-03-22', name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)' },
    { date: '2026-04-03', name: 'Wafat Isa Almasih' },
    { date: '2026-04-05', name: 'Paskah' },
    { date: '2026-05-01', name: 'Hari Buruh Internasional' },
    { date: '2026-05-14', name: 'Kenaikan Isa Almasih' },
    { date: '2026-05-16', name: 'Hari Raya Waisak 2570' },
    { date: '2026-06-01', name: 'Hari Lahir Pancasila' },
    { date: '2026-06-06', name: 'Idul Adha 1447 H' },
    { date: '2026-06-27', name: 'Tahun Baru Islam 1448 H' },
    { date: '2026-08-17', name: 'Hari Kemerdekaan RI' },
    { date: '2026-09-05', name: 'Maulid Nabi Muhammad SAW' },
    { date: '2026-12-25', name: 'Hari Raya Natal' },
];

// Day name to JS getDay() mapping
const dayNameToJS: Record<string, number> = {
    'Minggu': 0, 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6
};

const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#f43f5e', '#84cc16'
];

export default function InteractiveCalendar() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
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
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const getTaskCount = (courseName: string) => {
        return tasks.filter(t =>
            t.course_name?.toLowerCase().includes(courseName?.toLowerCase()) ||
            courseName?.toLowerCase().includes(t.course_name?.toLowerCase())
        ).length;
    };

    // Helper: Get next occurrence of a specific day starting from a base date
    const getNextDayOccurrence = (baseDate: Date, targetDayJS: number): Date => {
        const result = new Date(baseDate);
        const currentDay = result.getDay();
        let daysToAdd = targetDayJS - currentDay;
        if (daysToAdd < 0) daysToAdd += 7;
        result.setDate(result.getDate() + daysToAdd);
        return result;
    };

    const getEvents = () => {
        const events: any[] = [];
        const today = new Date();

        // Start from beginning of current week (Sunday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        // Generate schedule events for 4 weeks
        for (let week = 0; week < 4; week++) {
            const weekStart = new Date(startOfWeek);
            weekStart.setDate(startOfWeek.getDate() + (week * 7));

            schedules.forEach((schedule, index) => {
                const targetDayJS = dayNameToJS[schedule.day];
                if (targetDayJS === undefined) return;

                const eventDate = getNextDayOccurrence(weekStart, targetDayJS);
                const dateStr = eventDate.toISOString().split('T')[0];
                const startDateTime = `${dateStr}T${schedule.startTime}:00`;
                const endDateTime = `${dateStr}T${schedule.endTime}:00`;
                const taskCount = getTaskCount(schedule.course);

                events.push({
                    id: `${schedule.id}-${week}`,
                    title: taskCount > 0 ? `${schedule.course} 📌${taskCount}` : schedule.course,
                    start: startDateTime,
                    end: endDateTime,
                    backgroundColor: colors[index % colors.length],
                    borderColor: colors[index % colors.length],
                    textColor: '#ffffff',
                    extendedProps: {
                        ...schedule,
                        taskCount,
                        eventType: 'class'
                    }
                });
            });
        }

        // Add Indonesian public holidays (Tanggal Merah)
        holidays2026.forEach(holiday => {
            events.push({
                id: `holiday-${holiday.date}`,
                title: `🔴 ${holiday.name}`,
                start: holiday.date,
                allDay: true,
                backgroundColor: '#ef4444',
                borderColor: '#ef4444',
                textColor: '#ffffff',
                display: 'background',
                extendedProps: {
                    eventType: 'holiday',
                    name: holiday.name
                }
            });
            // Also add as regular event so it shows in the calendar
            events.push({
                id: `holiday-label-${holiday.date}`,
                title: `🎌 ${holiday.name}`,
                start: holiday.date,
                allDay: true,
                backgroundColor: '#dc2626',
                borderColor: '#dc2626',
                textColor: '#ffffff',
                extendedProps: {
                    eventType: 'holiday',
                    name: holiday.name
                }
            });
        });

        // Add task deadlines
        tasks.forEach(task => {
            if (task.deadline) {
                events.push({
                    id: `task-${task.id}`,
                    title: `📌 ${task.title}`,
                    start: task.deadline,
                    allDay: true,
                    backgroundColor: '#f97316',
                    borderColor: '#f97316',
                    textColor: '#ffffff',
                    extendedProps: {
                        ...task,
                        eventType: 'task'
                    }
                });
            }
        });

        return events;
    };

    const handleEventClick = (info: any) => {
        const props = info.event.extendedProps;
        if (props.eventType === 'class') {
            const relatedTasks = tasks.filter(t =>
                t.course_name?.toLowerCase().includes(props.course?.toLowerCase()) ||
                props.course?.toLowerCase().includes(t.course_name?.toLowerCase())
            );
            setSelectedEvent({ ...props, relatedTasks, eventTitle: info.event.title });
        } else if (props.eventType === 'task') {
            setSelectedEvent({ ...props, eventTitle: info.event.title });
        } else if (props.eventType === 'holiday') {
            setSelectedEvent({ ...props, eventTitle: props.name });
        }
    };

    if (isLoading) {
        return <div className="text-center py-12 text-slate-500">Memuat kalender...</div>;
    }

    return (
        <div className="relative">
            <style jsx global>{`
        .fc {
          --fc-border-color: #e2e8f0;
          --fc-button-bg-color: #3b82f6;
          --fc-button-border-color: #3b82f6;
          --fc-button-hover-bg-color: #2563eb;
          --fc-button-hover-border-color: #2563eb;
          --fc-button-active-bg-color: #1d4ed8;
          --fc-button-active-border-color: #1d4ed8;
          --fc-today-bg-color: #dbeafe;
          --fc-event-text-color: #fff;
          --fc-page-bg-color: #fff;
          font-size: 14px;
        }
        .fc .fc-button { padding: 6px 12px; font-weight: 500; border-radius: 8px; font-size: 12px; }
        .fc .fc-toolbar { flex-wrap: wrap; gap: 8px; }
        .fc .fc-toolbar-title { font-size: 1rem; font-weight: 700; color: #1e293b; }
        .fc .fc-col-header-cell { background: #f8fafc; padding: 8px 0; font-weight: 600; color: #475569; font-size: 11px; }
        .fc .fc-timegrid-slot { height: 40px; }
        .fc .fc-event { border-radius: 4px; padding: 2px 4px; font-size: 10px; font-weight: 500; cursor: pointer; border: none !important; }
        .fc .fc-event:hover { filter: brightness(1.1); transform: scale(1.02); transition: all 0.2s; }
        .fc .fc-daygrid-day.fc-day-today { background: #dbeafe !important; }
        .fc .fc-timegrid-col.fc-day-today { background: #f0f9ff !important; }
        .fc .fc-daygrid-event { margin: 2px 4px; }
        .fc .fc-timegrid-slot-label { font-size: 10px; }
        .fc .fc-bg-event { opacity: 0.3; }
        @media (max-width: 640px) {
          .fc .fc-toolbar { flex-direction: column; align-items: stretch; }
          .fc .fc-toolbar-chunk { display: flex; justify-content: center; margin-bottom: 8px; }
          .fc .fc-button { padding: 8px 10px; font-size: 11px; }
          .fc .fc-toolbar-title { font-size: 0.9rem; text-align: center; }
          .fc .fc-event { font-size: 9px; padding: 1px 2px; }
          .fc .fc-col-header-cell { font-size: 10px; padding: 4px 0; }
          .fc .fc-timegrid-slot { height: 32px; }
          .fc .fc-timegrid-slot-label { font-size: 9px; }
        }
      `}</style>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-2 sm:p-4 md:p-6">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek'
                    }}
                    events={getEvents()}
                    eventClick={handleEventClick}
                    height="auto"
                    slotMinTime="07:00:00"
                    slotMaxTime="18:00:00"
                    allDaySlot={true}
                    weekends={true}
                    locale="id"
                    firstDay={0}
                    buttonText={{ today: 'Hari Ini', month: 'Bulan', week: 'Minggu' }}
                    eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                    slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                    dayHeaderFormat={{ weekday: 'short', day: 'numeric', month: 'numeric' }}
                />
            </div>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
                    <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                                    {selectedEvent.eventType === 'task' ? '📌 Tugas' :
                                        selectedEvent.eventType === 'holiday' ? '🎌 Hari Libur' : '📚 Kelas'}
                                </h3>
                                <p className="text-base sm:text-lg text-slate-600 mt-1">
                                    {selectedEvent.course || selectedEvent.title || selectedEvent.name}
                                </p>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {selectedEvent.eventType === 'class' && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                    <span className="font-medium text-sm sm:text-base">{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                    <MapPin className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span className="font-medium text-sm sm:text-base">{selectedEvent.room}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${selectedEvent.type === 'online' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {selectedEvent.type === 'online' ? '🌐 Online' : '🏫 Offline'}
                                    </span>
                                    {selectedEvent.taskCount > 0 && (
                                        <span className="px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium bg-red-100 text-red-700 flex items-center gap-1">
                                            <Bell className="w-3 h-3 sm:w-4 sm:h-4" /> {selectedEvent.taskCount} Tugas
                                        </span>
                                    )}
                                </div>
                                {selectedEvent.relatedTasks?.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <h4 className="font-bold text-slate-700 flex items-center gap-2 mb-3 text-sm sm:text-base">
                                            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                                            Daftar Tugas ({selectedEvent.relatedTasks.length})
                                        </h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {selectedEvent.relatedTasks.map((task: Task) => (
                                                <div key={task.id} className="p-3 bg-red-50 rounded-xl border border-red-100">
                                                    <div className="font-medium text-xs sm:text-sm text-slate-700">{task.title}</div>
                                                    {task.deadline && <div className="text-xs text-red-600 mt-1 font-medium">⏰ Deadline: {task.deadline}</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedEvent.eventType === 'holiday' && (
                            <div className="p-4 bg-red-50 rounded-xl text-center">
                                <span className="text-4xl">🎌</span>
                                <p className="text-red-700 font-medium mt-2">Hari Libur Nasional</p>
                            </div>
                        )}

                        {selectedEvent.eventType === 'task' && (
                            <div className="space-y-3">
                                {selectedEvent.description && (
                                    <p className="text-slate-600 p-3 bg-slate-50 rounded-xl text-sm">{selectedEvent.description}</p>
                                )}
                                {selectedEvent.deadline && (
                                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl text-orange-600">
                                        <Clock className="w-5 h-5 flex-shrink-0" />
                                        <span className="font-medium text-sm">Deadline: {selectedEvent.deadline}</span>
                                    </div>
                                )}
                                {selectedEvent.course_name && (
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl text-blue-600">
                                        <BookOpen className="w-5 h-5 flex-shrink-0" />
                                        <span className="font-medium text-sm">{selectedEvent.course_name}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-50 rounded-xl flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-blue-500"></div>
                    <span className="text-slate-600">Jadwal Kelas</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-600"></div>
                    <span className="text-slate-600">Hari Libur</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-orange-500"></div>
                    <span className="text-slate-600">Deadline Tugas</span>
                </div>
            </div>
        </div>
    );
}
