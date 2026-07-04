import React, { useState } from 'react';
import { UserCheck, UserPlus, AtSign, Lock, Trash2, Edit2, X } from 'lucide-react';
import { Tim } from '../types';
import { INDONESIA_REGIONS } from '../utils/regions';

interface TimTabProps {
  tim: Tim[];
  onSaveTim: (t: Tim, index?: number) => void;
  onDeleteTim: (index: number) => void;
  currentUser: Tim;
}

export default function TimTab({
  tim,
  onSaveTim,
  onDeleteTim,
  currentUser
}: TimTabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  
  // Form fields
  const [formNama, setFormNama] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'Admin' | 'Operator' | 'SuperAdmin'>('Operator');
  const [formKabKota, setFormKabKota] = useState('');
  const [formIsSuperAdmin, setFormIsSuperAdmin] = useState(false);
  
  // Selected permissions (for Operators)
  const defaultPerms = ['dash', 'scan', 'rekap'];
  const [perms, setPerms] = useState<string[]>(defaultPerms);

  const isSuperAdminUser = currentUser.role === 'SuperAdmin' || currentUser.is_superadmin === true || currentUser.role === 'Admin';
  const canManage = currentUser.role === 'Admin' || currentUser.role === 'SuperAdmin' || currentUser.is_superadmin === true;

  const openAddModal = () => {
    setEditIndex(null);
    setFormNama('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('Operator');
    setFormKabKota(currentUser.kab_kota || 'KABUPATEN BOGOR');
    setFormIsSuperAdmin(false);
    setPerms(defaultPerms);
    setIsOpen(true);
  };

  const openEditModal = (t: Tim, idx: number) => {
    setEditIndex(idx);
    setFormNama(t.nama);
    setFormUsername(t.username);
    setFormPassword(t.password || '••••••••');
    setFormRole(t.role);
    setFormKabKota(t.kab_kota || '');
    setFormIsSuperAdmin(t.is_superadmin || false);
    setPerms(t.permissions || []);
    setIsOpen(true);
  };

  const handlePermissionToggle = (permission: string) => {
    if (perms.includes(permission)) {
      setPerms(perms.filter(p => p !== permission));
    } else {
      setPerms([...perms, permission]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save Tim
    onSaveTim({
      nama: formNama.trim(),
      username: formUsername.trim().toLowerCase(),
      password: formPassword === '••••••••' ? (tim[editIndex!]?.password || '') : formPassword,
      role: formRole,
      permissions: formRole === 'Admin' || formRole === 'SuperAdmin' ? ['dash', 'scan', 'sesi', 'peserta', 'rekap', 'kelulusan'] : perms,
      kab_kota: formIsSuperAdmin || formRole === 'SuperAdmin' ? '' : formKabKota,
      is_superadmin: formIsSuperAdmin || formRole === 'SuperAdmin'
    }, editIndex !== null ? editIndex : undefined);

    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-xs transition-colors duration-350">
        <div>
          <h3 className="text-sm font-black text-navy-900 dark:text-white uppercase tracking-widest">Manajemen Tim / Operator</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 uppercase font-bold">Kelola hak akses akun operator lapangan pendamping.</p>
        </div>
        
        {canManage && (
          <button
            onClick={openAddModal}
            className="bg-slate-900 dark:bg-slate-950 hover:bg-slate-800 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-sm transition active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span>TAMBAH OPERATOR</span>
          </button>
        )}
      </div>

      {/* Database Listing Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-205 dark:border-navy-800 shadow-sm overflow-hidden transition-colors duration-350">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-extrabold text-[10px] uppercase tracking-widest border-b border-slate-150 dark:border-navy-850">
              <th className="p-4 w-48">NAMA PETUGAS</th>
              <th className="p-4">USERNAME</th>
              <th className="p-4">PASSWORD</th>
              <th className="p-4">ROLE / LEVEL</th>
              <th className="p-4">KABUPATEN / KOTA</th>
              <th className="p-4 text-center w-36">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-navy-850 text-xs text-slate-650 dark:text-slate-350 font-medium">
            {tim.map((t, idx) => (
              <tr key={t.username} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/10 transition align-middle">
                <td className="p-4 font-bold text-slate-800 dark:text-white uppercase">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{t.nama}</span>
                  </div>
                </td>
                <td className="p-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <AtSign className="w-3.5 h-3.5" />
                    <span>{t.username}</span>
                  </div>
                </td>
                <td className="p-4 font-mono text-[11px] text-slate-350 dark:text-slate-600">
                  <div className="flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>••••••••</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                    t.role === 'SuperAdmin' || t.is_superadmin 
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400'
                      : t.role === 'Admin' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                  }`}>
                    {t.role === 'SuperAdmin' || t.is_superadmin ? 'SUPER ADMIN' : t.role}
                  </span>
                </td>
                <td className="p-4 font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase">
                  {t.is_superadmin || t.role === 'SuperAdmin' ? 'SEMUA (PUSAT)' : (t.kab_kota || '-')}
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    {/* Allow self-modification, or full actions if Admin */}
                    {(canManage || currentUser.username === t.username) && (
                      <button
                        onClick={() => openEditModal(t, idx)}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border border-blue-100/60 transition"
                        title="Sunting Akses"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canManage && t.username !== 'admin' && (
                      <button
                        onClick={() => onDeleteTim(idx)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100/60 transition"
                        title="Hapus Operator"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* POP-UP: OPERATOR FORM DIALOG */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] w-full max-w-sm shadow-2xl border border-slate-200 dark:border-navy-800 overflow-hidden transform transition duration-150 scale-100">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b dark:border-navy-850">
              <h4 className="font-extrabold text-xs uppercase tracking-wider">{editIndex !== null ? 'EDIT AKUN OPERATOR' : 'REGISTER AKUN OPERATOR'}</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-slate-250 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-700 dark:text-slate-350">
              
              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">NAMA PETUGAS</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2.5 rounded-lg text-xs font-semibold focus:outline-none dark:text-white"
                  placeholder="Nama Operator"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">USERNAME UNIK</label>
                <input
                  type="text"
                  required
                  disabled={editIndex !== null}
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2.5 rounded-lg text-xs font-mono font-semibold focus:outline-none dark:text-white disabled:opacity-50"
                  placeholder="Contoh: operator3"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">PASSWORD AKSES</label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2.5 rounded-lg text-xs font-mono font-semibold focus:outline-none dark:text-white"
                  placeholder="Masukkan password"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">ROLE / OTORITAS</label>
                <select
                  value={formRole}
                  onChange={(e) => {
                    const newRole = e.target.value as any;
                    setFormRole(newRole);
                    if (newRole === 'SuperAdmin') {
                      setFormIsSuperAdmin(true);
                    } else if (newRole === 'Operator') {
                      setFormIsSuperAdmin(false);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2.5 rounded-lg text-xs font-semibold dark:text-white dark:bg-slate-950"
                >
                  <option value="Operator">Operator Lapangan (Pemindai)</option>
                  <option value="Admin">Administrator (Wilayah)</option>
                  {isSuperAdminUser && <option value="SuperAdmin">Super Administrator (Pusat)</option>}
                </select>
              </div>

              {isSuperAdminUser && formRole !== 'SuperAdmin' && (
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">WILAYAH OPERASI (KAB/KOTA)</label>
                  <select
                    value={formKabKota}
                    onChange={(e) => setFormKabKota(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2.5 rounded-lg text-xs font-semibold dark:text-white dark:bg-slate-950"
                  >
                    <option value="">Pilih Kabupaten/Kota</option>
                    {Object.entries(INDONESIA_REGIONS).map(([provinsi, daftarKabKota]) => (
                      <optgroup key={provinsi} label={provinsi} className="font-bold text-slate-500 uppercase">
                        {daftarKabKota.map((kabKota) => (
                          <option key={kabKota} value={kabKota}>
                            {kabKota}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              {isSuperAdminUser && formRole !== 'SuperAdmin' && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="isSuperAdminCheckbox"
                    checked={formIsSuperAdmin}
                    onChange={(e) => setFormIsSuperAdmin(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 border-slate-350 bg-slate-50"
                  />
                  <label htmlFor="isSuperAdminCheckbox" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none cursor-pointer">
                    Jadikan Super Administrator Pusat
                  </label>
                </div>
              )}

              {/* Access Checkboxes for Operators */}
              {formRole === 'Operator' && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-navy-850">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Izin Hak Akses Modul:</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={perms.includes('dash')}
                        onChange={() => handlePermissionToggle('dash')}
                        className="mr-2 rounded text-emerald-600 focus:ring-emerald-500 border-slate-350 bg-slate-50"
                      />
                      <span>Dashboard</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={perms.includes('peserta')}
                        onChange={() => handlePermissionToggle('peserta')}
                        className="mr-2 rounded text-emerald-600 focus:ring-emerald-500 border-slate-350 bg-slate-50"
                      />
                      <span>Data Kader</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={perms.includes('kelulusan')}
                        onChange={() => handlePermissionToggle('kelulusan')}
                        className="mr-2 rounded text-emerald-600 focus:ring-emerald-500 border-slate-350 bg-slate-50"
                      />
                      <span>Kelulusan</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={perms.includes('scan')}
                        onChange={() => handlePermissionToggle('scan')}
                        className="mr-2 rounded text-emerald-600 focus:ring-emerald-500 border-slate-350 bg-slate-50"
                      />
                      <span>Scan QR</span>
                    </label>
                    <label className="flex items-center text-emerald-600 font-bold">
                      <input
                        type="checkbox"
                        checked={perms.includes('sesi')}
                        onChange={() => handlePermissionToggle('sesi')}
                        className="mr-2 rounded text-emerald-600 focus:ring-emerald-500 border-slate-350 bg-slate-50"
                      />
                      <span>Tambah Sesi</span>
                    </label>
                    <label className="flex items-center text-emerald-600 font-bold">
                      <input
                        type="checkbox"
                        checked={perms.includes('rekap')}
                        onChange={() => handlePermissionToggle('rekap')}
                        className="mr-2 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-800"
                      />
                      <span>Rekap Data</span>
                    </label>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white font-extrabold rounded-xl text-xs mt-4 uppercase tracking-wider transition active:scale-[0.98]"
              >
                SIMPAN OPERATOR
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
