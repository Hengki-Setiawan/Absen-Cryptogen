'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Loader2, CreditCard, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [formData, setFormData] = useState({ nim: '', full_name: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Request failed');

            setStatus('success');
            setMessage('Permintaan reset password telah dikirim ke Admin. Silakan hubungi admin untuk konfirmasi.');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke Login
                    </Link>

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-slate-900">Lupa Password?</h1>
                        <p className="text-slate-500">Isi data di bawah untuk request reset password</p>
                    </div>

                    {status === 'success' ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Permintaan Terkirim</h3>
                            <p className="text-slate-600 mb-6">{message}</p>
                            <Link href="/login" className="block w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                                Kembali ke Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">NIM</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={formData.nim}
                                        onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Masukkan NIM"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Nama Lengkap</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Nama sesuai data"
                                        required
                                    />
                                </div>
                            </div>

                            {status === 'error' && (
                                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Permintaan'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
