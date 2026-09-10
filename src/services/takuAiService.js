/**
 * takuAiService.js  —  Taku AI · Asisten Kebun Pintar
 *
 * Zero external API untuk laporan kondisi kebun.
 * Menggunakan Web Speech API (SpeechSynthesis) dengan tuning khusus
 * agar terdengar seperti AI asisten profesional.
 *
 * Script dibagi per-Segment sehingga UI tahu KAPAN menampilkan animasi apa.
 */

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
/**
 * @typedef {'greeting'|'system'|'summary'|'plant'|'warning'|'closing'} Cue
 *
 * @typedef {Object} Segment
 * @property {string}    text        Kalimat yang diucapkan
 * @property {Cue}       cue         Hint animasi untuk UI
 * @property {number|null} plantIndex  Index tanaman (null jika bukan segmen tanaman)
 * @property {number}    pauseBefore  ms jeda sebelum segment ini diucapkan
 * @property {number}    rate         SpeechSynthesis rate override (0.6–1.2)
 * @property {number}    pitch        SpeechSynthesis pitch override (0.5–1.5)
 */

// ─────────────────────────────────────────────────────────────
// REPORT GENERATOR
// ─────────────────────────────────────────────────────────────

export function generateReport(plants = []) {
  const hour   = new Date().getHours();
  const waktu  = hour < 11 ? 'pagi' : hour < 15 ? 'siang' : hour < 18 ? 'sore' : 'malam';
  const total  = plants.length;
  const good   = plants.filter(p => p.status === 'good').length;
  const warn   = plants.filter(p => p.status === 'warning' || p.status === 'no_data').length;

  /** @type {Segment[]} */
  const segs = [];

  // ── Activation beep pause ─────────────────────────────────
  segs.push({
    text: `Sistem aktif.`,
    cue: 'system',
    plantIndex: null,
    pauseBefore: 400,
    rate: 0.82,
    pitch: 0.7,
  });

  // ── Greeting ──────────────────────────────────────────────
  segs.push({
    text: `Selamat ${waktu}. Saya Taku, asisten kebun digital Anda.`,
    cue: 'greeting',
    plantIndex: null,
    pauseBefore: 600,
    rate: 0.88,
    pitch: 0.72,
  });

  segs.push({
    text: `Memuat data lapangan dan memproses kondisi seluruh tanaman.`,
    cue: 'system',
    plantIndex: null,
    pauseBefore: 300,
    rate: 0.85,
    pitch: 0.68,
  });

  // ── Summary ───────────────────────────────────────────────
  if (total === 0) {
    segs.push({
      text: `Tidak ada tanaman terdaftar dalam sistem. Silakan tambahkan tanaman melalui menu Kelola untuk memulai pemantauan.`,
      cue: 'summary',
      plantIndex: null,
      pauseBefore: 700,
      rate: 0.84,
      pitch: 0.7,
    });
  } else {
    segs.push({
      text: `Laporan kondisi kebun. Total tanaman terpantau: ${total}. ${good} dalam kondisi optimal. ${warn > 0 ? `${warn} memerlukan tindakan segera.` : 'Semua tanaman dalam keadaan baik.'}`,
      cue: 'summary',
      plantIndex: null,
      pauseBefore: 700,
      rate: 0.84,
      pitch: 0.7,
    });
  }

  // ── Per-plant ─────────────────────────────────────────────
  plants.forEach((plant, idx) => {
    const nama  = plant.name || 'Tanaman';
    const jenis = plant.type ? `, jenis ${plant.type}` : '';
    const kel   = plant.moisture !== null && plant.moisture !== undefined ? `${plant.moisture} persen` : 'tidak tersedia';

    let detail = '';
    let cue = 'plant';

    if (plant.status === 'good') {
      detail = `${nama}${jenis}. Status: optimal. Kelembaban tanah ${kel}, berada dalam rentang ideal. Tidak ada tindakan yang diperlukan.`;
    } else if (plant.status === 'warning') {
      cue    = 'warning';
      detail = `Peringatan. ${nama}${jenis}. Kelembaban tanah ${kel}, di luar ambang batas ideal. Sistem merekomendasikan penyiraman segera.`;
    } else {
      cue    = 'warning';
      detail = `Perhatian. ${nama}${jenis}. Data sensor tidak tersedia. Periksa koneksi perangkat IoT yang terpasang.`;
    }

    segs.push({
      text: detail,
      cue,
      plantIndex: idx,
      pauseBefore: 600,
      rate: cue === 'warning' ? 0.8 : 0.85,
      pitch: cue === 'warning' ? 0.62 : 0.7,
    });
  });

  // ── Closing ───────────────────────────────────────────────
  const closing = warn > 0
    ? `Laporan selesai. Ditemukan ${warn} anomali yang memerlukan perhatian Anda. Saya siap menerima instruksi lebih lanjut.`
    : `Laporan selesai. Semua sistem berjalan normal. Kebun Anda dalam kondisi prima. Selamat ${waktu}.`;

  segs.push({
    text: closing,
    cue: 'closing',
    plantIndex: null,
    pauseBefore: 800,
    rate: 0.86,
    pitch: 0.7,
  });

  return segs;
}

// ─────────────────────────────────────────────────────────────
// SPEECH ENGINE
// ─────────────────────────────────────────────────────────────

let _cancelFlag = false;

/**
 * Mainkan semua segments berurutan dengan jeda antar segment.
 */
export async function playReport(segments, { onCue, onWord, onDone, onError } = {}) {
  if (!window.speechSynthesis) {
    onError?.('Text-to-Speech tidak didukung di browser ini.');
    return;
  }

  _cancelFlag = false;
  window.speechSynthesis.cancel();
  await sleep(200);

  // Pastikan voices sudah dimuat
  await waitForVoices();

  for (let i = 0; i < segments.length; i++) {
    if (_cancelFlag) break;

    const seg = segments[i];

    // Jeda sebelum segment
    if (seg.pauseBefore > 0) await sleep(seg.pauseBefore);
    if (_cancelFlag) break;

    // Trigger UI cue
    onCue?.(seg.cue, seg.plantIndex, seg.text);

    // Speak
    await speakSegment(seg, onWord);
    if (_cancelFlag) break;
  }

  if (!_cancelFlag) onDone?.();
}

function speakSegment(seg, onWord) {
  return new Promise((resolve) => {
    if (_cancelFlag) { resolve(); return; }

    const utter      = new SpeechSynthesisUtterance(seg.text);
    utter.lang       = 'id-ID';
    utter.rate       = seg.rate  ?? 0.85;
    utter.pitch      = seg.pitch ?? 0.7;
    utter.volume     = 1;

    // Pilih suara: prioritas id-ID, fallback ke en (suara lebih rendah)
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(v => v.lang === 'id-ID')
      || voices.find(v => v.lang.startsWith('id'))
      || voices.find(v => v.name.toLowerCase().includes('google') && v.lang.startsWith('id'));

    if (idVoice) utter.voice = idVoice;

    utter.onboundary = (e) => {
      if (e.name === 'word') {
        const w = seg.text.substring(e.charIndex, e.charIndex + (e.charLength || 8)).trim();
        if (w) onWord?.(w);
      }
    };
    utter.onend   = () => resolve();
    utter.onerror = () => resolve();

    window.speechSynthesis.speak(utter);
  });
}

export function stopReport()   { _cancelFlag = true; window.speechSynthesis?.cancel(); }
export function pauseReport()  { window.speechSynthesis?.pause(); }
export function resumeReport() { window.speechSynthesis?.resume(); }
export function isSpeechSupported() { return Boolean(window.speechSynthesis); }

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function waitForVoices(timeout = 2000) {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(); return; }
    const handler = () => { window.speechSynthesis.removeEventListener('voiceschanged', handler); resolve(); };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(resolve, timeout); // fallback
  });
}
