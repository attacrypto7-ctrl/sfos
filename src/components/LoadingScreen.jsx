import React, { useEffect, useRef, useState } from 'react';
import '../css/loading.css';

const STEPS = [
  'Memeriksa kelembapan tanah…',
  'Menghubungkan sensor tanaman…',
  'Menyiapkan data tanaman…',
  'Menghitung skor kesehatan…',
  'Merawat tanaman terbaik…',
];

// Total durasi loading: 2.5–3 detik (diambil 2750ms)
const DURATION_MS = 2750;

export default function LoadingScreen({ label = 'Memuat tanaman anda...', inline = false, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const completedRef = useRef(false);

  // Progress bar bergerak mulus dari 0% → 100% tepat dalam DURATION_MS,
  // lalu (hanya bila disediakan) panggil onComplete ketika menyentuh 100%.
  useEffect(() => {
    const start = performance.now();
    let raf;

    const tick = (now) => {
      // t = 0..1 linear terhadap waktu
      const t = Math.min(1, (now - start) / DURATION_MS);
      // easeOutCubic agar percepatan awal lalu melambat di akhir (terasa halus)
      const eased = 1 - Math.pow(1 - t, 3);
      const pct = Math.round(eased * 100);

      if (t >= 1) {
        setProgress(100);
        if (!completedRef.current) {
          completedRef.current = true;
          if (typeof onComplete === 'function') onComplete();
        }
        return; // berhenti di 100%, tidak perlu tick berikutnya
      }

      setProgress(pct);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  // Rotasi pesan mengikuti progress
  useEffect(() => {
    const idx = Math.min(Math.floor((progress / 100) * STEPS.length), STEPS.length - 1);
    setStep(idx);
  }, [progress]);

  const grow = 0.22 + (progress / 100) * 0.78;
  const pct = Math.round(progress);

  return (
    <div
      className={`tmk-loader${inline ? ' is-inline' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="tmk-blob tmk-blob-a" aria-hidden="true"></div>
      <div className="tmk-blob tmk-blob-b" aria-hidden="true"></div>
      <div className="tmk-sun" aria-hidden="true"><i></i></div>
      <div className="tmk-cloud tmk-cloud-1" aria-hidden="true"></div>
      <div className="tmk-cloud tmk-cloud-2" aria-hidden="true"></div>

      <div className="tmk-card">
        <h2 className="tmk-title">{label}</h2>

        {/* Skena tumbuhan — tumbuh otomatis mengikuti progress */}
        <div className="tmk-scene" aria-hidden="true">
          <div className="tmk-hills"></div>
          <div className="tmk-pot">
            <span
              className="tmk-plant"
              style={{ transform: `scale(${grow})` }}
            >
              <svg viewBox="0 0 120 170" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32 110h56l-7 34h-42z" fill="#7A5C12" />
                <path d="M38 110h44l-6 30h-32z" fill="#A97B2A" />
                <rect x="26" y="104" width="68" height="9" rx="4.5" fill="#8B6914" />
                <path d="M60 106 C60 68 52 58 48 40" stroke="#28B585" strokeWidth="5" strokeLinecap="round" />
                <path d="M60 106 C60 62 70 52 74 32" stroke="#1D9E75" strokeWidth="5" strokeLinecap="round" />
                <path d="M48 40 C30 30 22 16 28 4 C44 6 52 22 48 40Z" fill="#2AB88A" />
                <path d="M74 32 C92 24 100 10 94 -1 C80 1 72 17 74 32Z" fill="#1D9E75" />
                <path d="M52 22 C40 10 42 -2 52 -8 C60 0 60 14 52 22Z" fill="#4DD9A8" />
                <path d="M40 55 C26 50 16 40 18 28 C32 28 40 40 40 55Z" fill="#2AB88A" />
                <path d="M80 52 C94 48 102 40 100 28 C86 28 80 40 80 52Z" fill="#28B585" />
              </svg>
            </span>
          </div>
        </div>

        <div className="tmk-progress">
          <div className="tmk-track" aria-hidden="true">
            <div className="tmk-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="tmk-meta">
            <span className="tmk-step">{STEPS[step]}</span>
            <span className="tmk-pct">{pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
