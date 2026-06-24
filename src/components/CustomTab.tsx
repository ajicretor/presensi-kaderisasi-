import React, { useState } from 'react';
import { Sliders, Copy, Check, Database, RefreshCw, Key, Upload, Image } from 'lucide-react';
import { Branding } from '../types';
import { SUPABASE_SQL_SCHEMA, getSupabaseKeys, resetSupabaseClient } from '../supabase';

interface CustomTabProps {
  branding: Branding;
  onSaveBranding: (b: Branding) => void;
  onSaveSupabaseKeys: (url: string, key: string) => void;
  supabaseConnected: boolean;
  supabaseMode: 'env' | 'custom' | 'none';
  supabaseError: 'auth' | 'schema' | null;
  onForceUpload?: () => void;
  onForceDownload?: () => void;
  onRetrySync?: () => void;
}

export default function CustomTab({
  branding,
  onSaveBranding,
  onSaveSupabaseKeys,
  supabaseConnected,
  supabaseMode,
  supabaseError,
  onForceUpload,
  onForceDownload,
  onRetrySync
}: CustomTabProps) {
  // Visual form fields
  const [appName, setAppName] = useState(branding.appName);
  const [org, setOrg] = useState(branding.organisasi);
  const [cabang, setCabang] = useState(branding.cabang);
  const [totalSesi, setTotalSesi] = useState(branding.totalSesi);
  const [themeColor, setThemeColor] = useState(branding.themeColor);
  const [logo, setLogo] = useState(branding.logo);
  const [delegationType, setDelegationType] = useState(branding.delegationType || 'PAC');
  const [uploadError, setUploadError] = useState('');

  // Synchronize state when branding props change from the parent (e.g. database sync or reload)
  React.useEffect(() => {
    setAppName(branding.appName);
    setOrg(branding.organisasi);
    setCabang(branding.cabang);
    setTotalSesi(branding.totalSesi);
    setThemeColor(branding.themeColor);
    setLogo(branding.logo);
    setDelegationType(branding.delegationType || 'PAC');
  }, [branding]);

  // Supabase form keys
  const keys = getSupabaseKeys();
  const [sbUrl, setSbUrl] = useState(keys.url);
  const [sbKey, setSbKey] = useState(keys.key);

  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setToastMsg('Teks SQL Schema berhasil disalin!');
    setTimeout(() => {
      setCopied(false);
      setToastMsg('');
    }, 2000);
  };

  const handleVisualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBranding({
      appName: appName.trim(),
      organisasi: org.trim(),
      cabang: cabang.trim(),
      totalSesi,
      logo,
      themeColor,
      delegationType: delegationType.trim()
    });
  };

  const handleDbSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSupabaseKeys(sbUrl.trim(), sbKey.trim());
    resetSupabaseClient();
  };

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* KIRI: Branding Visual Setup */}
        <div className="bg-white dark:bg-slate-900 rounded-[20px] p-5 border border-slate-200 dark:border-navy-800 shadow-sm transition-colors duration-350 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-navy-900 dark:text-white uppercase tracking-widest border-b dark:border-navy-850 pb-2 flex items-center space-x-1">
              <Sliders className="w-4.5 h-4.5 text-emerald-500" />
              <span>Kustomisasi Branding Visual</span>
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold">Atur kop surat, logo SVG, nama aplikasi web, dan jumlah sesi pelatihan.</p>

            <form onSubmit={handleVisualSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Nama Aplikasi Web</label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2.5 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Dinas / Organisasi</label>
                  <input
                    type="text"
                    required
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2.5 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Wilayah Administratif</label>
                  <input
                    type="text"
                    required
                    value={cabang}
                    onChange={(e) => setCabang(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2.5 rounded-lg text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Jumlah Sesi Maksimal</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={totalSesi}
                    onChange={(e) => setTotalSesi(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2.5 rounded-lg text-slate-850 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Tingkatan Delegasi / Wilayah (PAC / Kab / Kota / dll)</label>
                  <input
                    type="text"
                    required
                    value={delegationType}
                    onChange={(e) => setDelegationType(e.target.value)}
                    placeholder="Contoh: PAC, Kabupaten, Kota"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2.5 rounded-lg text-slate-800 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Pilih Warna Tema Utama</label>
                  <select
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2.5 rounded-lg text-slate-700 dark:text-slate-350 focus:outline-none focus:ring-1.5 focus:ring-emerald-500"
                  >
                    <option value="emerald">Emerald Green (Hijau Default)</option>
                    <option value="navy">Classic Navy (Biru Donker)</option>
                    <option value="indigo">Indigo Royal (Ungu Premium)</option>
                    <option value="rose">Crimson Rose (Merah Rose)</option>
                    <option value="amber">Warm Amber (Kuning Emas)</option>
                  </select>
                </div>
              </div>

              <div className="text-xs space-y-1.5">
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Upload / Ganti Logo Aplikasi</label>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 p-4 rounded-xl">
                  {/* Preview Box */}
                  <div className="w-16 h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-navy-800 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                    {logo && (typeof logo === 'string') && (logo.trim().startsWith('<svg') || logo.trim().startsWith('<div')) ? (
                      <div dangerouslySetInnerHTML={{ __html: logo }} className="w-10 h-10 flex items-center justify-center text-slate-900 dark:text-white" />
                    ) : logo ? (
                      <img src={logo} alt="Logo Preview" className="w-12 h-12 object-contain rounded-lg" referrerPolicy="no-referrer" />
                    ) : (
                      <Image className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-grow w-full text-center sm:text-left space-y-2">
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      <label className="cursor-pointer bg-slate-200 hover:bg-slate-300 dark:bg-navy-900 dark:hover:bg-navy-850 text-slate-800 dark:text-white px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih Gambar</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 2 * 1024 * 1024) {
                                setUploadError('Ukuran gambar maksimal adalah 2MB! File Anda terlalu besar.');
                                return;
                              }
                              setUploadError('');
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  const newLogo = event.target.result as string;
                                  setLogo(newLogo);
                                  // Automatically save and sync the logo immediately to avoid state loss!
                                  onSaveBranding({
                                    appName: appName.trim(),
                                    organisasi: org.trim(),
                                    cabang: cabang.trim(),
                                    totalSesi,
                                    logo: newLogo,
                                    themeColor,
                                    delegationType: delegationType.trim()
                                  });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {logo !== `<svg class="w-8 h-8" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 40 C30 40, 55 35, 60 35 C65 35, 90 40, 90 40 C90 40, 93 72, 60 92 C27 72, 30 40, 30 40 Z" stroke="#1E70CD" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><path d="M42 55 L58 71 L86 43" stroke="#1E70CD" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" /><path d="M52 45 L74 23" stroke="#1E70CD" stroke-width="10" stroke-linecap="round" /><path d="M72 23 H86 V37" stroke="#1E70CD" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" /><path d="M51 64 L58 71 L66 63" stroke="#4FAF3C" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" /></svg>` && (
                        <button
                          type="button"
                          onClick={() => {
                            const defaultLogo = `<svg class="w-8 h-8" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 40 C30 40, 55 35, 60 35 C65 35, 90 40, 90 40 C90 40, 93 72, 60 92 C27 72, 30 40, 30 40 Z" stroke="#1E70CD" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/><path d="M42 55 L58 71 L86 43" stroke="#1E70CD" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" /><path d="M52 45 L74 23" stroke="#1E70CD" stroke-width="10" stroke-linecap="round" /><path d="M72 23 H86 V37" stroke="#1E70CD" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" /><path d="M51 64 L58 71 L66 63" stroke="#4FAF3C" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
                            setLogo(defaultLogo);
                            onSaveBranding({
                              appName: appName.trim(),
                              organisasi: org.trim(),
                              cabang: cabang.trim(),
                              totalSesi,
                              logo: defaultLogo,
                              themeColor,
                              delegationType: delegationType.trim()
                            });
                          }}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/45 text-rose-500 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-colors"
                        >
                          Reset Default
                        </button>
                      )}
                    </div>
                    {uploadError && (
                      <p className="text-[10px] text-rose-500 font-extrabold uppercase tracking-wide animate-pulse">
                        {uploadError}
                      </p>
                    )}
                    <p className="text-[8px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wide">
                      Mendukung format gambar PNG, JPG, WEBP, atau SVG. Ukuran Maksimal 2MB.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider transition shadow-md shadow-emerald-500/10 active:scale-[0.98]"
              >
                Simpan Seluruh Setelan Visual
              </button>
            </form>
          </div>
        </div>

        {/* KANAN: Supabase Real connection configuration */}
        <div className="bg-white dark:bg-slate-900 rounded-[20px] p-5 border border-slate-200 dark:border-navy-800 shadow-sm transition-colors duration-350 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-navy-900 dark:text-white uppercase tracking-widest border-b dark:border-navy-850 pb-2 flex items-center space-x-1.5">
              <Database className="w-4.5 h-4.5 text-emerald-500" />
              <span>Hubungkan ke Database Supabase Anda</span>
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold">Lakukan sinkronisasi riwayat pendaftaran & presensi langsung ke cloud!</p>

            <form onSubmit={handleDbSubmit} className="space-y-4 pt-4 text-xs font-semibold">
              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Supabase API URL</label>
                <input
                  type="text"
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2.5 rounded-lg text-slate-800 dark:text-white font-mono"
                  placeholder="https://your-project.supabase.co"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Supabase Anon Public API Key</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Key className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="password"
                    value={sbKey}
                    onChange={(e) => setSbKey(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 pl-9 pr-3 py-2.5 rounded-lg text-slate-800 dark:text-white font-mono"
                    placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-navy-850 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Status Sinkronisasi saat ini:</span>
                  {onRetrySync && supabaseMode !== 'none' && (
                    <button
                      type="button"
                      onClick={() => {
                        resetSupabaseClient();
                        onRetrySync();
                      }}
                      className="text-[9px] font-extrabold text-emerald-500 hover:text-emerald-600 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                      title="Coba hubungkan ulang ke database"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Hubungkan Ulang</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <div className={`w-3 h-3 rounded-full ${supabaseConnected ? 'bg-emerald-500 animate-pulse' : (supabaseError ? 'bg-rose-500 animate-bounce' : 'bg-amber-500')}`}></div>
                  <span>
                    {supabaseConnected 
                      ? `Terkoneksi online (${supabaseMode === 'env' ? 'Environment Keys' : 'Kunci Kustom'})` 
                      : (supabaseError === 'auth' 
                          ? 'Offline: Kunci API / URL tidak valid' 
                          : (supabaseError === 'schema' 
                              ? 'Offline: Tabel database belum dibuat' 
                              : 'Offline: Menggunakan database local memory/localStorage'
                            )
                        )
                    }
                  </span>
                </div>
                {supabaseError === 'auth' && (
                  <div className="mt-2 text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/40 p-2.5 rounded-lg leading-relaxed">
                    ⚠️ Koneksi Gagal: Kunci API (Anon Key) atau URL Supabase Anda tidak valid. Periksa kembali isian URL & Key di atas!
                  </div>
                )}
                {supabaseError === 'schema' && (
                  <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-950/40 p-2.5 rounded-lg leading-relaxed">
                    ⚠️ Tabel Belum Siap: Koneksi berhasil tetapi beberapa tabel tidak ditemukan. Salin dan jalankan script SQL Schema di bawah pada tab SQL Editor Supabase Anda!
                  </div>
                )}

                {supabaseConnected && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-navy-850 space-y-2">
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Tindakan Sinkronisasi Manual:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={onForceUpload}
                        className="flex items-center justify-center space-x-1 py-2 px-1 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition shadow-sm active:scale-[0.98]"
                      >
                        <Upload className="w-3 h-3 animate-pulse" />
                        <span>Paksa Unggah ke Cloud</span>
                      </button>
                      <button
                        type="button"
                        onClick={onForceDownload}
                        className="flex items-center justify-center space-x-1 py-2 px-1 bg-slate-850 hover:bg-slate-800 dark:bg-navy-850 dark:hover:bg-navy-800 text-white font-extrabold rounded-lg text-[9px] uppercase tracking-wider transition shadow-sm active:scale-[0.98]"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Paksa Unduh dari Cloud</span>
                      </button>
                    </div>
                    <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold leading-normal">
                      *Gunakan <b>Paksa Unggah</b> jika operator (seperti kru Panitia) atau setelan visual Anda belum sinkron dengan database Supabase Cloud.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-955 text-white font-extrabold rounded-lg text-xs uppercase tracking-wider transition shadow-md active:scale-[0.98]"
              >
                Terapkan & Hubungkan Supabase
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* SQL Setup Instructions Block (High Usability) */}
      <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 border border-slate-200 dark:border-navy-800 shadow-sm transition-colors duration-350 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b dark:border-navy-850 pb-3">
          <div>
            <h4 className="text-sm font-black text-navy-900 dark:text-white uppercase tracking-widest flex items-center space-x-2">
              <Database className="w-4.5 h-4.5 text-emerald-500" />
              <span>Instruksi Inisialisasi SQL Schema Supabase</span>
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-bold">Copy dan jalankan script SQL di bawah pada SQL Editor Supabase Anda.</p>
          </div>

          <button
            onClick={handleCopySql}
            className="flex items-center space-x-1.5 px-4.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition shadow-sm active:scale-[0.98] shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Teks Disalin!' : 'Copy SQL Schema'}</span>
          </button>
        </div>

        {toastMsg && (
          <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-xs text-center font-bold">
            {toastMsg}
          </div>
        )}

        <div className="relative">
          <pre className="p-4 bg-slate-950 dark:bg-slate-950 border border-slate-850/50 rounded-xl overflow-x-auto text-[10px] font-mono text-slate-300 max-h-64 custom-scrollbar">
            <code>{SUPABASE_SQL_SCHEMA}</code>
          </pre>
        </div>
      </div>

    </div>
  );
}
