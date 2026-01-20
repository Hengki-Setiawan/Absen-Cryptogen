'use client';

import { useState, useEffect } from 'react';
import { QrCode, Copy, Check, RefreshCw } from 'lucide-react';

type Schedule = {
    id: string;
    course: string;
    day: string;
    startTime: string;
    room: string;
};

export default function QRGenerator() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState('');
    const [qrUrl, setQrUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetch('/api/schedules')
            .then(res => res.json())
            .then(data => setSchedules(data))
            .catch(err => console.error(err));
    }, []);

    const generateQR = () => {
        if (!selectedSchedule) return;

        const schedule = schedules.find(s => s.id === selectedSchedule);
        if (!schedule) return;

        // Create token data
        const data = {
            sid: schedule.id, // schedule id
            cn: schedule.course, // course name
            d: new Date().toISOString().split('T')[0], // date
            exp: Date.now() + 10 * 60 * 1000 // expires in 10 mins
        };

        // Base64 encode
        const token = btoa(JSON.stringify(data));

        // Get current domain
        const domain = window.location.origin;
        const url = `${domain}/absen?token=${token}`;

        // Generate QR Image URL using public API
        const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

        setQrUrl(qrImage);
    };

    const copyLink = () => {
        if (!qrUrl) return;
        // Decode URL from QR image param to get the actual link
        const urlParams = new URLSearchParams(qrUrl.split('?')[1]);
        const data = urlParams.get('data');
        if (data) {
            navigator.clipboard.writeText(data);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-slate-700">QR Code Absensi</h3>
                    <p className="text-sm text-slate-500">Generate QR untuk memudahkan mahasiswa absen</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Mata Kuliah</label>
                        <select
                            value={selectedSchedule}
                            onChange={(e) => {
                                setSelectedSchedule(e.target.value);
                                setQrUrl('');
                            }}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- Pilih Jadwal --</option>
                            {schedules.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.course} - {s.day} ({s.startTime})
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={generateQR}
                        disabled={!selectedSchedule}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <QrCode className="w-4 h-4" /> Generate QR Code
                    </button>
                </div>

                {qrUrl && (
                    <div className="mt-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100">
                            <img src={qrUrl} alt="QR Code Absensi" className="w-64 h-64 object-contain" />
                        </div>

                        <div className="mt-4 text-center">
                            <p className="text-sm font-medium text-slate-900">Scan untuk Absen</p>
                            <p className="text-xs text-slate-500">QR Code valid untuk hari ini</p>
                        </div>

                        <button
                            onClick={copyLink}
                            className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Link Tersalin' : 'Salin Link Absen'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
