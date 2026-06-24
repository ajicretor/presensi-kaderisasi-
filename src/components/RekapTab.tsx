import React, { useRef } from 'react';
import { ScrollText, Printer, Download } from 'lucide-react';
import { Presensi, Sesi, Branding } from '../types';

interface RekapTabProps {
  presensi: Presensi[];
  sesi: Sesi[];
  branding: Branding;
  currentUserRole: string;
  currentUserPermissions: string[];
}

export default function RekapTab({
  presensi,
  sesi,
  branding,
  currentUserRole,
  currentUserPermissions
}: RekapTabProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUserRole === 'Admin';
  const canRekap = isAdmin || currentUserPermissions.includes('rekap');

  const liveActiveSesi = sesi.find(s => s.active) || sesi[0] || {
    num: 1,
    materi: 'Ke-Ansoran Lanjutan',
    instruktur: 'Sahabat Nurdin Al-Fatih'
  };

  const handlePrint = () => {
    if (!canRekap) return;
    const printContent = printAreaRef.current?.innerHTML || '';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan_Rekap_Presensi_${branding.appName.replace(/\s+/g, '_')}</title>
          <style>
            body { font-family: sans-serif; padding: 25px; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 11px; }
            th { background-color: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 9px; letter-spacing: 0.05em; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background-color: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; font-weight: bold; font-size: 11px; }
            .header-flex { display: flex; align-items: center; gap: 15px; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
            .badge { display: inline-block; font-size: 8px; font-weight: bold; padding: 2px 6px; border-radius: 4px; uppercase; }
            .badge-on { background-color: #ecfdf5; color: #047857; border: 1px solid #34d399; }
            .badge-off { background-color: #fff1f2; color: #b91c1c; border: 1px solid #f87171; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportExcel = () => {
    if (!canRekap) return;
    // Simple TSV / CSV text converter for clean custom Excel files
    let headers = ['Nama Peserta', `Delegasi / ${branding.delegationType || 'PAC'}`, 'Sesi Ke', 'Bahasan Materi', 'Waktu Presensi', 'Status Lateness'];
    let rows = presensi.map(p => [
      p.nama,
      `${branding.delegationType || 'PAC'} ${p.utusan}`,
      `Sesi ${p.sesi}`,
      p.materi,
      p.waktu,
      p.status
    ]);

    let tsvContent = "data:text/xls;charset=utf-8,\uFEFF"
      + [headers.join("\t"), ...rows.map(e => e.join("\t"))].join("\n");

    const encodedUri = encodeURI(tsvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Rekap_Presensi_${branding.appName.replace(/\s+/g, '_')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm transition-colors duration-350">
        <div>
          <h3 className="text-lg font-black text-navy-900 dark:text-white uppercase tracking-wider">Laporan Rekapitulasi Kehadiran</h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">Arsip data master presensi berkelanjutan kader GP Ansor (Sesi 1 s/d 20).</p>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handlePrint}
            disabled={!canRekap}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-300 dark:bg-navy-950 dark:border-navy-850 dark:text-white text-slate-700 font-extrabold rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-navy-900 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider active:scale-[0.98]"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak Laporan</span>
          </button>
          
          <button
            onClick={handleExportExcel}
            disabled={!canRekap}
            className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* Printable Area Card */}
      <div
        ref={printAreaRef}
        className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm p-8 transition-colors duration-350"
      >
        
        {/* Kop Surat Header */}
        <div className="flex items-center space-x-4 pb-6 border-b-2 border-slate-200 dark:border-navy-800 mb-6 font-sans">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-navy-950 border border-emerald-100 dark:border-navy-800 rounded-xl flex items-center justify-center shrink-0">
            {branding && branding.logo && (typeof branding.logo === 'string') && (branding.logo.trim().startsWith('<svg') || branding.logo.trim().startsWith('<div')) ? (
              <div dangerouslySetInnerHTML={{ __html: branding.logo }} className="w-11 h-11 text-emerald-600 fill-emerald-600 scale-120 flex items-center justify-center" />
            ) : branding && branding.logo ? (
              <img src={branding.logo} alt="Logo" className="w-11 h-11 object-contain rounded-lg" referrerPolicy="no-referrer" />
            ) : null}
          </div>
          <div>
            <h2 className="text-xl font-black text-navy-900 dark:text-white uppercase tracking-wider leading-none">Rekap Presensi Kaderisasi</h2>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase leading-tight">{branding.organisasi}</p>
            <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mt-0.5">{branding.cabang}</p>
          </div>
        </div>

        {/* Audit Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs font-bold text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-navy-900 font-sans uppercase tracking-wider">
          <div><span className="text-slate-400 dark:text-slate-500 mr-2 font-black">Kaderisasi:</span> Pelatihan Kepemimpinan Dasar (PKD)</div>
          <div><span className="text-slate-400 dark:text-slate-500 mr-2 font-black">Aktif Sesi:</span> Sesi Ke-{liveActiveSesi.num}</div>
          <div><span className="text-slate-400 dark:text-slate-500 mr-2 font-black">Materi Aktif:</span> {liveActiveSesi.materi}</div>
          <div><span className="text-slate-400 dark:text-slate-500 mr-2 font-black">Instruktur:</span> {liveActiveSesi.instruktur}</div>
        </div>

        {/* Log table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 dark:bg-slate-950 text-white font-black text-[9px] uppercase tracking-widest border-b dark:border-navy-800">
                <th className="p-4 rounded-tl-lg">Nama Peserta / Kader</th>
                <th className="p-4">Utusan Delegasi {branding.delegationType || 'PAC'}</th>
                <th className="p-4 text-center">Sesi</th>
                <th className="p-4">Materi Bahasan</th>
                <th className="p-4">Waktu Absen</th>
                <th className="p-4 rounded-tr-lg text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-navy-850 text-xs font-semibold text-slate-650 dark:text-slate-350">
              {presensi.length > 0 ? (
                presensi.map((p, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-navy-900/10 transition">
                    <td className="p-4 font-bold text-slate-900 dark:text-white uppercase truncate max-w-[200px]">{p.nama}</td>
                    <td className="p-4 font-semibold text-slate-500 dark:text-slate-400 uppercase text-[11px]">{branding.delegationType || 'PAC'} {p.utusan}</td>
                    <td className="p-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">Sesi {p.sesi}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 truncate max-w-[220px]">{p.materi}</td>
                    <td className="p-4 font-mono text-slate-450 dark:text-slate-500 text-[11px]">{p.waktu}</td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full border font-black text-[8px] uppercase tracking-wider ${
                        p.status === 'Tepat Waktu' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/15 dark:text-emerald-400 dark:border-emerald-900/20' 
                          : 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/15 dark:text-amber-400 dark:border-amber-900/20'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                    Belum ada rekaman log kehadiran kader masuk
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
