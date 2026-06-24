import React, { useState } from 'react';
import { Users, UserPlus, Search, QrCode, Edit2, Trash2, X, Upload } from 'lucide-react';
import { Peserta, Branding } from '../types';

interface PesertaTabProps {
  peserta: Peserta[];
  branding: Branding;
  onSavePeserta: (p: Peserta, originalId?: string) => void;
  onDeletePeserta: (id: string) => void;
  onPrintQr: (id: string) => void;
}

export default function PesertaTab({
  peserta,
  branding,
  onSavePeserta,
  onDeletePeserta,
  onPrintQr
}: PesertaTabProps) {
  const [search, setSearch] = useState('');
  const [isOpenModal, setIsOpenModal] = useState(false);
  
  // Form input states
  const [originalId, setOriginalId] = useState('');
  const [formId, setFormId] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formUtusan, setFormUtusan] = useState('');
  const [formHp, setFormHp] = useState('');
  const [formFoto, setFormFoto] = useState('');
  const [fileName, setFileName] = useState('No file chosen');

  // Filter list
  const filteredPeserta = peserta.filter(p =>
    p.nama.toLowerCase().includes(search.toLowerCase()) ||
    p.utusan.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setOriginalId('');
    setFormId('');
    setFormNama('');
    setFormUtusan('');
    setFormHp('');
    setFormFoto('');
    setFileName('No file chosen');
    setIsOpenModal(true);
  };

  const openEditModal = (p: Peserta) => {
    setOriginalId(p.id);
    setFormId(p.id);
    setFormNama(p.nama);
    setFormUtusan(p.utusan);
    setFormHp(p.hp);
    setFormFoto(p.foto || '');
    setFileName(p.foto ? 'Kader photo selected' : 'No file chosen');
    setIsOpenModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setFormFoto(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate or preserve custom ID
    let finalId = formId;
    if (!formId) {
      const d = new Date();
      const dateStr = `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
      const prefix = `${peserta.length + 1}`;
      finalId = `IX-22.29.01.${dateStr}.${String(prefix).padStart(3, '0')}`;
    }

    const prevKader = originalId ? peserta.find(k => k.id === originalId) : peserta.find(k => k.id === formId);

    onSavePeserta({
      id: finalId.trim().toUpperCase(),
      nama: formNama.trim().toUpperCase(),
      utusan: formUtusan.trim().toUpperCase(),
      hp: formHp.trim(),
      foto: formFoto,
      nilai_post_test: prevKader ? prevKader.nilai_post_test : 0,
      nilai_praktik: prevKader ? prevKader.nilai_praktik : 0,
      nilai_keaktifan: prevKader ? prevKader.nilai_keaktifan : 0,
      status_kelulusan: prevKader ? prevKader.status_kelulusan : 'TIDAK LULUS',
      no_sertifikat: prevKader ? prevKader.no_sertifikat : '',
      izin_menit: prevKader ? prevKader.izin_menit : 0
    }, originalId || undefined);

    setIsOpenModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-xs transition-colors duration-350">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Users className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-navy-900 dark:text-white uppercase tracking-widest">Database Anggota Peserta</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Kelola data pendaftaran berkas kaderisasi GP Ansor secara tertata.</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-5 py-3 rounded-xl text-xs flex items-center space-x-2 shadow-xs transition shrink-0 active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4 text-white" />
          <span>TAMBAH PESERTA</span>
        </button>
      </div>

      {/* Database Spreadsheet card */}
      <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200/60 dark:border-navy-800 shadow-sm overflow-hidden transition-colors duration-350">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200/60 dark:border-navy-850 bg-slate-50/50 dark:bg-slate-950/20 flex justify-between">
          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-navy-850 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-emerald-500 text-slate-700 dark:text-white font-semibold"
              placeholder="Cari nama, utusan, atau ID kader..."
            />
          </div>
        </div>

        {/* Live List spreadsheet table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-extrabold text-[10px] uppercase tracking-widest border-b border-slate-150 dark:border-navy-850">
                <th className="p-4 w-36">ID / CARD</th>
                <th className="p-4">NAMA LENGKAP</th>
                <th className="p-4">UTUSAN / DELEGASI</th>
                <th className="p-4">NO. HP</th>
                <th className="p-4 text-center w-36">AKSI OPERASIONAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-850 text-xs text-slate-650 dark:text-slate-350 font-medium">
              {filteredPeserta.length > 0 ? (
                filteredPeserta.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/10 transition align-middle">
                    <td className="p-4 font-bold text-emerald-500 text-[11px] tracking-wider font-mono">
                      {p.id}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        {p.foto ? (
                          <img src={p.foto} className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/10 shadow-sm shrink-0 border border-slate-205" alt="Avatar" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-950 text-slate-400 flex items-center justify-center shrink-0 border dark:border-navy-800">
                            {p.nama.charAt(0)}
                          </div>
                        )}
                        <span className="font-extrabold text-slate-800 dark:text-white text-xs uppercase">{p.nama}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-500 dark:text-slate-400 uppercase text-[11px]">
                      {branding.delegationType || 'PAC'} {p.utusan}
                    </td>
                    <td className="p-4 font-mono select-all text-slate-600 dark:text-slate-300 text-xs text-[11px]">
                      {p.hp}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => onPrintQr(p.id)}
                          className="p-2 bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-navy-900 text-slate-650 dark:text-slate-300 rounded-lg border border-slate-150 dark:border-navy-850 transition-all hover:scale-105"
                          title="Cetak ID QR Card"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-105 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100/30 transition-all hover:scale-105"
                          title="Ubah Biodata"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeletePeserta(p.id)}
                          className="p-2 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-105 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100/30 transition-all hover:scale-105"
                          title="Hapus Kader"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                    Belum ada data anggota yang lolos pencarian
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* POP-UP MODAL BIODATA KADER (TAMBAH / EDIT) */}
      {isOpenModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] w-full max-w-md shadow-2xl border border-slate-200 dark:border-navy-800 overflow-hidden transform transition duration-150 scale-100 animate-in fade-in zoom-in-95">
            
            <div className="bg-slate-900 text-white px-6 py-4.5 flex justify-between items-center border-b dark:border-navy-850">
              <h4 className="font-extrabold text-xs uppercase tracking-widest">
                {formId ? 'UBAH DATA KADER' : 'TAMBAH REGISTER PESERTA_'}
              </h4>
              <button
                onClick={() => setIsOpenModal(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-700 dark:text-slate-350">
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">ID / CARD (NOMOR REGISTER)</label>
                <input
                  type="text"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1.5 focus:ring-emerald-500 text-slate-800 dark:text-white font-mono uppercase"
                  placeholder="Kosongkan untuk auto-generate nomor ID"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">NAMA LENGKAP SESUAI KTP</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1.5 focus:ring-emerald-500 text-slate-800 dark:text-white"
                  placeholder="Contoh: DOMIRI"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">UTUSAN / {(branding.delegationType || 'PAC').toUpperCase()} / DELEGASI</label>
                <input
                  type="text"
                  required
                  value={formUtusan}
                  onChange={(e) => setFormUtusan(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1.5 focus:ring-emerald-500 text-slate-800 dark:text-white"
                  placeholder="Contoh: Gunungsindur"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">NOMOR HANDPHONE (WHATSAPP)</label>
                <input
                  type="text"
                  required
                  value={formHp}
                  onChange={(e) => setFormHp(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3.5 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1.5 focus:ring-emerald-500 text-slate-800 dark:text-white"
                  placeholder="Contoh: 08123456789"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">FOTO FORMAL PROFIL PESERTA</label>
                <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-navy-850">
                  <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-navy-900 border border-slate-200 dark:border-navy-850 rounded-xl text-xs font-bold text-slate-700 dark:text-white cursor-pointer transition select-none flex items-center space-x-2 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Gambar</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate shrink-0 max-w-[150px]">
                    {fileName}
                  </span>
                </div>
              </div>

              {formFoto && (
                <div className="flex justify-center border-t dark:border-navy-850 pt-3">
                  <img
                    src={formFoto}
                    className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500"
                    alt="Preview"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-navy-850 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsOpenModal(false)}
                  className="px-5 py-2.5 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-navy-900 text-slate-500 dark:text-slate-400 font-bold rounded-xl text-xs transition border border-slate-200 dark:border-navy-850 uppercase active:scale-[0.98]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition uppercase active:scale-[0.98] shadow-md shadow-emerald-500/10"
                >
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
