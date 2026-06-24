import React, { useEffect, useRef, useState } from 'react';
import { safeStorage } from '../utils/storage';

interface MapRegion {
  name: string;
  count: number;
  lat: number;
  lng: number;
  coords?: { x: string; y: string };
}

interface LeafletMapProps {
  regions: MapRegion[];
  onPinClick: (reg: MapRegion) => void;
  activePin: MapRegion | null;
}

const loadLeaflet = (): Promise<any> => {
  return new Promise((resolve) => {
    if ((window as any).L) {
      resolve((window as any).L);
      return;
    }

    const existingScript = document.getElementById('leaflet-js') as HTMLScriptElement;
    if (existingScript) {
      const handleLoad = () => {
        resolve((window as any).L);
        cleanup();
      };
      const handleError = () => {
        resolve(null);
        cleanup();
      };
      const cleanup = () => {
        existingScript.removeEventListener('load', handleLoad);
        existingScript.removeEventListener('error', handleError);
      };
      existingScript.addEventListener('load', handleLoad);
      existingScript.addEventListener('error', handleError);
      
      // Fallback timeout
      setTimeout(() => {
        resolve((window as any).L || null);
        cleanup();
      }, 4000);
      return;
    }

    // Add CSS
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Add JS
    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.async = true;
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      resolve((window as any).L);
    };
    script.onerror = () => {
      console.warn("Leaflet map failed to load from unpkg.com.");
      resolve(null);
    };
    document.body.appendChild(script);

    // Dynamic append safety timeout
    setTimeout(() => {
      resolve((window as any).L || null);
    }, 6000);
  });
};

export default function LeafletMap({ regions, onPinClick, activePin }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [gisMode, setGisMode] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const isDark = document.documentElement.classList.contains('dark') || 
                 document.body.classList.contains('dark') || 
                 safeStorage.getItem('theme') === 'dark';

  // Load Leaflet dynamically only when GIS Mode is activated
  useEffect(() => {
    if (!gisMode) return;

    loadLeaflet().then((L) => {
      if (L) {
        setIsReady(true);
      } else {
        setLoadError(true);
      }
    });
  }, [gisMode]);

  useEffect(() => {
    if (!gisMode || !isReady || !containerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Check if map already initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Centered around Kabupaten Bogor
    const map = L.map(containerRef.current, {
      center: [-6.4950, 106.8200],
      zoom: 10.5,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Use beautiful minimal CartoDB tiles based on dark/light mode
    const tileUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      maxZoom: 19
    }).addTo(map);

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add markers
    regions.forEach(reg => {
      // Only show markers with count > 0 or known major PAC positions
      if (reg.count === 0 && reg.name.toLowerCase().includes('lainnya')) return;

      const markerHtml = `
        <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
          <span class="absolute inline-flex h-7 w-7 rounded-full ${activePin?.name === reg.name ? 'bg-emerald-400 opacity-50 scale-125 animate-ping' : 'bg-emerald-400 opacity-25 animate-pulse'}"></span>
          <div class="w-8 h-8 rounded-full ${activePin?.name === reg.name ? 'bg-emerald-600 scale-110 shadow-emerald-500/50 ring-2 ring-white dark:ring-slate-900' : 'bg-emerald-500 hover:bg-emerald-600'} border-2 border-white dark:border-slate-900 text-white font-extrabold text-[9.5px] flex items-center justify-center shadow-lg relative z-10 transition duration-150">
            ${reg.count}
          </div>
          <div class="absolute bottom-9 bg-slate-900/90 backdrop-blur-xs text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20">
            ${reg.name}: ${reg.count}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16] // Middle centered
      });

      const marker = L.marker([reg.lat, reg.lng], { icon }).addTo(map);
      
      marker.on('click', () => {
        onPinClick(reg);
        map.setView([reg.lat, reg.lng], Math.max(map.getZoom(), 11), { animate: true });
      });

      markersRef.current.push(marker);
    });

    // Clean up
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [gisMode, isReady, regions, isDark, activePin]);

  if (!gisMode) {
    // Elegant, fast, and secure schematic CSS Map view (0 network requests)
    return (
      <div className="w-full h-full relative bg-slate-50 dark:bg-slate-950 min-h-[300px] rounded-xl overflow-hidden select-none border border-slate-100 dark:border-slate-800 transition-colors duration-300">
        {/* Radar grids for visual elegance */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-75 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-dashed border-slate-200 dark:border-slate-800 rounded-full opacity-40 pointer-events-none animate-[spin_80s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-dashed border-slate-200 dark:border-slate-800 rounded-full opacity-20 pointer-events-none" />

        {/* Info compass */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center space-x-2 text-slate-400 dark:text-slate-500 text-[9px] font-mono select-none pointer-events-none">
          <div className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-800 flex items-center justify-center animate-[spin_24s_linear_infinite]">
            <span>🧭</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">PETA SKEMATIK</span>
            <span>PRESENSI OFFLINE</span>
          </div>
        </div>

        {/* Activation trigger */}
        <button
          onClick={() => setGisMode(true)}
          className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-750 rounded-lg text-[9px] font-bold shadow-sm transition-all duration-150 cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>PETA INTERAKTIF (GIS)</span>
        </button>

        {/* Region pin rendering */}
        {regions.map((reg) => {
          if (reg.count === 0 && reg.name.toLowerCase().includes('lainnya')) return null;

          const isSelected = activePin?.name === reg.name;
          const x = reg.coords?.x || '50%';
          const y = reg.coords?.y || '50%';

          return (
            <button
              key={reg.name}
              onClick={() => onPinClick(reg)}
              style={{ left: x, top: y }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 focus:outline-none z-20 group cursor-pointer"
            >
              <span className={`absolute -inset-2.5 rounded-full transition-all duration-200 ${
                isSelected ? 'bg-emerald-400/30 scale-135 animate-ping' : 'bg-emerald-400/0 scale-75 group-hover:bg-emerald-400/15 group-hover:scale-110'
              }`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[10.5px] shadow-md border-2 transition-all duration-200 ${
                isSelected 
                  ? 'bg-emerald-600 border-white dark:border-slate-900 text-white scale-110 ring-2 ring-emerald-400' 
                  : 'bg-emerald-500 hover:bg-emerald-600 border-white dark:border-slate-900 text-white hover:scale-105'
              }`}>
                {reg.count}
              </div>
              <div className="absolute top-9 left-1/2 transform -translate-x-1/2 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-30">
                {reg.name}: {reg.count}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-slate-100 dark:bg-slate-950 min-h-[300px]">
      {loadError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-xs text-slate-400 gap-3 bg-slate-50 dark:bg-slate-900">
          <span className="text-xl">🗺️</span>
          <span className="font-bold text-slate-500 dark:text-slate-400 text-[10.5px] uppercase tracking-wider">Koneksi Peta Terhambat</span>
          <p className="max-w-xs text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">Peta interaktif tidak dapat dihubungkan ke server Leaflet CDN. Silakan kembali ke mode skematik offline.</p>
          <button
            onClick={() => {
              setGisMode(false);
              setLoadError(false);
            }}
            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-[9px] rounded-lg tracking-wider transition-colors cursor-pointer"
          >
            KEMBALI KE PETA SKEMATIK
          </button>
        </div>
      ) : !isReady ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-bold text-slate-400 gap-2 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xs z-25">
          <span className="w-5 h-5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin"></span>
          <span className="text-[10px] tracking-wider uppercase font-black text-slate-500 dark:text-slate-400">Menghubungkan Peta GIS...</span>
        </div>
      ) : null}
      <div ref={containerRef} className="w-full h-full" style={{ zIndex: 10, display: loadError ? 'none' : 'block' }} />
    </div>
  );
}

