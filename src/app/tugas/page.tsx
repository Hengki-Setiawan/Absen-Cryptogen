'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';

type Task = {
    id: string;
    course_id: string;
    title: string;
    description: string;
    deadline: string;
    course_name: string;
    course_code: string;
};

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/tasks')
            .then(res => res.json())
            .then(data => {
                // Filter out past tasks? Or keep them? Let's keep upcoming ones primarily.
                // Sort by deadline
                const sorted = data.sort((a: Task, b: Task) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
                setTasks(sorted);
            })
            .catch(err => console.error(err))
            .finally(() => setIsLoading(false));
    }, []);

    const getDaysRemaining = (deadline: string) => {
        const diff = new Date(deadline).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">


            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                        Daftar Tugas Kuliah
                    </h1>
                    <p className="text-slate-600">Pantau deadline tugasmu agar tidak terlewat.</p>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-500">Memuat data tugas...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-200">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Tidak Ada Tugas!</h3>
                        <p className="text-slate-500">Saat ini belum ada tugas yang tercatat. Nikmati waktu luangmu!</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {tasks.map(task => {
                            const daysLeft = getDaysRemaining(task.deadline);
                            const isUrgent = daysLeft <= 3 && daysLeft >= 0;
                            const isPast = daysLeft < 0;

                            return (
                                <div key={task.id} className={`bg-white rounded-xl p-5 shadow-sm border transition-all hover:shadow-md ${isUrgent ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isUrgent ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {task.course_name}
                                                </span>
                                                {isUrgent && (
                                                    <span className="flex items-center gap-1 text-xs font-bold text-red-600 animate-pulse">
                                                        <AlertCircle className="w-3 h-3" /> Segera
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 mb-1">{task.title}</h3>
                                            <p className="text-slate-600 text-sm whitespace-pre-line">{task.description}</p>
                                        </div>

                                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1 text-right min-w-[140px]">
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {formatDate(task.deadline)}
                                            </div>
                                            <div className={`flex items-center gap-1.5 text-sm font-bold ${isPast ? 'text-slate-400' : isUrgent ? 'text-red-600' : 'text-blue-600'}`}>
                                                <Clock className="w-4 h-4" />
                                                {isPast ? 'Sudah Lewat' : daysLeft === 0 ? 'Hari Ini!' : `${daysLeft} Hari Lagi`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
