'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, CheckCircle, AlertCircle, Camera, Loader2, WifiOff, RefreshCw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import imageCompression from 'browser-image-compression';
import Image from 'next/image';
import { saveOfflineSubmission, getOfflineSubmissions, clearOfflineSubmissions } from '@/lib/offline-storage';

// Initialize Supabase Client (Client-side)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if env vars are available
const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

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
    const [studentInput, setStudentInput] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [courseInput, setCourseInput] = useState('');
    const router = useRouter();

    // Check auth
    useEffect(() => {
        const session = localStorage.getItem('user_session');
        if (!session) {
            router.push('/login');
        }
    }, [router]);

    const [attendanceDate, setAttendanceDate] = useState(() => {
        // Use WITA (UTC+8) date
        const now = new Date();
        const witaDate = new Intl.DateTimeFormat('en-CA', { // en-CA outputs YYYY-MM-DD
            timeZone: 'Asia/Makassar',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(now);
        return witaDate;
    });
    const [status, setStatus] = useState('hadir');
    const [notes, setNotes] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    const [isQrSubmission, setIsQrSubmission] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'offline-saved'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const [isOffline, setIsOffline] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check online status
    useEffect(() => {
        setIsOffline(!navigator.onLine);

        const handleOnline = () => {
            setIsOffline(false);
            syncOfflineData();
        };
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check pending submissions on load
        getOfflineSubmissions().then(items => setPendingCount(items.length));

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const syncOfflineData = async () => {
        const items = await getOfflineSubmissions();
        if (items.length === 0) return;

        setIsSyncing(true);
        let successCount = 0;
        const successIds: number[] = [];

        for (const item of items) {
            try {
                // Upload image first
                const fileExt = item.file.name.split('.').pop();
                const fileName = `${item.studentId}/${Date.now()}.${fileExt}`;

                if (!supabase) throw new Error('Supabase not configured');

                const { error: uploadError } = await supabase.storage
                    .from('attendance-photos')
                    .upload(fileName, item.file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('attendance-photos')
                    .getPublicUrl(fileName);

                // Submit to API
                const res = await fetch('/api/attendance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: item.studentId,
                        courseId: item.courseId,
                        attendanceDate: item.attendanceDate,
                        status: item.status,
                        notes: item.notes,
                        photoUrl: publicUrl,
                        timestamp: new Date().toISOString()
                    }),
                });

                if (res.ok) {
                    successCount++;
                    successIds.push(item.id);
                }
            } catch (error) {
                console.error('Sync error for item:', item, error);
            }
        }

        if (successIds.length > 0) {
            await clearOfflineSubmissions(successIds);
            setPendingCount(prev => prev - successIds.length);
            alert(`Berhasil sinkronisasi ${successCount} data absensi!`);
        }
        setIsSyncing(false);
    };

    // Fetch Data on Mount with Caching
    useEffect(() => {
        async function fetchData() {
            // Try to load from cache first
            const cachedData = localStorage.getItem('absen-data-cache');
            const cacheTimestamp = localStorage.getItem('absen-data-timestamp');
            const cacheMaxAge = 60 * 60 * 1000; // 1 hour

            if (cachedData && cacheTimestamp) {
                const isValid = Date.now() - parseInt(cacheTimestamp) < cacheMaxAge;
                if (isValid) {
                    const data = JSON.parse(cachedData);
                    setStudents(data.students);
                    setCourses(data.courses);
                    setIsLoadingData(false);

                    // Also restore saved student selection
                    const savedStudent = localStorage.getItem('saved-student-id');
                    const savedStudentName = localStorage.getItem('saved-student-name');
                    if (savedStudent && savedStudentName) {
                        setSelectedStudent(savedStudent);
                        setStudentInput(savedStudentName);
                    }

                    // Still fetch fresh data in background
                    fetchFreshData(false);
                    return;
                }
            }

            // No valid cache, fetch with loading state
            await fetchFreshData(true);
        }

        async function fetchFreshData(showLoading: boolean) {
            if (showLoading) setIsLoadingData(true);
            try {
                const response = await fetch('/api/data');
                if (!response.ok) throw new Error('Failed to fetch data');
                const data = await response.json();
                setStudents(data.students);
                setCourses(data.courses);

                // Save to cache
                localStorage.setItem('absen-data-cache', JSON.stringify(data));
                localStorage.setItem('absen-data-timestamp', Date.now().toString());
            } catch (error) {
                console.error('Error fetching data:', error);
                if (showLoading) {
                    setErrorMessage('Gagal memuat data. Silakan refresh halaman.');
                }
            } finally {
                if (showLoading) setIsLoadingData(false);
            }
        }

        fetchData();
    }, []);

    // Handle QR Token & Auto Attendance
    useEffect(() => {
        if (courses.length === 0) return;

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const userSession = localStorage.getItem('user_session');
        const user = userSession ? JSON.parse(userSession) : null;

        if (token) {
            try {
                const json = atob(token);
                const data = JSON.parse(json);

                // Check expiry
                if (data.exp < Date.now()) {
                    setErrorMessage('QR Code sudah kadaluarsa. Silakan minta QR baru.');
                    return;
                }

                // Set Course
                const course = courses.find(c => c.id === data.sid);
                if (course) {
                    setSelectedCourse(course.id);
                    setCourseInput(`${course.name} - ${course.day} (${course.start_time})`);
                }

                // Set Date
                if (data.d) {
                    setAttendanceDate(data.d);
                }

                // AUTO ATTENDANCE if Logged In
                if (user && user.role === 'student') {
                    // Auto-fill student info
                    setSelectedStudent(user.id);
                    setStudentInput(`${user.name} (${user.nim})`);

                    // Auto Submit
                    if (course && data.d) {
                        handleAutoSubmit(user.id, course.id, data.d);
                    }
                }

            } catch (e) {
                console.error('Invalid token', e);
            }
        } else if (user && user.role === 'student') {
            // Just auto-fill if no token but logged in
            setSelectedStudent(user.id);
            setStudentInput(`${user.name} (${user.nim})`);
        }
    }, [courses]);

    const handleAutoSubmit = async (studentId: string, courseId: string, date: string) => {
        setIsSubmitting(true);
        setErrorMessage('');

        // Get location for QR auto-submit
        let currentLoc = null;
        try {
            currentLoc = await getLocation();
            setLocation(currentLoc);
        } catch (error: any) {
            console.error('Location error:', error);
            setErrorMessage(error.message || 'Gagal mendapatkan lokasi. Wajib aktifkan GPS untuk absen QR.');
            setIsSubmitting(false);
            return;
        }

        try {
            // Check if already present? (Optional optimization)

            // Submit without photo (QR privilege)
            const res = await fetch('/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId,
                    courseId,
                    attendanceDate: date,
                    status: 'hadir',
                    notes: 'Auto-attendance via QR',
                    photoUrl: null, // No photo needed for QR
                    timestamp: new Date().toISOString(),
                    isQr: true, // Flag to bypass photo check in API if needed
                    latitude: currentLoc?.lat,
                    longitude: currentLoc?.long,
                    accuracy: currentLoc?.accuracy
                }),
            });

            if (!res.ok) throw new Error('Auto-attendance failed');

            setSubmitStatus('success');
        } catch (error) {
            console.error('Auto submit error:', error);
            setErrorMessage('Gagal absen otomatis. Silakan absen manual.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsCompressing(true);
            try {
                const options = {
                    maxSizeMB: 0.2, // 200KB max
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                    fileType: 'image/webp', // Convert to WebP for smaller size
                    initialQuality: 0.7,
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

    const [location, setLocation] = useState<{ lat: number; long: number; accuracy: number; isMock: boolean } | null>(null);
    const [locationError, setLocationError] = useState('');

    // Get location on mount or before submit
    const getLocation = () => {
        return new Promise<{ lat: number; long: number; accuracy: number; isMock: boolean }>((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    // Basic Mock Location Detection
                    // Accuracy 0 is suspicious.
                    const isMock = accuracy === 0;

                    resolve({
                        lat: latitude,
                        long: longitude,
                        accuracy,
                        isMock
                    });
                },
                (error) => {
                    let msg = 'Gagal mendapatkan lokasi.';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            msg = 'Izin lokasi ditolak. Mohon aktifkan izin lokasi.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            msg = 'Informasi lokasi tidak tersedia.';
                            break;
                        case error.TIMEOUT:
                            msg = 'Waktu permintaan lokasi habis.';
                            break;
                    }
                    reject(new Error(msg));
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all required fields with specific messages
        if (!selectedStudent) {
            setErrorMessage('Mohon pilih nama mahasiswa dari daftar yang tersedia.');
            return;
        }
        if (!selectedCourse) {
            setErrorMessage('Mohon pilih mata kuliah dari daftar yang tersedia.');
            return;
        }
        if (!attendanceDate) {
            setErrorMessage('Mohon pilih tanggal absensi.');
            return;
        }
        if (!file && !isQrSubmission) {
            setErrorMessage('Mohon upload bukti kehadiran (foto).');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');
        setLocationError('');

        let currentLoc = location;

        // Try to get location if not already available
        try {
            currentLoc = await getLocation();
            setLocation(currentLoc);

            if (currentLoc.isMock) {
                setErrorMessage('Terdeteksi penggunaan Lokasi Palsu (Mock Location). Mohon matikan Fake GPS.');
                setIsSubmitting(false);
                return;
            }
        } catch (error: any) {
            console.error('Location error:', error);
            // We can decide whether to block submission or just warn
            // For now, let's require location as per user request "wajib kan agar mereka menyalakan lokasi"
            setErrorMessage(error.message || 'Gagal mendapatkan lokasi. Wajib aktifkan GPS.');
            setIsSubmitting(false);
            return;
        }

        try {
            // Handle Offline Submission
            if (isOffline) {
                await saveOfflineSubmission({
                    studentId: selectedStudent,
                    courseId: selectedCourse,
                    attendanceDate,
                    status,
                    notes,
                    file,
                    // @ts-ignore - offline storage might need update too, but for now let's focus on online
                    latitude: currentLoc?.lat,
                    longitude: currentLoc?.long
                });

                // Save student selection for next time
                localStorage.setItem('saved-student-id', selectedStudent);
                localStorage.setItem('saved-student-name', studentInput);

                setSubmitStatus('offline-saved');
                setPendingCount(prev => prev + 1);
                setIsSubmitting(false);
                return;
            }

            // Check if Supabase is configured
            if (!supabase) {
                throw new Error('Supabase tidak terkonfigurasi. Hubungi administrator.');
            }

            // 1. Upload Image to Supabase (Only if not QR auto-submission)
            let publicUrl = null;

            if (!isQrSubmission && file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${selectedStudent}/${Date.now()}.${fileExt}`;

                let uploadError;
                try {
                    const result = await supabase.storage
                        .from('attendance-photos')
                        .upload(fileName, file);
                    uploadError = result.error;
                } catch (e) {
                    console.error('Supabase upload exception:', e);
                    throw new Error('Gagal mengupload foto ke server. Periksa koneksi internet Anda.');
                }

                if (uploadError) {
                    console.error('Supabase upload error:', uploadError);
                    throw new Error(`Gagal mengupload foto: ${uploadError.message}`);
                }

                const { data } = supabase.storage
                    .from('attendance-photos')
                    .getPublicUrl(fileName);

                publicUrl = data.publicUrl;
            } else if (!isQrSubmission && !file) {
                throw new Error('Mohon upload bukti kehadiran (foto).');
            }

            // 2. Submit Data to API
            let response;
            try {
                response = await fetch('/api/attendance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: selectedStudent,
                        courseId: selectedCourse,
                        attendanceDate: attendanceDate,
                        status,
                        notes,
                        photoUrl: publicUrl,
                        timestamp: new Date().toISOString(),
                        latitude: currentLoc?.lat,
                        longitude: currentLoc?.long,
                        accuracy: currentLoc?.accuracy
                    }),
                });
            } catch (e) {
                console.error('API fetch exception:', e);
                throw new Error('Gagal menghubungi server. Periksa koneksi internet Anda.');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('API response error:', response.status, errorData);
                throw new Error(errorData.error || 'Gagal menyimpan data absensi');
            }

            // Save student selection for next time
            localStorage.setItem('saved-student-id', selectedStudent);
            localStorage.setItem('saved-student-name', studentInput);

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

    if (submitStatus === 'offline-saved') {
        return (
            <div className="min-h-screen py-20 bg-slate-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md mx-4 w-full">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <WifiOff className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Tersimpan Offline</h2>
                    <p className="text-slate-600 mb-6">
                        Data tersimpan di perangkat. Akan otomatis diupload saat online.
                    </p>
                    <button
                        onClick={() => {
                            setSubmitStatus('idle');
                            setFile(null);
                            setPreviewUrl(null);
                            setNotes('');
                        }}
                        className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Kembali
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
                        {/* Offline Indicator */}
                        {(isOffline || pendingCount > 0) && (
                            <div className={`mb-6 p-4 rounded-xl flex items-center justify-between ${isOffline ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}`}>
                                <div className="flex items-center gap-3">
                                    {isOffline ? <WifiOff className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                                    <div>
                                        <div className="font-bold text-sm">
                                            {isOffline ? 'Mode Offline' : 'Sinkronisasi Data'}
                                        </div>
                                        <div className="text-xs opacity-90">
                                            {pendingCount} data menunggu upload
                                        </div>
                                    </div>
                                </div>
                                {!isOffline && pendingCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={syncOfflineData}
                                        disabled={isSyncing}
                                        className="px-3 py-1.5 bg-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-100 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                        Sync Sekarang
                                    </button>
                                )}
                            </div>
                        )}

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
                                    <input
                                        list="students-list"
                                        value={studentInput}
                                        onChange={(e) => {
                                            const inputValue = e.target.value;
                                            setStudentInput(inputValue);
                                            // Find matching student by name or NIM
                                            const matchedStudent = students.find(
                                                (s) => `${s.full_name} (${s.nim})` === inputValue ||
                                                    s.full_name === inputValue
                                            );
                                            setSelectedStudent(matchedStudent ? matchedStudent.id : '');
                                        }}
                                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white ${selectedStudent ? 'border-green-500' : studentInput ? 'border-red-300' : 'border-slate-300'
                                            }`}
                                        placeholder="Ketik atau pilih nama..."
                                        required
                                    />
                                    <datalist id="students-list">
                                        {students.map((s) => (
                                            <option key={s.id} value={`${s.full_name} (${s.nim})`} />
                                        ))}
                                    </datalist>
                                </div>

                                {/* Mata Kuliah */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Mata Kuliah <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        list="courses-list"
                                        value={courseInput}
                                        onChange={(e) => {
                                            const inputValue = e.target.value;
                                            setCourseInput(inputValue);
                                            // Find matching course
                                            const matchedCourse = courses.find(
                                                (c) => `${c.name} - ${c.day} (${c.start_time})` === inputValue ||
                                                    c.name === inputValue
                                            );
                                            setSelectedCourse(matchedCourse ? matchedCourse.id : '');
                                        }}
                                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white ${selectedCourse ? 'border-green-500' : courseInput ? 'border-red-300' : 'border-slate-300'
                                            }`}
                                        placeholder="Ketik atau pilih mata kuliah..."
                                        required
                                    />
                                    <datalist id="courses-list">
                                        {courses.map((c) => (
                                            <option key={c.id} value={`${c.name} - ${c.day} (${c.start_time})`} />
                                        ))}
                                    </datalist>
                                </div>

                                {/* Tanggal Absensi */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Tanggal <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={attendanceDate}
                                        onChange={(e) => setAttendanceDate(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
