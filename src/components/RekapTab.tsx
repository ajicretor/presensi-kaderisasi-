import React, { useRef, useState } from 'react';
import { ScrollText, Printer, Download } from 'lucide-react';
import { Presensi, Sesi, Branding } from '../types';

interface RekapTabProps {
  presensi: Presensi[];
  sesi: Sesi[];
  branding: Branding;
  currentUserRole: string;
  currentUserPermissions: string[];
  currentUserName: string;
}

export default function RekapTab({
  presensi,
  sesi,
  branding,
  currentUserRole,
  currentUserPermissions,
  currentUserName
}: RekapTabProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isAdmin = currentUserRole === 'Admin';
  const canRekap = isAdmin || currentUserPermissions.includes('rekap');

  const liveActiveSesi = sesi.find(s => s.active) || sesi[0] || {
    num: 1,
    materi: 'Ke-Ansoran Lanjutan',
    instruktur: 'Sahabat Nurdin Al-Fatih'
  };

  // Reset page when presensi changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [presensi.length]);

  const totalPages = Math.ceil(presensi.length / itemsPerPage);
  const activePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPresensi = presensi.slice(startIndex, endIndex);

  const handlePrint = () => {
    if (!canRekap) return;
    const printContent = printAreaRef.current?.innerHTML || '';
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formatPrintDateTime = () => {
      const d = new Date();
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      const day = d.getDate();
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      const time = d.toTimeString().split(' ')[0];
      return `${day} ${month} ${year}, ${time} WIB`;
    };

    const footerHtml = `
      <div style="margin-top: 35px; border-top: 1px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #64748b; font-family: monospace; font-weight: bold;">
        <div>VALIDASI SISTEM: REKAP PRESENSI SAH MELALUI ${branding.appName.toUpperCase()}</div>
        <div>OPERATOR CETAK: ${currentUserName.toUpperCase()} &nbsp;|&nbsp; WAKTU CETAK: ${formatPrintDateTime()}</div>
      </div>
    `;

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
            .header-flex { display: flex !important; align-items: center !important; gap: 15px !important; border-bottom: 2px solid #0f172a !important; padding-bottom: 12px !important; margin-bottom: 20px !important; }
            .logo-container { width: 64px !important; height: 64px !important; min-width: 64px !important; min-height: 64px !important; max-width: 64px !important; max-height: 64px !important; display: flex !important; align-items: center !important; justify-content: center !important; background-color: #ecfdf5 !important; border: 1px solid #d1fae5 !important; border-radius: 12px !important; overflow: hidden !important; box-sizing: border-box !important; }
            .logo-container img { width: 44px !important; height: 44px !important; max-width: 44px !important; max-height: 44px !important; object-fit: contain !important; }
            .logo-container svg { width: 44px !important; height: 44px !important; max-width: 44px !important; max-height: 44px !important; }
            .logo-container div { width: 44px !important; height: 44px !important; max-width: 44px !important; max-height: 44px !important; display: flex !important; align-items: center !important; justify-content: center !important; }
            .logo-container div svg { width: 44px !important; height: 44px !important; max-width: 44px !important; max-height: 44px !important; }
            .badge { display: inline-block; font-size: 8px; font-weight: bold; padding: 2px 6px; border-radius: 4px; uppercase; }
            .badge-on { background-color: #ecfdf5; color: #047857; border: 1px solid #34d399; }
            .badge-off { background-color: #fff1f2; color: #b91c1c; border: 1px solid #f87171; }
          </style>
        </head>
        <body>
          ${printContent}
          ${footerHtml}
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

      {/* Printable Area Card (Visible to User with Pagination) */}
      <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm transition-colors duration-350">
        
        <div className="p-8">
          {/* Kop Surat Header (Screen Display) */}
          <div className="flex items-center space-x-4 pb-6 border-b-2 border-slate-200 dark:border-navy-800 mb-6 font-sans header-flex">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-navy-950 border border-emerald-100 dark:border-navy-800 rounded-xl flex items-center justify-center shrink-0 logo-container">
              {branding && branding.logo && (typeof branding.logo === 'string') && (branding.logo.trim().startsWith('<svg') || branding.logo.trim().startsWith('<div')) ? (
                <div dangerouslySetInnerHTML={{ __html: branding.logo }} className="w-11 h-11 text-emerald-600 fill-emerald-600 scale-120 flex items-center justify-center logo-svg" />
              ) : branding && branding.logo ? (
                <img src={branding.logo} alt="Logo" className="w-11 h-11 object-contain rounded-lg logo-img" referrerPolicy="no-referrer" />
              ) : null}
            </div>
            <div className="header-info">
              <h2 className="text-xl font-black text-navy-900 dark:text-white uppercase tracking-wider leading-none">Rekap Presensi Kaderisasi</h2>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase leading-tight org-text">{branding.organisasi}</p>
              <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mt-0.5 cabang-text">{branding.cabang}</p>
            </div>
          </div>

          {/* Audit Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-xs font-bold text-slate-700 dark:text-slate-350 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-navy-900 font-sans uppercase tracking-wider meta-grid">
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
                {paginatedPresensi.length > 0 ? (
                  paginatedPresensi.map((p, index) => (
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

        {/* Pagination Footer */}
        {presensi.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-150 dark:border-navy-850 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20 dark:bg-slate-950/5 rounded-b-[20px]">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Menampilkan <span className="text-emerald-600 dark:text-emerald-400">{Math.min(startIndex + 1, presensi.length)}</span> - <span className="text-emerald-600 dark:text-emerald-400">{Math.min(endIndex, presensi.length)}</span> dari <span className="text-slate-800 dark:text-white">{presensi.length}</span> Presensi
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={activePage === 1}
                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-navy-800 bg-white dark:bg-slate-950 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-navy-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 select-none cursor-pointer"
              >
                Sebelumnya
              </button>
              
              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === activePage;
                if (totalPages > 5 && Math.abs(pageNum - activePage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) {
                    return <span key={pageNum} className="text-slate-400 px-1 font-bold text-xs select-none">...</span>;
                  }
                  return null;
                }
                
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7.5 h-7.5 rounded-lg text-[11px] font-black transition duration-150 flex items-center justify-center select-none cursor-pointer ${
                      isActive 
                        ? 'bg-emerald-500 text-white shadow-sm' 
                        : 'border border-slate-200 dark:border-navy-800 bg-white dark:bg-slate-950 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-navy-900/60'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={activePage === totalPages}
                className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-navy-800 bg-white dark:bg-slate-950 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-navy-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 select-none cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}

      </div>

      {/* HIDDEN PRINT-ONLY CONTAINER (Contains full database records) */}
      <div style={{ display: 'none' }}>
        <div ref={printAreaRef}>
          {/* Kop Surat Header */}
          <div className="flex items-center space-x-4 pb-6 border-b-2 border-slate-200 mb-6 font-sans header-flex">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center shrink-0 logo-container">
              {branding && branding.logo && (typeof branding.logo === 'string') && (branding.logo.trim().startsWith('<svg') || branding.logo.trim().startsWith('<div')) ? (
                <div dangerouslySetInnerHTML={{ __html: branding.logo }} className="w-11 h-11 text-emerald-600 fill-emerald-600 scale-120 flex items-center justify-center logo-svg" />
              ) : branding && branding.logo ? (
                <img src={branding.logo} alt="Logo" className="w-11 h-11 object-contain rounded-lg logo-img" referrerPolicy="no-referrer" />
              ) : null}
            </div>
            <div className="header-info">
              <h2 className="text-xl font-black text-navy-900 uppercase tracking-wider leading-none">Rekap Presensi Kaderisasi</h2>
              <p className="text-sm font-bold text-slate-500 mt-1 uppercase leading-tight org-text">{branding.organisasi}</p>
              <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mt-0.5 cabang-text">{branding.cabang}</p>
            </div>
          </div>

          {/* Audit Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-xs font-bold text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 font-sans uppercase tracking-wider meta-grid">
            <div><span className="text-slate-400 mr-2 font-black">Kaderisasi:</span> Pelatihan Kepemimpinan Dasar (PKD)</div>
            <div><span className="text-slate-400 mr-2 font-black">Aktif Sesi:</span> Sesi Ke-{liveActiveSesi.num}</div>
            <div><span className="text-slate-400 mr-2 font-black">Materi Aktif:</span> {liveActiveSesi.materi}</div>
            <div><span className="text-slate-400 mr-2 font-black">Instruktur:</span> {liveActiveSesi.instruktur}</div>
          </div>

          {/* Log table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest border-b">
                <th className="p-4 rounded-tl-lg">Nama Peserta / Kader</th>
                <th className="p-4">Utusan Delegasi {branding.delegationType || 'PAC'}</th>
                <th className="p-4 text-center">Sesi</th>
                <th className="p-4">Materi Bahasan</th>
                <th className="p-4">Waktu Absen</th>
                <th className="p-4 rounded-tr-lg text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-xs font-semibold text-slate-650">
              {presensi.length > 0 ? (
                presensi.map((p, index) => (
                  <tr key={index} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 font-bold text-slate-900 uppercase truncate max-w-[200px]">{p.nama}</td>
                    <td className="p-4 font-semibold text-slate-500 uppercase text-[11px]">{branding.delegationType || 'PAC'} {p.utusan}</td>
                    <td className="p-4 text-center font-mono font-bold text-slate-700">Sesi {p.sesi}</td>
                    <td className="p-4 text-slate-600 truncate max-w-[220px]">{p.materi}</td>
                    <td className="p-4 font-mono text-slate-450 text-[11px]">{p.waktu}</td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full border font-black text-[8px] uppercase tracking-wider ${
                        p.status === 'Tepat Waktu' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 font-bold uppercase tracking-widest text-[9px]">
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
