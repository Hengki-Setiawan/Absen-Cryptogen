'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Users as UsersIcon, Loader2, X } from 'lucide-react';
import Image from 'next/image';

type Student = {
    id: string;
    nim: string;
    full_name: string;
    position: string;
    avatar_url: string | null;
    phone?: string;
    instagram?: string;
    email?: string;
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
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await fetch('/api/admin/users?role=student');
                const data = await res.json();
                setStudents(data);
            } catch (error) {
                console.error('Failed to fetch students', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudents();
    }, []);

    const filteredStudents = students.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nim.includes(searchTerm)
    );

    const executivesCount = students.filter(s => s.position && s.position !== 'Anggota').length;

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
                                        {executivesCount}
                                    </div>
                                    <div className="text-sm text-[var(--foreground-muted)]">Pengurus</div>
                                </div>
                            </div>

                            {/* Students Grid wrapper start */}
                            <div>

                                {/* Students Grid */}
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredStudents.map((student, index) => (
                                        <div
                                            key={student.id}
                                            className="card hover:border-[var(--primary)] cursor-pointer animate-fade-in"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                            onClick={() => setSelectedStudent(student)}
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

                                {/* Modal */}
                                {selectedStudent && (
                                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
                                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                                            <div className="flex flex-col items-center text-center">
                                                {selectedStudent.avatar_url ? (
                                                    <div className="w-24 h-24 rounded-full overflow-hidden relative mb-4 border-4 border-slate-100 shadow-inner">
                                                        <Image
                                                            src={selectedStudent.avatar_url}
                                                            alt={selectedStudent.full_name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-3xl mb-4 border-4 border-slate-100 shadow-inner`}>
                                                        {getInitials(selectedStudent.full_name)}
                                                    </div>
                                                )}

                                                <h3 className="text-xl font-bold text-slate-900 mb-1">{selectedStudent.full_name}</h3>
                                                <p className="text-slate-500 font-medium mb-4">{selectedStudent.nim}</p>

                                                {selectedStudent.position && selectedStudent.position !== 'Anggota' && (
                                                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">
                                                        {selectedStudent.position}
                                                    </span>
                                                )}

                                                <div className="w-full space-y-3">
                                                    {selectedStudent.phone && (
                                                        <a href={`https://wa.me/${selectedStudent.phone.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                                                            <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                                                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-xs font-bold opacity-70">WhatsApp</div>
                                                                <div className="font-medium text-sm truncate">{selectedStudent.phone}</div>
                                                            </div>
                                                        </a>
                                                    )}

                                                    {selectedStudent.instagram && (
                                                        <a href={`https://instagram.com/${selectedStudent.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors">
                                                            <div className="w-8 h-8 bg-pink-200 rounded-full flex items-center justify-center">
                                                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-xs font-bold opacity-70">Instagram</div>
                                                                <div className="font-medium text-sm truncate">{selectedStudent.instagram}</div>
                                                            </div>
                                                        </a>
                                                    )}

                                                    {selectedStudent.email && (
                                                        <a href={`mailto:${selectedStudent.email}`} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                                                            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                                                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-xs font-bold opacity-70">Email</div>
                                                                <div className="font-medium text-sm truncate">{selectedStudent.email}</div>
                                                            </div>
                                                        </a>
                                                    )}

                                                    {!selectedStudent.phone && !selectedStudent.instagram && !selectedStudent.email && (
                                                        <div className="text-slate-400 text-sm py-2">Belum ada info kontak</div>
                                                    )}
                                                </div>

                                                <button onClick={() => setSelectedStudent(null)} className="mt-6 text-slate-400 hover:text-slate-600">
                                                    <X className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
