'use client';

import { useState, useEffect } from 'react';
import { Loader2, Check, X, Key } from 'lucide-react';

type Request = {
    id: string;
    nim: string;
    full_name: string;
    created_at: string;
};

export default function PasswordRequests() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/password-requests');
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
        let newPassword = '';
        if (action === 'approve') {
            newPassword = prompt('Masukkan password baru untuk mahasiswa ini:') || '';
            if (!newPassword) return;
        } else {
            if (!confirm('Tolak permintaan reset password ini?')) return;
        }

        setProcessingId(requestId);
        try {
            const res = await fetch('/api/admin/password-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, action, newPassword }),
            });

            if (res.ok) {
                alert(action === 'approve' ? 'Password berhasil direset!' : 'Permintaan ditolak.');
                fetchRequests();
            } else {
                alert('Gagal memproses permintaan.');
            }
        } catch (error) {
            console.error('Error processing request:', error);
            alert('Terjadi kesalahan.');
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div>;

    if (requests.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Key className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Tidak Ada Permintaan</h3>
                <p className="text-slate-500">Belum ada mahasiswa yang meminta reset password.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-800">Permintaan Reset Password</h3>
                <p className="text-sm text-slate-500">Daftar mahasiswa yang lupa password</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-semibold text-slate-700">Mahasiswa</th>
                            <th className="p-4 font-semibold text-slate-700">Waktu Request</th>
                            <th className="p-4 font-semibold text-slate-700 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {requests.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-medium text-slate-900">{req.full_name}</div>
                                    <div className="text-sm text-slate-500">{req.nim}</div>
                                </td>
                                <td className="p-4 text-sm text-slate-600">
                                    {new Date(req.created_at).toLocaleString('id-ID')}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleAction(req.id, 'approve')}
                                            disabled={!!processingId}
                                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                                            title="Reset Password"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'reject')}
                                            disabled={!!processingId}
                                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                                            title="Tolak"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
