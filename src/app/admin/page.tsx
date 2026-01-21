'use client';

import { useState, useEffect } from 'react';
import { Lock, LogOut, ClipboardList, FileText } from 'lucide-react';
import StudentManager from '@/components/admin/StudentManager';
import ScheduleManager from '@/components/admin/ScheduleManager';
import AdminManager from '@/components/admin/AdminManager';
import OverviewManager from '@/components/admin/OverviewManager';
import TaskManager from '@/components/admin/TaskManager';
import ContentManager from '@/components/admin/ContentManager';
import StatisticsManager from '@/components/admin/StatisticsManager';
import QRGenerator from '@/components/admin/QRGenerator';
import BlogManager from '@/components/admin/BlogManager';
import PasswordRequests from '@/components/admin/PasswordRequests';
import StudentAccountManager from '@/components/admin/StudentAccountManager';
import NFCScanner from '@/components/admin/NFCScanner';

type TabType = 'overview' | 'statistics' | 'qr' | 'nfc' | 'nfc-accounts' | 'students' | 'schedules' | 'tasks' | 'blog' | 'content' | 'requests' | 'admins';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('admin_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login gagal');
            }

            localStorage.setItem('admin_user', JSON.stringify(data.user));
            setUser(data.user);
            setIsAuthenticated(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_user');
        setIsAuthenticated(false);
        setUser(null);
        setUsername('');
        setPassword('');
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
                        <p className="text-slate-500">Masuk untuk mengelola kelas</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Masukkan username"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Masukkan password"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all disabled:opacity-70"
                        >
                            {isLoading ? 'Memproses...' : 'Masuk Dashboard'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const tabs: { id: TabType; label: string }[] = [
        { id: 'overview', label: '📊 Overview' },
        { id: 'statistics', label: '📈 Statistik' },
        { id: 'qr', label: '📱 QR Code' },
        { id: 'nfc', label: '📡 NFC Scanner' },
        { id: 'nfc-accounts', label: '🎫 Akun & NFC' },
        { id: 'students', label: '👨‍🎓 Mahasiswa' },
        { id: 'schedules', label: '📅 Jadwal' },
        { id: 'tasks', label: '📌 Tugas' },
        { id: 'blog', label: '📢 Blog' },
        { id: 'content', label: '📝 Konten' },
        { id: 'requests', label: '🔑 Reset Password' },
        { id: 'admins', label: '🔐 Admin' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl text-slate-800">
                        <Lock className="w-5 h-5 text-blue-600" />
                        Admin Panel
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600 hidden sm:inline">
                            Halo, <b>{user?.name}</b>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs */}
                <div className="flex flex-wrap gap-1 mb-8 border-b border-slate-200 pb-1 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[400px]">
                    {activeTab === 'overview' && <OverviewManager />}
                    {activeTab === 'statistics' && <StatisticsManager />}
                    {activeTab === 'qr' && <QRGenerator />}
                    {activeTab === 'nfc' && <NFCScanner />}
                    {activeTab === 'nfc-accounts' && <StudentAccountManager />}
                    {activeTab === 'students' && <StudentManager />}
                    {activeTab === 'schedules' && <ScheduleManager />}
                    {activeTab === 'tasks' && <TaskManager />}
                    {activeTab === 'blog' && <BlogManager />}
                    {activeTab === 'content' && <ContentManager />}
                    {activeTab === 'requests' && <PasswordRequests />}
                    {activeTab === 'admins' && <AdminManager />}
                </div>
            </div>
        </div>
    );
}
