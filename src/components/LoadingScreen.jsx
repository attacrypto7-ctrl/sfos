import React, { useCallback, useEffect, useRef, useState } from 'react';
import '../css/loading.css';

const STEPS = [
  'Memeriksa kelembapan tanah…',
  'Menghubungkan sensor kebun…',
  'Menyiapkan data tanaman…',
  'Menghitung skor kesehatan…',
  'Merawat tanaman terbaik…',
];

export default function LoadingScreen({ label = 'Memuat kebun anda...', sublabel, inline = false }) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [bursts, setBursts] = useState([]);
  const [justWatered, setJustWatered] = useState(false);
  const burstId = useRef(0);

  // Biarkan progress tumbuh alami / otomatis
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => (p >= 100 ? 100 : Math.min(100, p + Math.random() * 2.4 + 0.8)));
    }, 280);
    return () => clearInterval(timer);
  }, []);

  // Rotasi pesan mengikuti progress
  useEffect(() => {
    const idx = Math.min(Math.floor((progress / 100) * STEPS.length), STEPS.length - 1);
    setStep(idx);
  }, [progress]);

  // Interaksi: klik/siram untuk mempercepat loading (+5% per klik)
  const water = useCallback(() => {
    const id = ++burstId.current;
    setBursts((b) => [...b, { id, x: 18 + Math.random() * 64 }]);
    setProgress((p) => Math.min(100, p + 5));
    setJustWatered(true);
    window.setTimeout(() => {
      setBursts((b) => b.filter((d) => d.id !== id));
      setJustWatered(false);
    }, 1100);
  }, []);

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
        <div className="tmk-brand" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Tanamanku</span>
        </div>

        <h2 className="tmk-title">{label}</h2>
        {sublabel && <p className="tmk-sub">{sublabel}</p>}

        {/* Skena tumbuhan interaktif */}
        <div className="tmk-scene" onClick={water} onKeyDown={(e) => e.key === 'Enter' && water()} role="button" tabIndex={0} aria-label="Klik untuk menyiram tanaman">
          <div className="tmk-hills" aria-hidden="true"></div>
          <div className="tmk-pot" aria-hidden="true">
            <span
              className={`tmk-plant${justWatered ? ' shake' : ''}`}
              style={{ transform: `scale(${grow})`, '--grow': grow }}
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
              <span className="tmk-glow" aria-hidden="true"></span>
            </span>
            <span className="tmk-droplets" aria-hidden="true">
              {bursts.map((d) => <i key={d.id} style={{ left: `${d.x}%` }}></i>)}
            </span>
            <span className="tmk-waterline" aria-hidden="true"></span>
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

        <button type="button" className="tmk-water-btn" onClick={water} aria-label="Siram tanaman agar loading lebih cepat (+5%)">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
          Siram untuk mempercepat +5%
        </button>
      </div>
    </div>
  );
}