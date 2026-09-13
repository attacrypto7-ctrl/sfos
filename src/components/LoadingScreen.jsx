import React, { useEffect, useRef, useState } from 'react';
import '../css/loading.css';

const STEPS = [
  'Memeriksa kelembapan tanah\u2026',
  'Menghubungkan sensor tanaman\u2026',
  'Menyiapkan data tanaman\u2026',
  'Menghitung skor kesehatan\u2026',
  'Merawat tanaman terbaik\u2026',
];

const DURATION_MS = 2750;

// Threshold progress untuk setiap daun muncul (dalam persen)
const LEAF_THRESHOLDS = [28, 45, 60, 72, 85];

// Partikel: posisi X (%), delay animasi (s), durasi (s)
const PARTICLES = [
  { x: 33, delay: 0,    dur: 2.2 },
  { x: 55, delay: 0.6, dur: 1.8 },
  { x: 46, delay: 1.1, dur: 2.5 },
  { x: 40, delay: 0.3, dur: 2.0 },
  { x: 62, delay: 0.9, dur: 1.6 },
  { x: 38, delay: 1.6, dur: 2.3 },
  { x: 52, delay: 0.5, dur: 2.8 },
];

export default function LoadingScreen({ label = 'Memuat tanaman anda...', inline = false, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [visibleLeaves, setVisibleLeaves] = useState([]);
  const completedRef = useRef(false);

  // Progress bar bergerak mulus dari 0% -> 100% tepat dalam DURATION_MS
  useEffect(() => {
    const start = performance.now();
    let raf;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const pct = Math.round(eased * 100);

      if (t >= 1) {
        setProgress(100);
        if (!completedRef.current) {
          completedRef.current = true;
          if (typeof onComplete === 'function') onComplete();
        }
        return;
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

  // Daun muncul satu-satu sesuai threshold
  useEffect(() => {
    setVisibleLeaves((prev) => {
      const next = [...prev];
      LEAF_THRESHOLDS.forEach((threshold, i) => {
        if (progress >= threshold && !next.includes(i)) {
          next.push(i);
        }
      });
      return next.length !== prev.length ? next : prev;
    });
  }, [progress]);

  const pct = Math.round(progress);

  // Stroke-dashoffset untuk batang: makin kecil = makin panjang garis yang terlihat
  const stemLen = 120;
  const stemLeftOffset  = Math.max(0, stemLen - (progress / 100) * stemLen);
  const stemRightProgress = Math.max(0, (progress - 20) / 80);
  const stemRightOffset = Math.max(0, stemLen - stemRightProgress * stemLen);

  // Interpolasi warna glow pot: kuning (#FDD34D) -> hijau (#1D9E75)
  const glowR = Math.round(253 - (253 - 29)  * (progress / 100));
  const glowG = Math.round(211 - (211 - 158) * (progress / 100));
  const glowB = Math.round(77  + (117 - 77)  * (progress / 100));
  const glowOpacity = 0.3 + (progress / 100) * 0.4;
  const glowSize = 18 + (progress / 100) * 28;

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

        {/* Skena tumbuhan */}
        <div className="tmk-scene" aria-hidden="true">
          <div className="tmk-hills"></div>

          {/* Partikel cahaya mengambang */}
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="tmk-particle"
              style={{
                left: `${p.x}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.dur}s`,
              }}
              aria-hidden="true"
            />
          ))}

          <div className="tmk-pot">
            {/* Glow di belakang pot — berubah warna sesuai progress */}
            <div
              className="tmk-pot-glow"
              style={{
                boxShadow: `0 0 ${glowSize}px ${glowSize / 2}px rgba(${glowR},${glowG},${glowB},${glowOpacity})`,
              }}
              aria-hidden="true"
            />

            {/* SVG Tanaman — tiap elemen terpisah untuk animasi independen */}
            <svg
              viewBox="0 0 120 170"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="tmk-plant-svg"
            >
              {/* Pot */}
              <path d="M32 110h56l-7 34h-42z" fill="#7A5C12" />
              <path d="M38 110h44l-6 30h-32z" fill="#A97B2A" />
              <rect x="26" y="104" width="68" height="9" rx="4.5" fill="#8B6914" />

              {/* Batang kiri — tumbuh dari bawah sejak progress 0 */}
              <path
                d="M60 106 C60 68 52 58 48 40"
                stroke="#28B585"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={stemLen}
                strokeDashoffset={stemLeftOffset}
                style={{ transition: 'stroke-dashoffset 0.35s ease-out' }}
              />

              {/* Batang kanan — mulai tumbuh saat progress >= 20% */}
              <path
                d="M60 106 C60 62 70 52 74 32"
                stroke="#1D9E75"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={stemLen}
                strokeDashoffset={stemRightOffset}
                style={{ transition: 'stroke-dashoffset 0.35s ease-out' }}
              />

              {/* Daun 1 — muncul saat progress >= 28% */}
              {visibleLeaves.includes(0) && (
                <path
                  d="M48 40 C30 30 22 16 28 4 C44 6 52 22 48 40Z"
                  fill="#2AB88A"
                  className="tmk-leaf tmk-leaf-sway"
                  style={{ transformOrigin: '48px 40px', animationDelay: '0s, 0.45s' }}
                />
              )}

              {/* Daun 2 — muncul saat progress >= 45% */}
              {visibleLeaves.includes(1) && (
                <path
                  d="M74 32 C92 24 100 10 94 -1 C80 1 72 17 74 32Z"
                  fill="#1D9E75"
                  className="tmk-leaf tmk-leaf-sway"
                  style={{ transformOrigin: '74px 32px', animationDelay: '0s, 0.45s' }}
                />
              )}

              {/* Daun 3 — muncul saat progress >= 60% */}
              {visibleLeaves.includes(2) && (
                <path
                  d="M52 22 C40 10 42 -2 52 -8 C60 0 60 14 52 22Z"
                  fill="#4DD9A8"
                  className="tmk-leaf tmk-leaf-sway"
                  style={{ transformOrigin: '52px 22px', animationDelay: '0s, 0.45s' }}
                />
              )}

              {/* Daun 4 — muncul saat progress >= 72% */}
              {visibleLeaves.includes(3) && (
                <path
                  d="M40 55 C26 50 16 40 18 28 C32 28 40 40 40 55Z"
                  fill="#2AB88A"
                  className="tmk-leaf tmk-leaf-sway"
                  style={{ transformOrigin: '40px 55px', animationDelay: '0s, 0.45s' }}
                />
              )}

              {/* Daun 5 — muncul saat progress >= 85% */}
              {visibleLeaves.includes(4) && (
                <path
                  d="M80 52 C94 48 102 40 100 28 C86 28 80 40 80 52Z"
                  fill="#28B585"
                  className="tmk-leaf tmk-leaf-sway"
                  style={{ transformOrigin: '80px 52px', animationDelay: '0s, 0.45s' }}
                />
              )}
            </svg>
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
