import React, { useState } from 'react';
import { 
  GraduationCap, 
  Search, 
  Edit2, 
  Trash2, 
  Bookmark, 
  X, 
  BookOpen, 
  Clock, 
  Users, 
  MapPin,
  CheckCircle
} from 'lucide-react';
import { Sesi } from '../types';

interface InstrukturTabProps {
  sesi: Sesi[];
  onRenameInstructor: (oldName: string, newName: string) => void;
  onDeleteInstructor: (instructorName: string) => void;
}

interface AggregatedInstructor {
  nama: string;
  materiList: { materi: string; sesiNum: number; kab_kota?: string }[];
  count: number;
}

export default function InstrukturTab({
  sesi,
  onRenameInstructor,
  onDeleteInstructor
}: InstrukturTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [oldInstructorName, setOldInstructorName] = useState('');
  const [newInstructorName, setNewInstructorName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Process the sesi array dynamically to aggregate instructors and materials
  const aggregateInstructors = (): AggregatedInstructor[] => {
    const map = new Map<string, AggregatedInstructor>();

    sesi.forEach(s => {
      const rawName = s.instruktur ? s.instruktur.trim() : "";
      const name = rawName || "Belum Ditentukan";
      const key = name.toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          nama: name,
          materiList: [],
          count: 0
        });
      }

      const entry = map.get(key)!;
      entry.count += 1;
      
      // Add the material details if not already present or to show all
      entry.materiList.push({
        materi: s.materi || "Materi Tanpa Judul",
        sesiNum: s.num,
        kab_kota: s.kab_kota
      });
    });

    // Sort by count descending, then by name ascending
    return Array.from(map.values()).sort((a, b) => {
      if (a.nama === "Belum Ditentukan") return 1;
      if (b.nama === "Belum Ditentukan") return -1;
      return b.count - a.count || a.nama.localeCompare(b.nama);
    });
  };

  const aggregatedList = aggregateInstructors();

  // Filter based on search query
  const filteredList = aggregatedList.filter(ins => {
    const query = searchQuery.toLowerCase();
    const matchesNama = ins.nama.toLowerCase().includes(query);
    const matchesMateri = ins.materiList.some(m => m.materi.toLowerCase().includes(query));
    const matchesKabKota = ins.materiList.some(m => m.kab_kota && m.kab_kota.toLowerCase().includes(query));
    return matchesNama || matchesMateri || matchesKabKota;
  });

  // KPI Calculations
  const totalUniqueInstructors = aggregatedList.filter(ins => ins.nama !== "Belum Ditentukan").length;
  const totalSesiScheduled = sesi.length;
  const mostActiveInstructor = aggregatedList.length > 0 && aggregatedList[0].nama !== "Belum Ditentukan" 
    ? aggregatedList[0] 
    : (aggregatedList[1] || null);

  const openRenameModal = (name: string) => {
    if (name === "Belum Ditentukan") return;
    setOldInstructorName(name);
    setNewInstructorName(name);
    setIsOpen(true);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstructorName.trim()) return;
    onRenameInstructor(oldInstructorName, newInstructorName.trim());
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-xs transition-colors duration-350">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-xl">
            <GraduationCap className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-navy-900 dark:text-white uppercase tracking-widest">Master Data Instruktur & Materi</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 uppercase font-bold">
              Data narasumber & materi kaderisasi disinkronisasikan secara realtime dari tabel Sesi Supabase.
            </p>
          </div>
        </div>
        <div className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold px-3.5 py-1.5 rounded-lg border border-purple-500/20 uppercase tracking-wider shrink-0">
          ● Synced with Supabase
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl shrink-0">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Total Instruktur Unik</p>
            <h4 className="text-lg font-black text-slate-800 dark:text-white leading-none mt-1">
              {totalUniqueInstructors} <span className="text-xs text-slate-400 font-bold">Narasumber</span>
            </h4>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0">
            <BookOpen className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Total Sesi Terjadwal</p>
            <h4 className="text-lg font-black text-slate-800 dark:text-white leading-none mt-1">
              {totalSesiScheduled} <span className="text-xs text-slate-400 font-bold">Materi Kelas</span>
            </h4>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-xs flex items-center space-x-3.5">
          <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-xl shrink-0">
            <CheckCircle className="w-5 h-5 text-purple-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Jam Terbang Tertinggi</p>
            <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight mt-1 truncate uppercase" title={mostActiveInstructor?.nama || "Tidak ada"}>
              {mostActiveInstructor ? mostActiveInstructor.nama : "Belum Ada"}
            </h4>
            {mostActiveInstructor && (
              <p className="text-[9px] text-purple-500 font-bold mt-0.5 uppercase tracking-widest">
                Mengisi {mostActiveInstructor.count} Sesi Kaderisasi
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center transition-colors duration-350">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-450 dark:text-slate-500" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama instruktur, materi, atau asal wilayah (kab/kota)..."
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 pl-10 pr-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 dark:text-white"
          />
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest shrink-0">
          Menampilkan: <span className="text-purple-600 dark:text-purple-400 font-black">{filteredList.length}</span> Instruktur
        </div>
      </div>

      {/* Instructors Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-205 dark:border-navy-800 shadow-sm overflow-hidden transition-colors duration-350">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-extrabold text-[10px] uppercase tracking-widest border-b border-slate-150 dark:border-navy-850">
                <th className="p-4 w-72">NAMA INSTRUKTUR / NARASUMBER</th>
                <th className="p-4">MATERI YANG DIISI & ID SESI</th>
                <th className="p-4 text-center w-48">FREKUENSI MENGAJAR</th>
                <th className="p-4 text-center w-36">AKSI OPERASIONAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-850 text-xs text-slate-650 dark:text-slate-350 font-medium">
              {filteredList.length > 0 ? (
                filteredList.map((ins) => {
                  const isUnassigned = ins.nama === "Belum Ditentukan";
                  return (
                    <tr key={ins.nama} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/10 transition align-middle">
                      {/* Name Col */}
                      <td className="p-4 font-bold text-slate-800 dark:text-white uppercase">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                            isUnassigned 
                              ? 'bg-slate-100 text-slate-400 dark:bg-slate-850 dark:text-slate-600' 
                              : 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400'
                          }`}>
                            {ins.nama.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className={isUnassigned ? 'text-slate-400 italic font-bold' : ''}>{ins.nama}</span>
                            {!isUnassigned && (
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                Narasumber Utama
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Materials List Col */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xl">
                          {ins.materiList.map((m, mIdx) => (
                            <div 
                              key={`${m.sesiNum}-${mIdx}`}
                              className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300"
                            >
                              <Bookmark className="w-3 h-3 text-purple-500 shrink-0" />
                              <span>Sesi {m.sesiNum}: {m.materi}</span>
                              {m.kab_kota && (
                                <span className="text-[8px] bg-slate-200 dark:bg-navy-800 px-1 py-0.2 rounded font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest shrink-0">
                                  {m.kab_kota}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Count/Frequency Col */}
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center justify-center">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider ${
                            isUnassigned 
                              ? 'bg-slate-100 text-slate-400 dark:bg-navy-850 dark:text-slate-600' 
                              : 'bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400'
                          }`}>
                            {ins.count} KALI
                          </span>
                          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            Mengisi Materi
                          </span>
                        </div>
                      </td>

                      {/* Actions Col */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            disabled={isUnassigned}
                            onClick={() => openRenameModal(ins.nama)}
                            className={`p-2 rounded-lg border transition ${
                              isUnassigned 
                                ? 'bg-slate-50 text-slate-300 border-slate-100 dark:bg-navy-950/5 dark:text-slate-800 dark:border-transparent cursor-not-allowed' 
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-100/60 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:border-blue-900/30'
                            }`}
                            title={isUnassigned ? "Tidak dapat menyunting pengisi kosong" : "Ubah Nama Instruktur"}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={isUnassigned}
                            onClick={() => onDeleteInstructor(ins.nama)}
                            className={`p-2 rounded-lg border transition ${
                              isUnassigned 
                                ? 'bg-slate-50 text-slate-300 border-slate-100 dark:bg-navy-950/5 dark:text-slate-800 dark:border-transparent cursor-not-allowed' 
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-100/60 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:border-rose-900/30'
                            }`}
                            title={isUnassigned ? "Tidak dapat menghapus pengisi kosong" : "Kosongkan dari Seluruh Sesi"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 dark:text-slate-600 font-bold uppercase tracking-wider">
                    Tidak ada data instruktur atau materi ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POP-UP: RENAME DIALOG */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] w-full max-w-sm shadow-2xl border border-slate-200 dark:border-navy-800 overflow-hidden transform transition duration-150 scale-100">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b dark:border-navy-850">
              <h4 className="font-extrabold text-xs uppercase tracking-wider">
                UBAH NAMA INSTRUKTUR SECARA GLOBAL
              </h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-slate-250 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="p-6 space-y-4 text-slate-700 dark:text-slate-350">
              
              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  NAMA INSTRUKTUR SAAT INI
                </label>
                <input
                  type="text"
                  disabled
                  value={oldInstructorName}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-400 dark:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  NAMA INSTRUKTUR BARU *
                </label>
                <input
                  type="text"
                  required
                  value={newInstructorName}
                  onChange={(e) => setNewInstructorName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2.5 rounded-lg text-xs font-bold focus:outline-none dark:text-white"
                  placeholder="Contoh: Sahabat H. Addin Jauharudin, M.A."
                />
                <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase leading-relaxed">
                  * Perubahan nama ini akan otomatis disinkronisasikan ke seluruh Sesi di database Supabase yang saat ini diisi oleh narasumber ini.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition active:scale-[0.98]"
                >
                  SIMPAN & SINKRONISASI
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
