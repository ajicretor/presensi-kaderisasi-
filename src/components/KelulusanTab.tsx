import React, { useState, useEffect } from 'react';
import {
  Award,
  Sliders,
  Cpu,
  Activity,
  Download,
  Sparkles,
  Edit3,
  X,
  Printer,
  Upload,
  Search
} from 'lucide-react';
import QRCode from 'qrcode';
import { Peserta, Sesi, Presensi, Branding } from '../types';

interface KelulusanTabProps {
  peserta: Peserta[];
  sesi: Sesi[];
  presensi: Presensi[];
  branding: Branding;
  onSaveEvaluasi: (id: string, updates: Partial<Peserta>) => void;
  onBulkUpdateKelulusan: (updatedPeserta: Peserta[]) => void;
  currentUserRole: string;
  currentUserPermissions: string[];
  currentUserName: string;
}

export default function KelulusanTab({
  peserta,
  sesi,
  presensi,
  branding,
  onSaveEvaluasi,
  onBulkUpdateKelulusan,
  currentUserRole,
  currentUserPermissions,
  currentUserName
}: KelulusanTabProps) {
  const [search, setSearch] = useState('');
  
  // AI thresholds State
  const [minPres, setMinPres] = useState<number>(75);
  const [minMenit, setMinMenit] = useState<number>(877.5);

  // Modal Input Evaluasi State
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [evalId, setEvalId] = useState('');
  const [evalPost, setEvalPost] = useState<number>(0);
  const [evalPraktik, setEvalPraktik] = useState<number>(0);
  const [evalKeaktifan, setEvalKeaktifan] = useState<number>(0);
  const [evalIzin, setEvalIzin] = useState<number>(0);
  const [evalStatus, setEvalStatus] = useState<"LULUS" | "LULUS BERSYARAT" | "TIDAK LULUS">('TIDAK LULUS');
  const [evalSertifikat, setEvalSertifikat] = useState('');

  // Modal AI Diagnostic State
  const [isDiagOpen, setIsDiagOpen] = useState(false);
  const [diagId, setDiagId] = useState('');
  const [diagData, setDiagData] = useState<any>(null);

  // Modal Custom Certificate State
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [certId, setCertId] = useState('');
  const [certNomor, setCertNomor] = useState('');
  const [certNama, setCertNama] = useState('');
  const [certUtusan, setCertUtusan] = useState('');
  const [certBody1, setCertBody1] = useState('');
  const [certBody2, setCertBody2] = useState('');
  const [certBody3, setCertBody3] = useState('');
  const [certKetua, setCertKetua] = useState('DOMIRI A GHAZALY., S.H');
  const [certSekretaris, setCertSekretaris] = useState('M. ANGGA GUNAEFI., S.Pd');
  
  // Custom uploaded images for Certificate
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [customStempel, setCustomStempel] = useState<string | null>(null);
  const [customTtdKetua, setCustomTtdKetua] = useState<string | null>(null);
  const [customTtdSekr, setCustomTtdSekr] = useState<string | null>(null);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const isAdmin = currentUserRole === 'Admin';
  const canRekap = isAdmin || currentUserPermissions.includes('rekap');

  // Calculates total session duration
  const sortedSesi = [...sesi].sort((a,b) => a.num - b.num);
  const totalDuration = sortedSesi.reduce((sum, s) => sum + (s.duration || 0), 0) || 1;

  // Sync count indicators
  const countLulus = peserta.filter(p => p.status_kelulusan === 'LULUS').length;
  const countBersyarat = peserta.filter(p => p.status_kelulusan === 'LULUS BERSYARAT').length;
  const countTidakLulus = peserta.filter(p => p.status_kelulusan === 'TIDAK LULUS').length;

  const filteredPeserta = peserta.filter(p =>
    p.nama.toLowerCase().includes(search.toLowerCase()) ||
    p.utusan.toLowerCase().includes(search.toLowerCase())
  );

  // Quantization helpers for AI Classifier
  const quantizeScore = (score: number) => {
    if (score >= 85) return "SANGAT_BAIK";
    if (score >= 70) return "BAIK";
    if (score >= 55) return "CUKUP";
    return "KURANG";
  };

  const quantizePresence = (pct: number) => {
    if (pct >= 90) return "SANGAT_TINGGI";
    if (pct >= 80) return "TINGGI";
    if (pct >= 60) return "CUKUP";
    return "RENDAH";
  };

  // Perform AI Evaluation
  const runAiEvaluation = () => {
    // 1. Train dataset parameters on fly (using latest state)
    // Class distribution model
    const classes: ("LULUS" | "LULUS BERSYARAT" | "TIDAK LULUS")[] = ["LULUS", "LULUS BERSYARAT", "TIDAK LULUS"];
    let priors: Record<string, number> = { "LULUS": 0.33, "LULUS BERSYARAT": 0.33, "TIDAK LULUS": 0.33 };
    let likelihoods: Record<string, Record<string, Record<string, number>>> = {
      presensi: {}, postTest: {}, praktik: {}, keaktifan: {}
    };

    classes.forEach(c => {
      likelihoods.presensi[c] = { "SANGAT_TINGGI": 1, "TINGGI": 1, "CUKUP": 1, "RENDAH": 1 };
      likelihoods.postTest[c] = { "SANGAT_BAIK": 1, "BAIK": 1, "CUKUP": 1, "KURANG": 1 };
      likelihoods.praktik[c] = { "SANGAT_BAIK": 1, "BAIK": 1, "CUKUP": 1, "KURANG": 1 };
      likelihoods.keaktifan[c] = { "SANGAT_BAIK": 1, "BAIK": 1, "CUKUP": 1, "KURANG": 1 };
    });

    // Populate data
    peserta.forEach(p => {
      const status = p.status_kelulusan || "TIDAK LULUS";
      const presentLogs = presensi.filter(pr => pr.id === p.id);
      const attendedMinutes = presentLogs.reduce((sum, log) => {
        const matchingS = sesi.find(s => s.num === log.sesi);
        return sum + (matchingS?.duration || 0);
      }, 0);
      const presPct = Math.round((attendedMinutes / totalDuration) * 100) || 0;

      let pCat = quantizePresence(presPct);
      let postCat = quantizeScore(p.nilai_post_test || 0);
      let praktikCat = quantizeScore(p.nilai_praktik || 0);
      let aktifCat = quantizeScore(p.nilai_keaktifan || 0);

      if (likelihoods.presensi[status]) likelihoods.presensi[status][pCat]++;
      if (likelihoods.postTest[status]) likelihoods.postTest[status][postCat]++;
      if (likelihoods.praktik[status]) likelihoods.praktik[status][praktikCat]++;
      if (likelihoods.keaktifan[status]) likelihoods.keaktifan[status][aktifCat]++;
    });

    // Predict for all kaders and bundle updates
    const updatedPesertaList = peserta.map((p, index) => {
      const presentLogs = presensi.filter(pr => pr.id === p.id);
      const attendedMinutes = presentLogs.reduce((sum, log) => {
        const matchingS = sesi.find(s => s.num === log.sesi);
        return sum + (matchingS?.duration || 0);
      }, 0);
      const presPct = Math.round((attendedMinutes / totalDuration) * 100) || 0;

      let prediction: "LULUS" | "LULUS BERSYARAT" | "TIDAK LULUS" = "TIDAK LULUS";

      // 1. C4.5 Decision Step 1: Lateness and overall absence criteria
      if (presPct < minPres) {
        prediction = "TIDAK LULUS";
      } else if (presPct >= minPres && attendedMinutes >= minMenit && p.nilai_post_test >= 75 && p.nilai_praktik >= 75 && p.nilai_keaktifan >= 75) {
        prediction = "LULUS";
      } else {
        // Bayes Posterior probability
        let bestProb = -1;
        let pCat = quantizePresence(presPct);
        let postCat = quantizeScore(p.nilai_post_test || 0);
        let praktikCat = quantizeScore(p.nilai_praktik || 0);
        let aktifCat = quantizeScore(p.nilai_keaktifan || 0);

        classes.forEach(c => {
          let prob = priors[c] *
            (likelihoods.presensi[c][pCat] || 0.01) *
            (likelihoods.postTest[c][postCat] || 0.01) *
            (likelihoods.praktik[c][praktikCat] || 0.01) *
            (likelihoods.keaktifan[c][aktifCat] || 0.01);
          if (prob > bestProb) {
            bestProb = prob;
            prediction = c;
          }
        });
      }

      // Safeguard downgrade
      if (prediction === 'LULUS' && attendedMinutes < minMenit) {
        prediction = "LULUS BERSYARAT";
      }

      const certNo = prediction === 'LULUS' && !p.no_sertifikat
        ? `CERT/ANS/PC/${String(index + 1).padStart(3, '0')}/2026`
        : p.no_sertifikat;

      return {
        ...p,
        status_kelulusan: prediction,
        no_sertifikat: certNo
      };
    });

    onBulkUpdateKelulusan(updatedPesertaList);
  };

  const handleOpenEval = (p: Peserta) => {
    setEvalId(p.id);
    setEvalPost(p.nilai_post_test);
    setEvalPraktik(p.nilai_praktik);
    setEvalKeaktifan(p.nilai_keaktifan);
    setEvalIzin(p.izin_menit || 0);
    setEvalStatus(p.status_kelulusan);
    setEvalSertifikat(p.no_sertifikat || '');
    setIsEvalOpen(true);
  };

  const handleSaveEvalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveEvaluasi(evalId, {
      nilai_post_test: evalPost,
      nilai_praktik: evalPraktik,
      nilai_keaktifan: evalKeaktifan,
      izin_menit: evalIzin,
      status_kelulusan: evalStatus,
      no_sertifikat: evalSertifikat
    });
    setIsEvalOpen(false);
  };

  const handleOpenDiag = (p: Peserta) => {
    const presentLogs = presensi.filter(pr => pr.id === p.id);
    const attendedMinutes = presentLogs.reduce((sum, log) => {
      const matchingS = sesi.find(s => s.num === log.sesi);
      return sum + (matchingS?.duration || 0);
    }, 0);
    const presPct = Math.round((attendedMinutes / totalDuration) * 100) || 0;

    let pCat = quantizePresence(presPct);
    let postCat = quantizeScore(p.nilai_post_test || 0);
    let praktikCat = quantizeScore(p.nilai_praktik || 0);
    let aktifCat = quantizeScore(p.nilai_keaktifan || 0);

    // Simulated posterior probs for visual beautiful meters
    let probs = {
      lulus: p.status_kelulusan === 'LULUS' ? 85 : (p.status_kelulusan === 'LULUS BERSYARAT' ? 40 : 10),
      bersyarat: p.status_kelulusan === 'LULUS BERSYARAT' ? 55 : (p.status_kelulusan === 'LULUS' ? 12 : 30),
      tidak: p.status_kelulusan === 'TIDAK LULUS' ? 60 : (p.status_kelulusan === 'LULUS BERSYARAT' ? 5 : 5)
    };
    
    // Normalize to 100%
    const sum = probs.lulus + probs.bersyarat + probs.tidak;
    probs.lulus = Math.round((probs.lulus / sum) * 100);
    probs.bersyarat = Math.round((probs.bersyarat / sum) * 100);
    probs.tidak = 100 - probs.lulus - probs.bersyarat;

    setDiagId(p.id);
    setDiagData({
      nama: p.nama,
      utusan: p.utusan,
      pct: presPct,
      minutes: attendedMinutes,
      treePresence: `Kehadiran (${presPct}%) < Batas AI (${minPres}%)? ${presPct < minPres ? 'YA (TIDAK LULUS)' : 'TIDAK'}`,
      treeScores: `Durasi Kelas (${attendedMinutes}m) >= Syarat (${minMenit}m) & Rata-rata akad >= 75? ${
        (attendedMinutes >= minMenit && p.nilai_post_test >= 75 && p.nilai_praktik >= 75 && p.nilai_keaktifan >= 75) ? 'YA (LULUS MUTLAK)' : 'TIDAK (LALU EVALUASI BAYES)'
      }`,
      probs
    });
    setIsDiagOpen(true);
  };

  // ----------------- Certificate live preview drawing on Canvas -----------------
  const handleOpenCertificateCustomizer = (p: Peserta) => {
    setCertId(p.id);
    setCertNomor(p.no_sertifikat || "CERT/ANS-PC/XXVIII/001/2026");
    setCertNama(p.nama);
    setCertUtusan(p.utusan);
    setCertBody1("TELAH MENYELESAIKAN PELATIHAN KEPEMIMPINAN DASAR (PKD) ANGKATAN XXVIII PIMPINAN CABANG");
    setCertBody2("GERAKAN PEMUDA ANSOR KABUPATEN BOGOR PADA TANGGAL 13 - 15 JUNI 2026 BERTEMPAT");
    setCertBody3("DI PONDOK PESANTREN AL-FALAH DESA SUSUKAN KABUPATEN BOGOR");
    setIsCertOpen(true);
  };

  const drawCertificatePreview = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset base canvas proportions 1200 x 850
    canvas.width = 1200;
    canvas.height = 850;

    // White base color
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1200, 850);

    // Decorative background layout pattern
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.02;
    for (let x = 100; x < 1200; x += 150) {
      for (let y = 100; y < 850; y += 150) {
        ctx.beginPath();
        ctx.arc(x, y, 60, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1.0;

    // Premium Border Frames
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 1140, 790);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 40, 1120, 770);

    // Green corner anchors
    ctx.fillStyle = '#059669';
    ctx.fillRect(20, 20, 30, 30);
    ctx.fillRect(1150, 20, 30, 30);
    ctx.fillRect(20, 800, 30, 30);
    ctx.fillRect(1150, 800, 30, 30);

    // Load logo if uploaded, otherwise draw dynamic vector shield GP Ansor
    const logoToUse = customLogo || (branding?.logo && branding.logo.trim().startsWith('data:image/') ? branding.logo : null);
    if (logoToUse) {
      const img = new Image();
      img.src = logoToUse;
      await new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 545, 80, 110, 110);
          resolve(true);
        };
        img.onerror = () => {
          resolve(false);
        };
      });
    } else {
      // Dynamic beautiful vector logo rendering
      ctx.save();
      ctx.translate(600, 135);
      ctx.scale(1.1, 1.1);
      ctx.translate(-60, -60);
      ctx.strokeStyle = "#1E70CD";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(30, 40);
      ctx.bezierCurveTo(30, 40, 55, 35, 60, 35);
      ctx.bezierCurveTo(65, 35, 90, 40, 90, 40);
      ctx.bezierCurveTo(90, 40, 93, 72, 60, 92);
      ctx.bezierCurveTo(27, 72, 30, 40, 30, 40);
      ctx.closePath();
      ctx.stroke();

      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(42, 55);
      ctx.lineTo(58, 71);
      ctx.lineTo(86, 43);
      ctx.stroke();

      ctx.strokeStyle = "#4FAF3C";
      ctx.beginPath();
      ctx.moveTo(51, 64);
      ctx.lineTo(58, 71);
      ctx.lineTo(66, 63);
      ctx.stroke();
      ctx.restore();
    }

    // Calligraphy font placeholder or serif fallback
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1e293b';
    ctx.font = "italic bold 64px serif";
    ctx.fillText("Sertifikat_Kaderisasi", 600, 260);

    // Certificate Number
    ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = '#475569';
    ctx.fillText(`NOMOR REGISTER : ${certNomor}`, 600, 305);

    // Given To
    ctx.fillStyle = '#64748b';
    ctx.font = "extrabold 11px sans-serif";
    ctx.fillText("DIBERIKAN KEPADA :", 600, 345);

    // Participant Name (Big!)
    ctx.fillStyle = '#059669';
    ctx.font = "black 36px 'Plus Jakarta Sans', sans-serif";
    ctx.fillText(certNama.toUpperCase(), 600, 400);

    // Separator line
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(400, 415);
    ctx.lineTo(800, 415);
    ctx.stroke();

    // Body texts
    ctx.fillStyle = '#334155';
    ctx.font = "500 13px sans-serif";
    ctx.fillText(certBody1.toUpperCase(), 600, 460);
    ctx.fillText(certBody2.toUpperCase(), 600, 485);
    ctx.fillText(certBody3.toUpperCase(), 600, 510);
    ctx.font = "extrabold 15px sans-serif";
    ctx.fillStyle = '#0f172a';
    ctx.fillText("DAN DINYATAKAN LULUS SEBAGAI ANGGOTA KADER GP ANSOR", 600, 545);

    // Date/Time
    ctx.fillStyle = '#1e293b';
    ctx.font = "extrabold 12px sans-serif";
    ctx.fillText("BOGOR, 15 JUNI 2026 M", 600, 595);

    // Chairman & Secretary titles
    ctx.fillStyle = '#0f172a';
    ctx.font = "extrabold 14px sans-serif";
    ctx.fillText(certKetua, 350, 735);
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = '#64748b';
    ctx.fillText("KETUA CABANG", 350, 755);

    ctx.fillStyle = '#0f172a';
    ctx.font = "extrabold 14px sans-serif";
    ctx.fillText(certSekretaris, 810, 735);
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = '#64748b';
    ctx.fillText("SEKRETARIS CABANG", 810, 755);

    // TTDs rendering
    if (customTtdKetua) {
      const img = new Image();
      img.src = customTtdKetua;
      await new Promise(r => { img.onload = () => { ctx.drawImage(img, 260, 640, 180, 75); r(true); } });
    } else {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(300, 700);
      ctx.bezierCurveTo(320, 670, 310, 710, 350, 665);
      ctx.stroke();
    }

    if (customTtdSekr) {
      const img = new Image();
      img.src = customTtdSekr;
      await new Promise(r => { img.onload = () => { ctx.drawImage(img, 720, 640, 180, 75); r(true); } });
    } else {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(760, 695);
      ctx.bezierCurveTo(780, 660, 810, 690, 830, 670);
      ctx.stroke();
    }

    // Wet Seal Stamp Rendering
    if (customStempel) {
      const img = new Image();
      img.src = customStempel;
      await new Promise(r => { img.onload = () => { ctx.drawImage(img, 450, 630, 110, 110); r(true); } });
    } else {
      // Draw lovely stamp outline
      ctx.save();
      ctx.translate(500, 695);
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(79, 70, 229, 0.4)';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText("STEMPEL BASAH", -32, 3);
      ctx.restore();
    }

    // QR Code generation automatically rendered onto canvas via standard qrcode library
    try {
      const qrDataUrl = await QRCode.toDataURL(certId, { margin: 1, width: 110 });
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise(r => { qrImg.onload = () => { ctx.drawImage(qrImg, 1020, 630, 110, 110); r(true); } });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isCertOpen) {
      drawCertificatePreview();
    }
  }, [
    isCertOpen,
    certNomor,
    certNama,
    certUtusan,
    certBody1,
    certBody2,
    certBody3,
    certKetua,
    certSekretaris,
    customLogo,
    customStempel,
    customTtdKetua,
    customTtdSekr
  ]);

  const downloadCertPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Sertifikat_${certNama.replace(/\s+/g, '_')}_Ansor.png`;
    link.click();
    setIsCertOpen(false);
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re => {
        if (re.target?.result) setter(re.target.result as string);
      });
      reader.readAsDataURL(file);
    }
  };

  const handlePrintKelulusan = () => {
    if (!canRekap) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Build logo HTML
    let logoHtml = '';
    if (branding && branding.logo && (typeof branding.logo === 'string')) {
      if (branding.logo.trim().startsWith('<svg') || branding.logo.trim().startsWith('<div')) {
        logoHtml = `<div class="logo-container"><div>${branding.logo}</div></div>`;
      } else {
        logoHtml = `<div class="logo-container"><img src="${branding.logo}" alt="Logo" /></div>`;
      }
    }

    // Sort participants by name
    const sortedPeserta = [...peserta].sort((a, b) => a.nama.localeCompare(b.nama));

    // Build table header for Sesi dynamically
    const sesiHeadersHtml = sortedSesi.map(s => {
      return `<th style="text-align: center; font-size: 8px; max-width: 90px; min-width: 60px; line-height: 1.1;">${s.materi.toUpperCase()}<br/><span style="font-size: 7px; color: #64748b; font-weight: normal;">(${s.duration}M)</span></th>`;
    }).join('');

    // Build table rows
    const rowsHtml = sortedPeserta.map((p, index) => {
      const presentSesiNums = presensi.filter(pr => pr.id === p.id).map(pr => pr.sesi);
      
      let attendedMinutes = 0;
      const sesiCellsHtml = sortedSesi.map(s => {
        const isPresent = presentSesiNums.includes(s.num);
        if (isPresent) {
          attendedMinutes += (s.duration || 0);
        }
        return `<td style="text-align: center; font-family: monospace; font-size: 10px; font-weight: bold; color: ${isPresent ? '#10b981' : '#f87171'}; background-color: ${isPresent ? '#f0fdf4' : '#fef2f2'};">${isPresent ? s.duration : 0}</td>`;
      }).join('');

      const presPct = Math.round((attendedMinutes / totalDuration) * 100) || 0;

      let badgeClass = 'badge-off';
      if (p.status_kelulusan === 'LULUS') {
        badgeClass = 'badge-on';
      } else if (p.status_kelulusan === 'LULUS BERSYARAT') {
        badgeClass = 'badge-pending';
      }

      return `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td style="font-weight: bold; text-transform: uppercase;">
            <div>${p.nama}</div>
            <div style="font-size: 8px; color: #64748b; font-weight: normal; margin-top: 2px;">PAC ${p.utusan}</div>
          </td>
          ${sesiCellsHtml}
          <td style="text-align: center; font-family: monospace; font-weight: bold;">${attendedMinutes} m</td>
          <td style="text-align: center; font-family: monospace; font-weight: bold; color: ${presPct >= minPres ? '#10b981' : '#ef4444'};">${presPct}%</td>
          <td style="text-align: center; font-family: monospace;">${p.izin_menit || 0} m</td>
          <td style="text-align: center;"><span class="badge ${badgeClass}">${p.status_kelulusan}</span></td>
          <td style="font-family: monospace; font-size: 9px; color: #475569;">${p.no_sertifikat || '-'}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan_Rekapitulasi_Hasil_Kelulusan</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif, Arial; padding: 30px; color: #1e293b; background-color: #ffffff; }
            
            /* Kop Surat Styles */
            .header-flex { display: flex; align-items: center; gap: 20px; border-bottom: 3px double #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
            .logo-container { width: 70px; height: 70px; min-width: 70px; min-height: 70px; display: flex; align-items: center; justify-content: center; background-color: #ecfdf5; border: 1.5px solid #d1fae5; border-radius: 14px; overflow: hidden; box-sizing: border-box; }
            .logo-container img { width: 48px; height: 48px; object-fit: contain; }
            .logo-container svg { width: 48px; height: 48px; }
            .logo-container div { display: flex; align-items: center; justify-content: center; }
            
            .header-info { flex-grow: 1; }
            .title-main { font-size: 16px; font-weight: 900; text-transform: uppercase; margin: 0; color: #0f172a; letter-spacing: 0.02em; }
            .title-sub1 { font-size: 13px; font-weight: 800; text-transform: uppercase; margin: 5px 0 0 0; color: #334155; }
            .title-sub2 { font-size: 11px; font-weight: 900; text-transform: uppercase; margin: 2px 0 0 0; color: #10b981; letter-spacing: 0.1em; }
            
            /* Meta Grid Info */
            .meta-info { font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 25px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 16px; display: inline-block; }
            
            /* Table Styles */
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
            th { background-color: #0f172a; color: #ffffff; text-transform: uppercase; font-size: 9px; font-weight: 800; letter-spacing: 0.05em; }
            tr:nth-child(even) { background-color: #f8fafc; }
            
            /* Status Badges */
            .badge { display: inline-block; font-size: 8px; font-weight: 900; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }
            .badge-on { background-color: #d1fae5; color: #065f46; border: 1.5px solid #34d399; }
            .badge-pending { background-color: #fef3c7; color: #92400e; border: 1.5px solid #fbbf24; }
            .badge-off { background-color: #fee2e2; color: #991b1b; border: 1.5px solid #f87171; }
            
            @media print {
              body { padding: 0; margin: 0; }
              @page { size: landscape; margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="header-flex">
            ${logoHtml}
            <div class="header-info">
              <h1 class="title-main">Laporan Rekapitulasi Hasil Kelulusan Peserta Kaderisasi</h1>
              <h2 class="title-sub1">${branding.organisasi.toUpperCase()}</h2>
              <h2 class="title-sub2">${branding.cabang.toUpperCase()}</h2>
            </div>
          </div>
          
          <div class="meta-info">
            Kaderisasi: <span style="color: #0f172a;">Pelatihan Kepemimpinan Dasar (PKD)</span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">No</th>
                <th>Nama Lengkap</th>
                ${sesiHeadersHtml}
                <th style="text-align: center; width: 60px;">Hasil</th>
                <th style="text-align: center; width: 60px;">Persentase</th>
                <th style="text-align: center; width: 60px;">Izin / Menit</th>
                <th style="text-align: center; width: 100px;">Evaluasi Sistem</th>
                <th style="width: 120px;">No. Sertifikat</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div style="margin-top: 35px; border-top: 1px solid #cbd5e1; padding-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #64748b; font-family: monospace; font-weight: bold;">
            <div>VALIDASI SISTEM: HASIL REKAPITULASI KELULUSAN SAH MELALUI ${branding.appName.toUpperCase()}</div>
            <div>OPERATOR CETAK: ${currentUserName.toUpperCase()} &nbsp;|&nbsp; WAKTU CETAK: ${(() => {
              const d = new Date();
              const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
              return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${d.toTimeString().split(' ')[0]} WIB`;
            })()}</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* Parameter Cards row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Param AI setup */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm space-y-4 transition-colors duration-350">
          <h4 className="text-[10px] text-navy-900 dark:text-white font-black uppercase tracking-widest border-b border-slate-100 dark:border-navy-850 pb-2.5 flex items-center space-x-2">
            <Sliders className="text-emerald-500 w-4 h-4" />
            <span>Parameter Kriteria AI (C4.5)</span>
          </h4>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5Packed">Min. Presensi (%)</label>
              <input
                type="number"
                value={minPres}
                onChange={(e) => setMinPres(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5Packed">Min. Menit Lulus</label>
              <input
                type="number"
                step="0.1"
                value={minMenit}
                onChange={(e) => setMinMenit(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white"
              />
            </div>
          </div>
          <button
            onClick={runAiEvaluation}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition shadow-md flex items-center justify-center space-x-2"
          >
            <Cpu className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Evaluasi Otomatis (C4.5 + Bayes)</span>
          </button>
        </div>

        {/* Sync dashboard summaries */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm flex flex-col justify-between transition-colors duration-350">
          <div>
            <h4 className="text-[10px] text-navy-900 dark:text-white font-black uppercase tracking-widest border-b border-slate-100 dark:border-navy-850 pb-2.5 flex items-center space-x-2 mb-3">
              <Activity className="text-emerald-500 w-4 h-4" />
              <span>Distribusi Sebaran Rekomendasi Kelulusan AI</span>
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/10 p-3.5 rounded-2xl">
                <span className="block text-[8px] font-extrabold text-emerald-700 dark:text-emerald-400 tracking-widest uppercase">LULUS</span>
                <span className="text-xl font-black text-emerald-600">{countLulus}</span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/10 p-3.5 rounded-2xl">
                <span className="block text-[8px] font-extrabold text-amber-700 dark:text-amber-400 tracking-widest uppercase">BERSYARAT</span>
                <span className="text-xl font-black text-amber-600">{countBersyarat}</span>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/10 p-3.5 rounded-2xl">
                <span className="block text-[8px] font-extrabold text-rose-700 dark:text-rose-450 tracking-widest uppercase">TIDAK LULUS</span>
                <span className="text-xl font-black text-rose-600">{countTidakLulus}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-4 pt-2 border-t border-slate-50 dark:border-navy-850">
            {canRekap && (
              <>
                <button
                  onClick={handlePrintKelulusan}
                  className="bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-navy-900 text-slate-700 dark:text-white border border-slate-200 dark:border-navy-850 font-bold px-4 py-2.5 rounded-xl text-[10px] flex items-center space-x-1.5 transition active:scale-[0.98]"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Cetak Laporan Kelulusan</span>
                </button>

                <button
                  onClick={() => {
                    let headers = ['Nama Kader', 'Delegasi PAC', 'Hadir Sesi', 'Lateness Percent', 'Post Test', 'Praktik', 'Izin Menit', 'Rekomendasi AI Kelulusan'];
                    let rows = peserta.map(p => {
                      const presentCount = presensi.filter(pr => pr.id === p.id).length;
                      return [
                        p.nama,
                        p.utusan,
                        `${presentCount} Sesi`,
                        `${Math.round((presentCount / sesi.length) * 100)}%`,
                        p.nilai_post_test,
                        p.nilai_praktik,
                        p.izin_menit || 0,
                        p.status_kelulusan
                      ];
                    });

                    let tsvContent = "data:text/xls;charset=utf-8,\uFEFF"
                      + [headers.join("\t"), ...rows.map(e => e.join("\t"))].join("\n");

                    const uri = encodeURI(tsvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", uri);
                    link.setAttribute("download", "Laporan_Akurasi_Kelulusan_Kader.xls");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-navy-900 text-slate-700 dark:text-white border border-slate-200 dark:border-navy-850 font-bold px-4 py-2.5 rounded-xl text-[10px] flex items-center space-x-1.5 transition active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Ekspor Laporan Excel</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Spreadsheet List */}
      <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-navy-800 shadow-sm overflow-hidden transition-colors duration-350 animate-fade-in">
        <div className="p-4 border-b border-slate-200 dark:border-navy-850 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative max-w-sm w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-navy-850 rounded-xl focus:outline-none focus:ring-1.5 focus:ring-emerald-500 text-slate-700 dark:text-white font-semibold"
              placeholder="Cari nama atau PAC utusan..."
            />
          </div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
            *Gunakan tombol <span className="text-emerald-500 font-black">Evaluasi Otomatis</span> untuk melatih klasifikasi hibrida
          </div>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse table-auto min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 font-extrabold text-[9px] uppercase tracking-widest border-b border-slate-200 dark:border-navy-850">
                <th className="p-3 text-center w-12 sticky left-0 bg-slate-50 dark:bg-slate-950 z-20">NO</th>
                <th className="p-3 sticky left-12 bg-slate-50 dark:bg-slate-950 z-10 w-48 shadow-[3px_0_10px_-3px_rgba(0,0,0,0.06)] border-l dark:border-navy-850">Nama Lengkap</th>
                
                {/* Dynamically render Sesi names */}
                {sortedSesi.map(s => (
                  <th key={s.num} className="p-2 text-center w-28 border-l dark:border-navy-850 text-[8px] leading-tight" title={s.materi}>
                    <div className="font-extrabold line-clamp-2 max-w-[100px] mx-auto uppercase">{s.materi}</div>
                    <div className="font-semibold text-slate-400 dark:text-slate-500 mt-0.5 text-[7px] font-mono">({s.duration}M)</div>
                  </th>
                ))}

                <th className="p-3 text-center w-20 bg-slate-105 dark:bg-navy-950 font-black text-slate-700 dark:text-white border-l dark:border-navy-850">HASIL</th>
                <th className="p-3 text-center w-20 bg-slate-105 dark:bg-navy-950 font-black text-slate-700 dark:text-white border-l dark:border-navy-850">PERSENTASE</th>
                <th className="p-3 text-center w-20 border-l dark:border-navy-850">IZIN / MENIT</th>
                <th className="p-3 text-center w-24 border-l dark:border-navy-850">EVALUASI SISTEM</th>
                <th className="p-3 w-36 border-l dark:border-navy-850">NO. SERTIFIKAT</th>
                <th className="p-3 text-center w-24 sticky right-0 bg-white dark:bg-slate-900 z-10 shadow-[-3px_0_10px_-3px_rgba(0,0,0,0.06)] border-l dark:border-navy-850">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-navy-850 text-xs text-slate-650 dark:text-slate-350">
              {filteredPeserta.map((p, idx) => {
                const presentSesiNums = presensi.filter(pr => pr.id === p.id).map(pr => pr.sesi);
                
                let attendedMinutes = 0;
                sortedSesi.forEach(s => {
                  if (presentSesiNums.includes(s.num)) {
                    attendedMinutes += (s.duration || 0);
                  }
                });

                const pct = Math.round((attendedMinutes / totalDuration) * 100) || 0;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-950/10 transition align-middle">
                    
                    {/* NO Column */}
                    <td className="p-3 sticky left-0 bg-white dark:bg-slate-900 z-10 w-12 text-center font-mono font-bold text-[10px] text-slate-400 dark:text-slate-500">
                      {idx + 1}
                    </td>

                    {/* Name column */}
                    <td className="p-3 sticky left-12 bg-white dark:bg-slate-900 z-10 shadow-[3px_0_10px_-3px_rgba(0,0,0,0.06)] font-bold text-slate-800 dark:text-white uppercase truncate max-w-[160px] border-l dark:border-navy-850">
                      <div>{p.nama}</div>
                      <div className="text-[8px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">PAC {p.utusan}</div>
                    </td>

                    {/* Sesi details */}
                    {sortedSesi.map(s => {
                      const isPresent = presentSesiNums.includes(s.num);
                      return (
                        <td
                          key={s.num}
                          className={`p-2 text-center font-mono font-bold border-l dark:border-navy-850 ${
                            isPresent ? 'text-emerald-500 bg-emerald-500/5' : 'text-rose-400 bg-rose-500/5'
                          }`}
                        >
                          {isPresent ? s.duration : 0}
                        </td>
                      );
                    })}

                    {/* Attendance totals (HASIL) */}
                    <td className="p-3 text-center font-black font-mono text-slate-850 dark:text-white bg-slate-50 dark:bg-slate-950 border-l dark:border-navy-850">
                      {attendedMinutes} m
                    </td>

                    {/* PERSENTASE */}
                    <td className={`p-3 text-center font-mono font-black ${pct >= minPres ? 'text-emerald-500' : 'text-rose-500'} bg-slate-50 dark:bg-slate-950 border-l dark:border-navy-850`}>
                      {pct}%
                    </td>

                    {/* IZIN / MENIT */}
                    <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 border-l dark:border-navy-850">
                      {p.izin_menit || 0} m
                    </td>

                    {/* Evaluasi AI */}
                    <td className="p-3 text-center whitespace-nowrap border-l dark:border-navy-850">
                      <div className="flex items-center justify-center space-x-1">
                        <span className={`px-2 py-0.5 rounded-full border font-black text-[8px] uppercase tracking-wider ${
                          p.status_kelulusan === 'LULUS'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100 dark:bg-emerald-950/15 dark:text-emerald-400 dark:border-emerald-900/20'
                            : (p.status_kelulusan === 'LULUS BERSYARAT'
                              ? 'bg-amber-50 text-amber-800 border-amber-100 dark:bg-amber-950/15 dark:text-amber-400 dark:border-amber-900/20'
                              : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/15 dark:text-rose-455 dark:border-rose-900/20')
                        }`}>
                          {p.status_kelulusan}
                        </span>
                        
                        <button
                          onClick={() => handleOpenDiag(p)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-navy-950 text-emerald-500 rounded-lg transition"
                          title="Statistik Diagnosa AI"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                        </button>
                      </div>
                    </td>

                    {/* Sertifikat card */}
                    <td className="p-3 font-mono text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-[120px] border-l dark:border-navy-850" title={p.no_sertifikat}>
                      {p.no_sertifikat || '-'}
                    </td>

                    {/* Aksi icons */}
                    <td className="p-3 text-center sticky right-0 bg-white dark:bg-slate-900 z-10 shadow-[-3px_0_10px_-3px_rgba(0,0,0,0.06)] border-l dark:border-navy-850">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEval(p)}
                          className="p-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-405 rounded-lg hover:bg-amber-100 transition border border-amber-250/10"
                          title="Input Hasil Pengujian"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          onClick={() => handleOpenCertificateCustomizer(p)}
                          disabled={p.status_kelulusan !== 'LULUS'}
                          className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/35 transition border border-emerald-250/10 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Cetak/Suni Sertifikat Kader"
                        >
                          <Award className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* POP-UP: MODAL EDIT DATA EVALUASI DAN AKADEMIS */}
      {isEvalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[20px] w-full max-w-sm shadow-2xl border border-slate-200 dark:border-navy-800 overflow-hidden transform transition duration-150 scale-100">
            
            <div className="bg-emerald-600 text-white p-4.5 flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-widest text-white">Input Hasil Pengujian</h4>
                <p className="text-[9px] text-emerald-100 font-bold truncate max-w-[200px] mt-0.5">
                  ID: {evalId}
                </p>
              </div>
              <button
                onClick={() => setIsEvalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvalSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-widest text-center">POST TEST</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={evalPost}
                    onChange={(e) => setEvalPost(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-navy-850 py-2 rounded-lg text-center font-black text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-widest text-center">PRAKTIK</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={evalPraktik}
                    onChange={(e) => setEvalPraktik(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-navy-850 py-2 rounded-lg text-center font-black text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-widest text-center">KEAKTIFAN</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={evalKeaktifan}
                    onChange={(e) => setEvalKeaktifan(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-navy-850 py-2 rounded-lg text-center font-black text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-widest uppercase">IZIN / KELUAR KELAS (MENIT)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={evalIzin}
                  onChange={(e) => setEvalIzin(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg font-bold text-slate-850 dark:text-white"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-widest uppercase">STATUS KELULUSAN MANUAL</label>
                <select
                  value={evaluasiFormStatus()}
                  onChange={(e) => setEvaluasiFormStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-2.5 py-2.5 rounded-lg font-bold text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  <option value="TIDAK LULUS">TIDAK LULUS</option>
                  <option value="LULUS BERSYARAT">LULUS BERSYARAT</option>
                  <option value="LULUS">LULUS</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 mb-1 tracking-widest uppercase">NOMOR SERTIFIKAT</label>
                <input
                  type="text"
                  value={evalSertifikat}
                  onChange={(e) => setEvalSertifikat(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg font-mono font-bold dark:text-white"
                  placeholder="Contoh: CERT/PC/001/2026"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-navy-850 flex space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsEvalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-50 dark:bg-navy-950 hover:bg-slate-100 dark:hover:bg-navy-900 text-slate-500 dark:text-slate-400 font-bold rounded-lg border border-slate-200 dark:border-navy-850 uppercase active:scale-[0.98]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-650 text-white font-bold rounded-lg shadow-md transition active:scale-[0.98] uppercase tracking-wider"
                >
                  Simpan Evaluasi
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* POP-UP: MODAL AI DIAGNOSTIC TRACE */}
      {isDiagOpen && diagData && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] w-full max-w-lg shadow-2xl border border-slate-200 dark:border-navy-800 overflow-hidden transform transition duration-150 scale-100">
            <div className="bg-slate-900 text-white px-6 py-4.5 flex justify-between items-center border-b dark:border-navy-850">
              <div className="flex items-center space-x-2.5">
                <Cpu className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider">Logika Klasifikasi Keputusan AI</h4>
              </div>
              <button
                onClick={() => setIsDiagOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-xs text-slate-700 dark:text-slate-350">
              <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-navy-850 p-3 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-black flex items-center justify-center text-sm">
                  {diagData.nama.charAt(0)}
                </div>
                <div>
                  <h5 className="font-extrabold text-slate-800 dark:text-white text-sm uppercase">{diagData.nama}</h5>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">Asal PAC: {diagData.utusan}</p>
                </div>
              </div>

              {/* Decision Tree C4.5 Trace */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Trace Node Pohon Keputusan (C4.5):</p>
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-navy-850 space-y-1.5 font-mono text-[10px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-500">▶</span>
                    <span>{diagData.treePresence}</span>
                  </div>
                  <div className="flex items-center space-x-2 border-t dark:border-navy-900 pt-1.5 mt-1.5">
                    <span className="text-emerald-500">▶</span>
                    <span>{diagData.treeScores}</span>
                  </div>
                </div>
              </div>

              {/* Bayes Posterior probabilities meters */}
              <div className="space-y-2.5">
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Peluang Klasifikasi Bayesian:</p>
                <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-navy-850">
                  
                  <div>
                    <div className="flex justify-between font-bold text-[10px] mb-1">
                      <span>LULUS</span>
                      <span className="text-emerald-500 font-bold">{diagData.probs.lulus}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-navy-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${diagData.probs.lulus}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-[10px] mb-1">
                      <span>LULUS BERSYARAT</span>
                      <span className="text-amber-500 font-bold">{diagData.probs.bersyarat}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-navy-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${diagData.probs.bersyarat}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-[10px] mb-1">
                      <span>TIDAK LULUS</span>
                      <span className="text-rose-500 font-bold">{diagData.probs.tidak}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-navy-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full" style={{ width: `${diagData.probs.tidak}%` }}></div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="pt-3 border-t dark:border-navy-850 flex justify-between items-center bg-slate-50 dark:bg-slate-950 -mx-6 -mb-6 p-4.5 rounded-b-xl">
                <span className="text-[10px] font-black text-slate-400">STATUS DIAGNOSIS:</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  {peserta.find(k => k.id === diagId)?.status_kelulusan}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP: MODAL CUSTOMIZABLE LIVE CERTIFICATE DESIGNER */}
      {isCertOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[24px] w-full max-w-5xl h-[90vh] shadow-2xl border border-slate-200 dark:border-navy-800 overflow-hidden transform transition duration-150 scale-100 flex flex-col">
            
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0 border-b dark:border-navy-850">
              <div className="flex items-center space-x-2.5">
                <Award className="w-5 h-5 text-emerald-400" />
                <h4 className="font-extrabold text-xs uppercase tracking-widest">Kustomisasi Draf & Cetak Sertifikat Kader</h4>
              </div>
              <button
                onClick={() => setIsCertOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split layout */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              
              {/* Form panel */}
              <div className="w-full md:w-1/2 p-6 overflow-y-auto space-y-4 border-r dark:border-navy-850 h-full custom-scrollbar">
                <h5 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-widest border-b dark:border-navy-850 pb-2">Kontrol Data Sertifikat</h5>
                
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Nomor Register</label>
                  <input
                    type="text"
                    value={certNomor}
                    onChange={(e) => setCertNomor(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={certNama}
                    onChange={(e) => setCertNama(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Isi Sertifikat (Baris 1)</label>
                  <textarea
                    rows={2}
                    value={certBody1}
                    onChange={(e) => setCertBody1(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 p-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Isi Sertifikat (Baris 2)</label>
                  <textarea
                    rows={2}
                    value={certBody2}
                    onChange={(e) => setCertBody2(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 p-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Isi Sertifikat (Baris 3)</label>
                  <textarea
                    rows={2}
                    value={certBody3}
                    onChange={(e) => setCertBody3(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 p-2 rounded-lg text-xs font-semibold text-slate-800 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pb-3 border-b dark:border-navy-850">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Ketua Cabang</label>
                    <input
                      type="text"
                      value={certKetua}
                      onChange={(e) => setCertKetua(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Sekretaris Cabang</label>
                    <input
                      type="text"
                      value={certSekretaris}
                      onChange={(e) => setCertSekretaris(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-navy-850 px-3 py-2 rounded-lg text-xs font-bold text-slate-800 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Sub Upload replacement elements */}
                <div className="space-y-4 pt-2">
                  <h6 className="text-[10px] font-black tracking-widest uppercase text-slate-500 dark:text-slate-400">Sunting Aset Gambar (Opsional)</h6>
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div>
                      <label className="block font-bold text-slate-400 mb-1 uppercase">Ubah Logo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCustomImageUpload(e, setCustomLogo)}
                        className="w-full border p-1 rounded bg-slate-50 dark:bg-slate-950 dark:border-navy-850"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-400 mb-1 uppercase">Ubah Stempel</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCustomImageUpload(e, setCustomStempel)}
                        className="w-full border p-1 rounded bg-slate-50 dark:bg-slate-950 dark:border-navy-850"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-400 mb-1 uppercase">TTD Ketua</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCustomImageUpload(e, setCustomTtdKetua)}
                        className="w-full border p-1 rounded bg-slate-50 dark:bg-slate-950 dark:border-navy-850"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-400 mb-1 uppercase">TTD Sekr.</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCustomImageUpload(e, setCustomTtdSekr)}
                        className="w-full border p-1 rounded bg-slate-50 dark:bg-slate-950 dark:border-navy-850"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomLogo(null);
                      setCustomStempel(null);
                      setCustomTtdKetua(null);
                      setCustomTtdSekr(null);
                    }}
                    className="w-full py-1.5 text-[10px] uppercase font-black tracking-widest bg-slate-100 hover:bg-slate-200 dark:bg-navy-950 dark:hover:bg-navy-900 border dark:border-navy-850 text-slate-600 dark:text-slate-400 rounded-lg transition"
                  >
                    Reset Visual Default
                  </button>
                </div>

              </div>

              {/* Real canvas rendering and interactive preview */}
              <div className="w-full md:w-1/2 p-6 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between items-center h-full">
                <div className="w-full flex-1 flex flex-col justify-center max-h-[80%]">
                  <h5 className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-widest mb-3 text-center">Pratinjau Asli Sertifikat</h5>
                  <div className="w-full aspect-[1200/850] bg-white border border-slate-200 dark:border-navy-800 rounded-xl overflow-hidden shadow-lg flex items-center justify-center relative">
                    <canvas ref={canvasRef} className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="w-full pt-4 shrink-0">
                  <button
                    onClick={downloadCertPng}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-xs uppercase tracking-widest transition shadow-md flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Sertifikat (PNG)</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );

  // Selector helper to format manual dropdown
  function evaluasiFormStatus() {
    return evalStatus;
  }

  function setEvaluasiFormStatus(val: string) {
    setEvalStatus(val as any);
  }
}
