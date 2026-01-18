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

// Fixed: Correct mapping for firstDay=1 (Monday first)
const dayToNumber: Record<string, number> = {
    'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5, 'Sabtu': 6, 'Minggu': 0
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

    // Fixed: Correct date calculation for events
    const getEvents = () => {
        const events: any[] = [];
        const today = new Date();

        // Get the Monday of current week
        const currentDay = today.getDay(); // 0=Sunday, 1=Monday, etc
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);

        for (let week = 0; week < 4; week++) {
            schedules.forEach((schedule, index) => {
                const dayNum = dayToNumber[schedule.day];
                const date = new Date(monday);

                // Calculate correct offset from Monday
                const dayOffset = dayNum === 0 ? 6 : dayNum - 1; // Sunday is 6 days after Monday
                date.setDate(monday.getDate() + dayOffset + (week * 7));

                const dateStr = date.toISOString().split('T')[0];
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
                        type: 'class'
                    }
                });
            });
        }

        // Add task deadlines
        tasks.forEach(task => {
            if (task.deadline) {
                events.push({
                    id: `task-${task.id}`,
                    title: `📌 ${task.title}`,
                    start: task.deadline,
                    allDay: true,
                    backgroundColor: '#dc2626',
                    borderColor: '#dc2626',
                    textColor: '#ffffff',
                    extendedProps: {
                        ...task,
                        type: 'task'
                    }
                });
            }
        });

        return events;
    };

    const handleEventClick = (info: any) => {
        const props = info.event.extendedProps;
        if (props.type === 'class') {
            const relatedTasks = tasks.filter(t =>
                t.course_name?.toLowerCase().includes(props.course?.toLowerCase()) ||
                props.course?.toLowerCase().includes(t.course_name?.toLowerCase())
            );
            setSelectedEvent({ ...props, relatedTasks, eventTitle: info.event.title });
        } else if (props.type === 'task') {
            setSelectedEvent({ ...props, eventTitle: info.event.title });
        }
    };

    if (isLoading) {
        return <div className="text-center py-12 text-slate-500">Memuat kalender...</div>;
    }

    return (
        <div className="relative">
            {/* Custom Calendar Styles - Mobile Optimized */}
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
        .fc .fc-button {
          padding: 6px 12px;
          font-weight: 500;
          border-radius: 8px;
          font-size: 12px;
        }
        .fc .fc-toolbar {
          flex-wrap: wrap;
          gap: 8px;
        }
        .fc .fc-toolbar-title {
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
        }
        .fc .fc-col-header-cell {
          background: #f8fafc;
          padding: 8px 0;
          font-weight: 600;
          color: #475569;
          font-size: 11px;
        }
        .fc .fc-timegrid-slot {
          height: 40px;
        }
        .fc .fc-event {
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 10px;
          font-weight: 500;
          cursor: pointer;
          border: none !important;
        }
        .fc .fc-event:hover {
          filter: brightness(1.1);
          transform: scale(1.02);
          transition: all 0.2s;
        }
        .fc .fc-daygrid-day.fc-day-today {
          background: #dbeafe !important;
        }
        .fc .fc-timegrid-col.fc-day-today {
          background: #f0f9ff !important;
        }
        .fc .fc-daygrid-event {
          margin: 2px 4px;
        }
        .fc .fc-timegrid-slot-label {
          font-size: 10px;
        }
        @media (max-width: 640px) {
          .fc .fc-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          .fc .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
            margin-bottom: 8px;
          }
          .fc .fc-button {
            padding: 8px 10px;
            font-size: 11px;
          }
          .fc .fc-toolbar-title {
            font-size: 0.9rem;
            text-align: center;
          }
          .fc .fc-event {
            font-size: 9px;
            padding: 1px 2px;
          }
          .fc .fc-col-header-cell {
            font-size: 10px;
            padding: 4px 0;
          }
          .fc .fc-timegrid-slot {
            height: 32px;
          }
          .fc .fc-timegrid-slot-label {
            font-size: 9px;
          }
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
                    firstDay={1}
                    buttonText={{
                        today: 'Hari Ini',
                        month: 'Bulan',
                        week: 'Minggu'
                    }}
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }}
                    slotLabelFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }}
                    dayHeaderFormat={{
                        weekday: 'short',
                        day: 'numeric',
                        month: 'numeric'
                    }}
                />
            </div>

            {/* Event Detail Modal - Mobile Optimized */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
                    <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-800">
                                    {selectedEvent.type === 'task' ? '📌 Tugas' : '📚 Kelas'}
                                </h3>
                                <p className="text-base sm:text-lg text-slate-600 mt-1">{selectedEvent.course || selectedEvent.title}</p>
                            </div>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {selectedEvent.type === 'class' && (
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
                                            <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                                            {selectedEvent.taskCount} Tugas
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
                                                    {task.description && (
                                                        <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                                                    )}
                                                    {task.deadline && (
                                                        <div className="text-xs text-red-600 mt-1 font-medium">⏰ Deadline: {task.deadline}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedEvent.type === 'task' && (
                            <div className="space-y-3">
                                {selectedEvent.description && (
                                    <p className="text-slate-600 p-3 bg-slate-50 rounded-xl text-sm">{selectedEvent.description}</p>
                                )}
                                {selectedEvent.deadline && (
                                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl text-red-600">
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

            {/* Legend with task count - Mobile Optimized */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-50 rounded-xl flex flex-wrap gap-3 sm:gap-6 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-blue-500"></div>
                    <span className="text-slate-600">Jadwal Kelas</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-600"></div>
                    <span className="text-slate-600">Deadline Tugas</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-medium">📌 N</span>
                    <span className="text-slate-600">Jumlah tugas</span>
                </div>
            </div>
        </div>
    );
}
