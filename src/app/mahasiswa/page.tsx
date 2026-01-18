'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Users as UsersIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

type Student = {
    id: string;
    nim: string;
    full_name: string;
    position: string;
    avatar_url: string | null;
};

function getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getGradient(index: number): string {
    const gradients = [
        'from-blue-500 to-cyan-500',
        'from-purple-500 to-pink-500',
        'from-orange-500 to-yellow-500',
        'from-green-500 to-emerald-500',
        'from-rose-500 to-red-500',
        'from-indigo-500 to-violet-500',
    ];
    return gradients[index % gradients.length];
}

export default function MahasiswaPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchStudents() {
            try {
                const res = await fetch('/api/data');
                if (!res.ok) throw new Error('Failed to fetch students');
                const data = await res.json();
                setStudents(data.students);
            } catch (error) {
                console.error('Error fetching students:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchStudents();
    }, []);

    const filteredStudents = students.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nim.includes(searchTerm)
    );

    const pengurusCount = students.filter(s => s.position && s.position !== 'Anggota').length;

    return (
        <div className="min-h-screen py-12">
            {isLoading ? (
                <div className="flex justify-center items-center h-[60vh]">
                    <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
                </div>
            ) : (
                <>
                    {/* Header */}
                    <section className="py-16">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-12">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium mb-6">
                                    <UsersIcon className="w-4 h-4" />
                                    Daftar Mahasiswa
                                </div>
                                <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                                    Mahasiswa <span className="gradient-text">Cryptgen 2023</span>
                                </h1>
                                <p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto">
                                    Kenali semua anggota kelas Bisnis Digital UNM angkatan 2023
                                </p>
                            </div>

                            {/* Search & Filter */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama atau NIM..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="input pl-12"
                                    />
                                </div>
                                {/* <button className="btn btn-secondary">
                                    <Filter className="w-4 h-4" />
                                    Filter
                                </button> */}
                            </div>

                            {/* Stats */}
                            <div className="flex items-center justify-center gap-8 mb-12">
                                <div className="text-center">
                                    <div className="text-3xl font-bold gradient-text">{students.length}</div>
                                    <div className="text-sm text-[var(--foreground-muted)]">Total Mahasiswa</div>
                                </div>
                                <div className="w-px h-12 bg-[var(--border)]" />
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-[var(--primary)]">
                                        {pengurusCount}
                                    </div>
                                    <div className="text-sm text-[var(--foreground-muted)]">Pengurus</div>
                                </div>
                            </div>

                            {/* Students Grid */}
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredStudents.map((student, index) => (
                                    <div
                                        key={student.id}
                                        className="card hover:border-[var(--primary)] cursor-pointer animate-fade-in"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className="flex items-center gap-4">
                                            {student.avatar_url ? (
                                                <div className="w-14 h-14 rounded-full overflow-hidden relative">
                                                    <Image
                                                        src={student.avatar_url}
                                                        alt={student.full_name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            ) : (
                                                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getGradient(index)} flex items-center justify-center text-white font-bold text-lg`}>
                                                    {getInitials(student.full_name)}
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold truncate">{student.full_name}</h3>
                                                <p className="text-sm text-[var(--foreground-muted)]">{student.nim}</p>
                                                {student.position && student.position !== 'Anggota' && (
                                                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                                                        {student.position}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
