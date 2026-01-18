'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, Camera, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';
import Image from 'next/image';

// Initialize Supabase Client (Client-side)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Student = {
    id: string;
    nim: string;
    full_name: string;
};

type Course = {
    id: string;
    name: string;
    code: string;
    day: string;
    start_time: string;
    end_time: string;
};

export default function AbsenPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [meetingNumber, setMeetingNumber] = useState('');
    const [status, setStatus] = useState('hadir');
    const [notes, setNotes] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch Data on Mount
    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/data');
                if (!response.ok) throw new Error('Failed to fetch data');
                const data = await response.json();
                setStudents(data.students);
                setCourses(data.courses);
            } catch (error) {
                console.error('Error fetching data:', error);
                setErrorMessage('Gagal memuat data. Silakan refresh halaman.');
            } finally {
                setIsLoadingData(false);
            }
        }
        fetchData();
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsCompressing(true);
            try {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(file, options);
                setFile(compressedFile);
                const url = URL.createObjectURL(compressedFile);
                setPreviewUrl(url);
            } catch (error) {
                console.error('Compression error:', error);
                setErrorMessage('Gagal memproses gambar. Silakan coba lagi.');
            } finally {
                setIsCompressing(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudent || !selectedCourse || !meetingNumber || !file) {
            setErrorMessage('Mohon lengkapi semua data wajib!');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            // 1. Upload Image to Supabase
            const fileExt = file.name.split('.').pop();
            const fileName = `${selectedStudent}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('attendance-photos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('attendance-photos')
                .getPublicUrl(fileName);

            // 2. Submit Data to API
            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedStudent,
                    courseId: selectedCourse,
                    meetingNumber: parseInt(meetingNumber),
                    status,
                    notes,
                    photoUrl: publicUrl,
                    timestamp: new Date().toISOString()
                }),
            });

            if (!response.ok) throw new Error('Gagal menyimpan data absensi');

            setSubmitStatus('success');
        } catch (error: unknown) {
            console.error('Submission error:', error);
            const err = error as { message: string };
            setErrorMessage(err.message || 'Terjadi kesalahan saat mengirim data.');
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitStatus === 'success') {
        return (
            <div className="min-h-screen py-20 bg-slate-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md mx-4 w-full">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Absensi Berhasil!</h2>
                    <p className="text-slate-600 mb-6">
                        Data kehadiranmu telah tersimpan.
                    </p>
                    <button
                        onClick={() => {
                            setSubmitStatus('idle');
                            setFile(null);
                            setPreviewUrl(null);
                            setNotes('');
                        }}
                        className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Isi Absen Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 bg-slate-50">
            <div className="max-w-2xl mx-auto px-4">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Form Absensi Kelas</h1>
                    <p className="text-slate-600">Silakan isi data kehadiran dengan benar dan jujur.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 sm:p-8">
                        {isLoadingData ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* Nama Mahasiswa */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Nama Mahasiswa <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={selectedStudent}
                                        onChange={(e) => setSelectedStudent(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                                        required
                                    >
                                        <option value="">Pilih Nama Anda...</option>
                                        {students.map((s) => (
                                            <option key={s.id} value={s.id}>{s.full_name} ({s.nim})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Mata Kuliah */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Mata Kuliah <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={selectedCourse}
                                        onChange={(e) => setSelectedCourse(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                                        required
                                    >
                                        <option value="">Pilih Mata Kuliah...</option>
                                        {courses.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name} - {c.day} ({c.start_time})</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Pertemuan Ke */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Pertemuan Ke- <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="16"
                                        value={meetingNumber}
                                        onChange={(e) => setMeetingNumber(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                        placeholder="Contoh: 1"
                                        required
                                    />
                                </div>

                                {/* Status Kehadiran */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Status Kehadiran <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {['hadir', 'izin', 'sakit'].map((s) => (
                                            <label key={s} className="cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="status"
                                                    value={s}
                                                    checked={status === s}
                                                    onChange={(e) => setStatus(e.target.value)}
                                                    className="peer sr-only"
                                                />
                                                <div className={`text-center py-3 rounded-lg border border-slate-200 capitalize transition-all
                          ${status === s ?
                                                        (s === 'hadir' ? 'border-green-500 bg-green-50 text-green-700' :
                                                            s === 'izin' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' :
                                                                'border-red-500 bg-red-50 text-red-700')
                                                        : 'hover:bg-slate-50'
                                                    }
                        `}>
                                                    {s}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Bukti Foto */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Bukti Kehadiran (Foto) <span className="text-red-500">*</span>
                                    </label>
                                    <div
                                        onClick={() => !isCompressing && fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer group relative overflow-hidden
                      ${previewUrl ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50'}
                      ${isCompressing ? 'cursor-wait opacity-70' : ''}
                    `}
                                    >
                                        {previewUrl ? (
                                            <div className="relative h-48 w-full">
                                                <Image
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    fill
                                                    className="object-contain"
                                                    unoptimized
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white font-medium flex items-center gap-2">
                                                        <Camera className="w-5 h-5" /> Ganti Foto
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-8">
                                                {isCompressing ? (
                                                    <div className="flex flex-col items-center justify-center text-blue-500">
                                                        <Loader2 className="w-10 h-10 animate-spin mb-3" />
                                                        <p className="text-sm font-medium">Memproses Gambar...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3 group-hover:text-blue-500 transition-colors" />
                                                        <p className="text-sm text-slate-500 group-hover:text-blue-600 font-medium">
                                                            Klik untuk upload atau ambil foto
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-1">Maksimal 5MB (Otomatis Dikompres)</p>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            disabled={isCompressing}
                                        />
                                    </div>
                                </div>

                                {/* Keterangan Optional */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Keterangan (Opsional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all h-24 resize-none"
                                        placeholder="Tambahkan catatan jika perlu..."
                                    />
                                </div>

                                {/* Error Message */}
                                {errorMessage && (
                                    <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        {errorMessage}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting || isCompressing}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Mengirim...
                                        </>
                                    ) : (
                                        <>Kirim Absensi</>
                                    )}
                                </button>

                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
