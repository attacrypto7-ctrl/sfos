/**
 * TakuAssistant.jsx - Taku AI: Asisten Aktif
 *
 * Menggantikan VoiceOrb.jsx sebagai floating orb di semua halaman.
 * Fitur:
 *  - Greeting sekali per sesi login (via sessionStorage)
 *  - Web Speech API -> kirim ke /api/ai/taku/command (function calling)
 *  - Eksekusi aksi nyata: navigate, water_plant, toggle_auto_water
 *  - TTS balasan Taku via SpeechSynthesis
 *  - Response bubble muncul di atas orb (fade 4 detik)
 *  - Fallback manual menu saat speech tidak didukung
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { waterPlantApi, toggleAutoWaterApi, takuCommandApi } from '../services/plantService';

// Route map - nama yang dikirim AI -> path react-router
const ROUTE_MAP = {
  'dashboard':      '/dashboard',
  'kebun-saya':     '/garden',
  'riwayat':        '/history',
  'kelola-tanaman': '/manage-plants',
  'profil':         '/profile',
  'taku-chat':      '/taku',
};

const TAKU_STYLES = `
  @keyframes taku-bubble-in {
    from { opacity: 0; transform: translateY(8px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes taku-bubble-out {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to   { opacity: 0; transform: translateY(-6px) scale(0.97); }
  }
  @keyframes taku-sonar {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(1.9); opacity: 0; }
  }
  @keyframes taku-pulse-idle {
    0%, 100% { box-shadow: 0 0 0 0 rgba(29,158,117,0.4); }
    50%      { box-shadow: 0 0 0 10px rgba(29,158,117,0); }
  }
  @keyframes taku-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes orbScan {
    0%   { top: -4px; }
    100% { top: 100%; }
  }
`;

export default function TakuAssistant() {
  const { user, plants, showToast, loadPlants } = useApp();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [phase, setPhase]             = useState('idle');
  const [bubble, setBubble]           = useState('');
  const [bubbleOut, setBubbleOut]     = useState(false);
  const [showMenu, setShowMenu]       = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [speechOk, setSpeechOk]       = useState(true);

  const recognitionRef = useRef(null);
  const bubbleTimer    = useRef(null);
  const synthRef       = useRef(window.speechSynthesis);

  const speakText = useCallback((text) => {
    if (!('speechSynthesis' in window)) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang  = 'id-ID';
    utt.rate  = 1.05;
    utt.pitch = 1.05;
    utt.onstart = () => setPhase('speaking');
    utt.onend   = () => setPhase('idle');
    utt.onerror = () => setPhase('idle');
    synthRef.current.speak(utt);
  }, []);

  const showBubble = useCallback((text) => {
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    setBubbleOut(false);
    setBubble(text);
    bubbleTimer.current = setTimeout(() => {
      setBubbleOut(true);
      setTimeout(() => setBubble(''), 350);
    }, 4500);
  }, []);

  const speakAndShow = useCallback((text) => {
    showBubble(text);
    speakText(text);
  }, [showBubble, speakText]);

  // Greeting sekali per sesi
  useEffect(() => {
    if (!user) return;
    const alreadyGreeted = sessionStorage.getItem('taku_greeted');
    if (alreadyGreeted) return;
    sessionStorage.setItem('taku_greeted', 'true');
    const firstName = (user.name || 'Kamu').split(' ')[0];
    const timer = setTimeout(() => {
      speakAndShow(
        `Halo ${firstName}, selamat datang di kebunmu! Saya Taku, asisten AI yang siap membantu. Ketuk orb hijau ini kapan saja untuk kasih perintah.`
      );
    }, 1200);
    return () => clearTimeout(timer);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setSpeechOk(false); return; }

    const rec = new SpeechRecognition();
    rec.continuous      = false;
    rec.lang            = 'id-ID';
    rec.interimResults  = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => { setPhase('listening'); setShowMenu(false); };
    rec.onend   = () => { setPhase((prev) => (prev === 'listening' ? 'idle' : prev)); };
    rec.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      setPhase('idle');
      if (e.error === 'not-allowed') {
        setSpeechOk(false);
        showToast('Akses mikrofon ditolak. Gunakan menu manual.', 'warning');
      } else if (e.error !== 'aborted') {
        showToast('Gagal mengenali suara, coba lagi.', 'error');
      }
    };
    rec.onresult = async (e) => {
      const transcript = e.results[0][0].transcript;
      console.log('[Taku] Mendengar:', transcript);
      showToast(`Mendengar: "${transcript}"`, 'info');
      await processCommand(transcript);
    };

    recognitionRef.current = rec;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const executeToolCalls = useCallback(async (toolCalls, backendPlants) => {
    const plantList = (backendPlants && backendPlants.length) ? backendPlants : plants;

    for (const call of toolCalls) {
      switch (call.name) {
        case 'navigate_to_page': {
          const path = ROUTE_MAP[call.parameters && call.parameters.page];
          if (path) navigate(path);
          else console.warn('[Taku] navigate_to_page: unknown page', call.parameters && call.parameters.page);
          break;
        }
        case 'water_plant': {
          const target = ((call.parameters && call.parameters.target) || '').toLowerCase().trim();
          try {
            if (target === 'semua') {
              showToast('Menyiram semua tanaman...', 'info');
              await Promise.all(plantList.map((p) => waterPlantApi(p.id)));
              showToast('Semua tanaman berhasil disiram!', 'success');
            } else {
              const found = plantList.find((p) =>
                p.name.toLowerCase().includes(target) ||
                (p.type || '').toLowerCase().includes(target) ||
                p.name.toLowerCase().split(' ').some((w) => w.length > 2 && target.includes(w))
              );
              if (found) {
                await waterPlantApi(found.id);
                showToast(`${found.name} berhasil disiram!`, 'success');
              } else {
                showToast(`Tanaman "${target}" tidak ditemukan.`, 'warning');
              }
            }
            await loadPlants();
          } catch (err) {
            showToast(`Gagal menyiram: ${err.message}`, 'error');
          }
          break;
        }
        case 'toggle_auto_water': {
          const plantName = ((call.parameters && call.parameters.plantName) || '').toLowerCase();
          const enabled   = Boolean(call.parameters && call.parameters.enabled);
          try {
            const found = plantList.find((p) => p.name.toLowerCase().includes(plantName));
            if (found) {
              await toggleAutoWaterApi(found.id, enabled);
              showToast(`${enabled ? 'Aktifkan' : 'Nonaktifkan'} siram otomatis ${found.name}`, 'success');
              await loadPlants();
            } else {
              showToast(`Tanaman "${plantName}" tidak ditemukan.`, 'warning');
            }
          } catch (err) {
            showToast(`Gagal toggle auto water: ${err.message}`, 'error');
          }
          break;
        }
        case 'get_garden_report':
          // Data laporan sudah ada di spokenReply dari backend.
          break;
        default:
          console.warn('[Taku] Unknown tool call:', call.name);
      }
    }
  }, [navigate, plants, loadPlants, showToast]);

  const processCommand = useCallback(async (transcript) => {
    setPhase('processing');
    try {
      const result = await takuCommandApi(transcript, location.pathname);
      const { toolCalls = [], spokenReply = '', plants: backendPlants } = result;
      if (toolCalls.length > 0) {
        await executeToolCalls(toolCalls, backendPlants);
      }
      if (spokenReply) {
        speakAndShow(spokenReply);
      } else {
        setPhase('idle');
      }
    } catch (err) {
      console.error('[Taku] processCommand error:', err);
      setPhase('idle');
      const fallback = 'Maaf, saya sedang tidak bisa terhubung. Coba lagi sebentar.';
      speakAndShow(fallback);
      showToast('Taku AI tidak merespons.', 'error');
    }
  }, [location.pathname, executeToolCalls, speakAndShow, showToast]);

  const handleManualCommand = useCallback(async (text) => {
    setShowMenu(false);
    showToast(`Perintah: "${text}"`, 'info');
    await processCommand(text);
  }, [processCommand, showToast]);

  const handleOrbClick = () => {
    if (!speechOk) { setShowMenu((prev) => !prev); return; }
    if (phase === 'listening') { recognitionRef.current && recognitionRef.current.stop(); return; }
    if (phase === 'processing' || phase === 'speaking') return;
    setShowMenu(false);
    try {
      recognitionRef.current && recognitionRef.current.start();
    } catch (err) {
      console.error('[Taku] Speech start error:', err);
      setPhase('idle');
    }
  };

  useEffect(() => () => { if (bubbleTimer.current) clearTimeout(bubbleTimer.current); }, []);

  const isListening  = phase === 'listening';
  const isProcessing = phase === 'processing';
  const isSpeaking   = phase === 'speaking';
  const isActive     = isListening || isProcessing || isSpeaking;

  const orbColor = isListening ? '#3B8BF7' : isProcessing ? '#F5A623' : '#1D9E75';
  const orbGlow  = isListening
    ? '0 0 24px rgba(59,139,247,0.65)'
    : isProcessing
    ? '0 0 20px rgba(245,166,35,0.55)'
    : isSpeaking
    ? '0 0 24px rgba(29,158,117,0.65)'
    : '0 4px 16px rgba(29,158,117,0.35)';
  const orbLabel = isListening ? 'Mendengarkan...' : isProcessing ? 'Memproses...' : isSpeaking ? 'Berbicara...' : 'Ketuk untuk berbicara';

  return (
    <>
      <style>{TAKU_STYLES}</style>
      <div style={{ position: 'fixed', bottom: '84px', right: '20px', zIndex: 1100, fontFamily: 'var(--font-family)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>

        {/* Response bubble */}
        {bubble && (
          <div style={{ background: 'var(--color-card, #fff)', border: '1px solid var(--color-border, #DCF0E9)', borderRadius: '16px', borderBottomRightRadius: '4px', padding: '10px 14px', maxWidth: '260px', fontSize: '13px', lineHeight: 1.5, color: 'var(--color-text)', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', animation: bubbleOut ? 'taku-bubble-out 0.35s ease forwards' : 'taku-bubble-in 0.3s ease both' }}>
            <span style={{ fontWeight: 700, color: '#1D9E75', fontSize: '11px', display: 'block', marginBottom: '3px' }}>TAKU AI</span>
            {bubble}
          </div>
        )}

        {/* Tooltip hover */}
        {showTooltip && !isActive && !bubble && (
          <div style={{ background: 'var(--color-card, #fff)', border: '1px solid var(--color-border, #DCF0E9)', borderRadius: '12px', borderBottomRightRadius: '4px', padding: '10px 14px', maxWidth: '240px', fontSize: '12px', color: 'var(--color-text-sub)', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', animation: 'taku-bubble-in 0.25s ease both' }}>
            <p style={{ fontWeight: 700, color: '#1D9E75', margin: '0 0 6px' }}>Asisten Aktif Taku</p>
            <ul style={{ margin: 0, paddingLeft: '14px', listStyleType: 'disc', lineHeight: 1.8 }}>
              <li>"Pindah ke kebun saya"</li>
              <li>"Siram durian"</li>
              <li>"Laporan kebun saya"</li>
              <li>"Aktifkan siram otomatis manggis"</li>
            </ul>
          </div>
        )}

        {/* Manual menu */}
        {showMenu && (
          <div style={{ background: 'var(--color-card, #fff)', border: '1px solid var(--color-border, #DCF0E9)', borderRadius: '14px', padding: '8px', width: '244px', boxShadow: '0 8px 28px rgba(0,0,0,0.14)', display: 'flex', flexDirection: 'column', gap: '4px', animation: 'taku-bubble-in 0.25s ease both' }}>
            <div style={{ padding: '6px 8px', fontWeight: 700, fontSize: '11px', color: '#1D9E75', borderBottom: '1px solid var(--color-border-soft, #EDF7F3)', letterSpacing: '0.08em' }}>MENU TAKU AI</div>
            {[
              { label: 'Ke Dashboard',     cmd: 'pindah ke dashboard' },
              { label: 'Ke Kebun Saya',    cmd: 'pindah ke kebun saya' },
              { label: 'Laporan Kebun',    cmd: 'berikan laporan kebun saya' },
              { label: 'Ke Riwayat',       cmd: 'pindah ke riwayat' },
              { label: 'Kondisi Tanaman',  cmd: 'bagaimana kondisi tanaman saya' },
            ].map(({ label, cmd }) => (
              <button key={cmd} onClick={() => handleManualCommand(cmd)} style={{ background: 'none', border: 'none', textAlign: 'left', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text)', width: '100%' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-pale, #E8FAF4)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                {label}
              </button>
            ))}
            {plants.length > 0 && (
              <>
                <div style={{ fontSize: '10px', color: '#9BB5AC', padding: '4px 10px 2px', fontWeight: 600, letterSpacing: '0.08em' }}>SIRAM TANAMAN</div>
                {plants.slice(0, 4).map((p) => (
                  <button key={p.id} onClick={() => handleManualCommand(`siram ${p.name}`)} style={{ background: 'none', border: 'none', textAlign: 'left', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text)', width: '100%' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-pale, #E8FAF4)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                    Siram {p.name}
                  </button>
                ))}
                <button onClick={() => handleManualCommand('siram semua tanaman')} style={{ background: 'none', border: 'none', textAlign: 'left', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#1D9E75', fontWeight: 600, width: '100%' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-pale, #E8FAF4)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                  Siram Semua ({plants.length} tanaman)
                </button>
              </>
            )}
            <button onClick={() => { navigate('/taku'); setShowMenu(false); }} style={{ background: 'none', border: 'none', textAlign: 'left', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text)', width: '100%', marginTop: '2px', borderTop: '1px solid var(--color-border-soft, #EDF7F3)' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-pale, #E8FAF4)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
              Buka riwayat chat
            </button>
          </div>
        )}

        {/* Floating Orb */}
        <div style={{ position: 'relative' }}>
          {isActive && (
            <>
              <div style={{ position: 'absolute', inset: '-10px', borderRadius: '50%', border: `2px solid ${orbColor}`, opacity: 0, animation: 'taku-sonar 1.6s ease-out infinite' }} />
              <div style={{ position: 'absolute', inset: '-10px', borderRadius: '50%', border: `2px solid ${orbColor}`, opacity: 0, animation: 'taku-sonar 1.6s ease-out 0.55s infinite' }} />
            </>
          )}
          {!isActive && (
            <div style={{ position: 'absolute', inset: '-8px', borderRadius: '50%', border: '1.5px solid rgba(29,158,117,0.3)', opacity: 0, animation: 'taku-sonar 3s ease-out infinite' }} />
          )}

          <button
            onClick={handleOrbClick}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            aria-label={orbLabel}
            title={orbLabel}
            style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, ${isListening ? '#5BA8FF' : '#2aad82'}, ${orbColor} 55%, ${isListening ? '#1A5EBF' : '#0a5c3f'})`,
              border: 'none', cursor: isProcessing ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: orbGlow,
              transition: 'box-shadow 0.3s, background 0.3s',
              animation: !isActive ? 'taku-pulse-idle 3s ease-in-out infinite' : 'none',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {isSpeaking && (
              <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, rgba(61,255,187,0.7), transparent)', animation: 'orbScan 1.8s linear infinite', top: 0 }} />
            )}

            {isProcessing ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" style={{ animation: 'taku-spin 0.8s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
              </svg>
            ) : isListening ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5">
                <rect x="4" y="9" width="3" height="6" rx="1.5" /><rect x="10" y="5" width="3" height="14" rx="1.5" /><rect x="16" y="9" width="3" height="6" rx="1.5" />
              </svg>
            ) : isSpeaking ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            )}
          </button>
        </div>

        <span style={{ fontSize: '10px', color: isActive ? '#1D9E75' : 'rgba(100,120,115,0.7)', fontWeight: 600, letterSpacing: '0.04em', textAlign: 'center', transition: 'color 0.3s', userSelect: 'none' }}>
          {isListening ? 'MENDENGAR' : isProcessing ? 'MEMPROSES' : isSpeaking ? 'BERBICARA' : 'TAKU AI'}
        </span>
      </div>
    </>
  );
}
