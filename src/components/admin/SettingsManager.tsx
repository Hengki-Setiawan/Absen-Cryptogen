'use client';

import { useState, useEffect, useCallback } from 'react';
import { Settings, MapPin, Loader2, Check } from 'lucide-react';

interface SiteSettings {
    require_location: string;
}

export default function SettingsManager() {
    const [settings, setSettings] = useState<SiteSettings>({ require_location: 'true' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [savedKey, setSavedKey] = useState<string | null>(null);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const updateSetting = async (key: string, value: string) => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });

            if (res.ok) {
                setSettings(prev => ({ ...prev, [key]: value }));
                setSavedKey(key);
                setTimeout(() => setSavedKey(null), 2000);
            }
        } catch (error) {
            console.error('Error updating setting:', error);
            alert('Gagal menyimpan pengaturan');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleLocation = () => {
        const newValue = settings.require_location === 'true' ? 'false' : 'true';
        updateSetting('require_location', newValue);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-slate-600" />
                <h3 className="text-lg font-bold text-slate-700">Pengaturan Sistem</h3>
            </div>

            <div className="space-y-4">
                {/* Location Requirement Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${settings.require_location === 'true'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-slate-200 text-slate-500'
                            }`}>
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-medium text-slate-800">Wajib Akses Lokasi</h4>
                            <p className="text-sm text-slate-500">
                                {settings.require_location === 'true'
                                    ? 'Mahasiswa harus mengaktifkan GPS saat absen'
                                    : 'Absen bisa dilakukan tanpa GPS (untuk kelas online)'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {savedKey === 'require_location' && (
                            <span className="text-green-600 flex items-center gap-1 text-sm">
                                <Check className="w-4 h-4" /> Tersimpan
                            </span>
                        )}
                        <button
                            onClick={toggleLocation}
                            disabled={isSaving}
                            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${settings.require_location === 'true'
                                    ? 'bg-green-500'
                                    : 'bg-slate-300'
                                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${settings.require_location === 'true'
                                    ? 'translate-x-7'
                                    : 'translate-x-0.5'
                                }`} />
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <h5 className="font-medium text-blue-800 mb-2">ℹ️ Informasi</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>• <strong>Aktif:</strong> Mahasiswa wajib menyalakan GPS. Jarak dari UNM akan dicatat.</li>
                        <li>• <strong>Nonaktif:</strong> Cocok untuk kelas online. Absen tetap bisa dilakukan tanpa lokasi.</li>
                        <li>• Pengaturan berlaku untuk semua mata kuliah.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
