'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function NFCAttendPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [studentInfo, setStudentInfo] = useState<{ name: string; nim: string } | null>(null);

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('error');
            setMessage('Token NFC tidak valid');
            return;
        }

        processAttendance(token);
    }, [searchParams]);

    async function processAttendance(token: string) {
        try {
            const res = await fetch('/api/nfc/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nfcToken: token })
            });

            const data = await res.json();

            if (data.success) {
                setStatus('success');
                setMessage('Absensi berhasil dicatat!');
                setStudentInfo(data.student);

                // Redirect after 3 seconds
                setTimeout(() => {
                    router.push('/');
                }, 3000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Gagal mencatat absensi');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Terjadi kesalahan saat memproses absensi');
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                {status === 'loading' && (
                    <div className="text-center">
                        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Memproses Absensi...</h2>
                        <p className="text-slate-600">Mohon tunggu sebentar</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-900 mb-2">Berhasil!</h2>
                        <p className="text-lg text-slate-700 mb-4">{message}</p>
                        {studentInfo && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                <p className="font-bold text-slate-900">{studentInfo.name}</p>
                                <p className="text-sm text-slate-600">NIM: {studentInfo.nim}</p>
                            </div>
                        )}
                        <p className="text-sm text-slate-500">Anda akan diarahkan kembali...</p>
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
