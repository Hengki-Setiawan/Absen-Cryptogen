'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Calendar, BookOpen } from 'lucide-react';

type AttendanceResult = {
    course: string;
    schedule: string;
    status: 'success' | 'already' | 'error';
    message: string;
};

export default function NFCPage() {
    const params = useParams();
    const router = useRouter();
    const shortId = params.id as string;

    const [status, setStatus] = useState<'loading' | 'success' | 'no-session' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [studentInfo, setStudentInfo] = useState<{ name: string; nim: string } | null>(null);
    const [attendanceResults, setAttendanceResults] = useState<AttendanceResult[]>([]);

    useEffect(() => {
        if (shortId) {
            // Process scan directly without location
            processNFCScan(shortId, null);
        }
    }, [shortId]);

    // const getLocationAndProcess = async (id: string) => { ... } - REMOVED

    // const getLocation = () => { ... } - REMOVED

    async function processNFCScan(id: string, location: { lat: number; long: number } | null) {
        try {
            const res = await fetch('/api/nfc/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shortId: id,
                    latitude: location?.lat,
                    longitude: location?.long
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setStatus('error');
                setMessage(data.error || 'Kartu NFC tidak valid');
                return;
            }

            // Set student info
            setStudentInfo(data.student);

            // Save session to localStorage (auto-login)
            localStorage.setItem('user_session', JSON.stringify(data.student));

            if (data.attendanceResults && data.attendanceResults.length > 0) {
                // There were active sessions, show attendance results
                setAttendanceResults(data.attendanceResults);
                setStatus('success');
                setMessage('Absensi berhasil dicatat!');
            } else {
                // No active sessions, redirect to absen page
                setStatus('no-session');
                setMessage('Login berhasil! Tidak ada sesi absensi aktif.');

                // Redirect after 2 seconds
                setTimeout(() => {
                    router.push('/absen');
                }, 2000);
            }
        } catch (error) {
            setStatus('error');
            setMessage('Terjadi kesalahan saat memproses kartu NFC');
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                {status === 'loading' && (
                    <div className="text-center">
                        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Memproses...</h2>
                        <p className="text-slate-600">Mengidentifikasi kartu NFC Anda</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-900 mb-2">Berhasil!</h2>

                        {studentInfo && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <p className="font-bold text-slate-900">{studentInfo.name}</p>
                                <p className="text-sm text-slate-600">NIM: {studentInfo.nim}</p>
                            </div>
                        )}

                        {attendanceResults.length > 0 && (
                            <div className="mt-4 space-y-2 text-left">
                                <p className="font-semibold text-slate-700 mb-2">Absensi dicatat untuk:</p>
                                {attendanceResults.map((result, index) => (
                                    <div
                                        key={index}
                                        className={`p-3 rounded-lg flex items-center gap-3 ${result.status === 'success'
                                            ? 'bg-green-50 text-green-800'
                                            : result.status === 'already'
                                                ? 'bg-yellow-50 text-yellow-800'
                                                : 'bg-red-50 text-red-800'
                                            }`}
                                    >
                                        <BookOpen className="w-5 h-5 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium">{result.course}</p>
                                            <p className="text-sm opacity-75">{result.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => router.push('/absen')}
                            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Lihat Detail Absensi
                        </button>
                    </div>
                )}

                {status === 'no-session' && (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-12 h-12 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-blue-900 mb-2">Login Berhasil!</h2>

                        {studentInfo && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="font-bold text-slate-900">{studentInfo.name}</p>
                                <p className="text-sm text-slate-600">NIM: {studentInfo.nim}</p>
                            </div>
                        )}

                        <p className="text-slate-600 mb-4">
                            Tidak ada sesi absensi yang aktif saat ini.
                        </p>
                        <p className="text-sm text-slate-500">Mengalihkan ke halaman absensi...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-12 h-12 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-red-900 mb-2">Gagal</h2>
                        <p className="text-lg text-slate-700 mb-4">{message}</p>
                        <button
                            onClick={() => router.push('/')}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Kembali ke Beranda
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
