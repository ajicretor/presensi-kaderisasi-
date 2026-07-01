import React, { useState } from 'react';
import { User, Lock, KeyRound, ShieldAlert } from 'lucide-react';
import { Tim, Branding } from '../types';
import { getSupabaseClient } from '../supabase';

interface LoginScreenProps {
  tim: Tim[];
  branding: Branding;
  onLoginSuccess: (user: Tim) => void;
}

export default function LoginScreen({ tim, branding, onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const checkCredentials = async () => {
      try {
        const client = getSupabaseClient();
        if (client) {
          // Attempt direct pull for the user from Supabase to handle multi-device credential synchronization immediately
          const { data, error: dbError } = await client
            .from('tim')
            .select('*')
            .eq('username', username.trim().toLowerCase())
            .maybeSingle();

          if (data && !dbError) {
            if (data.password === password) {
              setLoading(false);
              onLoginSuccess(data as Tim);
              return;
            } else {
              setLoading(false);
              setError('Kombinasi username atau password salah.');
              return;
            }
          }
        }
      } catch (err) {
        console.warn("Direct database auth check failed, falling back to cached list:", err);
      }

      // Offline / cached local fallback list
      const matched = tim.find(
        (t) => t.username.toLowerCase() === username.trim().toLowerCase() && t.password === password
      );

      setLoading(false);
      if (matched) {
        onLoginSuccess(matched);
      } else {
        setError('Kombinasi username atau password salah.');
      }
    };

    // Add a small artificial delay for clean animation rhythm and visual transition
    setTimeout(() => {
      checkCredentials();
    }, 400);
  };

  // Determine gradient based on branding theme color
  const getGradientClass = () => {
    switch (branding.themeColor) {
      case 'navy':
        return 'from-blue-700 via-blue-900 to-slate-950';
      case 'indigo':
        return 'from-indigo-600 via-indigo-800 to-violet-950';
      case 'rose':
        return 'from-rose-600 via-rose-850 to-stone-950';
      case 'amber':
        return 'from-amber-600 via-amber-850 to-neutral-950';
      default: // emerald
        return 'from-emerald-600 via-emerald-800 to-teal-950';
    }
  };

  const getTextColorClass = () => {
    switch (branding.themeColor) {
      case 'navy': return 'text-blue-300';
      case 'indigo': return 'text-indigo-300';
      case 'rose': return 'text-rose-300';
      case 'amber': return 'text-amber-300';
      default: return 'text-emerald-300';
    }
  };

  const getButtonBgClass = () => {
    switch (branding.themeColor) {
      case 'navy': return 'bg-blue-600 hover:bg-blue-750';
      case 'indigo': return 'bg-indigo-600 hover:bg-indigo-750';
      case 'rose': return 'bg-rose-600 hover:bg-rose-750';
      case 'amber': return 'bg-amber-600 hover:bg-amber-750';
      default: return 'bg-emerald-600 hover:bg-emerald-700';
    }
  };

  return (
    <div id="page-login" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-navy-950 overflow-y-auto p-4 md:p-6 transition-colors duration-350">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px] relative border border-slate-200/50 dark:border-navy-800 transition-colors duration-350">
        
        {/* Sisi Kiri: Panel Informasi & Selamat Datang */}
        <div className={`w-full md:w-5/12 bg-gradient-to-br ${getGradientClass()} text-white p-8 md:p-10 flex flex-col justify-between relative overflow-hidden shrink-0`}>
          {/* Dekorasi Latar Belakang */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-20 -right-10 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
          
          {/* Badge Atas */}
          <div className="relative z-10 text-center md:text-left">
            <span className={`bg-white/10 backdrop-blur-md ${getTextColorClass()} font-extrabold text-[9px] px-3.5 py-1.5 rounded-full uppercase tracking-widest border border-white/5`}>
              KADERISASI DIGITAL
            </span>
          </div>

          {/* Pusat Logo & Judul */}
          <div className="relative z-10 flex flex-col items-center justify-center py-10 md:py-0 my-auto text-center">
            <div className="bg-white/10 backdrop-blur-md p-5 rounded-[24px] border border-white/15 shadow-xl mb-6 flex items-center justify-center">
              {branding && branding.logo && (typeof branding.logo === 'string') && (branding.logo.trim().startsWith('<svg') || branding.logo.trim().startsWith('<div')) ? (
                <div dangerouslySetInnerHTML={{ __html: branding.logo }} className="w-16 h-16 flex items-center justify-center scale-150 text-white" />
              ) : branding && branding.logo ? (
                <img src={branding.logo} alt="Logo" className="w-24 h-24 object-contain rounded-2xl" referrerPolicy="no-referrer" />
              ) : null}
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-white leading-none">{branding.appName}</h2>
            <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest mt-2">{branding.organisasi}</p>
            <p className="text-xs text-white/70 mt-4 max-w-xs leading-relaxed hidden md:block">
              Sistem integrasi manajemen kehadiran, analisis evaluasi kelulusan, serta pencetakan sertifikasi kader terpadu.
            </p>
          </div>

          {/* Identitas Bawah */}
          <div className="relative z-10 text-center md:text-left text-[9px] text-white/50 font-bold tracking-wider">
            {branding.organisasi} &copy; 2026
          </div>

          {/* Cloud Wavy Transition SVG (Desktop Side Wave) */}
          <div className="absolute right-0 top-0 bottom-0 w-16 hidden md:block pointer-events-none transform translate-x-1">
            <svg className="h-full w-full fill-white dark:fill-slate-900 transition-colors duration-350" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M100,0 C85,15 95,30 80,45 C65,60 85,75 70,90 C55,100 100,100 100,100 Z"></path>
            </svg>
          </div>

          {/* Cloud Wavy Transition SVG (Mobile Bottom Wave) */}
          <div className="absolute bottom-0 left-0 right-0 h-16 md:hidden pointer-events-none transform translate-y-1">
            <svg className="w-full h-full fill-white dark:fill-slate-900 transition-colors duration-350" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,100 C15,85 30,95 45,80 C60,65 75,85 90,70 C100,55 100,100 100,100 Z"></path>
            </svg>
          </div>
        </div>

        {/* Sisi Kanan: Panel Form Masuk */}
        <div className="w-full md:w-7/12 bg-white dark:bg-slate-900 p-8 md:p-12 flex flex-col justify-center transition-colors duration-350">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white uppercase tracking-wider">LOGIN</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold">Silakan masukkan kredensial otentikasi tim Anda</p>
            </div>

            {error && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center space-x-2 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition shadow-sm"
                    placeholder="Masukkan username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition shadow-sm"
                    placeholder="Masukkan password"
                  />
                </div>
              </div>

              {/* Options Row */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
                  <span className="text-[11px]">Keep me logged in</span>
                </label>
                <span className="text-slate-400 dark:text-slate-500 hover:underline text-[11px] cursor-pointer">Syarat & Ketentuan</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-6 ${getButtonBgClass()} text-white font-extrabold rounded-full text-xs uppercase tracking-wider transition-all duration-200 shadow-lg active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Sign In...' : 'Sign In'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
