import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  LayoutDashboard,
  QrCode,
  Calendar,
  Users,
  ScrollText,
  Award,
  ShieldCheck,
  Sliders,
  Power,
  Sun,
  Moon,
  Menu,
  Database,
  CloudLightning,
  XCircle,
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Printer,
  RefreshCw
} from 'lucide-react';

import { Peserta, Sesi, Presensi, Tim, Branding, SystemState } from './types';
import { safeStorage } from './utils/storage';
import {
  getSupabaseClient,
  getSupabaseKeys,
  setApiEnvKeys,
  resetSupabaseClient,
  fetchAllFromSupabase,
  syncPeserta,
  deletePesertaFromSupabase,
  syncSesi,
  deleteSesiFromSupabase,
  syncPresensi,
  syncTim,
  deleteTimFromSupabase,
  syncBranding,
  syncRekapKelulusan,
  deleteRekapKelulusanFromSupabase
} from './supabase';

import LoginScreen from './components/LoginScreen';
import DashboardTab from './components/DashboardTab';
import ScanTab from './components/ScanTab';
import SesiTab from './components/SesiTab';
import PesertaTab from './components/PesertaTab';
import RekapTab from './components/RekapTab';
import KelulusanTab from './components/KelulusanTab';
import TimTab from './components/TimTab';
import CustomTab from './components/CustomTab';

// DEFAULT STATIC DEMO DATA FOR OFFLINE-FALLBACK
const DEFAULT_PESERTA: Peserta[] = [];

const DEFAULT_SESI: Sesi[] = [];

const DEFAULT_TIM: Tim[] = [
  { username: "admin", nama: "Administrator Wilayah", role: "Admin", password: "admin", permissions: ["dash", "peserta", "kelulusan", "scan", "sesi", "rekap"] }
];

const DEFAULT_BRANDING: Branding = {
  appName: "PRESENSI-ANSOR PRO",
  organisasi: "PC GP ANSOR KABUPATEN BOGOR",
  cabang: "KABUPATEN BOGOR",
  totalSesi: 14,
  logo: `<svg class="w-11 h-11" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="blueTeal" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0284c7" /><stop offset="50%" stop-color="#0ea5e9" /><stop offset="100%" stop-color="#0d9488" /></linearGradient><linearGradient id="emeraldTeal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#10b981" /><stop offset="100%" stop-color="#059669" /></linearGradient><linearGradient id="skyGrad" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="#1e3a8a" /><stop offset="100%" stop-color="#0284c7" /></linearGradient></defs><path d="M 20 60 A 40 40 0 0 1 100 60" stroke="url(#skyGrad)" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 10" /><path d="M 12 60 C 12 30, 30 12, 60 12 C 90 12, 108 30, 108 60 C 108 80, 95 100, 75 108" stroke="url(#blueTeal)" stroke-width="7" stroke-linecap="round" fill="none" /><path d="M 22 75 C 16 65, 18 45, 30 30" stroke="url(#emeraldTeal)" stroke-width="5" stroke-linecap="round" fill="none" /><g stroke="#0d9488" stroke-width="2" opacity="0.6"><line x1="60" y1="20" x2="60" y2="24" /><line x1="60" y1="100" x2="60" y2="96" /><line x1="20" y1="60" x2="24" y2="60" /><line x1="100" y1="60" x2="96" y2="60" /><line x1="32" y1="32" x2="35" y2="35" /><line x1="88" y1="32" x2="85" y2="35" /><line x1="32" y1="88" x2="35" y2="85" /><line x1="88" y1="88" x2="85" y2="85" /></g><path d="M 60 28 C 58 18, 65 10, 75 8 C 70 16, 68 22, 60 28 Z" fill="url(#emeraldTeal)" /><path d="M 58 26 C 54 22, 55 16, 60 12 C 58 18, 58 22, 58 26 Z" fill="url(#blueTeal)" /><circle cx="60" cy="46" r="5" fill="#10b981" /><path d="M 60 51 C 54 53, 50 63, 60 78 C 70 63, 66 53, 60 51 Z" fill="url(#emeraldTeal)" /><path d="M 46 51 C 52 49, 56 50, 60 51 C 64 50, 68 49, 74 51 C 66 58, 54 58, 46 51 Z" fill="url(#blueTeal)" /><circle cx="48" cy="55" r="4.5" fill="#0284c7" /><path d="M 48 59.5 C 42 61, 38 72, 48 83 C 54 72, 52 61, 48 59.5 Z" fill="url(#blueTeal)" /><circle cx="72" cy="55" r="4.5" fill="#0284c7" /><path d="M 72 59.5 C 78 61, 82 72, 72 83 C 66 72, 68 61, 72 59.5 Z" fill="url(#blueTeal)" /><path d="M 35 88 C 45 98, 55 98, 60 98 C 65 98, 75 98, 85 88" stroke="url(#blueTeal)" stroke-width="4" stroke-linecap="round" fill="none" /><path d="M 42 93 C 50 101, 56 101, 60 101 C 64 101, 70 101, 78 93" stroke="url(#blueTeal)" stroke-width="3" stroke-linecap="round" fill="none" /><path d="M 48 98 C 53 104, 57 104, 60 104 C 63 104, 67 104, 72 98" stroke="url(#blueTeal)" stroke-width="2" stroke-linecap="round" fill="none" /></svg>`,
  themeColor: "emerald",
  delegationType: "PAC"
};

const DEFAULT_PRESENSI: Presensi[] = [];


export default function App() {
  // Navigation & authentication states
  const [activeTab, setActiveTab] = useState<'dash' | 'scan' | 'sesi' | 'peserta' | 'rekap' | 'kelulusan' | 'tim' | 'custom'>('dash');
  const [currentUser, setCurrentUser] = useState<Tim | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Supabase State
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseMode, setSupabaseMode] = useState<'env' | 'custom' | 'none'>('none');
  const [supabaseError, setSupabaseError] = useState<'auth' | 'schema' | 'connection' | null>(null);
  const [supabaseErrorDetail, setSupabaseErrorDetail] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  // System Database Content State
  const [peserta, setPeserta] = useState<Peserta[]>(DEFAULT_PESERTA);
  const [sesi, setSesi] = useState<Sesi[]>(DEFAULT_SESI);
  const [presensi, setPresensi] = useState<Presensi[]>(DEFAULT_PRESENSI);
  const [tim, setTim] = useState<Tim[]>(DEFAULT_TIM);
  const [activeSesiId, setActiveSesiId] = useState(1);
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);

  // Overlay Alert & confirm state
  const [customAlert, setCustomAlert] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'warning' | 'danger' }>({
    isOpen: false, title: '', message: '', type: 'success'
  });
  const [customConfirm, setCustomConfirm] = useState<{ isOpen: boolean; title: string; message: string; callback: ((yes: boolean) => void) | null }>({
    isOpen: false, title: '', message: '', callback: null
  });

  // Modal Cetak ID Card State
  const [printQrId, setPrintQrId] = useState<string | null>(null);
  const [cardQrDataUrl, setCardQrIdDataUrl] = useState('');

  // 1. Initial State Synchronization on mount
  useEffect(() => {
    // Theme setup from cache
    const savedTheme = safeStorage.getItem('SIANSOR_THEME');
    const prefersDark = typeof window !== 'undefined' && 
                        typeof window.matchMedia === 'function' && 
                        window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }

    // Load Local storage state first (for offline stability)
    const localData = safeStorage.getItem('SIANSOR_STATE_V7');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (parsed.peserta) setPeserta(parsed.peserta);
        if (parsed.sesi) setSesi(parsed.sesi);
        if (parsed.presensi) setPresensi(parsed.presensi);
        if (parsed.tim) setTim(parsed.tim);
        if (parsed.activeSesiId) setActiveSesiId(parsed.activeSesiId);
        if (parsed.branding) {
          let b = parsed.branding;
          if (b && (!b.logo || b.logo.includes('stroke-width="9"') || b.logo.includes('M30 40'))) {
            b = { ...b, logo: DEFAULT_BRANDING.logo };
          }
          setBranding(b);
        }
      } catch (e) {
        console.error("Local data parsing failed:", e);
      }
    }

    // Fetch dynamic configuration from the backend to support runtime container variables, then initialize connection
    const initConnection = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const config = await res.json();
          if (config.supabaseUrl && config.supabaseKey) {
            setApiEnvKeys(config.supabaseUrl, config.supabaseKey);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch runtime backend configuration:", e);
      }

      const { isCustom, isEnv } = getSupabaseKeys();
      const mode = isCustom ? 'custom' : (isEnv ? 'env' : 'none');
      setSupabaseMode(mode);

      if (mode !== 'none') {
        triggerSupabaseSync();
      }
    };

    initConnection();
  }, []);

  const triggerSupabaseSync = async () => {
    setIsSyncing(true);
    try {
      const data = await fetchAllFromSupabase();
      if (data) {
        if (data.errorType) {
          setSupabaseConnected(false);
          setSupabaseError(data.errorType);
          
          // Formulate a clean error description from returned errors
          const errorDetails = data.errors && Array.isArray(data.errors) 
            ? data.errors.map((e: any) => `${e.message || 'Error'} (Code: ${e.code || 'unknown'})`).join(', ')
            : '';

          setSupabaseErrorDetail(errorDetails);

          if (currentUser) {
            if (data.errorType === 'auth') {
              triggerAlert(
                "Koneksi Supabase Gagal",
                `Kunci API (Anon Key) atau URL Supabase Anda tidak valid. Silakan periksa kembali konfigurasi Anda. ${errorDetails ? `[Detail: ${errorDetails}]` : ''}`,
                "danger"
              );
            } else if (data.errorType === 'schema') {
              triggerAlert(
                "Tabel Database Belum Siap",
                `Koneksi berhasil, tetapi beberapa tabel tidak ditemukan atau bermasalah. ${errorDetails ? `[Detail: ${errorDetails}]` : ''}. Silakan salin & jalankan script SQL Schema di tab 'Kustomisasi Aplikasi' pada SQL Editor Supabase Anda untuk membuat semua tabel yang diperlukan!`,
                "warning"
              );
            } else if (data.errorType === 'connection') {
              triggerAlert(
                "Gangguan Koneksi Supabase",
                `Terjadi masalah koneksi atau error internal saat menghubungi database Supabase Anda. ${errorDetails ? `[Detail: ${errorDetails}]` : ''}`,
                "danger"
              );
            }
          }
          return;
        }

        setSupabaseConnected(true);
        setSupabaseError(null);
        setSupabaseErrorDetail('');

        // Cek apakah database Supabase kosong (misal baru dibuat atau di-reset)
        const isCloudEmpty = (!data.peserta || data.peserta.length === 0) && 
                             (!data.sesi || data.sesi.length === 0) &&
                             (!data.presensi || data.presensi.length === 0);
        
        const localDataStr = safeStorage.getItem('SIANSOR_STATE_V7');
        let localDataParsed: any = null;
        if (localDataStr) {
          try {
            localDataParsed = JSON.parse(localDataStr);
          } catch (e) {
            console.error("Local data parse error:", e);
          }
        }

        const hasLocalData = localDataParsed && (
          (localDataParsed.peserta && localDataParsed.peserta.length > 0) ||
          (localDataParsed.sesi && localDataParsed.sesi.length > 0) ||
          (localDataParsed.presensi && localDataParsed.presensi.length > 0) ||
          (localDataParsed.tim && localDataParsed.tim.length > 1) ||
          (localDataParsed.branding && localDataParsed.branding.appName !== DEFAULT_BRANDING.appName)
        );

        // Jika database Cloud kosong dan ada data lokal di browser, unggah data lokal ke Cloud (Upward Sync)
        if (isCloudEmpty && hasLocalData) {
          if (localDataParsed.peserta && localDataParsed.peserta.length > 0) {
            await syncPeserta(localDataParsed.peserta);
            setPeserta(localDataParsed.peserta);
          }
          if (localDataParsed.sesi && localDataParsed.sesi.length > 0) {
            await syncSesi(localDataParsed.sesi);
            setSesi(localDataParsed.sesi);
          }
          if (localDataParsed.presensi && localDataParsed.presensi.length > 0) {
            await syncPresensi(localDataParsed.presensi);
            setPresensi(localDataParsed.presensi);
          }
          if (localDataParsed.tim && localDataParsed.tim.length > 0) {
            await syncTim(localDataParsed.tim);
            setTim(localDataParsed.tim);
          }
          if (localDataParsed.branding) {
            await syncBranding(localDataParsed.branding);
            setBranding(localDataParsed.branding);
          }
          
          triggerAlert("Sinkronisasi Berhasil", "Data lokal Anda telah diunggah ke database Supabase Cloud yang kosong!", "success");
        } else {
          // Jika database Cloud sudah memiliki data, gunakan data Cloud (Downward Sync)
          setPeserta(data.peserta || []);
          setSesi(data.sesi || []);
          setPresensi(data.presensi || []);
          setTim(data.tim && data.tim.length > 0 ? data.tim : DEFAULT_TIM);
          
          let finalBranding = data.branding || branding;
          if (finalBranding && (
            !finalBranding.logo || 
            finalBranding.logo.includes('stroke-width="9"') || 
            finalBranding.logo.includes('M30 40')
          )) {
            finalBranding = {
              ...finalBranding,
              logo: DEFAULT_BRANDING.logo
            };
            await syncBranding(finalBranding);
          }
          setBranding(finalBranding);

          // Simpan data dari Cloud ke Local Storage agar sinkron
          const current = {
            peserta: data.peserta || [],
            sesi: data.sesi || [],
            presensi: data.presensi || [],
            tim: data.tim && data.tim.length > 0 ? data.tim : DEFAULT_TIM,
            activeSesiId,
            branding: finalBranding,
          };
          safeStorage.setItem('SIANSOR_STATE_V7', JSON.stringify(current));

          triggerAlert("Sync Berhasil", "Basis data disinkronkan sepenuhnya dari Supabase Cloud!", "success");
        }
      } else {
        setSupabaseConnected(false);
        setSupabaseError(null);
      }
    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- ACTIONS: SINKRONISASI MANUAL PAKSA (HIGH RELIABILITY) ---
  const handleForceUploadToSupabase = async () => {
    if (!supabaseConnected) {
      triggerAlert("Koneksi Offline", "Tidak dapat mengunggah data karena aplikasi tidak terhubung ke Supabase.", "danger");
      return;
    }

    triggerConfirm(
      "Unggah Paksa ke Cloud",
      "Apakah Anda yakin ingin menimpa seluruh data di database Supabase dengan data lokal dari browser Anda? Tindakan ini akan mengunggah data kader, sesi, presensi, tim operator, dan branding visual saat ini ke database cloud.",
      async (yes) => {
        if (!yes) return;
        
        try {
          // Sync all tables to Supabase
          const okPeserta = await syncPeserta(peserta);
          const okSesi = await syncSesi(sesi);
          const okPresensi = await syncPresensi(presensi);
          const okTim = await syncTim(tim);
          const okBranding = await syncBranding(branding);

          if (okPeserta && okSesi && okPresensi && okTim && okBranding) {
            triggerAlert("Unggah Sukses", "Seluruh data lokal berhasil disinkronkan dan diunggah ke database Supabase Cloud!", "success");
          } else {
            triggerAlert("Unggah Sebagian", "Beberapa data mungkin gagal diunggah. Silakan periksa koneksi atau schema tabel database Anda.", "warning");
          }
        } catch (e) {
          console.error("Force upload error:", e);
          triggerAlert("Gagal Sinkronisasi", "Terjadi kesalahan saat mengunggah data ke database cloud.", "danger");
        }
      }
    );
  };

  const handleForceDownloadFromSupabase = async () => {
    if (!supabaseConnected) {
      triggerAlert("Koneksi Offline", "Tidak dapat mengunduh data karena aplikasi tidak terhubung ke Supabase.", "danger");
      return;
    }

    triggerConfirm(
      "Unduh Paksa dari Cloud",
      "Apakah Anda yakin ingin mengambil seluruh data dari database Supabase dan menimpa data lokal di browser saat ini? Data lokal di browser Anda saat ini akan sepenuhnya digantikan oleh data cloud.",
      async (yes) => {
        if (!yes) return;

        try {
          const data = await fetchAllFromSupabase();
          if (data) {
            if (data.errorType) {
              triggerAlert("Gagal Sinkronisasi", "Koneksi ke database bermasalah atau tabel tidak ditemukan.", "danger");
              return;
            }

            setPeserta(data.peserta || []);
            setSesi(data.sesi || []);
            setPresensi(data.presensi || []);
            setTim(data.tim && data.tim.length > 0 ? data.tim : DEFAULT_TIM);
            if (data.branding) setBranding(data.branding);

            const current = {
              peserta: data.peserta || [],
              sesi: data.sesi || [],
              presensi: data.presensi || [],
              tim: data.tim && data.tim.length > 0 ? data.tim : DEFAULT_TIM,
              activeSesiId,
              branding: data.branding || branding,
            };
            safeStorage.setItem('SIANSOR_STATE_V7', JSON.stringify(current));

            triggerAlert("Unduh Sukses", "Data database cloud berhasil disinkronkan sepenuhnya ke browser lokal Anda!", "success");
          } else {
            triggerAlert("Gagal Ambil Data", "Gagal mengunduh data dari database cloud. Periksa koneksi internet.", "danger");
          }
        } catch (e) {
          console.error("Force download error:", e);
          triggerAlert("Gagal Sinkronisasi", "Terjadi kesalahan saat mengunduh data dari database cloud.", "danger");
        }
      }
    );
  };

  // 2. State modification handlers
  const saveStateToLocalStorage = (newState: Partial<SystemState>) => {
    const current = {
      peserta,
      sesi,
      presensi,
      tim,
      activeSesiId,
      branding,
      ...newState
    };
    safeStorage.setItem('SIANSOR_STATE_V7', JSON.stringify(current));
  };

  const triggerAlert = (title: string, message: string, type: 'success' | 'warning' | 'danger') => {
    setCustomAlert({ isOpen: true, title, message, type });
  };

  const triggerConfirm = (title: string, message: string, callback: (yes: boolean) => void) => {
    setCustomConfirm({ isOpen: true, title, message, callback });
  };

  // --- ACTIONS: PESERTA ---
  const handleSavePeserta = async (p: Peserta, originalId?: string) => {
    const isIdRenamed = originalId && originalId !== p.id;
    
    if (isIdRenamed || !originalId) {
      const isTaken = peserta.some(k => k.id === p.id && k.id !== originalId);
      if (isTaken) {
        triggerAlert("Error ID Duplikat", `Nomor ID/Card "${p.id}" sudah digunakan oleh peserta lain.`, "danger");
        return;
      }
    }

    let newList = [...peserta];
    let newPresensi = [...presensi];

    if (isIdRenamed) {
      newList = peserta.map(k => k.id === originalId ? p : k);
      newPresensi = presensi.map(pr => pr.id === originalId ? { ...pr, id: p.id } : pr);
      
      setPeserta(newList);
      setPresensi(newPresensi);
      saveStateToLocalStorage({ peserta: newList, presensi: newPresensi });

      if (supabaseConnected) {
        await deletePesertaFromSupabase(originalId);
        await deleteRekapKelulusanFromSupabase(originalId);
        
        const okPeserta = await syncPeserta([p]);
        const okPresensi = await syncPresensi(newPresensi);
        await syncRekapToSupabase(newList);
        
        if (okPeserta && okPresensi) {
          triggerAlert("Data Disimpan", `ID / CARD peserta berhasil diubah dari "${originalId}" menjadi "${p.id}".`, "success");
        } else {
          triggerAlert("Data Disimpan", `Data terupdate dengan beberapa sinkronisasi cloud tertunda.`, "warning");
        }
      } else {
        triggerAlert("Data Disimpan", `ID / CARD peserta berhasil diubah dari "${originalId}" menjadi "${p.id}" secara lokal.`, "success");
      }
    } else {
      const isNew = !peserta.some(k => k.id === p.id);
      newList = isNew ? [...peserta, p] : peserta.map(k => k.id === p.id ? p : k);
      
      setPeserta(newList);
      saveStateToLocalStorage({ peserta: newList });

      if (supabaseConnected) {
        const ok = await syncPeserta([p]);
        await syncRekapToSupabase(newList);
        if (ok) triggerAlert("Data Disimpan", `Data kader ${p.nama} tersimpan secara real-time.`, "success");
      } else {
        triggerAlert("Data Disimpan", `Data kader ${p.nama} tersimpan di penyimpanan lokal.`, "success");
      }
    }
  };

  const handleDeletePeserta = (id: string) => {
    triggerConfirm("Hapus Anggota", "Yakin ingin menghapus data kader ini secara permanen dari server?", async (yes) => {
      if (!yes) return;
      
      const newList = peserta.filter(k => k.id !== id);
      const newPresensi = presensi.filter(pr => pr.id !== id);
      
      setPeserta(newList);
      setPresensi(newPresensi);
      saveStateToLocalStorage({ peserta: newList, presensi: newPresensi });

      if (supabaseConnected) {
        await deletePesertaFromSupabase(id);
        await deleteRekapKelulusanFromSupabase(id);
        await syncPresensi(newPresensi);
      }
      triggerAlert("Hapus Berhasil", "Data kader telah dihapus dari sistem.", "success");
    });
  };

  // --- ACTIONS: SESI ---
  const handleSaveSesi = async (s: Sesi) => {
    const isNew = !sesi.some(x => x.num === s.num);
    const newList = isNew ? [...sesi, s] : sesi.map(x => x.num === s.num ? s : x);
    
    setSesi(newList);
    saveStateToLocalStorage({ sesi: newList });

    if (supabaseConnected) {
      await syncSesi([s]);
    }
    triggerAlert("Sesi Disimpan", `Konfigurasi Sesi ${s.num} berhasil tersimpan.`, "success");
  };

  const handleDeleteSesi = (num: number) => {
    triggerConfirm("Hapus Sesi", `Yakin ingin menghapus Sesi ${num} dari jadwal program?`, async (yes) => {
      if (!yes) return;
      
      const newList = sesi.filter(x => x.num !== num);
      setSesi(newList);
      saveStateToLocalStorage({ sesi: newList });

      if (supabaseConnected) {
        await deleteSesiFromSupabase(num);
      }
      triggerAlert("Sesi Terhapus", `Modul pengajaran Sesi ${num} ditiadakan.`, "success");
    });
  };

  const handleSetActiveSesi = async (num: number) => {
    const updated = sesi.map(s => ({ ...s, active: s.num === num }));
    setSesi(updated);
    setActiveSesiId(num);
    saveStateToLocalStorage({ sesi: updated, activeSesiId: num });

    if (supabaseConnected) {
      await syncSesi(updated);
    }
  };

  // --- ACTIONS: PRESENSI ---
  const handleRecordPresence = async (pesertaId: string, statusOverride?: "Tepat Waktu" | "Terlambat") => {
    const p = peserta.find(k => k.id === pesertaId);
    if (!p) return;

    const currentSesi = sesi.find(s => s.num === activeSesiId) || sesi[0];
    const isDouble = presensi.some(pr => pr.id === p.id && pr.sesi === activeSesiId);

    if (isDouble) {
      triggerAlert("Duplikasi Presensi", `${p.nama} sudah tercatat hadir pada Sesi ${activeSesiId}!`, "warning");
      return;
    }

    const d = new Date();
    const bln = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const waktuStr = `${d.getDate()} ${bln[d.getMonth()]} 2026 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

    let finalStatus: "Tepat Waktu" | "Terlambat" = "Tepat Waktu";
    if (statusOverride) {
      finalStatus = statusOverride;
    } else if (currentSesi?.startTime) {
      const parts = currentSesi.startTime.split(":");
      const maxLimit = parseInt(parts[0]) * 60 + parseInt(parts[1]) + (currentSesi.maxLate || 10);
      const nowMin = d.getHours() * 60 + d.getMinutes();
      if (nowMin > maxLimit) {
        finalStatus = "Terlambat";
      }
    }

    const newRow: Presensi = {
      id: p.id,
      nama: p.nama,
      utusan: p.utusan,
      materi: currentSesi?.materi || "Topik Pembahasan",
      waktu: waktuStr,
      status: finalStatus,
      sesi: activeSesiId
    };

    const newLogs = [...presensi, newRow];
    setPresensi(newLogs);
    saveStateToLocalStorage({ presensi: newLogs });

    if (supabaseConnected) {
      await syncPresensi(newLogs);
    }

    triggerAlert("Absen Sukses", `${p.nama} tercatat hadir pada Sesi ${activeSesiId} (${finalStatus})`, "success");
  };

  // --- ACTIONS: EVALUASI ACADEMIS ---
  const syncRekapToSupabase = async (listPeserta: Peserta[]) => {
    if (!supabaseConnected) return;
    try {
      const totalDuration = sesi.reduce((acc, s) => acc + (s.duration || 0), 0) || 1;
      const rekapList = listPeserta.map(p => {
        const presentSesiNums = presensi.filter(pr => pr.id === p.id).map(pr => pr.sesi);
        let attendedMinutes = 0;
        sesi.forEach(s => {
          if (presentSesiNums.includes(s.num)) {
            attendedMinutes += (s.duration || 0);
          }
        });
        const pct = Math.round((attendedMinutes / totalDuration) * 100) || 0;
        return {
          id: p.id,
          nama: p.nama,
          utusan: p.utusan,
          total_hadir_menit: attendedMinutes,
          persentase_kehadiran: pct,
          izin_menit: p.izin_menit || 0,
          evaluasi_sistem: p.status_kelulusan,
          no_sertifikat: p.no_sertifikat || '',
          status_kelulusan: p.status_kelulusan
        };
      });
      await syncRekapKelulusan(rekapList);
    } catch (e) {
      console.error("Failed to sync rekap kelulusan:", e);
    }
  };

  const handleSaveEvaluasi = async (id: string, updates: Partial<Peserta>) => {
    const newList = peserta.map(p => p.id === id ? { ...p, ...updates } : p);
    setPeserta(newList);
    saveStateToLocalStorage({ peserta: newList });

    if (supabaseConnected) {
      const matched = newList.find(x => x.id === id);
      if (matched) {
        await syncPeserta([matched]);
        await syncRekapToSupabase(newList);
      }
    }
  };

  const handleBulkUpdateKelulusan = async (updatedPelestari: Peserta[]) => {
    setPeserta(updatedPelestari);
    saveStateToLocalStorage({ peserta: updatedPelestari });

    if (supabaseConnected) {
      await syncPeserta(updatedPelestari);
      await syncRekapToSupabase(updatedPelestari);
    }
    triggerAlert("Evaluasi Rampung", "Model AI Decision Tree C4.5 berhasil memperbarui status seluruh kader.", "success");
  };

  // --- ACTIONS: TIM ---
  const handleSaveTim = async (t: Tim, index?: number) => {
    let newList = [...tim];
    if (index !== undefined) {
      newList[index] = t;
    } else {
      newList.push(t);
    }

    setTim(newList);
    saveStateToLocalStorage({ tim: newList });

    if (supabaseConnected) {
      await syncTim([t]);
    }
    triggerAlert("Kru Operator Disimpan", `Data tim pelaksana dengan Username ${t.username} berhasil disimpan.`, "success");
  };

  const handleDeleteTim = async (index: number) => {
    const target = tim[index];
    if (target.username === 'admin') {
      triggerAlert("Aksi Terlarang", "Admin utama wilayah tidak dapat dihapus.", "danger");
      return;
    }

    triggerConfirm("Hapus Kru", `Yakin ingin mencabut hak akses operator ${target.nama}?`, async (yes) => {
      if (!yes) return;

      const newList = tim.filter((_, i) => i !== index);
      setTim(newList);
      saveStateToLocalStorage({ tim: newList });

      if (supabaseConnected) {
        await deleteTimFromSupabase(target.username);
      }
      triggerAlert("Hapus Operator", "Akses operator berhasil dicabut.", "success");
    });
  };

  // --- ACTIONS: BRANDING ---
  const handleSaveBranding = async (b: Branding) => {
    setBranding(b);
    saveStateToLocalStorage({ branding: b });

    if (supabaseConnected) {
      await syncBranding(b);
    }
    triggerAlert("Visual Disimpan", "Perubahan setelan visual branding sukses diterapkan.", "success");
  };

  const handleSaveSupabaseKeys = (url: string, key: string) => {
    if (url && key) {
      safeStorage.setItem('SIANSOR_SUPABASE_URL', url);
      safeStorage.setItem('SIANSOR_SUPABASE_KEY', key);
      setSupabaseMode('custom');
      
      triggerConfirm("Terapkan Supabase", "Konfigurasi Supabase kustom disimpan. Lakukan reload sinkronisasi sekarang?", (yes) => {
        if (!yes) return;
        resetSupabaseClient();
        triggerSupabaseSync();
      });
    } else {
      safeStorage.removeItem('SIANSOR_SUPABASE_URL');
      safeStorage.removeItem('SIANSOR_SUPABASE_KEY');
      resetSupabaseClient();
      
      const { isEnv } = getSupabaseKeys();
      if (isEnv) {
        setSupabaseMode('env');
        triggerSupabaseSync();
        triggerAlert("Kustom Dilepas", "Kunci kustom dihapus. Beralih kembali menggunakan Environment Keys bawaan.", "success");
      } else {
        setSupabaseMode('none');
        setSupabaseConnected(false);
        setSupabaseError(null);
        triggerAlert("Koneksi Diputus", "Database kustom dilepas. Program berjalan offline kembali.", "warning");
      }
    }
  };

  // --- THEME ---
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      safeStorage.setItem('SIANSOR_THEME', 'dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
      safeStorage.setItem('SIANSOR_THEME', 'light');
    }
  };

  // --- SYSTEM RESET ---
  const handleResetCache = () => {
    triggerConfirm("Reset Data Lokal", "Apakah Anda yakin ingin mengatur ulang cache aplikasi dan mengembalikannya ke demo bawaan?", () => {
      safeStorage.removeItem('SIANSOR_STATE_V7');
      safeStorage.removeItem('SIANSOR_SUPABASE_URL');
      safeStorage.removeItem('SIANSOR_SUPABASE_KEY');
      
      setPeserta(DEFAULT_PESERTA);
      setSesi(DEFAULT_SESI);
      setPresensi(DEFAULT_PRESENSI);
      setTim(DEFAULT_TIM);
      setBranding(DEFAULT_BRANDING);
      setActiveSesiId(1);
      setSupabaseConnected(false);
      setSupabaseMode('none');
      setCurrentUser(null);
      resetSupabaseClient();
      triggerAlert("Reset Berhasil", "Basis data lokal sukses dikembalikan ke kondisi awal.", "success");
    });
  };

  // --- PRINT ID QR ---
  const handleOpenPrintQr = async (id: string) => {
    try {
      const qrData = await QRCode.toDataURL(id, { margin: 1, width: 180 });
      setCardQrIdDataUrl(qrData);
      setPrintQrId(id);
    } catch (e) {
      console.error("QR Code generation error:", e);
    }
  };

  // --- AUTH ROUTING ---
  if (!currentUser) {
    return (
      <LoginScreen
        tim={tim}
        branding={branding}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          triggerAlert("Akses Diterima", `Ahlan Wa Sahlan, Sahabat ${user.nama}!`, "success");
          // Automatically trigger sync immediately upon login
          setTimeout(() => {
            triggerSupabaseSync();
          }, 100);
        }}
      />
    );
  }

  // Permissions validation
  const isAdmin = currentUser.role === 'Admin';
  const perms = currentUser.permissions || [];

  const canDash = isAdmin || perms.includes('dash');
  const canScan = isAdmin || perms.includes('scan');
  const canSesi = isAdmin || perms.includes('sesi'); // Tambah Sesi permission check
  const canPeserta = isAdmin || perms.includes('peserta');
  const canRekap = isAdmin || perms.includes('rekap'); // Rekap Data permission check
  const canKelulusan = isAdmin || perms.includes('kelulusan');

  const handleLogout = () => {
    triggerConfirm("Ke luar Akun", "Yakin ingin keluar dari panel operator?", (yes) => {
      if (yes) {
        setCurrentUser(null);
        setActiveTab('dash');
      }
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-navy-950 font-sans transition-colors duration-350">
      
      {/* SIDEBAR FOR DESKTOP & MOBILE */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-900 border-r border-slate-850 shadow-2xl transition-all duration-300 overflow-hidden md:static md:flex-shrink-0 ${
        isSidebarCollapsed 
          ? 'w-0 md:w-0 opacity-0 border-r-0 pointer-events-none' 
          : 'w-72 md:w-72 opacity-100'
      } ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Brand Banner */}
        <div className="flex h-20 items-center px-6 border-b border-slate-800 gap-3">
          <div className="bg-white p-2 rounded-xl text-white shadow-lg flex items-center justify-center shrink-0 w-11 h-11">
            {branding && branding.logo && (typeof branding.logo === 'string') && (branding.logo.trim().startsWith('<svg') || branding.logo.trim().startsWith('<div')) ? (
              <div dangerouslySetInnerHTML={{ __html: branding.logo }} className="text-slate-900 scale-110 flex items-center justify-center w-7 h-7" />
            ) : branding && branding.logo ? (
              <img src={branding.logo} alt="Logo" className="w-7 h-7 object-contain rounded-md" referrerPolicy="no-referrer" />
            ) : null}
          </div>
          <div className="truncate">
            <h1 className="font-extrabold text-sm tracking-tight text-white uppercase">{branding.appName}</h1>
            <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">{branding.organisasi}</p>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
          {canDash && (
            <button
              onClick={() => { setActiveTab('dash'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'dash' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span>Dashboard</span>
            </button>
          )}

          {canScan && (
            <button
              onClick={() => { setActiveTab('scan'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'scan' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <QrCode className="w-4.5 h-4.5" />
              <span>Scan Presensi</span>
            </button>
          )}

          {canSesi && (
            <button
              onClick={() => { setActiveTab('sesi'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'sesi' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Calendar className="w-4.5 h-4.5" />
              <span>Kelola Sesi</span>
            </button>
          )}

          {canPeserta && (
            <button
              onClick={() => { setActiveTab('peserta'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'peserta' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Users className="w-4.5 h-4.5" />
              <span>Data Peserta</span>
            </button>
          )}

          {canRekap && (
            <button
              onClick={() => { setActiveTab('rekap'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'rekap' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <ScrollText className="w-4.5 h-4.5" />
              <span>Rekap Presensi</span>
            </button>
          )}

          {canKelulusan && (
            <button
              onClick={() => { setActiveTab('kelulusan'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                activeTab === 'kelulusan' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Award className="w-4.5 h-4.5" />
              <span>Rekap Kelulusan</span>
            </button>
          )}

          {isAdmin && (
            <>
              <button
                onClick={() => { setActiveTab('tim'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'tim' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4.5 h-4.5" />
                <span>Manajemen Tim</span>
              </button>

              <button
                onClick={() => { setActiveTab('custom'); setIsSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'custom' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <Sliders className="w-4.5 h-4.5" />
                <span>Kustomisasi</span>
              </button>
            </>
          )}

        </nav>

        {/* Profile Operator Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 truncate">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-900 flex items-center justify-center font-black text-sm shrink-0 shadow-lg select-none">
                {currentUser.nama.charAt(0).toUpperCase()}
              </div>
              <div className="truncate text-xs">
                <p className="font-extrabold text-white truncate leading-tight">{currentUser.nama}</p>
                <span className="text-[9px] text-emerald-400 block font-bold uppercase tracking-widest mt-0.5">{currentUser.role === 'Admin' ? 'Super Admin' : 'Operator'}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-500 transition-all"
              title="Logout Sesi"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-grow flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* TOP NAVBAR */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-205 dark:border-navy-850 px-6 flex items-center justify-between shrink-0 z-20 transition-colors duration-350 shadow-xs">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setIsSidebarOpen(!isSidebarOpen);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              }}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-navy-950 transition flex items-center justify-center shrink-0"
              title="Sembunyikan / Tampilkan Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="truncate">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest font-sans">
                {activeTab === 'dash' && 'Dashboard Utama_'}
                {activeTab === 'scan' && 'Scan Kehadiran Kader_'}
                {activeTab === 'sesi' && 'Silabus Sesi Pelatihan_'}
                {activeTab === 'peserta' && 'Daftar Anggota Kader_'}
                {activeTab === 'rekap' && 'Laporan Rekap Presensi_'}
                {activeTab === 'kelulusan' && 'Hasil Evaluasi Kelulusan_'}
                {activeTab === 'tim' && 'Hak Akses Operator_'}
                {activeTab === 'custom' && 'Kustomisasi Aplikasi_'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {/* Theme toggle indicator */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-505 dark:text-slate-400 dark:hover:bg-navy-950 hover:bg-slate-50 transition border border-transparent"
              title="Ubah Mode Visual"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Supabase status indicator */}
            <span className={`flex items-center space-x-1.5 border text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
              supabaseConnected 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30' 
                : 'bg-amber-50 border-amber-250/20 text-amber-500 dark:bg-amber-950/20'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <span>{supabaseConnected ? 'Online Mode' : 'Offline Mode'}</span>
            </span>
          </div>
        </header>

        {/* SCROLLABLE VIEWPORT */}
        <main className="flex-grow overflow-y-auto p-6 space-y-6 pb-24 md:pb-6 custom-scrollbar">
          
          {activeTab === 'dash' && (
            <DashboardTab
              peserta={peserta}
              sesi={sesi}
              presensi={presensi}
              branding={branding}
              activeSesiId={activeSesiId}
              onResetCache={handleResetCache}
              supabaseConnected={supabaseConnected}
              supabaseMode={supabaseMode}
              onRetrySync={triggerSupabaseSync}
              isSyncing={isSyncing}
            />
          )}

          {activeTab === 'scan' && (
            <ScanTab
              peserta={peserta}
              sesi={sesi}
              presensi={presensi}
              branding={branding}
              onRecordPresence={handleRecordPresence}
              activeSesiId={activeSesiId}
            />
          )}

          {activeTab === 'sesi' && (
            <SesiTab
              sesi={sesi}
              onSaveSesi={handleSaveSesi}
              onDeleteSesi={handleDeleteSesi}
              onSetActiveSesi={handleSetActiveSesi}
              currentUserRole={currentUser.role}
              currentUserPermissions={currentUser.permissions}
            />
          )}

          {activeTab === 'peserta' && (
            <PesertaTab
              peserta={peserta}
              branding={branding}
              onSavePeserta={handleSavePeserta}
              onDeletePeserta={handleDeletePeserta}
              onPrintQr={handleOpenPrintQr}
            />
          )}

          {activeTab === 'rekap' && (
            <RekapTab
              presensi={presensi}
              sesi={sesi}
              branding={branding}
              currentUserRole={currentUser.role}
              currentUserPermissions={currentUser.permissions}
              currentUserName={currentUser.nama}
            />
          )}

          {activeTab === 'kelulusan' && (
            <KelulusanTab
              peserta={peserta}
              sesi={sesi}
              presensi={presensi}
              branding={branding}
              onSaveEvaluasi={handleSaveEvaluasi}
              onBulkUpdateKelulusan={handleBulkUpdateKelulusan}
              currentUserRole={currentUser.role}
              currentUserPermissions={currentUser.permissions}
              currentUserName={currentUser.nama}
            />
          )}

          {activeTab === 'tim' && (
            <TimTab
              tim={tim}
              onSaveTim={handleSaveTim}
              onDeleteTim={handleDeleteTim}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'custom' && (
            <CustomTab
              branding={branding}
              onSaveBranding={handleSaveBranding}
              onSaveSupabaseKeys={handleSaveSupabaseKeys}
              supabaseConnected={supabaseConnected}
              supabaseMode={supabaseMode}
              supabaseError={supabaseError}
              supabaseErrorDetail={supabaseErrorDetail}
              onForceUpload={handleForceUploadToSupabase}
              onForceDownload={handleForceDownloadFromSupabase}
              onRetrySync={triggerSupabaseSync}
            />
          )}

        </main>

      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-205 dark:border-navy-850 fixed bottom-0 inset-x-0 py-2.5 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-30 md:hidden overflow-x-auto custom-scrollbar">
        <div className="min-w-[420px] max-w-md mx-auto grid grid-cols-6 gap-1 px-3 text-center whitespace-nowrap text-slate-500">
          
          {canDash && (
            <button
              onClick={() => setActiveTab('dash')}
              className={`flex flex-col items-center space-y-1 ${activeTab === 'dash' ? 'text-emerald-500' : 'text-slate-400'}`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              <span className="text-[8px] font-black uppercase tracking-wider">Dashboard</span>
            </button>
          )}

          {canScan && (
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex flex-col items-center space-y-1 ${activeTab === 'scan' ? 'text-emerald-500' : 'text-slate-400'}`}
            >
              <QrCode className="w-4.5 h-4.5" />
              <span className="text-[8px] font-black uppercase tracking-wider">Scan</span>
            </button>
          )}

          {canSesi && (
            <button
              onClick={() => setActiveTab('sesi')}
              className={`flex flex-col items-center space-y-1 ${activeTab === 'sesi' ? 'text-emerald-500' : 'text-slate-400'}`}
            >
              <Calendar className="w-4.5 h-4.5" />
              <span className="text-[8px] font-black uppercase tracking-wider">Sesi</span>
            </button>
          )}

          {canPeserta && (
            <button
              onClick={() => setActiveTab('peserta')}
              className={`flex flex-col items-center space-y-1 ${activeTab === 'peserta' ? 'text-emerald-500' : 'text-slate-400'}`}
            >
              <Users className="w-4.5 h-4.5" />
              <span className="text-[8px] font-black uppercase tracking-wider">Kader</span>
            </button>
          )}

          {canRekap && (
            <button
              onClick={() => setActiveTab('rekap')}
              className={`flex flex-col items-center space-y-1 ${activeTab === 'rekap' ? 'text-emerald-500' : 'text-slate-400'}`}
            >
              <ScrollText className="w-4.5 h-4.5" />
              <span className="text-[8px] font-black uppercase tracking-wider">Rekap</span>
            </button>
          )}

          {canKelulusan && (
            <button
              onClick={() => setActiveTab('kelulusan')}
              className={`flex flex-col items-center space-y-1 ${activeTab === 'kelulusan' ? 'text-emerald-500' : 'text-slate-400'}`}
            >
              <Award className="w-4.5 h-4.5" />
              <span className="text-[8px] font-black uppercase tracking-wider">Lulus</span>
            </button>
          )}

        </div>
      </footer>

      {/* SYSTEM CONFIRM OVERLAY */}
      {customConfirm.isOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xs shadow-2xl p-5 border border-slate-200 dark:border-navy-850 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-100 dark:border-amber-900/10">
              <HelpCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">{customConfirm.title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-semibold">{customConfirm.message}</p>
            </div>
            <div className="flex space-x-2 pt-1.5">
              <button
                onClick={() => {
                  if (customConfirm.callback) customConfirm.callback(false);
                  setCustomConfirm({ isOpen: false, title: '', message: '', callback: null });
                }}
                className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-navy-950 dark:hover:bg-navy-900 text-slate-500 dark:text-slate-400 font-bold rounded-lg text-xs transition border border-slate-200 dark:border-navy-850"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (customConfirm.callback) customConfirm.callback(true);
                  setCustomConfirm({ isOpen: false, title: '', message: '', callback: null });
                }}
                className="flex-grow py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition shadow-sm"
              >
                Ya, Proses
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM ALERT OVERLAY */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xs shadow-2xl p-5 border border-slate-200 dark:border-navy-850 text-center space-y-3">
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center border ${
              customAlert.type === 'success' 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/10' 
                : (customAlert.type === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/10' : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/10')
            }`}>
              {customAlert.type === 'success' && <CheckCircle className="w-6 h-6" />}
              {customAlert.type === 'warning' && <AlertTriangle className="w-6 h-6 animate-bounce" />}
              {customAlert.type === 'danger' && <XCircle className="w-6 h-6 animate-pulse" />}
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">{customAlert.title}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-semibold">{customAlert.message}</p>
            </div>
            <button
              onClick={() => setCustomAlert({ isOpen: false, title: '', message: '', type: 'success' })}
              className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-lg text-xs transition uppercase"
            >
              Oke, Mengerti
            </button>
          </div>
        </div>
      )}

      {/* MODAL PRINT ID QR CARD (POPUP DIALOG) */}
      {printQrId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] w-full max-w-sm shadow-2xl border border-slate-205 dark:border-navy-800 overflow-hidden transform transition duration-150 scale-100">
            
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-navy-850 flex justify-between items-center bg-white dark:bg-slate-900">
              <h4 className="font-extrabold text-xs uppercase tracking-widest text-emerald-700 dark:text-emerald-500">
                KADERISASI CARD ID
              </h4>
              <button
                onClick={() => setPrintQrId(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-navy-950 rounded-lg text-slate-500 transition"
              >
                <XCircle className="w-5 h-5 text-slate-405" />
              </button>
            </div>

            <div className="p-6 space-y-5 bg-slate-50 dark:bg-slate-950">
              <div id="print-card-area" className="border border-slate-200 dark:border-navy-850 rounded-2xl p-6 bg-white dark:bg-slate-900 text-center shadow-sm space-y-4">
                <div className="flex justify-center">
                  {peserta.find(k => k.id === printQrId)?.foto ? (
                    <img 
                      src={peserta.find(k => k.id === printQrId)?.foto} 
                      className="w-20 h-20 rounded-full object-cover shrink-0 shadow-sm border border-slate-200 dark:border-navy-800" 
                      alt="Avatar" 
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-navy-950 text-slate-400 flex items-center justify-center font-black text-xl shrink-0 shadow-sm border border-slate-200 dark:border-navy-800">
                      {peserta.find(k => k.id === printQrId)?.nama.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="text-base font-extrabold text-slate-905 dark:text-white uppercase leading-tight font-sans">
                    {peserta.find(k => k.id === printQrId)?.nama}
                  </h5>
                  <p className="text-xs text-slate-505 dark:text-slate-400 font-semibold mt-0.5">
                    {branding.delegationType || 'PAC'} {peserta.find(k => k.id === printQrId)?.utusan}
                  </p>
                </div>
                <div className="flex justify-center bg-white p-2.5 rounded-xl border border-slate-100 inline-block mx-auto shadow-inner">
                  {cardQrDataUrl && <img src={cardQrDataUrl} className="w-36 h-36" alt="Card QR" />}
                </div>
                <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tracking-wider">
                  {printQrId}
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    const k = peserta.find(x => x.id === printQrId);
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>ID_Card_${k?.nama}</title>
                          <style>
                            body { display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
                            .card { border: 1px solid #ddd; padding: 25px; border-radius: 16px; text-align: center; width: 280px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                            .photo-container { display: flex; justify-content: center; margin-bottom: 15px; }
                            .photo { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 1px solid #ddd; }
                            .initial-photo { width: 80px; height: 80px; border-radius: 50%; border: 1px solid #ddd; background: #f1f5f9; color: #64748b; font-size: 24px; font-weight: bold; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
                            .name { font-size: 16px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
                            .sub { font-size: 11px; color: #666; margin-bottom: 15px; }
                            img.qr { width: 140px; height: 140px; }
                          </style>
                        </head>
                        <body>
                          <div class="card">
                            <div class="photo-container">
                              ${k?.foto ? `<img class="photo" src="${k.foto}" />` : `<div class="initial-photo">${k?.nama.charAt(0)}</div>`}
                            </div>
                            <div class="name">${k?.nama}</div>
                            <div class="sub">${branding.delegationType || 'PAC'} ${k?.utusan}</div>
                            <img class="qr" src="${cardQrDataUrl}" />
                            <div style="font-family: monospace; font-size: 9px; margin-top: 10px; color: #999;">${printQrId}</div>
                          </div>
                          <script>
                            window.onload = function() { window.print(); window.close(); };
                          <\/script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                  className="w-full py-3 bg-slate-900 dark:bg-slate-950 text-white font-extrabold rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-md hover:bg-slate-800"
                >
                  <Printer className="w-4 h-4" />
                  <span>CETAK ID CARD</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* GLOBAL SINKRONISASI LOADING OVERLAY */}
      {isSyncing && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xs shadow-2xl p-6 border border-slate-200 dark:border-navy-850 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 border border-emerald-100 dark:border-emerald-900/10 flex items-center justify-center">
              <RefreshCw className="w-7 h-7 animate-spin text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest animate-pulse">Menghubungkan Database</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-semibold">
                Sedang menyinkronkan data presensi & silabus dengan basis data cloud Supabase...
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-navy-950 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-full w-2/3 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
