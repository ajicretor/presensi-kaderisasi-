import React, { useState, useMemo } from 'react';
import {
  Users,
  CalendarCheck,
  Clock,
  AlertCircle,
  Shield,
  MapPin,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  HeartHandshake,
  Settings,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Peserta, Sesi, Presensi, Branding } from '../types';
import LeafletMap from './LeafletMap';

// Coordinates of Bogor Regency (Kabupaten Bogor) subdistricts (Kecamatan)
const BOGOR_KECAMATAN_COORDS: Record<string, { lat: number; lng: number }> = {
  'cibinong': { lat: -6.4827, lng: 106.8494 },
  'gunung putri': { lat: -6.4385, lng: 106.9171 },
  'citeureup': { lat: -6.4950, lng: 106.8795 },
  'ciawi': { lat: -6.6575, lng: 106.8580 },
  'parungpanjang': { lat: -6.3475, lng: 106.5921 },
  'leuwiliang': { lat: -6.5684, lng: 106.6111 },
  'babakan madang': { lat: -6.5786, lng: 106.8686 },
  'bojonggede': { lat: -6.4875, lng: 106.7903 },
  'ciampea': { lat: -6.5567, lng: 106.6972 },
  'cigombong': { lat: -6.7411, lng: 106.8117 },
  'cigudeg': { lat: -6.5414, lng: 106.5294 },
  'cijeruk': { lat: -6.6806, lng: 106.7928 },
  'cileungsi': { lat: -6.4025, lng: 106.9631 },
  'ciomas': { lat: -6.6019, lng: 106.7644 },
  'cisarua': { lat: -6.6953, lng: 106.9406 },
  'ciseeng': { lat: -6.4522, lng: 106.7025 },
  'dramaga': { lat: -6.5931, lng: 106.7325 },
  'gunung sindur': { lat: -6.3986, lng: 106.6947 },
  'jasinga': { lat: -6.4831, lng: 106.4561 },
  'jonggol': { lat: -6.4678, lng: 107.0394 },
  'kemang': { lat: -6.4967, lng: 106.7511 },
  'klapanunggal': { lat: -6.4667, lng: 106.9453 },
  'megamendung': { lat: -6.6539, lng: 106.9158 },
  'nanggung': { lat: -6.6186, lng: 106.5264 },
  'pamijahan': { lat: -6.6664, lng: 106.6558 },
  'parung': { lat: -6.4344, lng: 106.7262 },
  'rancabungur': { lat: -6.5186, lng: 106.7347 },
  'rumpin': { lat: -6.4467, lng: 106.6347 },
  'sukajaya': { lat: -6.5986, lng: 106.4561 },
  'sukamakmur': { lat: -6.6086, lng: 107.0131 },
  'sukaraja': { lat: -6.5706, lng: 106.8378 },
  'tajurhalang': { lat: -6.4664, lng: 106.7444 },
  'tamansari': { lat: -6.6567, lng: 106.7725 },
  'tenjo': { lat: -6.3539, lng: 106.4561 },
  'tenjolaya': { lat: -6.6631, lng: 106.7117 }
};


interface DashboardTabProps {
  peserta: Peserta[];
  sesi: Sesi[];
  presensi: Presensi[];
  branding: Branding;
  activeSesiId: number;
  onResetCache: () => void;
  supabaseConnected: boolean;
  supabaseMode: 'env' | 'custom' | 'none';
  onRetrySync?: () => void;
  isSyncing?: boolean;
}

export default function DashboardTab({
  peserta,
  sesi,
  presensi,
  branding,
  activeSesiId,
  onResetCache,
  supabaseConnected,
  supabaseMode,
  onRetrySync,
  isSyncing = false
}: DashboardTabProps) {
  // Stats calculations
  const totalPeserta = peserta.length;
  const totalHadir = presensi.length;
  const tepatWaktu = presensi.filter(p => p.status === 'Tepat Waktu').length;
  const terlambat = presensi.filter(p => p.status === 'Terlambat').length;

  const currentActiveSesi = sesi.find(s => s.num === activeSesiId) || sesi[0] || {
    num: 1,
    materi: 'Ke-Ansoran Lanjutan',
    instruktur: 'K.H. Nuruddin Al-Syafii',
    startTime: '08:00',
    duration: 90,
    maxLate: 10,
    toiletLimit: 5
  };

  // Rata-rata kehadiran (overall)
  const totalPossible = totalPeserta * sesi.length;
  const globalAttendancePct = totalPossible > 0 ? Math.round((totalHadir / totalPossible) * 100) : 0;

  // Chart data matching each session
  const chartData = sesi.map(s => {
    const presentCount = presensi.filter(p => p.sesi === s.num).length;
    const absentCount = Math.max(0, totalPeserta - presentCount);
    const attendancePct = totalPeserta > 0 ? Math.round((presentCount / totalPeserta) * 100) : 0;

    return {
      name: `Sesi ${s.num}`,
      Hadir: presentCount,
      Alpa: absentCount,
      Persentase: attendancePct
    };
  });

  const [activePin, setActivePin] = useState<{ name: string; count: number; lat: number; lng: number } | null>(null);

  // Get participants filtered by active pin
  const activePinPeserta = useMemo(() => {
    if (!activePin) return [];
    
    const canonicalName = activePin.name.toLowerCase().replace(' (pc)', '');
    return peserta.filter(p => {
      const utusan = p.utusan.toLowerCase();
      // Special case for 'Lainnya / Luar Daerah'
      if (canonicalName === 'lainnya / luar daerah' || canonicalName.includes('lainnya')) {
        const isKnownKecamatan = Object.keys(BOGOR_KECAMATAN_COORDS).some(k => utusan.includes(k));
        return !isKnownKecamatan;
      }
      return utusan.includes(canonicalName) || utusan.replace(' ', '').includes(canonicalName.replace(' ', ''));
    });
  }, [activePin, peserta]);

  // Regions count & coordinates for Google Maps and interactive panel
  const regions = useMemo(() => {
    // Start with the standard 6 regions
    const baseRegions = [
      { name: 'Cibinong (PC)', count: 0, lat: -6.4827, lng: 106.8494, matchKeys: ['cibinong'], coords: { x: '45%', y: '45%' } },
      { name: 'Gunung Putri', count: 0, lat: -6.4385, lng: 106.9171, matchKeys: ['gunung putri', 'gunungputri'], coords: { x: '70%', y: '30%' } },
      { name: 'Citeureup', count: 0, lat: -6.4950, lng: 106.8795, matchKeys: ['citeureup'], coords: { x: '60%', y: '40%' } },
      { name: 'Ciawi', count: 0, lat: -6.6575, lng: 106.8580, matchKeys: ['ciawi'], coords: { x: '50%', y: '65%' } },
      { name: 'Parungpanjang', count: 0, lat: -6.3475, lng: 106.5921, matchKeys: ['parungpanjang', 'parung panjang', 'parung'], coords: { x: '20%', y: '35%' } },
      { name: 'Leuwiliang', count: 0, lat: -6.5684, lng: 106.6111, matchKeys: ['leuwiliang'], coords: { x: '15%', y: '60%' } },
    ];

    // Compute counts for all known subdistricts
    const counts: Record<string, number> = {};
    const unmappedPeserta: typeof peserta = [];

    peserta.forEach(p => {
      const u = p.utusan.toLowerCase().trim();
      let matched = false;

      // Check base regions first (using sub-string matches)
      for (const br of baseRegions) {
        if (br.matchKeys.some(k => u.includes(k))) {
          br.count++;
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Look for match in full dictionary
        let matchedDictKey = '';
        for (const k of Object.keys(BOGOR_KECAMATAN_COORDS)) {
          if (u.includes(k)) {
            matchedDictKey = k;
            break;
          }
        }

        if (matchedDictKey) {
          counts[matchedDictKey] = (counts[matchedDictKey] || 0) + 1;
        } else {
          unmappedPeserta.push(p);
        }
      }
    });

    const result = baseRegions.map(br => ({
      name: br.name,
      count: br.count,
      lat: br.lat,
      lng: br.lng,
      coords: br.coords
    }));

    Object.entries(counts).forEach(([key, count]) => {
      const name = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      result.push({
        name,
        count,
        lat: BOGOR_KECAMATAN_COORDS[key].lat,
        lng: BOGOR_KECAMATAN_COORDS[key].lng,
        coords: { x: '50%', y: '50%' } // Default central coords for fallback vector positioning
      });
    });

    if (unmappedPeserta.length > 0) {
      result.push({
        name: 'Lainnya / Luar Daerah',
        count: unmappedPeserta.length,
        lat: -6.5971,
        lng: 106.8060,
        coords: { x: '50%', y: '50%' }
      });
    }

    return result;
  }, [peserta]);


  // SVG circular stroke representation
  const strokeDash = 314.16;
  const strokeOffset = strokeDash - (globalAttendancePct / 100) * strokeDash;

  return (
    <div className="space-y-6">
      
      {/* DB Connection Top Warning / Notification */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-navy-800 rounded-xl shadow-xs transition-colors duration-350 gap-4">
        <div className="flex items-center space-x-3 text-xs w-full md:w-auto">
          <div className={`p-2 rounded-lg ${supabaseConnected ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-500'}`}>
            <HeartHandshake className={`w-5 h-5 ${isSyncing ? 'animate-bounce' : 'animate-pulse'}`} />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h4 className="font-extrabold text-slate-800 dark:text-white uppercase tracking-wider text-[11px]">Koneksi Supabase Cloud</h4>
              <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${supabaseConnected ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                {supabaseConnected ? 'AKTIF (REAL-TIME)' : 'OFFLINE (LOKAL)'}
              </span>
              {isSyncing && (
                <span className="px-2 py-0.5 text-[8px] font-black uppercase rounded bg-indigo-500 text-white animate-pulse flex items-center space-x-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  <span>SINKRONISASI...</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-bold">
              {isSyncing
                ? 'Sedang melakukan sinkronisasi data dengan server cloud Supabase...'
                : supabaseConnected 
                  ? `Sinkronisasi real-time berhasil menggunakan Supabase database (${supabaseMode === 'env' ? 'Environment Keys' : 'Kunci Kustom'})` 
                  : 'Menggunakan memori local storage sekuriti tinggi. Coba hubungkan kembali dengan tombol di kanan!'
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end shrink-0">
          {onRetrySync && (
            <button
              id="btn-sync-dashboard"
              onClick={onRetrySync}
              disabled={isSyncing}
              className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 shadow-sm ${
                isSyncing 
                  ? 'bg-slate-100 dark:bg-navy-900 text-slate-400 dark:text-navy-600 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 cursor-pointer'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menghubungkan...' : 'Sinkronkan Database'}</span>
            </button>
          )}
          <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest text-right">
            PC GP ANSOR BOGOR &copy; 2026
          </div>
        </div>
      </div>

      {/* Hero Card Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Active Sesi Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-855 to-slate-950 dark:from-navy-950 dark:via-navy-900 dark:to-slate-950 rounded-[20px] p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px] border border-slate-800">
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-[0.03] pointer-events-none">
            <Shield className="w-80 h-80 text-white" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500 text-white font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest">Sesi Aktif</span>
              <span className="bg-white/10 text-emerald-300 font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                Sesi #{currentActiveSesi.num}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight leading-tight uppercase font-sans">
              {currentActiveSesi.materi}
            </h2>
          </div>

          <div className="pt-5 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs z-10 mt-6 text-slate-300 font-medium">
            <div>
              <p className="text-[9px] font-black tracking-wider uppercase text-slate-500">Instruktur</p>
              <p className="font-bold text-white text-xs truncate mt-0.5">{currentActiveSesi.instruktur}</p>
            </div>
            <div>
              <p className="text-[9px] font-black tracking-wider uppercase text-slate-500">Mulai Kelas</p>
              <p className="font-bold text-white text-xs mt-0.5">{currentActiveSesi.startTime} WIB</p>
            </div>
            <div>
              <p className="text-[9px] font-black tracking-wider uppercase text-slate-500">Durasi Sesi</p>
              <p className="font-bold text-white text-xs mt-0.5">{currentActiveSesi.duration || 90} Menit</p>
            </div>
            <div>
              <p className="text-[9px] font-black tracking-wider uppercase text-slate-500">Toleransi</p>
              <p className="font-bold text-amber-400 text-xs font-mono mt-0.5">Toleransi {currentActiveSesi.maxLate || 10} Menit</p>
            </div>
          </div>
        </div>

        {/* Right: Circular Progress Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[20px] p-6 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden transition-colors duration-350">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-4">Rata-Rata Kehadiran Kader</h4>
          <div className="relative flex items-center justify-center">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="50" stroke="#f1f5f9" strokeWidth="10" fill="transparent" className="dark:stroke-navy-950" />
              <circle
                cx="64"
                cy="64"
                r="50"
                stroke="#16C784"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-700 hover:stroke-emerald-400"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{globalAttendancePct}%</span>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Kehadiran</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold mt-4 leading-relaxed">
            Kalkulasi persentase kualifikasi berdasarkan total log sebaran presensi terverifikasi.
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Peserta */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-navy-800 shadow-sm flex items-center space-x-4 hover:-translate-y-1 transition-all duration-250">
          <div className="p-3 bg-slate-50 dark:bg-navy-950 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-100 dark:border-navy-900">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">Total Peserta</p>
            <h3 className="text-2xl font-extrabold text-navy-900 dark:text-white tracking-tight leading-tight mt-0.5">{totalPeserta}</h3>
          </div>
        </div>

        {/* Total Hadir */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-navy-800 shadow-sm flex items-center space-x-4 hover:-translate-y-1 transition-all duration-250">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl border border-emerald-100/30">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">Logs Hadir</p>
            <h3 className="text-2xl font-extrabold text-emerald-500 tracking-tight leading-tight mt-0.5">{totalHadir}</h3>
          </div>
        </div>

        {/* Tepat Waktu */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-navy-800 shadow-sm flex items-center space-x-4 hover:-translate-y-1 transition-all duration-250">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-xl border border-blue-100/30">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">Tepat Waktu</p>
            <h3 className="text-2xl font-extrabold text-blue-500 tracking-tight leading-tight mt-0.5">{tepatWaktu}</h3>
          </div>
        </div>

        {/* Terlambat */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200/80 dark:border-navy-800 shadow-sm flex items-center space-x-4 hover:-translate-y-1 transition-all duration-250">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-xl border border-rose-100/30">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[9px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">Terlambat</p>
            <h3 className="text-2xl font-extrabold text-rose-500 tracking-tight leading-tight mt-0.5">{terlambat}</h3>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between transition-colors duration-350">
          <h4 className="text-[10px] text-navy-900 dark:text-white font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-navy-800 pb-2.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Rasio Presensi Kader</span>
          </h4>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="Hadir" stackId="a" fill="#16C784" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Alpa" stackId="a" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Line Chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between transition-colors duration-350">
          <h4 className="text-[10px] text-navy-900 dark:text-white font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-navy-800 pb-2.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Tren Kehadiran per Sesi (%)</span>
          </h4>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94A3B8" domain={[0, 100]} fontSize={9} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="Persentase" stroke="#16C784" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4, strokeWidth: 1 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Map representation with Leaflet (Peta Aktif only) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between transition-colors duration-350">
          <h4 className="text-[10px] text-navy-900 dark:text-white font-black uppercase tracking-widest mb-3 flex items-center gap-1.5 border-b border-slate-100 dark:border-navy-800 pb-2.5">
            <MapPin className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Peta Distribusi {branding.delegationType || 'PAC'}</span>
          </h4>
          <div className="h-64 w-full text-xs relative rounded-xl overflow-hidden border border-slate-200 dark:border-navy-900">
            <LeafletMap 
              regions={regions} 
              onPinClick={setActivePin} 
              activePin={activePin} 
            />

            {/* Bottom Info Window Overlay for clicked pin */}
            {activePin && (
              <div className="absolute bottom-2 left-2 right-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 dark:border-navy-850 shadow-xl z-25 max-h-36 overflow-y-auto text-xs flex flex-col transition-all duration-200">
                <div className="flex items-center justify-between border-b border-slate-101 dark:border-navy-800 pb-1 mb-1 font-bold text-slate-800 dark:text-white uppercase text-[9px] tracking-wide">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    <span>{activePin.name} &bull; {activePin.count} Kader</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setActivePin(null)} 
                    className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 cursor-pointer font-extrabold text-[10px] px-1"
                  >
                    ✕
                  </button>
                </div>
                {activePinPeserta.length > 0 ? (
                  <div className="space-y-1">
                    <p className="text-[8px] text-slate-450 dark:text-slate-500 uppercase font-black tracking-wider flex items-center gap-1">
                      <Info className="w-2.5 h-2.5 text-slate-400" />
                      <span>Rincian Kader Terdaftar:</span>
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-[8.5px]">
                      {activePinPeserta.map((p, pIdx) => (
                        <div key={p.id || pIdx} className="flex items-center justify-between p-0.5 px-1 bg-slate-50 dark:bg-slate-950 border border-slate-101 dark:border-navy-900 rounded">
                          <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[85%]">{p.nama}</span>
                          <span className="text-[7.5px] font-mono text-slate-400 dark:text-slate-500">
                            {p.id.split('.').pop() || p.id.slice(-3)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[8.5px] text-slate-400 dark:text-slate-550 italic">Tidak ada rincian data kader dari wilayah ini.</p>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Warning cache Reset */}
      <div className="bg-rose-50/75 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-md shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-rose-950 dark:text-rose-400 uppercase tracking-wider">Pembersihan Cache & Reset Data Lokal</h4>
            <p className="text-[10px] text-rose-700/80 dark:text-rose-400/60 mt-0.5 font-bold uppercase">
              Lakukan pengaturan ulang atau refresh manual jika log status visual terhambat.
            </p>
          </div>
        </div>
        <button
          onClick={onResetCache}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition shadow-sm shrink-0 active:scale-[0.98]"
        >
          Reset Cache Aplikasi
        </button>
      </div>

    </div>
  );
}
