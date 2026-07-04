import React, { useState, useMemo } from 'react';
import {
  Users,
  CalendarCheck,
  Award,
  ShieldAlert,
  Building2,
  MapPin,
  TrendingUp,
  Activity,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  FileSpreadsheet,
  Download,
  Clock,
  ArrowRight,
  Database,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Peserta, Sesi, Presensi, Tim, Branding } from '../types';

interface SuperAdminDashboardProps {
  peserta: Peserta[];
  sesi: Sesi[];
  presensi: Presensi[];
  tim: Tim[];
  branding: Branding;
  supabaseConnected?: boolean;
  isSyncing?: boolean;
  onRetrySync?: (userOverride?: Tim) => Promise<void>;
}

export default function SuperAdminDashboard({
  peserta,
  sesi,
  presensi,
  tim,
  branding,
  supabaseConnected,
  isSyncing,
  onRetrySync
}: SuperAdminDashboardProps) {
  // Local state for interactive filtering and inspection
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [searchRegionQuery, setSearchRegionQuery] = useState('');
  const [activitySearchQuery, setActivitySearchQuery] = useState('');

  // States for Master Consolidated Table
  const [masterSearch, setMasterSearch] = useState('');
  const [masterRegionFilter, setMasterRegionFilter] = useState('all');
  const [masterStatusFilter, setMasterStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 1. Get List of all active/configured regions in the app
  const configuredRegions = useMemo(() => {
    const list = new Set<string>();
    
    // Add regions from participants
    peserta.forEach(p => {
      if (p.kab_kota) list.add(p.kab_kota.trim().toUpperCase());
    });
    
    // Add regions from operators
    tim.forEach(t => {
      if (t.kab_kota) list.add(t.kab_kota.trim().toUpperCase());
    });

    // Default region list fallback if database is empty
    if (list.size === 0) {
      list.add("KABUPATEN BOGOR");
      list.add("KOTA BOGOR");
    }

    return Array.from(list).sort();
  }, [peserta, tim]);

  // 2. Aggregate Data per Region
  const regionAggregates = useMemo(() => {
    return configuredRegions.map(regionName => {
      const regionPeserta = peserta.filter(p => p.kab_kota?.toUpperCase() === regionName);
      const regionSesi = sesi.filter(s => s.kab_kota?.toUpperCase() === regionName);
      const regionPresensi = presensi.filter(pr => pr.kab_kota?.toUpperCase() === regionName);
      const regionTim = tim.filter(t => t.kab_kota?.toUpperCase() === regionName);

      const totalPeserta = regionPeserta.length;
      const totalSesi = regionSesi.length;
      const totalPresensi = regionPresensi.length;

      // Calculate average attendance rate
      // Attendance rate = total recorded presensi / (total peserta * total sesi)
      let attendanceRate = 0;
      if (totalPeserta > 0 && totalSesi > 0) {
        attendanceRate = Math.min(100, Math.round((totalPresensi / (totalPeserta * totalSesi)) * 100));
      } else if (totalPeserta > 0 && totalPresensi > 0) {
        // Fallback: ratio of sessions with at least one scan
        const uniqueSesiScanned = new Set(regionPresensi.map(p => p.sesi)).size;
        attendanceRate = Math.min(100, Math.round((uniqueSesiScanned / Math.max(1, totalSesi || 10)) * 100));
      }

      const lulusCount = regionPeserta.filter(p => p.status_kelulusan === 'LULUS').length;
      const lulusBersyaratCount = regionPeserta.filter(p => p.status_kelulusan === 'LULUS BERSYARAT').length;
      const tidakLulusCount = regionPeserta.filter(p => p.status_kelulusan === 'TIDAK LULUS').length;
      const belumEvaluasiCount = regionPeserta.filter(p => !p.status_kelulusan).length;

      const graduationRate = totalPeserta > 0 
        ? Math.round(((lulusCount + lulusBersyaratCount) / totalPeserta) * 100) 
        : 0;

      return {
        region: regionName,
        totalPeserta,
        totalSesi,
        totalPresensi,
        attendanceRate,
        lulusCount,
        lulusBersyaratCount,
        tidakLulusCount,
        belumEvaluasiCount,
        graduationRate,
        operatorCount: regionTim.length,
        operators: regionTim.map(t => t.nama || t.username).join(', ')
      };
    });
  }, [configuredRegions, peserta, sesi, presensi, tim]);

  // 3. National Overview Metrics
  const globalMetrics = useMemo(() => {
    const totalPesertaAll = peserta.length;
    const totalRegions = configuredRegions.length;
    const totalOperators = tim.length;

    const totalLulus = peserta.filter(p => p.status_kelulusan === 'LULUS' || p.status_kelulusan === 'LULUS BERSYARAT').length;
    const globalGraduationRate = totalPesertaAll > 0 ? Math.round((totalLulus / totalPesertaAll) * 100) : 0;

    // Attendance rate
    const distinctRegions = configuredRegions.length;
    const avgAttendanceRate = regionAggregates.length > 0
      ? Math.round(regionAggregates.reduce((acc, curr) => acc + curr.attendanceRate, 0) / regionAggregates.length)
      : 0;

    return {
      totalPesertaAll,
      totalRegions,
      totalOperators,
      globalGraduationRate,
      avgAttendanceRate
    };
  }, [peserta, configuredRegions, tim, regionAggregates]);

  // 4. Filters & Searches
  const filteredRegionAggregates = useMemo(() => {
    return regionAggregates.filter(item => 
      item.region.toLowerCase().includes(searchRegionQuery.toLowerCase()) ||
      item.operators.toLowerCase().includes(searchRegionQuery.toLowerCase())
    );
  }, [regionAggregates, searchRegionQuery]);

  // 5. Regional Admin Activity Logs
  const operatorActivities = useMemo(() => {
    // Collect active operator stats: group by operator username
    return tim.map(operator => {
      const isGlobal = operator.role === 'SuperAdmin' || operator.is_superadmin;
      const opRegion = operator.kab_kota || '';
      
      // Match scans recorded in this operator's region
      const opRegionScans = opRegion 
        ? presensi.filter(pr => pr.kab_kota?.toUpperCase() === opRegion.toUpperCase())
        : [];
      
      const opRegionPeserta = opRegion
        ? peserta.filter(p => p.kab_kota?.toUpperCase() === opRegion.toUpperCase())
        : [];

      const latestScan = opRegionScans.length > 0 
        ? opRegionScans.reduce((latest, current) => {
            const timeA = new Date(current.waktu || 0).getTime();
            const timeB = new Date(latest.waktu || 0).getTime();
            return timeA > timeB ? current : latest;
          })
        : null;

      return {
        username: operator.username,
        nama: operator.nama,
        role: operator.role,
        kab_kota: opRegion || 'Pusat (Global)',
        isGlobal,
        scansCount: opRegionScans.length,
        pesertaCount: opRegionPeserta.length,
        latestActivityTime: latestScan ? latestScan.waktu : null,
        latestActivityDetail: latestScan ? `Men-scan "${latestScan.nama}" di Sesi ${latestScan.sesi}` : '-'
      };
    }).sort((a, b) => (b.scansCount + b.pesertaCount) - (a.scansCount + a.pesertaCount));
  }, [tim, peserta, presensi]);

  const filteredOperatorActivities = useMemo(() => {
    return operatorActivities.filter(op =>
      op.nama.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
      op.username.toLowerCase().includes(activitySearchQuery.toLowerCase()) ||
      op.kab_kota.toLowerCase().includes(activitySearchQuery.toLowerCase())
    );
  }, [operatorActivities, activitySearchQuery]);

  // Master Consolidated Kader calculation
  const consolidatedKader = useMemo(() => {
    return peserta.map(p => {
      const pPresence = presensi.filter(pr => pr.id === p.id);
      return {
        ...p,
        totalPresence: pPresence.length,
        presenceRate: branding.totalSesi ? Math.min(100, Math.round((pPresence.length / branding.totalSesi) * 100)) : 0
      };
    });
  }, [peserta, presensi, branding.totalSesi]);

  const filteredConsolidatedKader = useMemo(() => {
    return consolidatedKader.filter(k => {
      const matchSearch = 
        k.nama.toLowerCase().includes(masterSearch.toLowerCase()) ||
        k.id.toLowerCase().includes(masterSearch.toLowerCase()) ||
        (k.utusan || '').toLowerCase().includes(masterSearch.toLowerCase()) ||
        (k.kab_kota || '').toLowerCase().includes(masterSearch.toLowerCase());

      const matchRegion = masterRegionFilter === 'all' || (k.kab_kota && k.kab_kota.toUpperCase() === masterRegionFilter.toUpperCase());
      const matchStatus = masterStatusFilter === 'all' || 
        (masterStatusFilter === 'BELUM' ? !k.status_kelulusan : k.status_kelulusan === masterStatusFilter);

      return matchSearch && matchRegion && matchStatus;
    });
  }, [consolidatedKader, masterSearch, masterRegionFilter, masterStatusFilter]);

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [masterSearch, masterRegionFilter, masterStatusFilter]);

  // Paginated Kader
  const paginatedKader = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredConsolidatedKader.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredConsolidatedKader, currentPage]);

  const totalPages = Math.ceil(filteredConsolidatedKader.length / itemsPerPage) || 1;

  // Export Consolidated Data specific function
  const handleExportConsolidatedCSV = () => {
    const headers = ["ID Kader", "Nama Lengkap", "Kabupaten/Kota", "Utusan (Delegasi)", "Total Kehadiran", "Rasio Kehadiran (%)", "Nilai Post Test", "Status Kelulusan", "Sinkronisasi"];
    const rows = filteredConsolidatedKader.map(k => [
      k.id,
      k.nama,
      k.kab_kota || 'PUSAT',
      k.utusan || '-',
      k.totalPresence,
      `${k.presenceRate}%`,
      k.nilai_post_test || '-',
      k.status_kelulusan || 'PENDING / BELUM EVALUASI',
      'TER-SINKRONISASI'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Master_Konsolidasi_Kader_Nasional_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 6. Selected region inspection data
  const selectedRegionDetails = useMemo(() => {
    if (!selectedRegion) return null;
    const rName = selectedRegion.toUpperCase();
    
    const rPeserta = peserta.filter(p => p.kab_kota?.toUpperCase() === rName);
    const rSesi = sesi.filter(s => s.kab_kota?.toUpperCase() === rName);
    const rPresensi = presensi.filter(pr => pr.kab_kota?.toUpperCase() === rName);
    const rTim = tim.filter(t => t.kab_kota?.toUpperCase() === rName);

    return {
      name: selectedRegion,
      peserta: rPeserta,
      sesi: rSesi,
      presensi: rPresensi,
      operators: rTim,
      lulus: rPeserta.filter(p => p.status_kelulusan === 'LULUS').length,
      lulusBersyarat: rPeserta.filter(p => p.status_kelulusan === 'LULUS BERSYARAT').length,
      tidakLulus: rPeserta.filter(p => p.status_kelulusan === 'TIDAK LULUS').length,
      belumEvaluasi: rPeserta.filter(p => !p.status_kelulusan).length,
    };
  }, [selectedRegion, peserta, sesi, presensi, tim]);

  // 7. Chart Data Preparation
  const participantDistributionChartData = useMemo(() => {
    return regionAggregates
      .map(item => ({
        name: item.region.replace("KABUPATEN ", "Kab. ").replace("KOTA ", "Kota "),
        kader: item.totalPeserta,
        kehadiran: item.attendanceRate
      }))
      .filter(item => item.kader > 0)
      .sort((a, b) => b.kader - a.kader)
      .slice(0, 10); // top 10 regions
  }, [regionAggregates]);

  const graduationChartData = useMemo(() => {
    return regionAggregates
      .map(item => ({
        name: item.region.replace("KABUPATEN ", "Kab. ").replace("KOTA ", "Kota "),
        Lulus: item.lulusCount + item.lulusBersyaratCount,
        'Tidak Lulus': item.tidakLulusCount,
        'Belum Evaluasi': item.belumEvaluasiCount
      }))
      .filter(item => (item.Lulus + item['Tidak Lulus'] + item['Belum Evaluasi']) > 0)
      .slice(0, 8);
  }, [regionAggregates]);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#64748b'];

  const globalGraduationPieData = useMemo(() => {
    const lulus = peserta.filter(p => p.status_kelulusan === 'LULUS').length;
    const lulusSyarat = peserta.filter(p => p.status_kelulusan === 'LULUS BERSYARAT').length;
    const tidakLulus = peserta.filter(p => p.status_kelulusan === 'TIDAK LULUS').length;
    const belum = peserta.filter(p => !p.status_kelulusan).length;

    return [
      { name: 'Lulus Murni', value: lulus },
      { name: 'Lulus Bersyarat', value: lulusSyarat },
      { name: 'Tidak Lulus', value: tidakLulus },
      { name: 'Belum Evaluasi', value: belum }
    ].filter(item => item.value > 0);
  }, [peserta]);

  // Export regional report as CSV
  const handleExportCSV = () => {
    const headers = ["Kabupaten/Kota", "Total Kader", "Total Sesi", "Tingkat Kehadiran (%)", "Lulus", "Lulus Bersyarat", "Tidak Lulus", "Belum Evaluasi", "Tingkat Kelulusan (%)", "Operator Terdaftar"];
    const rows = regionAggregates.map(item => [
      item.region,
      item.totalPeserta,
      item.totalSesi,
      item.attendanceRate,
      item.lulusCount,
      item.lulusBersyaratCount,
      item.tidakLulusCount,
      item.belumEvaluasiCount,
      item.graduationRate,
      `"${item.operators.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Wilayah_Pusat_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="super-admin-dashboard-container">
      
      {/* 1. Welcoming & Top Summary banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-80 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-purple-500/25 border border-purple-400/30 text-purple-200 text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full">
                Pusat Kendali Nasional (Mabes)
              </span>
              {supabaseConnected !== undefined && (
                <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                  supabaseConnected 
                    ? 'bg-emerald-500/25 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/25 border-rose-500/30 text-rose-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${supabaseConnected ? 'bg-emerald-400' : 'bg-rose-400'} ${isSyncing ? 'animate-ping' : 'animate-pulse'}`} />
                  <span>{supabaseConnected ? 'DATABASE TERKONEKSI' : 'DATABASE TERPUTUS'}</span>
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
              Dashboard Super Admin Pusat
            </h2>
            <p className="text-slate-300 text-xs mt-1.5 max-w-xl font-medium leading-relaxed">
              Memantau aktivitas real-time dari seluruh Admin Wilayah (Kabupaten & Kota), melacak rekap kehadiran kolektif, serta mengevaluasi grafik kelulusan nasional dari satu panel tunggal.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {onRetrySync && (
              <button
                onClick={() => onRetrySync()}
                disabled={isSyncing}
                className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-xs font-black px-5 py-3 rounded-xl flex items-center space-x-2 border border-white/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Database'}</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-900 text-xs font-black px-5 py-3 rounded-xl flex items-center space-x-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Laporan Konsolidasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Hero Widget Grid (Bento Box) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-navy-850 p-4 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Wilayah</span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 dark:text-indigo-400 rounded-xl">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{globalMetrics.totalRegions}</h3>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase">Kabupaten/Kota Terdaftar</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-navy-850 p-4 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kader Nasional</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 dark:text-emerald-400 rounded-xl">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{globalMetrics.totalPesertaAll}</h3>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase">Kader di Seluruh Daerah</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-navy-850 p-4 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kelulusan Global</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400 rounded-xl">
              <Award className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{globalMetrics.globalGraduationRate}%</h3>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase">Rata-rata Lulus Nasional</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-navy-850 p-4 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Rasio Kehadiran</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/30 text-purple-500 dark:text-purple-400 rounded-xl">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{globalMetrics.avgAttendanceRate}%</h3>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase">Kehadiran Sesi Kolektif</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-navy-850 p-4 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md transition col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Operator Pusat & Daerah</span>
            <div className="p-2 bg-teal-50 dark:bg-teal-950/30 text-teal-500 dark:text-teal-400 rounded-xl">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-none">{globalMetrics.totalOperators}</h3>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase">Total Petugas Aktif</p>
          </div>
        </div>

      </div>

      {/* 3. Graphs and Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Participant Distribution Top Regions */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-navy-850 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-navy-850 pb-3">
            <div>
              <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                Distribusi Kader Nasional & Kehadiran (Top 10 Daerah)
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                Perbandingan jumlah peserta terdaftar dan rasio kehadiran sesi per wilayah.
              </p>
            </div>
          </div>
          
          <div className="h-72">
            {participantDistributionChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={participantDistributionChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:hidden" />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" className="hidden dark:block" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94a3b8" />
                  <YAxis yAxisId="left" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94a3b8" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#a78bfa" />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, padding: 10 }}
                    wrapperClassName="font-sans text-xs"
                  />
                  <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                  <Bar yAxisId="left" dataKey="kader" name="Kader Terdaftar (Jiwa)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="kehadiran" name="Kehadiran Sesi (%)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                <p className="text-xs font-bold uppercase">Belum Ada Data Distribusi</p>
                <p className="text-[10px] mt-1">Harap pastikan kader di wilayah didaftarkan ke Supabase.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Global Graduation Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-navy-850 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-navy-850 pb-3">
            <div>
              <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                Status Kelulusan Nasional
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                Rasio kelulusan kader secara keseluruhan.
              </p>
            </div>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            {globalGraduationPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={globalGraduationPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {globalGraduationPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip wrapperClassName="font-sans text-xs" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 dark:text-slate-500">
                <p className="text-xs font-bold uppercase">Belum Dievaluasi</p>
                <p className="text-[10px] mt-1">Gunakan tab Kelulusan untuk mengevaluasi kader.</p>
              </div>
            )}
            
            {globalGraduationPieData.length > 0 && (
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-xs font-bold uppercase text-slate-400">Lulus</span>
                <span className="text-2xl font-black text-slate-800 dark:text-white">
                  {peserta.filter(p => p.status_kelulusan === 'LULUS' || p.status_kelulusan === 'LULUS BERSYARAT').length}
                </span>
                <span className="text-[9px] font-black text-slate-400">Kader</span>
              </div>
            )}
          </div>

          {/* Legend/Key */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {globalGraduationPieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center space-x-1.5 p-1.5 rounded-lg bg-slate-50 dark:bg-navy-950/40 border border-slate-100/50 dark:border-navy-900">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <div className="truncate text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 leading-none">
                  <p className="truncate">{entry.name}</p>
                  <span className="font-bold text-[10px] text-slate-700 dark:text-white block mt-0.5">{entry.value} Kader</span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* 4. Kabupaten / Kota Aggregation Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-navy-850 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 dark:border-navy-850 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40 dark:bg-navy-900/10">
          <div>
            <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-emerald-500" />
              <span>Daftar Konsolidasi Seluruh Wilayah</span>
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">
              Klik nama wilayah untuk menginspeksi rincian kader dan operator pendamping secara detail.
            </p>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari wilayah / nama operator..."
                value={searchRegionQuery}
                onChange={(e) => setSearchRegionQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-navy-850 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Table content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-navy-950 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100 dark:border-navy-850">
                <th className="p-4">KABUPATEN / KOTA</th>
                <th className="p-4 text-center">KADER DAFTAR</th>
                <th className="p-4 text-center">SESI AKTIF</th>
                <th className="p-4 text-center">TINGKAT HADIR</th>
                <th className="p-4">STATUS KELULUSAN (L / L.B / T.L / B.E)</th>
                <th className="p-4 text-center">RASIO LULUS</th>
                <th className="p-4">ADMIN/OPERATOR LAPANGAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-850">
              {filteredRegionAggregates.length > 0 ? (
                filteredRegionAggregates.map((item, idx) => {
                  const isSelected = selectedRegion === item.region;
                  return (
                    <tr 
                      key={item.region} 
                      onClick={() => setSelectedRegion(isSelected ? null : item.region)}
                      className={`hover:bg-slate-50/50 dark:hover:bg-navy-950/20 cursor-pointer transition ${
                        isSelected ? 'bg-amber-500/5 border-l-4 border-l-amber-500' : ''
                      }`}
                    >
                      <td className="p-4 font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>{item.region}</span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-800 dark:text-slate-100">
                        {item.totalPeserta} <span className="text-[10px] text-slate-400">Jiwa</span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-800 dark:text-slate-100">
                        {item.totalSesi} <span className="text-[10px] text-slate-400">Sesi</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center space-x-1 font-bold text-slate-800 dark:text-slate-100">
                          <span className={`w-1.5 h-1.5 rounded-full ${item.attendanceRate > 75 ? 'bg-emerald-500' : item.attendanceRate > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                          <span>{item.attendanceRate}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1 text-[10px] font-black">
                          <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded uppercase" title="Lulus">
                            L: {item.lulusCount}
                          </span>
                          <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase" title="Lulus Bersyarat">
                            LB: {item.lulusBersyaratCount}
                          </span>
                          <span className="bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 px-1.5 py-0.5 rounded uppercase" title="Tidak Lulus">
                            TL: {item.tidakLulusCount}
                          </span>
                          <span className="bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase" title="Belum Evaluasi">
                            BE: {item.belumEvaluasiCount}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="w-full bg-slate-100 dark:bg-navy-950 rounded-full h-1.5 max-w-[80px] mx-auto overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-1.5 rounded-full" 
                            style={{ width: `${item.graduationRate}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block mt-1">{item.graduationRate}% Lulus</span>
                      </td>
                      <td className="p-4 truncate max-w-[200px] font-medium text-slate-500 dark:text-slate-400 italic">
                        {item.operators || <span className="text-rose-400 font-bold not-italic text-[10px]">BELUM ADA AKUN</span>}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase">Wilayah tidak ditemukan</p>
                    <p className="text-[10px] mt-1">Gunakan kata kunci pencarian wilayah yang valid.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Selected Region Drawer / Detailed view */}
      {selectedRegionDetails && (
        <div className="bg-slate-100/50 dark:bg-navy-950/40 border border-amber-500/25 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-navy-900 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white">
                Inspeksi Wilayah: <span className="text-indigo-600 dark:text-amber-400">{selectedRegionDetails.name}</span>
              </h4>
            </div>
            <button 
              onClick={() => setSelectedRegion(null)}
              className="text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase cursor-pointer"
            >
              Tutup Panel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Region Admins */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-navy-850 p-4 rounded-xl space-y-2">
              <h5 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Petugas & Operator ({selectedRegionDetails.operators.length})</h5>
              {selectedRegionDetails.operators.length > 0 ? (
                <div className="space-y-2">
                  {selectedRegionDetails.operators.map(t => (
                    <div key={t.username} className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-navy-950">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
                        {t.nama.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-[10px]">
                        <p className="font-extrabold text-slate-700 dark:text-white">{t.nama}</p>
                        <p className="text-[9px] text-slate-400 font-bold">Role: {t.role} (@{t.username})</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-rose-500 font-bold italic py-2">Belum ada akun operator lapangan yang didaftarkan untuk wilayah ini.</p>
              )}
            </div>

            {/* Region stats */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-navy-850 p-4 rounded-xl space-y-2 col-span-2">
              <h5 className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Daftar Anggota / Peserta di {selectedRegionDetails.name} ({selectedRegionDetails.peserta.length})</h5>
              {selectedRegionDetails.peserta.length > 0 ? (
                <div className="max-h-56 overflow-y-auto space-y-2 custom-scrollbar">
                  <table className="w-full text-left text-[10px]">
                    <thead>
                      <tr className="text-slate-400 uppercase font-bold border-b border-slate-100 dark:border-navy-850 pb-1">
                        <th className="pb-1">NAMA / ID</th>
                        <th className="pb-1">UTUSAN</th>
                        <th className="pb-1">POST TEST</th>
                        <th className="pb-1">EVALUASI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-navy-850">
                      {selectedRegionDetails.peserta.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-navy-950/40">
                          <td className="py-1.5 font-bold">
                            <p className="text-slate-800 dark:text-white">{p.nama}</p>
                            <span className="text-[8px] font-mono text-slate-400 block leading-tight">{p.id}</span>
                          </td>
                          <td className="py-1.5 font-medium text-slate-500 uppercase">{p.utusan}</td>
                          <td className="py-1.5 font-bold text-slate-800 dark:text-slate-200">{p.nilai_post_test || '-'}</td>
                          <td className="py-1.5">
                            <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase ${
                              p.status_kelulusan === 'LULUS' 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : p.status_kelulusan === 'LULUS BERSYARAT'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                                  : p.status_kelulusan === 'TIDAK LULUS'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-850'
                            }`}>
                              {p.status_kelulusan || 'PENDING'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic py-2">Belum ada kader yang terdaftar.</p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 5.5 Master Consolidated Database Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-navy-850 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Header Section */}
        <div className="p-5 border-b border-slate-100 dark:border-navy-850 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50/40 dark:bg-navy-900/10">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Database className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center space-x-2">
                  <span>Tabel Master Konsolidasi Data Kader Nasional</span>
                </h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">
                  Sinkronisasi real-time seluruh basis data kader dari semua cabang kabupaten / kota se-Indonesia.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase bg-slate-100 dark:bg-navy-950 px-3 py-1.5 rounded-lg border border-slate-200/50 dark:border-navy-900">
              Total Database: <span className="text-indigo-600 dark:text-amber-400 font-extrabold">{filteredConsolidatedKader.length}</span> / {peserta.length} Kader
            </span>
            <button
              onClick={handleExportConsolidatedCSV}
              className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-4 py-2 rounded-xl flex items-center space-x-1.5 border border-indigo-100 dark:border-indigo-900 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Master CSV</span>
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-navy-850 bg-slate-50/20 dark:bg-navy-950/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, ID registrasi, atau utusan..."
              value={masterSearch}
              onChange={(e) => setMasterSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-navy-850 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none dark:text-white"
            />
          </div>

          {/* Region Filter */}
          <div className="relative flex items-center">
            <Filter className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={masterRegionFilter}
              onChange={(e) => setMasterRegionFilter(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-navy-850 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none dark:text-white appearance-none cursor-pointer"
            >
              <option value="all">Semua Wilayah / Cabang</option>
              {configuredRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative flex items-center">
            <Filter className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={masterStatusFilter}
              onChange={(e) => setMasterStatusFilter(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-navy-850 rounded-lg pl-9 pr-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none dark:text-white appearance-none cursor-pointer"
            >
              <option value="all">Semua Status Kelulusan</option>
              <option value="LULUS">LULUS</option>
              <option value="LULUS BERSYARAT">LULUS BERSYARAT</option>
              <option value="TIDAK LULUS">TIDAK LULUS</option>
              <option value="BELUM">BELUM DIEVALUASI</option>
            </select>
          </div>

        </div>

        {/* Master Table Display */}
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-navy-950 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[9px] border-b border-slate-100 dark:border-navy-850">
                <th className="p-4 w-12 text-center">NO</th>
                <th className="p-4">NO. REGISTRASI / ID</th>
                <th className="p-4">NAMA KADER</th>
                <th className="p-4">WILAYAH / CABANG</th>
                <th className="p-4">DELEGASI / UTUSAN</th>
                <th className="p-4 text-center">KEHADIRAN SESI</th>
                <th className="p-4 text-center">POST-TEST</th>
                <th className="p-4 text-center">EVALUASI AKHIR</th>
                <th className="p-4 text-center">STATUS SINKRONISASI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-850">
              {paginatedKader.length > 0 ? (
                paginatedKader.map((kader, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr 
                      key={kader.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-navy-950/10 transition"
                    >
                      <td className="p-4 text-center font-bold text-slate-400">
                        {globalIdx}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        {kader.id}
                      </td>
                      <td className="p-4 font-extrabold text-slate-800 dark:text-white text-xs">
                        {kader.nama}
                      </td>
                      <td className="p-4">
                        <div className="inline-flex items-center space-x-1 bg-slate-100 dark:bg-navy-950 px-2 py-1 rounded-md text-[10px] font-bold text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-navy-900 uppercase">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{kader.kab_kota || 'PUSAT'}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                        {kader.utusan || '-'}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1 max-w-[120px] mx-auto">
                          <div className="flex items-center justify-between text-[9px] font-black">
                            <span className="text-slate-600 dark:text-slate-400">{kader.totalPresence} Sesi</span>
                            <span className="text-indigo-600 dark:text-amber-400">{kader.presenceRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-navy-950 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                kader.presenceRate >= 80 
                                  ? 'bg-emerald-500' 
                                  : kader.presenceRate >= 60 
                                    ? 'bg-amber-500' 
                                    : 'bg-rose-500'
                              }`}
                              style={{ width: `${kader.presenceRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center font-black text-slate-800 dark:text-slate-100 text-xs">
                        {kader.nilai_post_test || <span className="text-slate-300 dark:text-slate-700">-</span>}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block ${
                          kader.status_kelulusan === 'LULUS' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : kader.status_kelulusan === 'LULUS BERSYARAT'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                              : kader.status_kelulusan === 'TIDAK LULUS'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-850 dark:text-slate-400'
                        }`}>
                          {kader.status_kelulusan || 'PENDING'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center space-x-1.5 text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-100/30 font-black">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>TER-SINKRONISASI</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <Database className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2 animate-bounce" />
                    <p className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">Data Tidak Ditemukan</p>
                    <p className="text-[10px] mt-1 text-slate-400">Silakan gunakan filter atau pencarian lain.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {filteredConsolidatedKader.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-navy-850 bg-slate-50/20 dark:bg-navy-950/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">
              Menampilkan <span className="text-slate-800 dark:text-white font-extrabold">{Math.min(filteredConsolidatedKader.length, (currentPage - 1) * itemsPerPage + 1)}</span> - <span className="text-slate-800 dark:text-white font-extrabold">{Math.min(filteredConsolidatedKader.length, currentPage * itemsPerPage)}</span> dari <span className="text-indigo-600 dark:text-amber-400 font-extrabold">{filteredConsolidatedKader.length}</span> Kader Terkonsolidasi
            </span>

            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-navy-850 text-[10px] font-extrabold text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-40 disabled:hover:text-slate-500 cursor-pointer transition"
              >
                Pertama
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-navy-850 text-[10px] font-extrabold text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-40 disabled:hover:text-slate-500 cursor-pointer transition"
              >
                Sebelumnya
              </button>
              
              <div className="flex items-center space-x-1 px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Halaman</span>
                <span className="font-extrabold text-slate-800 dark:text-white bg-white dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-navy-850 min-w-[24px] text-center">{currentPage}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase">dari</span>
                <span className="font-extrabold text-slate-500">{totalPages}</span>
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-navy-850 text-[10px] font-extrabold text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-40 disabled:hover:text-slate-500 cursor-pointer transition"
              >
                Berikutnya
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-navy-850 text-[10px] font-extrabold text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-40 disabled:hover:text-slate-500 cursor-pointer transition"
              >
                Terakhir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Admin & Operator Activity Log / Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Operators Status List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-navy-850 rounded-2xl p-5 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-navy-850 pb-3">
            <div>
              <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <span>Status & Aktivitas Operator</span>
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">
                Kinerja input operator berdasarkan scan.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto custom-scrollbar">
            {filteredOperatorActivities.map((op) => (
              <div 
                key={op.username} 
                className="p-3 rounded-xl border border-slate-100 dark:border-navy-850 bg-slate-50/50 dark:bg-navy-950/20 hover:border-slate-200 dark:hover:border-navy-800 transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${
                    op.isGlobal 
                      ? 'bg-purple-500 text-white' 
                      : op.scansCount > 0 
                        ? 'bg-emerald-500 text-slate-900' 
                        : 'bg-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-500'
                  }`}>
                    {op.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate text-xs">
                    <p className="font-extrabold text-slate-800 dark:text-white truncate">{op.nama}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">
                      {op.kab_kota}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-black text-xs text-slate-800 dark:text-white">{op.scansCount}</span>
                  <span className="text-[9px] text-slate-400 block font-bold uppercase">Scans</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Recent Activity Log */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-navy-850 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-navy-850 pb-3">
            <div>
              <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-emerald-500" />
                <span>Log Aktivitas Presensi Nasional (Terbaru)</span>
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">
                Pencatatan QR code real-time dari seluruh wilayah.
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
            {presensi.length > 0 ? (
              [...presensi].reverse().slice(0, 15).map((log, idx) => {
                const logTime = new Date(log.waktu);
                const isLate = log.status === 'Terlambat';
                
                return (
                  <div 
                    key={`${log.id}-${log.sesi}-${idx}`} 
                    className="p-3 bg-slate-50 dark:bg-navy-950/40 rounded-xl border border-slate-100 dark:border-navy-850/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl shrink-0 ${isLate ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/20' : 'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20'}`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-800 dark:text-white leading-tight">{log.nama}</span>
                          <span className="text-[8px] font-mono text-slate-400 bg-slate-100 dark:bg-navy-950 px-1 rounded">{log.id.slice(-8)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 uppercase">
                          Sesi {log.sesi} • {log.materi}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span className="text-[9px] bg-slate-100 dark:bg-navy-900 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded font-black uppercase">
                        {log.kab_kota || 'KABUPATEN BOGOR'}
                      </span>
                      
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        isLate 
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' 
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                      }`}>
                        {log.status}
                      </span>

                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold whitespace-nowrap">
                        {logTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400">
                <Activity className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs font-bold uppercase">Belum Ada Presensi</p>
                <p className="text-[10px] mt-1">Gunakan tab scan presensi di daerah untuk mulai merekam.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
