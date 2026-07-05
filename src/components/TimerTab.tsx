import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Tv, 
  Volume2, 
  VolumeX, 
  Calendar, 
  User, 
  Maximize2, 
  Minimize2, 
  Settings, 
  Clock, 
  AlertCircle,
  Hourglass,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { Sesi } from '../types';

interface TimerTabProps {
  sesi: Sesi[];
}

export default function TimerTab({ sesi }: TimerTabProps) {
  // Config
  const DEFAULT_DURATION_MINUTES = 90;

  // Selected Sesi
  const [selectedSesiNum, setSelectedSesiNum] = useState<number | 'custom'>('custom');
  
  // Sesi details (either selected from list or custom input)
  const [sessionTitle, setSessionTitle] = useState('Sesi Presentasi Bebas');
  const [instructorName, setInstructorName] = useState('Narasumber Mandiri');

  // Timer states
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_DURATION_MINUTES * 60);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_DURATION_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(90);

  // Full Screen & Projector Mode
  const [isFullScreen, setIsFullScreen] = useState(false);
  const projectorRef = useRef<HTMLDivElement>(null);

  // Audio Context for beep sound when timer ends (synthesized so no external assets needed)
  const audioContextRef = useRef<AudioContext | null>(null);

  // Handle selected session changes
  useEffect(() => {
    if (selectedSesiNum === 'custom') {
      setSessionTitle('Sesi Presentasi Bebas');
      setInstructorName('Narasumber Mandiri');
      const secs = customMinutes * 60;
      setTotalSeconds(secs);
      setSecondsLeft(secs);
      setIsRunning(false);
    } else {
      const activeSesi = sesi.find(s => s.num === selectedSesiNum);
      if (activeSesi) {
        setSessionTitle(`Sesi ${activeSesi.num}: ${activeSesi.materi || 'Materi Belum Diisi'}`);
        setInstructorName(activeSesi.instruktur || 'Belum Ditentukan');
        
        // Use session duration if defined and > 0, otherwise default to 90 mins
        const durationMin = (activeSesi.duration && activeSesi.duration > 0) ? activeSesi.duration : DEFAULT_DURATION_MINUTES;
        setCustomMinutes(durationMin);
        const secs = durationMin * 60;
        setTotalSeconds(secs);
        setSecondsLeft(secs);
        setIsRunning(false);
      }
    }
  }, [selectedSesiNum, sesi]);

  // Main countdown loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            playCompletionSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  // Sync manual custom minutes input
  const handleCustomMinutesChange = (mins: number) => {
    const val = Math.max(1, Math.min(600, mins));
    setCustomMinutes(val);
    if (selectedSesiNum === 'custom') {
      const secs = val * 60;
      setTotalSeconds(secs);
      setSecondsLeft(secs);
      setIsRunning(false);
    }
  };

  // Quick Presets
  const applyPreset = (minutes: number) => {
    setCustomMinutes(minutes);
    const secs = minutes * 60;
    setTotalSeconds(secs);
    setSecondsLeft(secs);
    setIsRunning(false);
  };

  // Timer controls
  const handleStartPause = () => {
    if (secondsLeft === 0) {
      // Auto reset if starting at 0
      setSecondsLeft(totalSeconds);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
  };

  // Web Audio API Synthesizer beep
  const playCompletionSound = () => {
    if (isMuted) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // Play a nice triple-beep sequence
      const now = ctx.currentTime;
      
      const playBeep = (timeOffset: number, frequency: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, now + timeOffset);
        
        gainNode.gain.setValueAtTime(0.3, now + timeOffset);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + timeOffset + duration);
        
        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + duration);
      };

      playBeep(0, 880, 0.4);
      playBeep(0.5, 880, 0.4);
      playBeep(1.0, 1200, 0.6);
    } catch (e) {
      console.warn("Audio Context failed to play beep:", e);
    }
  };

  // Full Screen API wrapper
  const toggleFullScreen = () => {
    if (!isFullScreen) {
      if (projectorRef.current?.requestFullscreen) {
        projectorRef.current.requestFullscreen();
        setIsFullScreen(true);
      } else {
        // Fallback layout-only full screen
        setIsFullScreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullScreen(false);
    }
  };

  // Monitor hardware fullscreen escape
  useEffect(() => {
    const handleFSChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  // Format seconds to HH:MM:SS
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    
    const hStr = h > 0 ? `${h.toString().padStart(2, '0')}:` : '';
    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');
    
    return `${hStr}${mStr}:${sStr}`;
  };

  // Progress calculations
  const progressPercentage = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
  
  // Theme color based on time left
  const isTimeCritical = secondsLeft <= 300; // Less than 5 mins (amber)
  const isTimeDanger = secondsLeft <= 60;   // Less than 1 min (red)
  
  let progressColorClass = "text-purple-600 dark:text-purple-400";
  let ringBgColor = "stroke-purple-600 dark:stroke-purple-400";
  let timerTextColor = "text-slate-800 dark:text-white";
  let statusBadgeColor = "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400";

  if (isTimeDanger) {
    progressColorClass = "text-rose-600 dark:text-rose-400 animate-pulse";
    ringBgColor = "stroke-rose-600 dark:stroke-rose-400";
    timerTextColor = "text-rose-600 dark:text-rose-400 font-black animate-pulse";
    statusBadgeColor = "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400";
  } else if (isTimeCritical) {
    progressColorClass = "text-amber-500 dark:text-amber-400";
    ringBgColor = "stroke-amber-500 dark:stroke-amber-400";
    timerTextColor = "text-amber-500 dark:text-amber-400";
    statusBadgeColor = "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";
  }

  // Find currently active session
  const activeSesiFromList = sesi.find(s => s.active);

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-xs transition-colors duration-350">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-xl">
            <Clock className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-navy-900 dark:text-white uppercase tracking-widest">Waktu Digital & Running Timer</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 uppercase font-bold">
              Stopwatch hitung waktu mundur presentasi narasumber & sesi kaderisasi GP Ansor.
            </p>
          </div>
        </div>
        <button
          onClick={toggleFullScreen}
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 text-white font-extrabold px-4.5 py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-sm transition active:scale-[0.98]"
        >
          <Tv className="w-4 h-4 text-emerald-400" />
          <span>PROJEKTOR FULLSCREEN</span>
        </button>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: THE GORGEOUS INTERACTIVE TIMER DISPLAY */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-navy-800 shadow-xs flex flex-col justify-between items-center relative overflow-hidden min-h-[460px] transition-colors duration-350">
          
          {/* Top session display */}
          <div className="w-full text-center space-y-1.5 pb-4 border-b border-slate-100 dark:border-navy-850/60 z-10">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <Calendar className="w-3 h-3 text-purple-500" />
              <span>Sesi Terpilih: {selectedSesiNum === 'custom' ? 'Custom Presentasi' : `Sesi ${selectedSesiNum}`}</span>
            </div>
            <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider line-clamp-1">
              {sessionTitle}
            </h4>
            <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">{instructorName}</span>
            </div>
          </div>

          {/* Central Circular Progress Timer */}
          <div className="relative my-8 flex items-center justify-center w-60 h-60 md:w-64 md:h-64 shrink-0 z-10 select-none">
            {/* Circular SVG Progress Meter */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Underlay Track */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-slate-100 dark:stroke-navy-850 fill-transparent"
                strokeWidth="6"
              />
              {/* Active Indicator Ring */}
              <circle
                cx="50"
                cy="50"
                r="44"
                className={`fill-transparent transition-all duration-300 ${ringBgColor}`}
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - progressPercentage / 100)}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner text and numbers */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-1">
              <span className={`text-4xl md:text-5xl font-black font-mono tracking-tight leading-none ${timerTextColor}`}>
                {formatTime(secondsLeft)}
              </span>
              <div className="flex flex-col items-center">
                <span className={`text-[9px] font-extrabold uppercase tracking-widest ${
                  isRunning ? 'text-emerald-500 animate-pulse' : 'text-slate-400'
                }`}>
                  {isRunning ? 'RUNNING' : secondsLeft === 0 ? 'TIME OUT' : 'PAUSED'}
                </span>
                <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                  dari {customMinutes} Menit
                </span>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="w-full pt-4 border-t border-slate-100 dark:border-navy-850/60 flex items-center justify-between z-10">
            {/* Reset */}
            <button
              onClick={handleReset}
              className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-xl transition hover:scale-105 active:scale-95 flex items-center space-x-1.5 text-xs font-bold"
              title="Reset Timer"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">RESET</span>
            </button>

            {/* Play/Pause Main Controller */}
            <button
              onClick={handleStartPause}
              className={`px-8 py-3.5 text-white font-extrabold rounded-2xl text-xs uppercase tracking-widest flex items-center space-x-2.5 transition duration-200 shadow-md transform hover:scale-[1.03] active:scale-95 ${
                isRunning 
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10' 
                  : secondsLeft === 0 
                    ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/10'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-white text-white" />
                  <span>JEDA PRESENTASI</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>START TIMER</span>
                </>
              )}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 border rounded-xl transition hover:scale-105 active:scale-95 flex items-center space-x-1.5 text-xs font-bold ${
                isMuted 
                  ? 'bg-rose-50 border-rose-100 text-rose-500 dark:bg-rose-950/20 dark:border-rose-900/30' 
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-navy-850 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
              title={isMuted ? "Suara Alarm Off" : "Suara Alarm On"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 shrink-0" /> : <Volume2 className="w-4 h-4 shrink-0" />}
              <span className="hidden sm:inline">{isMuted ? 'MUTE' : 'SOUND'}</span>
            </button>
          </div>

          {/* Decorative ambient background glows */}
          <div className="absolute -top-16 -left-16 w-32 h-32 bg-purple-500/5 dark:bg-purple-500/2 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/2 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* RIGHT COLUMN: CONTROLS, SESSIONS & PRESETS */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          
          {/* Quick Preset Panels */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200 dark:border-navy-800 shadow-xs transition-colors duration-350">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-navy-850">
              <Sliders className="w-4.5 h-4.5 text-purple-500" />
              <h4 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider">
                Pengaturan Durasi Waktu
              </h4>
            </div>

            <div className="mt-4 space-y-4">
              {/* Preset buttons */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  DURASI PRESENTASI PRESET
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[90, 60, 45, 30, 15].map(mins => (
                    <button
                      key={mins}
                      onClick={() => applyPreset(mins)}
                      className={`py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all ${
                        customMinutes === mins && selectedSesiNum === 'custom'
                          ? 'bg-purple-600 text-white border-transparent shadow-md'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-navy-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-850'
                      }`}
                    >
                      {mins} Menit {mins === 90 && '🌟'}
                    </button>
                  ))}
                  <button
                    onClick={() => applyPreset(120)}
                    className={`py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all ${
                      customMinutes === 120 && selectedSesiNum === 'custom'
                        ? 'bg-purple-600 text-white border-transparent shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-navy-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-850'
                    }`}
                  >
                    120 Menit
                  </button>
                </div>
              </div>

              {/* Custom Number Input */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  INPUT CUSTOM MENIT MANUAL
                </label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Hourglass className="h-4 w-4 text-slate-400" />
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="600"
                      value={customMinutes}
                      onChange={(e) => handleCustomMinutesChange(parseInt(e.target.value) || 90)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 pl-10 pr-4 py-2.5 rounded-xl text-xs font-black dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                    MENIT
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sesi DB Linker */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-200 dark:border-navy-800 shadow-xs transition-colors duration-350">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-navy-850">
              <Calendar className="w-4.5 h-4.5 text-purple-500" />
              <h4 className="text-xs font-black text-slate-850 dark:text-white uppercase tracking-wider">
                Hubungkan Dengan Sesi Supabase
              </h4>
            </div>

            <div className="mt-4 space-y-4">
              {/* Alert helper */}
              {activeSesiFromList ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/30 rounded-xl flex items-start space-x-2.5">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-1.5 animate-pulse" />
                  <div className="text-[10px] text-emerald-800 dark:text-emerald-400 font-semibold leading-relaxed">
                    <span className="font-extrabold uppercase">Sesi Sedang Aktif:</span> Sesi {activeSesiFromList.num} ({activeSesiFromList.materi || 'Materi'}). Silakan pilih di bawah untuk mensinkronkan timer.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-navy-950/40 border border-slate-200 dark:border-navy-850 rounded-xl flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    Saat ini tidak ada Sesi Kaderisasi yang sedang ditandai aktif di menu Kelola Sesi. Anda tetap bisa memilih Sesi manapun secara manual.
                  </div>
                </div>
              )}

              {/* Sesi Dropdown */}
              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                  PILIH SESI KADERISASI
                </label>
                <select
                  value={selectedSesiNum}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedSesiNum(val === 'custom' ? 'custom' : parseInt(val));
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3.5 py-2.5 rounded-xl text-xs font-black dark:text-white focus:outline-none"
                >
                  <option value="custom">-- PRESET MANDIRI / CUSTOM --</option>
                  {sesi.map((s, idx) => (
                    <option key={`${s.num}_${s.kab_kota || 'default'}_${idx}`} value={s.num}>
                      Sesi {s.num}: {s.materi || 'Materi Bebas'} ({s.instruktur || 'Tanpa Narasumber'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Direct Quick Sync Action for active session */}
              {activeSesiFromList && selectedSesiNum !== activeSesiFromList.num && (
                <button
                  onClick={() => {
                    setSelectedSesiNum(activeSesiFromList.num);
                  }}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-widest rounded-xl border border-emerald-100 dark:border-emerald-900/30 transition flex items-center justify-center space-x-2.5"
                >
                  <span>SYNC TIMER KE SESI AKTIF (SESI {activeSesiFromList.num})</span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* FULL-SCREEN PROJECTOR PORTAL OVERLAY */}
      {isFullScreen && (
        <div 
          ref={projectorRef} 
          className="fixed inset-0 bg-slate-950 text-white z-[9999] flex flex-col justify-between p-12 select-none"
        >
          {/* Top Info Banner */}
          <div className="flex justify-between items-center border-b border-white/10 pb-6 w-full">
            <div className="space-y-1">
              <span className="text-emerald-400 font-black text-xs uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                GP ANSOR PRESENTATION TIMER
              </span>
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1.5">
                Kaderisasi Kepemimpinan & Pengabdian Jam'iyah
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-xl border transition ${
                  isMuted 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleFullScreen}
                className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition"
                title="Keluar Layar Penuh"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Central Massive Digital Clock */}
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            
            {/* Session Metadata display */}
            <div className="space-y-3 max-w-4xl">
              <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-wide leading-tight">
                {sessionTitle}
              </h2>
              <div className="flex items-center justify-center space-x-2 text-white/60 font-bold uppercase tracking-widest text-xs md:text-sm">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Narasumber: {instructorName}</span>
              </div>
            </div>

            {/* Huge countdown display */}
            <div className="space-y-2">
              <div className={`text-[120px] sm:text-[180px] md:text-[230px] font-black font-mono tracking-tighter leading-none select-all ${
                isTimeDanger 
                  ? 'text-rose-500 animate-pulse' 
                  : isTimeCritical 
                    ? 'text-amber-500' 
                    : 'text-emerald-400'
              }`}>
                {formatTime(secondsLeft)}
              </div>
              
              {/* Sesi Status Info Banner */}
              <div className="flex items-center justify-center space-x-2 text-xs font-black uppercase tracking-widest">
                <span className={`w-3 h-3 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-white/40">Status:</span>
                <span className={isRunning ? 'text-emerald-400' : 'text-rose-400'}>
                  {isRunning ? 'Sesi Sedang Berlangsung' : 'Sesi Dijeda'}
                </span>
                <span className="text-white/20">|</span>
                <span className="text-white/40">Target:</span>
                <span className="text-white/80">{customMinutes} Menit</span>
              </div>
            </div>

            {/* Bottom mini-progress bar to span screen */}
            <div className="w-full max-w-5xl bg-white/5 h-2.5 rounded-full overflow-hidden mt-4">
              <div 
                className={`h-full transition-all duration-300 ${
                  isTimeDanger ? 'bg-rose-500' : isTimeCritical ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

          </div>

          {/* Bottom Projection Controllers */}
          <div className="border-t border-white/5 pt-6 flex items-center justify-between text-xs font-bold text-white/40">
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleStartPause}
                className={`px-6 py-3 rounded-xl text-white font-extrabold flex items-center space-x-2 transition ${
                  isRunning 
                    ? 'bg-amber-500 hover:bg-amber-600' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isRunning ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                <span>{isRunning ? 'JEDA' : 'START'}</span>
              </button>

              <button 
                onClick={handleReset}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80 transition"
              >
                RESET TIMER
              </button>
            </div>

            <div className="uppercase tracking-widest text-[9px] font-black text-white/30 text-right">
              Materi Pengkaderan GP Ansor © 2026<br/>
              Sistem Absensi & Penilaian Terintegrasi
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
