'use client';

import { useState, useEffect } from 'react';
import { LogIn, Link as LinkIcon, Copy, Check, Loader2, Eye, EyeOff, RefreshCw, Search, FileText } from 'lucide-react';
import StudentAttendanceModal from './StudentAttendanceModal';

type Student = {
    id: string;
    nim: string;
    full_name: string;
    username: string;
    password: string;
    position: string;
    email?: string;
};

type NFCCard = {
    id: string;
    user_id: string;
    nim: string;
    short_id: string;
    is_active: number;
};

export default function StudentAccountManager() {
    const [students, setStudents] = useState<Student[]>([]);
    const [nfcCards, setNfcCards] = useState<Record<string, NFCCard>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [generatingNFC, setGeneratingNFC] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);


    async function fetchData() {
        setIsLoading(true);
        try {
            // Fetch students
            const studentsRes = await fetch('/api/admin/users?role=student');
            const studentsData = await studentsRes.json();
            setStudents(studentsData);

            // Fetch NFC cards
            try {
                const nfcRes = await fetch('/api/nfc/cards');
                if (nfcRes.ok) {
                    const nfcData = await nfcRes.json();

                    // Check if nfcData is an array
                    if (Array.isArray(nfcData)) {
                        // Map NFC cards by user_id for easy lookup
                        const nfcMap: Record<string, NFCCard> = {};
                        nfcData.forEach((card: NFCCard) => {
                            nfcMap[card.user_id] = card;
                        });
                        setNfcCards(nfcMap);
                    } else {
                        console.warn('NFC cards data is not an array:', nfcData);
                        setNfcCards({});
                    }
                } else {
                    console.warn('Failed to fetch NFC cards:', nfcRes.status);
                    setNfcCards({});
                }
            } catch (nfcError) {
                console.error('Error fetching NFC cards:', nfcError);
                setNfcCards({});
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleLoginAs = async (student: Student) => {
        if (!confirm(`Login sebagai ${student.full_name}?`)) return;
        try {
            const res = await fetch('/api/admin/impersonate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: student.id })
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem('user_session', JSON.stringify(data.user));
                window.location.href = '/absen';
            } else {
                alert('Gagal login: ' + data.error);
            }
        } catch (e) {
            alert('Terjadi kesalahan saat login');
        }
    };

    const handleGenerateNFC = async (student: Student) => {
        setGeneratingNFC(student.id);
        try {
            const res = await fetch('/api/nfc/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: student.id, nim: student.nim })
            });
            const data = await res.json();

            if (data.success) {
                // Refresh NFC cards
                await fetchData();
                alert('NFC Link berhasil di-generate!');
            } else {
                alert(data.error || 'Gagal generate NFC link');
            }
        } catch (error) {
            alert('Terjadi kesalahan');
        } finally {
            setGeneratingNFC(null);
        }
    };

    const handleCopyNFC = (shortId: string, studentId: string) => {
        const domain = 'https://absen-cryptogen.vercel.app';
        const nfcUrl = `${domain}/nfc/${shortId}`;
        navigator.clipboard.writeText(nfcUrl);
        setCopiedUrl(studentId);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const togglePasswordVisibility = (studentId: string) => {
        setShowPasswords(prev => ({ ...prev, [studentId]: !prev[studentId] }));
    };

    // Filter students based on search term
    const filteredStudents = students.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.nim.includes(searchTerm) ||
        (student.username && student.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleViewAttendance = (studentId: string) => {
        setSelectedStudentId(studentId);
        setIsAttendanceModalOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-700">Manajemen Akun & NFC</h3>
                    <p className="text-sm text-slate-500">Kelola akun mahasiswa dan kartu NFC</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari mahasiswa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
                        />
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-700">NIM</th>
                                <th className="p-4 font-semibold text-slate-700">Nama Lengkap</th>
                                <th className="p-4 font-semibold text-slate-700">Username</th>
                                <th className="p-4 font-semibold text-slate-700">Password</th>
                                <th className="p-4 font-semibold text-slate-700">NFC Link</th>
                                <th className="p-4 font-semibold text-slate-700 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-8 text-center">Memuat...</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">
                                    {searchTerm ? 'Tidak ada mahasiswa yang cocok dengan pencarian' : 'Tidak ada data'}
                                </td></tr>
                            ) : (
                                filteredStudents.map(student => {
                                    const nfcCard = nfcCards[student.id];
                                    const showPassword = showPasswords[student.id];

                                    return (
                                        <tr key={student.id} className="hover:bg-slate-50">
                                            <td className="p-4 font-mono text-sm">{student.nim}</td>
                                            <td className="p-4 font-medium">{student.full_name}</td>
                                            <td className="p-4 text-slate-600">{student.username || '-'}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-sm">
                                                        {student.password ? (
                                                            showPassword ? student.password : '••••••••'
                                                        ) : '-'}
                                                    </span>
                                                    {student.password && (
                                                        <button
                                                            onClick={() => togglePasswordVisibility(student.id)}
                                                            className="p-1 hover:bg-slate-100 rounded"
                                                            title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                                                        >
                                                            {showPassword ?
                                                                <EyeOff className="w-4 h-4 text-slate-400" /> :
                                                                <Eye className="w-4 h-4 text-slate-400" />
                                                            }
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {nfcCard ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                                            ✓ Generated
                                                        </span>
                                                        <button
                                                            onClick={() => handleCopyNFC(nfcCard.short_id, student.id)}
                                                            className="p-1 hover:bg-slate-100 rounded"
                                                            title="Copy NFC URL"
                                                        >
                                                            {copiedUrl === student.id ?
                                                                <Check className="w-4 h-4 text-green-600" /> :
                                                                <Copy className="w-4 h-4 text-slate-400" />
                                                            }
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleGenerateNFC(student)}
                                                        disabled={generatingNFC === student.id}
                                                        className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        {generatingNFC === student.id ? (
                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                        ) : (
                                                            <LinkIcon className="w-3 h-3" />
                                                        )}
                                                        Generate
                                                    </button>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleLoginAs(student)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Login sebagai mahasiswa ini"
                                                >
                                                    <LogIn className="w-4 h-4" />
                                                    Login As
                                                </button>
                                                <button
                                                    onClick={() => handleViewAttendance(student.id)}
                                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-2"
                                                    title="Lihat Absensi"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    Absensi
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* NFC URL Details Section */}
            {students.some(s => nfcCards[s.id]) && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="font-bold text-blue-900 mb-4">📱 Cara Menggunakan NFC Link</h4>
            } else {
                        alert(data.error || 'Gagal generate NFC link');
            }
        } catch (error) {
                        alert('Terjadi kesalahan');
        } finally {
                        setGeneratingNFC(null);
        }
    };

    const handleCopyNFC = (shortId: string, studentId: string) => {
        const domain = 'https://absen-cryptogen.vercel.app';
                    const nfcUrl = `${domain}/nfc/${shortId}`;
                    navigator.clipboard.writeText(nfcUrl);
                    setCopiedUrl(studentId);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const togglePasswordVisibility = (studentId: string) => {
                        setShowPasswords(prev => ({ ...prev, [studentId]: !prev[studentId] }));
    };

    // Filter students based on search term
    const filteredStudents = students.filter(student =>
                    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    student.nim.includes(searchTerm) ||
                    (student.username && student.username.toLowerCase().includes(searchTerm.toLowerCase()))
                    );

    const handleViewAttendance = (studentId: string) => {
                        setSelectedStudentId(studentId);
                    setIsAttendanceModalOpen(true);
    };

                    return (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-700">Manajemen Akun & NFC</h3>
                                <p className="text-sm text-slate-500">Kelola akun mahasiswa dan kartu NFC</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari mahasiswa..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
                                    />
                                </div>
                                <button
                                    onClick={fetchData}
                                    className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
                                >
                                    <RefreshCw className="w-4 h-4" /> Refresh
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 font-semibold text-slate-700">NIM</th>
                                            <th className="p-4 font-semibold text-slate-700">Nama Lengkap</th>
                                            <th className="p-4 font-semibold text-slate-700">Username</th>
                                            <th className="p-4 font-semibold text-slate-700">Password</th>
                                            <th className="p-4 font-semibold text-slate-700">NFC Link</th>
                                            <th className="p-4 font-semibold text-slate-700 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {isLoading ? (
                                            <tr><td colSpan={6} className="p-8 text-center">Memuat...</td></tr>
                                        ) : filteredStudents.length === 0 ? (
                                            <tr><td colSpan={6} className="p-8 text-center text-slate-500">
                                                {searchTerm ? 'Tidak ada mahasiswa yang cocok dengan pencarian' : 'Tidak ada data'}
                                            </td></tr>
                                        ) : (
                                            filteredStudents.map(student => {
                                                const nfcCard = nfcCards[student.id];
                                                const showPassword = showPasswords[student.id];

                                                return (
                                                    <tr key={student.id} className="hover:bg-slate-50">
                                                        <td className="p-4 font-mono text-sm">{student.nim}</td>
                                                        <td className="p-4 font-medium">{student.full_name}</td>
                                                        <td className="p-4 text-slate-600">{student.username || '-'}</td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-sm">
                                                                    {student.password ? (
                                                                        showPassword ? student.password : '••••••••'
                                                                    ) : '-'}
                                                                </span>
                                                                {student.password && (
                                                                    <button
                                                                        onClick={() => togglePasswordVisibility(student.id)}
                                                                        className="p-1 hover:bg-slate-100 rounded"
                                                                        title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                                                                    >
                                                                        {showPassword ?
                                                                            <EyeOff className="w-4 h-4 text-slate-400" /> :
                                                                            <Eye className="w-4 h-4 text-slate-400" />
                                                                        }
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            {nfcCard ? (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                                                        ✓ Generated
                                                                    </span>
                                                                    <button
                                                                        onClick={() => handleCopyNFC(nfcCard.short_id, student.id)}
                                                                        className="p-1 hover:bg-slate-100 rounded"
                                                                        title="Copy NFC URL"
                                                                    >
                                                                        {copiedUrl === student.id ?
                                                                            <Check className="w-4 h-4 text-green-600" /> :
                                                                            <Copy className="w-4 h-4 text-slate-400" />
                                                                        }
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleGenerateNFC(student)}
                                                                    disabled={generatingNFC === student.id}
                                                                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                                                >
                                                                    {generatingNFC === student.id ? (
                                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                                    ) : (
                                                                        <LinkIcon className="w-3 h-3" />
                                                                    )}
                                                                    Generate
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <button
                                                                onClick={() => handleLoginAs(student)}
                                                                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Login sebagai mahasiswa ini"
                                                            >
                                                                <LogIn className="w-4 h-4" />
                                                                Login As
                                                            </button>
                                                            <button
                                                                onClick={() => handleViewAttendance(student.id)}
                                                                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-2"
                                                                title="Lihat Absensi"
                                                            >
                                                                <FileText className="w-4 h-4" />
                                                                Absensi
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* NFC URL Details Section */}
                        {students.some(s => nfcCards[s.id]) && (
                            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                                <h4 className="font-bold text-blue-900 mb-4">📱 Cara Menggunakan NFC Link</h4>
                                <ol className="space-y-2 text-sm text-blue-800">
                                    <li>1. Klik tombol <strong>Copy</strong> untuk menyalin NFC URL mahasiswa</li>
                                    <li>2. Buka aplikasi <strong>NFC Tools</strong> di smartphone Android</li>
                                    <li>3. Pilih menu <strong>Write</strong> → <strong>Add a record</strong> → <strong>URL/URI</strong></li>
                                    <li>4. Paste URL yang sudah di-copy</li>
                                    <li>5. Tap <strong>Write</strong> dan tempelkan kartu/gantungan NFC ke smartphone</li>
                                    <li>6. Kartu NFC siap digunakan untuk absensi!</li>
                                </ol>
                            </div>
                        )}

                        {selectedStudentId && (
                            <StudentAttendanceModal
                                studentId={selectedStudentId}
                                isOpen={isAttendanceModalOpen}
                                onClose={() => setIsAttendanceModalOpen(false)}
                            />
                        )}
                    </div>
                    );
}
