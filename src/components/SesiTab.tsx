import React, { useState, useEffect } from 'react';
import { Presentation, ShieldAlert, PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { Sesi } from '../types';

interface SesiTabProps {
  sesi: Sesi[];
  onSaveSesi: (session: Sesi) => void;
  onDeleteSesi: (num: number) => void;
  onSetActiveSesi: (num: number) => void;
  currentUserRole: string;
  currentUserPermissions: string[];
}

export default function SesiTab({
  sesi,
  onSaveSesi,
  onDeleteSesi,
  onSetActiveSesi,
  currentUserRole,
  currentUserPermissions
}: SesiTabProps) {
  const [num, setNum] = useState<number>(sesi.length + 1);
  const [materi, setMateri] = useState('');
  const [instruktur, setInstruktur] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [duration, setDuration] = useState<number>(90);
  const [maxLate, setMaxLate] = useState<number>(10);
  const [toiletLimit, setToiletLimit] = useState<number>(5);

  const isAdmin = currentUserRole === 'Admin';
  // Standard permission check for "Tambah Sesi"
  const canSesi = isAdmin || currentUserPermissions.includes('sesi');

  useEffect(() => {
    setNum(sesi.length + 1);
  }, [sesi]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSesi) return;

    onSaveSesi({
      num,
      materi: materi.trim(),
      instruktur: instruktur.trim(),
      startTime,
      duration,
      maxLate,
      toiletLimit,
      active: sesi.find(s => s.num === num)?.active || false
    });

    // Reset Form
    setNum(sesi.length + 1);
    setMateri('');
    setInstruktur('');
    setStartTime('08:00');
    setDuration(90);
    setMaxLate(10);
    setToiletLimit(5);
  };

  const handleEditClick = (s: Sesi) => {
    if (!canSesi) return;
    setNum(s.num);
    setMateri(s.materi);
    setInstruktur(s.instruktur);
    setStartTime(s.startTime);
    setDuration(s.duration);
    setMaxLate(s.maxLate);
    setToiletLimit(s.toiletLimit);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-xs transition-colors duration-350">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-navy-900 dark:text-white uppercase tracking-widest">Kelola Sesi & Kurikulum</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Atur silabus materi, pembicara, waktu mulai, dan toleransi keterlambatan kader GP Ansor.</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
            {sesi.length} Sesi Terdaftar
          </span>
        </div>
      </div>

      {/* Form Sesi + Daftar Tabel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* FORM KIRI: Konfigurasi Sesi Utama */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm transition-colors duration-350 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-navy-850 pb-2.5">
            <h4 className="text-[10px] text-navy-900 dark:text-white font-black uppercase tracking-widest">Konfigurasi Sesi Utama</h4>
            {!canSesi && (
              <span className="bg-rose-50 border border-rose-200 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                Terkunci (No Otoritas)
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
            <div>
              <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Nomor Sesi (ID)</label>
              <input
                type="number"
                required
                min={1}
                max={25}
                disabled={!canSesi}
                value={num}
                onChange={(e) => setNum(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white disabled:opacity-40"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Bahasan / Topik Materi</label>
              <input
                type="text"
                required
                disabled={!canSesi}
                value={materi}
                placeholder="Contoh: Ke-Ansoran Lanjutan"
                onChange={(e) => setMateri(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white disabled:opacity-40 placeholder:text-slate-350"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Instruktur / Pembicara</label>
              <input
                type="text"
                required
                disabled={!canSesi}
                value={instruktur}
                placeholder="Contoh: Sahabat Dr. H. M. Athoillah"
                onChange={(e) => setInstruktur(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white disabled:opacity-40 placeholder:text-slate-350"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Mulai Materi</label>
                <input
                  type="time"
                  required
                  disabled={!canSesi}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-white disabled:opacity-40"
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Durasi Sesi</label>
                <select
                  disabled={!canSesi}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-850 dark:text-white disabled:opacity-40"
                >
                  <option value={45}>45 Menit</option>
                  <option value={60}>60 Menit</option>
                  <option value={90}>90 Menit</option>
                  <option value={120}>120 Menit</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Max. Telat</label>
                <select
                  disabled={!canSesi}
                  value={maxLate}
                  onChange={(e) => setMaxLate(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-850 dark:text-white disabled:opacity-40"
                >
                  <option value={5}>5 Menit</option>
                  <option value={10}>10 Menit</option>
                  <option value={15}>15 Menit</option>
                  <option value={20}>20 Menit</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Limit Toilet</label>
                <select
                  disabled={!canSesi}
                  value={toiletLimit}
                  onChange={(e) => setToiletLimit(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-850 dark:text-white disabled:opacity-40"
                >
                  <option value={5}>5 Menit</option>
                  <option value={10}>10 Menit</option>
                  <option value={15}>15 Menit</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSesi}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-lg text-xs tracking-wider uppercase transition shadow-md duration-200 active:scale-[0.98]"
            >
              Simpan Sesi / Kelas
            </button>
          </form>
        </div>

        {/* DAFTAR TABEL KANAN: Sesi list */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm transition-colors duration-350">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-navy-850 pb-3 mb-4">
            <h4 className="text-[10px] text-navy-900 dark:text-white font-black uppercase tracking-widest">Daftar Sesi Materi dan Instruktur</h4>
            {canSesi && (
              <button
                onClick={() => {
                  setNum(sesi.length + 1);
                  setMateri('');
                  setInstruktur('');
                }}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition shadow-sm flex items-center space-x-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Input Sesi Baru</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse table-auto text-xs min-w-[550px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-extrabold text-[9px] uppercase tracking-wider border-b border-slate-100 dark:border-navy-850">
                  <th className="p-3 w-16">Sesi</th>
                  <th className="p-3">Materi & Instruktur</th>
                  <th className="p-3">Waktu & Durasi</th>
                  <th className="p-3">Aturan Kelas</th>
                  <th className="p-3 text-center w-36">Aksi Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-navy-850 text-slate-650 dark:text-slate-350 font-medium">
                {[...sesi].sort((a, b) => a.num - b.num).map((s, idx) => (
                  <tr key={`${s.num}_${s.kab_kota || 'default'}_${idx}`} className={`hover:bg-slate-50/50 dark:hover:bg-navy-950/20 transition ${s.active ? 'bg-emerald-500/5 dark:bg-emerald-500/5' : ''}`}>
                    <td className="p-3 font-mono font-bold text-navy-900 dark:text-white text-xs">Sesi {s.num}</td>
                    <td className="p-3">
                      <p className="font-extrabold text-slate-800 dark:text-white text-xs uppercase">{s.materi}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{s.instruktur}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-700 dark:text-slate-300 font-mono text-[11px]">{s.startTime} WIB</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{s.duration || 90} Menit</p>
                    </td>
                    <td className="p-3">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold">Late: {s.maxLate || 10}m</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">Toilet: {s.toiletLimit || 5}m</p>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onSetActiveSesi(s.num)}
                          disabled={s.active}
                          className={`px-2.5 py-1 rounded text-[9px] font-black uppercase transition-all duration-150 ${
                            s.active 
                              ? 'bg-emerald-500 text-white shadow-xs' 
                              : 'bg-slate-100 dark:bg-navy-950 text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-900'
                          }`}
                        >
                          {s.active ? 'Aktif' : 'Pilih'}
                        </button>
                        
                        {canSesi && (
                          <>
                            <button
                              onClick={() => handleEditClick(s)}
                              className="p-1.5 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded transition border border-blue-100/10"
                              title="Edit Sesi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteSesi(s.num)}
                              disabled={s.active}
                              className="p-1.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded transition border border-rose-100/10 disabled:opacity-40"
                              title="Hapus Sesi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
