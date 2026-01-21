'use client';

import { useState, useEffect } from 'react';
import { Radio, Circle, Loader2, CheckCircle, XCircle } from 'lucide-react';

type Schedule = {
    id: string;
    course: string;
    course_id: string;
    day: string;
    startTime: string;
    room: string;
};

type AttendanceRecord = {
    studentName: string;
    nim: string;
    time: string;
};

export default function NFCScanner() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [isActivating, setIsActivating] = useState(false);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [lastScanResult, setLastScanResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        fetch('/api/schedules')
            .then(res => res.json())
            .then(data => setSchedules(data))
            .catch(err => console.error(err));
    }, []);

    useEffect(() => {
        // Check if there's an active session
        checkActiveSession();
    }, [selectedSchedule, selectedDate]);

    async function checkActiveSession() {
        try {
            const res = await fetch('/api/nfc/sessions?active=true');
            const sessions = await res.json();

            if (sessions.length > 0) {
                const session = sessions[0];
                setIsSessionActive(true);
                setCurrentSessionId(session.id);
            } else {
                setIsSessionActive(false);
                setCurrentSessionId(null);
            }
        } catch (error) {
            console.error('Error checking session:', error);
        }
    }

    const handleActivateSession = async () => {
        if (!selectedSchedule) {
            alert('Pilih mata kuliah terlebih dahulu');
            return;
        }

        setIsActivating(true);
        try {
            const schedule = schedules.find(s => s.id === selectedSchedule);
            if (!schedule) return;

            // Get admin user from localStorage
            const userSession = localStorage.getItem('user_session');
            if (!userSession) {
                alert('Session tidak ditemukan. Silakan login kembali.');
                return;
            }
            const user = JSON.parse(userSession);

            const res = await fetch('/api/nfc/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminId: user.id,
                    scheduleId: schedule.id,
                    courseId: schedule.course_id,
                    attendanceDate: selectedDate,
                    expiresInHours: 24
                })
            });

            const data = await res.json();
            if (data.success) {
                setIsSessionActive(true);
                setCurrentSessionId(data.sessionId);
                setAttendanceRecords([]);
                alert('Sesi NFC berhasil diaktifkan!');
            } else {
                alert('Gagal mengaktifkan sesi: ' + data.error);
            }
        } catch (error) {
            alert('Terjadi kesalahan');
        } finally {
            setIsActivating(false);
        }
    };

    const handleDeactivateSession = async () => {
        if (!currentSessionId) return;

        try {
            const res = await fetch('/api/nfc/sessions', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: currentSessionId,
                    isActive: false
                })
            });

            if (res.ok) {
                setIsSessionActive(false);
                setCurrentSessionId(null);
                alert('Sesi NFC dinonaktifkan');
            }
        } catch (error) {
            alert('Gagal menonaktifkan sesi');
        }
    };

    const handleNFCScan = async () => {
        if (!isSessionActive) {
            alert('Aktifkan sesi terlebih dahulu');
            return;
        }

        // Check if Web NFC is supported
        if (!('NDEFReader' in window)) {
            alert('Web NFC tidak didukung di browser ini. Gunakan Chrome di Android.');
            return;
        }

        setIsScanning(true);
        setLastScanResult(null);

        try {
            const ndef = new (window as any).NDEFReader();
            await ndef.scan();

            ndef.addEventListener('reading', async ({ message, serialNumber }: any) => {
                console.log('NFC Tag detected:', serialNumber);

                // Read the URL from NFC tag
                for (const record of message.records) {
                    if (record.recordType === 'url') {
                        const url = new TextDecoder().decode(record.data);
                        console.log('URL:', url);

                        // Extract token from URL
                        const urlObj = new URL(url);
                        const token = urlObj.searchParams.get('token');

                        if (token) {
                            await processNFCAttendance(token);
                        }
                    }
                }
            });

            ndef.addEventListener('readingerror', () => {
                setLastScanResult({ success: false, message: 'Gagal membaca NFC tag' });
                setIsScanning(false);
            });

        } catch (error: any) {
            console.error('NFC Scan error:', error);
            setLastScanResult({ success: false, message: error.message || 'Gagal memulai scan NFC' });
            setIsScanning(false);
        }
    };

    const processNFCAttendance = async (token: string) => {
        try {
            const res = await fetch('/api/nfc/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nfcToken: token })
            });

            const data = await res.json();

            if (data.success) {
                setLastScanResult({ success: true, message: `✓ ${data.student.name} berhasil absen` });
                setAttendanceRecords(prev => [{
                    studentName: data.student.name,
                    nim: data.student.nim,
                    time: new Date().toLocaleTimeString('id-ID')
                }, ...prev]);
            } else {
                setLastScanResult({ success: false, message: data.error || 'Gagal mencatat absensi' });
            }
        } catch (error) {
            setLastScanResult({ success: false, message: 'Terjadi kesalahan saat mencatat absensi' });
        }
    };

    const stopScanning = () => {
        setIsScanning(false);
        setLastScanResult(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-700">NFC Scanner</h3>
                    <p className="text-sm text-slate-500">Scan kartu NFC mahasiswa untuk absensi</p>
                </div>
                <div className="flex items-center gap-2">
                    {isSessionActive ? (
                        <span className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            <Radio className="w-4 h-4" />
                            Sesi Aktif
                        </span>
                    ) : (
                        <span className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
                            <Circle className="w-4 h-4" />
                            Tidak Aktif
                        </span>
                    )}
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Mata Kuliah</label>
                            <select
                                value={selectedSchedule}
                                onChange={(e) => setSelectedSchedule(e.target.value)}
                                disabled={isSessionActive}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
                            >
                                <option value="">-- Pilih Jadwal --</option>
                                {schedules.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.course} - {s.day} ({s.startTime})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tanggal Absen</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                disabled={isSessionActive}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {!isSessionActive ? (
                            <button
                                onClick={handleActivateSession}
                                disabled={!selectedSchedule || !selectedDate || isActivating}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isActivating && <Loader2 className="w-4 h-4 animate-spin" />}
                                Aktifkan Sesi NFC
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleDeactivateSession}
                                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                                >
                                    Nonaktifkan Sesi
                                </button>
                                {!isScanning ? (
                                    <button
                                        onClick={handleNFCScan}
                                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Radio className="w-5 h-5" />
                                        Mulai Scan NFC
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopScanning}
                                        className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Circle className="w-5 h-5" />
                                        Stop Scanning
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Scan Status */}
                    {isScanning && (
                        <div className="mt-6 p-6 bg-blue-50 border-2 border-blue-300 rounded-xl text-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative">
                                    <Radio className="w-16 h-16 text-blue-600 animate-pulse" />
                                    <div className="absolute inset-0 animate-ping">
                                        <Radio className="w-16 h-16 text-blue-400 opacity-75" />
                                    </div>
                                </div>
                                <p className="text-lg font-bold text-blue-900">Menunggu Kartu NFC...</p>
                                <p className="text-sm text-blue-700">Tempelkan kartu NFC ke perangkat</p>
                            </div>
                        </div>
                    )}

                    {/* Last Scan Result */}
                    {lastScanResult && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 ${lastScanResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                            }`}>
                            {lastScanResult.success ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <XCircle className="w-5 h-5" />
                            )}
                            <span className="font-medium">{lastScanResult.message}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Attendance Records */}
            {attendanceRecords.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                    <h4 className="font-bold text-slate-700 mb-4">Daftar Absensi Hari Ini</h4>
                    <div className="space-y-2">
                        {attendanceRecords.map((record, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-slate-900">{record.studentName}</div>
                                    <div className="text-sm text-slate-600">{record.nim}</div>
                                </div>
                                <div className="text-sm text-slate-500">{record.time}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="font-bold text-yellow-900 mb-2">⚠️ Catatan Penting</h4>
                <ul className="space-y-1 text-sm text-yellow-800">
                    <li>• Web NFC hanya didukung di Chrome/Edge pada perangkat Android</li>
                    <li>• Pastikan NFC sudah diaktifkan di pengaturan perangkat</li>
                    <li>• Kartu NFC harus sudah di-write dengan URL yang di-generate dari menu Manajemen Akun</li>
                </ul>
            </div>
        </div>
    );
}
