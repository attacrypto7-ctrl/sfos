/**
 * TakuBar.jsx  —  Taku AI · Sci-Fi HUD Bar
 *
 * Bottom HUD fixed bar, futuristic style.
 * - Holographic orb dengan pulse rings
 * - Spectrum waveform animasi real-time
 * - Subtitle dengan typewriter effect
 * - Status chip + progress indicator
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  generateReport,
  playReport,
  stopReport,
  pauseReport,
  resumeReport,
  isSpeechSupported,
} from '../services/takuAiService';

// ─────────────────────────────────────────────────────────────
// SPECTRUM WAVEFORM (canvas-based, lebih sci-fi dari div bars)
// ─────────────────────────────────────────────────────────────
function SpectrumCanvas({ active }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const barsRef   = useRef(Array.from({ length: 48 }, () => ({ h: 2, v: 2, vel: 0 })));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const barW  = W / barsRef.current.length;
      const mid   = W / 2;

      barsRef.current.forEach((bar, i) => {
        if (active) {
          // Physics-based random motion
          const target = 2 + Math.random() * 22 * Math.sin((Date.now() / 180 + i * 0.4));
          bar.vel += (Math.abs(target) - bar.h) * 0.35;
          bar.vel *= 0.62;
          bar.h = Math.max(2, bar.h + bar.vel);
        } else {
          // Idle: slow breathing
          bar.h = 2 + Math.sin(Date.now() / 900 + i * 0.5) * 1.5;
        }

        const x     = i * barW + barW / 2;
        const dist  = Math.abs(x - mid) / mid;   // 0 = centre, 1 = edge
        const alpha = active ? (1 - dist * 0.5) : 0.25;

        // Green → cyan gradient based on height
        const greenRatio = Math.min(1, bar.h / 18);
        const r = Math.round(29  + (0   - 29)  * greenRatio);
        const g = Math.round(158 + (230 - 158) * greenRatio);
        const b = Math.round(117 + (200 - 117) * greenRatio);

        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.beginPath();
        ctx.roundRect(
          x - barW * 0.35,
          (H - bar.h) / 2,
          barW * 0.7,
          bar.h,
          1
        );
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={36}
      aria-hidden="true"
      style={{ display: 'block' }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// HOLOGRAPHIC ORB
// ─────────────────────────────────────────────────────────────
function HoloOrb({ phase }) {
  const active = phase === 'speaking';
  return (
    <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
      {/* Outer rings */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          inset: `-${(i + 1) * 8}px`,
          borderRadius: '50%',
          border: `1px solid rgba(29,158,117,${active ? 0.35 - i * 0.1 : 0.08})`,
          animation: active
            ? `orbRing ${1.2 + i * 0.4}s ease-in-out ${i * 0.18}s infinite`
            : 'none',
          transition: 'border-color 0.5s',
        }} />
      ))}

      {/* Core orb */}
      <div style={{
        position: 'relative',
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        background: active
          ? 'radial-gradient(circle at 35% 35%, #3dffbb, #1D9E75 50%, #0a5c3f)'
          : 'radial-gradient(circle at 35% 35%, #2aad82, #166b50 50%, #0a3d2c)',
        boxShadow: active
          ? '0 0 20px rgba(29,158,117,0.8), 0 0 40px rgba(29,158,117,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
          : '0 0 8px rgba(29,158,117,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'box-shadow 0.4s, background 0.4s',
        animation: active ? 'orbPulse 2s ease-in-out infinite' : 'none',
      }}>
        {/* Mic icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
        </svg>

        {/* Scanning line overlay */}
        {active && (
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}>
            <div style={{
              position: 'absolute',
              left: 0, right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, transparent, rgba(61,255,187,0.7), transparent)',
              animation: 'orbScan 1.8s linear infinite',
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TYPEWRITER SUBTITLE
// ─────────────────────────────────────────────────────────────
function TypewriterText({ text }) {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    idxRef.current = 0;
    if (!text) return;
    const interval = setInterval(() => {
      if (idxRef.current >= text.length) { clearInterval(interval); return; }
      setDisplayed(text.slice(0, ++idxRef.current));
    }, 22);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayed}
      <span style={{
        display: 'inline-block',
        width: '2px',
        height: '13px',
        background: '#1D9E75',
        marginLeft: '2px',
        verticalAlign: 'middle',
        animation: 'cursorBlink 0.8s step-end infinite',
      }} />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// PROGRESS DOTS
// ─────────────────────────────────────────────────────────────
function SegmentDots({ total, current }) {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
        <div key={i} style={{
          width:  i === current ? '16px' : '5px',
          height: '5px',
          borderRadius: '3px',
          background: i < current
            ? 'rgba(29,158,117,0.8)'
            : i === current
            ? '#1D9E75'
            : 'rgba(255,255,255,0.15)',
          transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function TakuBar({ plants = [], onCue, autoStart = true }) {
  const [phase, setPhase]             = useState('idle');   // idle|booting|speaking|paused|done
  const [subtitle, setSubtitle]       = useState('');
  const [cueLabel, setCueLabel]       = useState('TAKU AI · ASISTEN TANAMAN');
  const [segments, setSegments]       = useState([]);
  const [segIdx, setSegIdx]           = useState(0);
  const [dismissed, setDismissed]     = useState(false);
  const pausedRef  = useRef(false);
  const startedRef = useRef(false);
  const totalSegs  = segments.length;

  // Generate report once
  useEffect(() => {
    if (dismissed) return;
    setSegments(generateReport(plants));
  }, [plants, dismissed]);

  // Auto-start when segments ready
  useEffect(() => {
    if (!autoStart || startedRef.current || !segments.length || dismissed) return;
    startedRef.current = true;
    startPlayback(segments);
  }, [segments, autoStart, dismissed]);

  const startPlayback = useCallback(async (segs = segments) => {
    if (!isSpeechSupported()) {
      setPhase('done');
      setSubtitle('Browser tidak mendukung Text-to-Speech.');
      return;
    }

    setPhase('booting');
    setSubtitle('');
    setSegIdx(0);

    // Boot delay for dramatic effect
    await new Promise(r => setTimeout(r, 900));
    setPhase('speaking');

    await playReport(segs, {
      onCue: (cue, plantIndex, text) => {
        // find segment index
        const idx = segs.findIndex(s => s.cue === cue && s.plantIndex === plantIndex && s.text === text);
        if (idx >= 0) setSegIdx(idx);

        setSubtitle(text);

        const cueLabels = {
          system:   'TAKU AI · SISTEM',
          greeting: 'TAKU AI · INISIALISASI',
          summary:  'TAKU AI · RINGKASAN TANAMAN',
          plant:    `TAKU AI · TANAMAN ${plants[plantIndex]?.name?.toUpperCase() ?? ''}`,
          warning:  `TAKU AI · ⚠ PERINGATAN`,
          closing:  'TAKU AI · LAPORAN SELESAI',
        };
        setCueLabel(cueLabels[cue] || 'TAKU AI');
        onCue?.(cue, plantIndex);
      },
      onWord: () => {},
      onDone: () => {
        setPhase('done');
        setSubtitle('Laporan kondisi tanaman telah selesai disampaikan.');
        setCueLabel('TAKU AI · STANDBY');
      },
      onError: (err) => {
        setPhase('done');
        setSubtitle(`Error: ${err}`);
      },
    });
  }, [segments, plants, onCue]);

  const handlePauseResume = () => {
    if (pausedRef.current) {
      resumeReport(); pausedRef.current = false; setPhase('speaking');
    } else {
      pauseReport(); pausedRef.current = true; setPhase('paused');
    }
  };

  const handleStop = () => {
    stopReport(); setPhase('idle'); setSubtitle(''); startedRef.current = false; pausedRef.current = false;
    setCueLabel('TAKU AI · ASISTEN TANAMAN');
  };

  const handleReplay = () => {
    startedRef.current = false; pausedRef.current = false;
    startPlayback();
  };

  const handleDismiss = () => { stopReport(); setDismissed(true); };

  if (dismissed) return null;

  const isSpeaking = phase === 'speaking';
  const isBooting  = phase === 'booting';

  return (
    <>
      <style>{`
        @keyframes orbRing {
          0%   { transform: scale(1);    opacity: 0.6; }
          50%  { transform: scale(1.18); opacity: 0.2; }
          100% { transform: scale(1);    opacity: 0.6; }
        }
        @keyframes orbPulse {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.06); }
        }
        @keyframes orbScan {
          0%   { top: -4px; }
          100% { top: 100%; }
        }
        @keyframes cursorBlink {
          0%,100% { opacity: 1; }
          50%     { opacity: 0; }
        }
        @keyframes takuBarIn {
          from { transform: translateY(110%); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        @keyframes takuBootSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes scanLine {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .taku-bar { animation: takuBarIn 0.55s cubic-bezier(0.16,1,0.3,1) both; }

        .taku-ctrl-btn {
          width: 36px; height: 36px; border-radius: 50%;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          color: white;
        }
        .taku-ctrl-btn:hover  { transform: scale(1.12); }
        .taku-ctrl-btn:active { transform: scale(0.95); }
      `}</style>

      {/* ── HUD Bar ── */}
      <div
        className="taku-bar"
        role="region"
        aria-label="Taku AI Asisten Tanaman"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 4000,
          background: 'linear-gradient(180deg, rgba(5,20,14,0.97) 0%, rgba(8,28,18,0.99) 100%)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(29,158,117,0.28)',
          boxShadow: '0 -4px 32px rgba(29,158,117,0.12)',
          padding: '10px 20px 12px',
        }}
      >
        {/* Top scan line */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, #1D9E75 30%, #3dffbb 50%, #1D9E75 70%, transparent 100%)',
          opacity: isSpeaking ? 0.9 : 0.3,
          transition: 'opacity 0.4s',
        }} />

        {/* Moving scan highlight */}
        {isSpeaking && (
          <div style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '40%', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(61,255,187,0.8), transparent)',
            animation: 'scanLine 2s linear infinite',
          }} />
        )}

        {/* Main row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

          {/* Orb */}
          <HoloOrb phase={phase} />

          {/* Text area */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Status label */}
            <div style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              letterSpacing: '0.12em',
              color: isSpeaking ? '#3dffbb' : 'rgba(29,158,117,0.6)',
              marginBottom: '3px',
              transition: 'color 0.3s',
            }}>
              {isBooting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg style={{ animation: 'takuBootSpin 0.8s linear infinite' }}
                    width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="3">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                  </svg>
                  TAKU AI · MEMUAT LAPORAN…
                </span>
              ) : cueLabel}
            </div>

            {/* Subtitle */}
            <div style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.88)',
              lineHeight: 1.45,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}>
              {subtitle
                ? <TypewriterText key={subtitle} text={subtitle} />
                : <span style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {phase === 'idle' ? '▶ Ketuk play untuk memulai laporan kondisi tanaman' : ''}
                  </span>
              }
            </div>

            {/* Progress dots */}
            {totalSegs > 0 && (phase === 'speaking' || phase === 'paused') && (
              <div style={{ marginTop: '6px' }}>
                <SegmentDots total={totalSegs} current={segIdx} />
              </div>
            )}
          </div>

          {/* Waveform */}
          <div style={{ flexShrink: 0, opacity: isSpeaking ? 1 : 0.3, transition: 'opacity 0.4s' }}>
            <SpectrumCanvas active={isSpeaking} />
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>

            {phase === 'idle' && (
              <button className="taku-ctrl-btn" onClick={handleReplay}
                style={{ background: '#1D9E75', boxShadow: '0 0 16px rgba(29,158,117,0.5)' }}
                title="Mulai laporan">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </button>
            )}

            {(isSpeaking || phase === 'paused') && (<>
              <button className="taku-ctrl-btn" onClick={handlePauseResume}
                style={{ background: phase === 'paused' ? '#1D9E75' : 'rgba(255,255,255,0.1)' }}
                title={phase === 'paused' ? 'Lanjutkan' : 'Jeda'}>
                {phase === 'paused'
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                }
              </button>

              <button className="taku-ctrl-btn" onClick={handleStop}
                style={{ background: 'rgba(255,255,255,0.08)' }}
                title="Stop">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
              </button>
            </>)}

            {phase === 'done' && (
              <button className="taku-ctrl-btn" onClick={handleReplay}
                style={{ background: 'rgba(29,158,117,0.25)', border: '1px solid rgba(29,158,117,0.4)' }}
                title="Putar ulang">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                </svg>
              </button>
            )}

            {/* Vertical divider */}
            <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.1)' }} />

            <button className="taku-ctrl-btn" onClick={handleDismiss}
              style={{ background: 'transparent' }}
              title="Tutup Taku AI">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
