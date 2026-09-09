import React, { useRef, useCallback } from 'react';

/**
 * AuthIllustration
 * Inline SVG dari aset-iot-isometrik — pot tanaman, sensor tower, sinyal WiFi, droplet.
 * Layout: absolute bottom panel kiri, lebar penuh, transparan sepenuhnya.
 * Animasi: translateY/translateX/opacity only — tidak ada rotate.
 * Parallax: mouse movement ringan per layer.
 *
 * Props:
 *   isZooming {boolean} — saat true, tambah class `.illustration-zoom` ke wrapper.
 *                         Class ini dikontrol CSS @keyframes murni (transform+opacity),
 *                         berjalan di compositor thread, tidak menyentuh main thread.
 *                         State ini harus lokal di parent (LoginPage/RegisterPage),
 *                         bukan di context/tree besar, agar tidak memicu re-render lain.
 */
export default function AuthIllustration({ isZooming = false }) {
  const wrapRef   = useRef(null);
  const plantRef  = useRef(null);   // pot + daun — float lambat
  const dropRef   = useRef(null);   // droplet — float sedang
  const sensorRef = useRef(null);   // sensor tower + sinyal — parallax sendiri

  const handleMouseMove = useCallback((e) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5 → 0.5
    const cy = (e.clientY - rect.top)  / rect.height - 0.5;
    if (plantRef.current)  plantRef.current.style.transform  = `translate(${cx * -10}px, ${cy * -6}px)`;
    if (dropRef.current)   dropRef.current.style.transform   = `translate(${cx * -16}px, ${cy * -10}px)`;
    if (sensorRef.current) sensorRef.current.style.transform = `translate(${cx * -13}px, ${cy * -8}px)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const r = 'translate(0px,0px)';
    if (plantRef.current)  plantRef.current.style.transform  = r;
    if (dropRef.current)   dropRef.current.style.transform   = r;
    if (sensorRef.current) sensorRef.current.style.transform = r;
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`auth-ill-wrap${isZooming ? ' illustration-zoom' : ''}`}
      aria-hidden="true"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        viewBox="0 0 800 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="auth-ill-svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ailLeaf1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(200,245,222,0.80)" />
            <stop offset="1" stopColor="rgba(77,217,168,0.30)" />
          </linearGradient>
          <linearGradient id="ailLeaf2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(77,217,168,0.75)" />
            <stop offset="1" stopColor="rgba(29,158,117,0.30)" />
          </linearGradient>
          <linearGradient id="ailLeaf3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.65)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.12)" />
          </linearGradient>
          <linearGradient id="ailPot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(255,255,255,0.88)" />
            <stop offset="1" stopColor="rgba(207,244,228,0.55)" />
          </linearGradient>
          <radialGradient id="ailGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(159,225,203,0.18)" />
            <stop offset="1" stopColor="rgba(159,225,203,0)" />
          </radialGradient>
          <radialGradient id="ailSensorGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(150,255,210,0.95)" />
            <stop offset="0.5" stopColor="rgba(42,184,138,0.45)" />
            <stop offset="1" stopColor="rgba(42,184,138,0)" />
          </radialGradient>
          {/* Scene gradients */}
          <linearGradient id="ailGround" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(42,28,12,0.38)" />
            <stop offset="1" stopColor="rgba(15,10,4,0.55)" />
          </linearGradient>
          <linearGradient id="ailTreeCanopy1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(159,225,203,0.65)" />
            <stop offset="1" stopColor="rgba(42,184,138,0.30)" />
          </linearGradient>
          <linearGradient id="ailTreeCanopy2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(77,217,168,0.60)" />
            <stop offset="1" stopColor="rgba(29,158,117,0.22)" />
          </linearGradient>
          <linearGradient id="ailTreeCanopy3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgba(200,245,222,0.55)" />
            <stop offset="1" stopColor="rgba(77,217,168,0.18)" />
          </linearGradient>
          <radialGradient id="ailSunGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(255,240,180,0.55)" />
            <stop offset="0.6" stopColor="rgba(255,230,140,0.20)" />
            <stop offset="1" stopColor="rgba(255,220,100,0)" />
          </radialGradient>
          <radialGradient id="ailSoilDotGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(150,255,210,0.90)" />
            <stop offset="0.5" stopColor="rgba(42,184,138,0.40)" />
            <stop offset="1" stopColor="rgba(42,184,138,0)" />
          </radialGradient>
          <filter id="ailBlurSoft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id="ailBlurGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="ailBlurSun" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="ailBlurDotGlow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* ════════════════════════════════════════════════
            SCENE LAYER — z-index paling belakang
            Urutan render: tanah → rumput → pohon → matahari → sensor dot
            Semua elemen scene di sini TIDAK menyentuh elemen existing di bawah
            ════════════════════════════════════════════════ */}

        {/* ── MATAHARI — pojok kanan atas (x≈720, y≈30) ── */}
        <g className="ail-sun-group">
          {/* Outer glow */}
          <circle cx="720" cy="32" r="40" fill="url(#ailSunGlow)" filter="url(#ailBlurSun)" />
          {/* Sun disc */}
          <circle cx="720" cy="32" r="18" fill="rgba(255,240,160,0.48)" />
          {/* Rays — 8 buah, pendek, flat style */}
          <line x1="720" y1="6"  x2="720" y2="1"  stroke="rgba(255,235,140,0.45)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="720" y1="58" x2="720" y2="63" stroke="rgba(255,235,140,0.45)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="694" y1="32" x2="689" y2="32" stroke="rgba(255,235,140,0.45)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="746" y1="32" x2="751" y2="32" stroke="rgba(255,235,140,0.45)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="702" y1="14" x2="698" y2="10" stroke="rgba(255,235,140,0.38)" strokeWidth="2" strokeLinecap="round" />
          <line x1="738" y1="50" x2="742" y2="54" stroke="rgba(255,235,140,0.38)" strokeWidth="2" strokeLinecap="round" />
          <line x1="738" y1="14" x2="742" y2="10" stroke="rgba(255,235,140,0.38)" strokeWidth="2" strokeLinecap="round" />
          <line x1="702" y1="50" x2="698" y2="54" stroke="rgba(255,235,140,0.38)" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* ── POHON — sisi kiri (base x≈130, base y≈248, tinggi ke y≈95) ── */}
        <g className="ail-tree-group">
          {/* Batang */}
          <path d="M130 248 L130 168" stroke="rgba(101,67,33,0.55)" strokeWidth="7" strokeLinecap="round" />
          {/* Shadow batang kiri */}
          <path d="M127 248 L127 172" stroke="rgba(60,35,10,0.20)" strokeWidth="3" strokeLinecap="round" />
          {/* Kanopi layer bawah (terlebar) */}
          <ellipse
            cx="130" cy="175"
            rx="52" ry="28"
            fill="url(#ailTreeCanopy1)"
            className="ail-tree-canopy"
          />
          {/* Kanopi layer tengah */}
          <ellipse
            cx="118" cy="152"
            rx="44" ry="24"
            fill="url(#ailTreeCanopy2)"
            className="ail-tree-canopy"
            style={{ animationDelay: '0.4s' }}
          />
          {/* Kanopi layer atas (paling kecil, paling terang) */}
          <ellipse
            cx="134" cy="130"
            rx="34" ry="20"
            fill="url(#ailTreeCanopy3)"
            className="ail-tree-canopy"
            style={{ animationDelay: '0.8s' }}
          />
          {/* Highlight kanopi atas */}
          <ellipse cx="138" cy="122" rx="18" ry="10" fill="rgba(255,255,255,0.12)" />
        </g>

        {/* ── TANAH (ground strip) — y≈243–300, full width ── */}
        {/* Harus setelah pohon agar pohon terlihat berdiri DI ATAS tanah */}
        <path
          d="M0 252 Q80 242 200 248 T400 244 T600 246 T800 243 L800 300 L0 300 Z"
          fill="url(#ailGround)"
        />
        {/* Ground highlight strip tipis */}
        <path
          d="M0 252 Q80 242 200 248 T400 244 T600 246 T800 243"
          stroke="rgba(77,217,168,0.22)"
          strokeWidth="1.5"
          fill="none"
        />

        {/* ── RUMPUT — di atas garis tanah, tersebar sepanjang x=20–780 ── */}
        {/* Setiap rumpun: 3–4 helai lengkung tipis, transform-origin bottom */}
        {/* Rumpun 1 */}
        <g className="ail-grass ail-grass-d0" style={{ transformOrigin: '38px 252px' }}>
          <path d="M38 252 Q34 238 30 228" stroke="rgba(77,217,168,0.55)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M38 252 Q38 236 38 224" stroke="rgba(120,230,185,0.50)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M38 252 Q42 237 46 226" stroke="rgba(42,184,138,0.48)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
        {/* Rumpun 2 */}
        <g className="ail-grass ail-grass-d1" style={{ transformOrigin: '72px 250px' }}>
          <path d="M72 250 Q68 237 65 226" stroke="rgba(159,225,203,0.52)" strokeWidth="1.7" fill="none" strokeLinecap="round" />
          <path d="M72 250 Q73 235 74 222" stroke="rgba(77,217,168,0.48)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M72 250 Q76 238 80 228" stroke="rgba(42,184,138,0.44)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
        {/* Rumpun 3 — dekat pohon kanan */}
        <g className="ail-grass ail-grass-d2" style={{ transformOrigin: '190px 248px' }}>
          <path d="M190 248 Q186 235 182 224" stroke="rgba(120,230,185,0.50)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M190 248 Q191 233 192 220" stroke="rgba(77,217,168,0.46)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M190 248 Q194 236 198 226" stroke="rgba(159,225,203,0.48)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
        {/* Rumpun 4 */}
        <g className="ail-grass ail-grass-d3" style={{ transformOrigin: '260px 246px' }}>
          <path d="M260 246 Q256 234 252 222" stroke="rgba(42,184,138,0.48)" strokeWidth="1.7" fill="none" strokeLinecap="round" />
          <path d="M260 246 Q261 232 262 220" stroke="rgba(120,230,185,0.44)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M260 246 Q264 234 268 224" stroke="rgba(77,217,168,0.46)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
        {/* Rumpun 5 */}
        <g className="ail-grass ail-grass-d4" style={{ transformOrigin: '330px 246px' }}>
          <path d="M330 246 Q326 234 323 222" stroke="rgba(159,225,203,0.50)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M330 246 Q331 232 332 220" stroke="rgba(77,217,168,0.46)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M330 246 Q334 235 338 224" stroke="rgba(42,184,138,0.44)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
        {/* Rumpun 6 — tengah */}
        <g className="ail-grass ail-grass-d0" style={{ transformOrigin: '430px 245px' }}>
          <path d="M430 245 Q426 233 422 221" stroke="rgba(77,217,168,0.48)" strokeWidth="1.7" fill="none" strokeLinecap="round" />
          <path d="M430 245 Q431 231 432 219" stroke="rgba(120,230,185,0.44)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M430 245 Q434 234 438 222" stroke="rgba(159,225,203,0.46)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
        {/* Rumpun 7 */}
        <g className="ail-grass ail-grass-d2" style={{ transformOrigin: '500px 245px' }}>
          <path d="M500 245 Q496 233 492 221" stroke="rgba(42,184,138,0.46)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M500 245 Q501 231 502 219" stroke="rgba(77,217,168,0.42)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M500 245 Q504 233 508 222" stroke="rgba(120,230,185,0.44)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
        {/* Rumpun 8 */}
        <g className="ail-grass ail-grass-d1" style={{ transformOrigin: '570px 245px' }}>
          <path d="M570 245 Q566 233 562 221" stroke="rgba(159,225,203,0.48)" strokeWidth="1.7" fill="none" strokeLinecap="round" />
          <path d="M570 245 Q571 231 572 219" stroke="rgba(77,217,168,0.44)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M570 245 Q574 233 578 221" stroke="rgba(42,184,138,0.42)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
        {/* Rumpun 9 */}
        <g className="ail-grass ail-grass-d3" style={{ transformOrigin: '645px 245px' }}>
          <path d="M645 245 Q641 233 637 221" stroke="rgba(77,217,168,0.46)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M645 245 Q646 231 647 219" stroke="rgba(120,230,185,0.42)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M645 245 Q649 233 653 221" stroke="rgba(159,225,203,0.44)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
        {/* Rumpun 10 */}
        <g className="ail-grass ail-grass-d4" style={{ transformOrigin: '710px 244px' }}>
          <path d="M710 244 Q706 232 702 220" stroke="rgba(42,184,138,0.44)" strokeWidth="1.7" fill="none" strokeLinecap="round" />
          <path d="M710 244 Q711 230 712 218" stroke="rgba(77,217,168,0.40)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M710 244 Q714 232 718 220" stroke="rgba(120,230,185,0.42)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
        {/* Rumpun 11 — kanan ujung */}
        <g className="ail-grass ail-grass-d1" style={{ transformOrigin: '768px 244px' }}>
          <path d="M768 244 Q764 232 760 220" stroke="rgba(159,225,203,0.44)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M768 244 Q769 230 770 218" stroke="rgba(77,217,168,0.40)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M768 244 Q772 232 776 220" stroke="rgba(42,184,138,0.38)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </g>
        {/* Rumpun 12 — kiri ujung pendek */}
        <g className="ail-grass ail-grass-d0" style={{ transformOrigin: '14px 254px' }}>
          <path d="M14 254 Q11 244 9 234"  stroke="rgba(77,217,168,0.42)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M14 254 Q15 243 16 232" stroke="rgba(120,230,185,0.38)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>

        {/* ── SENSOR TANAH IoT — dekat pohon (x≈165, y≈245) ── */}
        {/* Glow outer */}
        <circle
          cx="165" cy="245"
          r="12"
          fill="url(#ailSoilDotGlow)"
          filter="url(#ailBlurDotGlow)"
          className="ail-soil-sensor-glow"
        />
        {/* Sensor body: tiang kecil */}
        <line x1="165" y1="248" x2="165" y2="234" stroke="rgba(255,255,255,0.70)" strokeWidth="2" strokeLinecap="round" />
        {/* Sensor head dot */}
        <circle
          cx="165" cy="232"
          r="4"
          fill="rgba(200,255,230,0.92)"
          className="ail-soil-sensor-dot"
        />
        {/* Connector line ke batang pohon (visual "menempel") */}
        <path
          d="M165 238 Q152 242 130 245"
          stroke="rgba(159,225,203,0.30)"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="3 3"
        />

        {/* ── Ambient ground shadow (static bg — existing) ── */}
        <ellipse cx="400" cy="268" rx="340" ry="22" fill="rgba(0,80,58,0.28)" filter="url(#ailBlurSoft)" />

        {/* ── PLANT group — float up/down ── */}
        <g
          ref={plantRef}
          className="ail-plant-group"
          style={{ transition: 'transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94)', willChange: 'transform' }}
        >
          {/* Ambient glow behind plant */}
          <circle cx="380" cy="190" r="130" fill="url(#ailGlow)" />

          {/* Pot rim */}
          <ellipse cx="380" cy="248" rx="60" ry="14" fill="rgba(255,255,255,0.72)" />
          {/* Pot body */}
          <path d="M342 251 L418 251 L406 292 L354 292 Z" fill="url(#ailPot)" />
          {/* Pot left shadow face */}
          <path d="M342 251 L354 292 L347 292 L335 251 Z" fill="rgba(29,158,117,0.28)" />
          {/* Pot right shadow face */}
          <path d="M418 251 L406 292 L413 292 L425 251 Z" fill="rgba(29,158,117,0.18)" />
          {/* Pot top soil */}
          <ellipse cx="380" cy="251" rx="46" ry="10" fill="rgba(15,110,86,0.55)" />

          {/* Stems */}
          <path d="M380 247 C378 212 375 192 378 162" stroke="rgba(29,158,117,0.55)" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M378 243 C356 224 334 210 316 199" stroke="rgba(29,158,117,0.45)" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M382 241 C406 222 428 208 448 197" stroke="rgba(29,158,117,0.40)" strokeWidth="4" fill="none" strokeLinecap="round" />

          {/* Leaf left */}
          <ellipse cx="314" cy="188" rx="52" ry="16" transform="rotate(-34 314 188)" fill="url(#ailLeaf1)" />
          <path d="M314 188 L292 170" stroke="rgba(15,110,86,0.32)" strokeWidth="2" strokeLinecap="round" />
          {/* Leaf right */}
          <ellipse cx="450" cy="184" rx="48" ry="15" transform="rotate(30 450 184)" fill="url(#ailLeaf2)" />
          <path d="M450 184 L468 167" stroke="rgba(15,110,86,0.38)" strokeWidth="2" strokeLinecap="round" />
          {/* Leaf top */}
          <ellipse cx="380" cy="148" rx="44" ry="15" transform="rotate(-8 380 148)" fill="url(#ailLeaf3)" />
          <path d="M380 148 L380 133" stroke="rgba(15,110,86,0.32)" strokeWidth="2" strokeLinecap="round" />

          {/* Small decorative spark dots near plant */}
          <circle cx="262" cy="212" r="3"   fill="rgba(255,255,255,0.28)" className="ail-spark ail-spark-0" />
          <circle cx="502" cy="208" r="2.5" fill="rgba(159,225,203,0.38)" className="ail-spark ail-spark-1" />
          <circle cx="348" cy="120" r="2"   fill="rgba(255,255,255,0.22)" className="ail-spark ail-spark-2" />
        </g>

        {/* ── DROPLET group — float diagonal ── */}
        <g
          ref={dropRef}
          className="ail-drop-group"
          style={{ transition: 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)', willChange: 'transform' }}
        >
          {/* Cloud (top-left) */}
          <circle cx="174" cy="86"  r="22" fill="rgba(255,255,255,0.28)" />
          <circle cx="198" cy="76"  r="17" fill="rgba(255,255,255,0.24)" />
          <circle cx="154" cy="80"  r="15" fill="rgba(255,255,255,0.22)" />
          <rect   x="148" y="90" width="56" height="16" rx="8" fill="rgba(255,255,255,0.20)" />

          {/* Main droplet */}
          <path
            className="ail-drop ail-drop-0"
            d="M176 138 c18 24 30 37 30 53 a30 30 0 1 1 -60 0 c0-16 12-29 30-53 Z"
            fill="rgba(255,255,255,0.78)"
          />
          <ellipse cx="168" cy="182" rx="7" ry="4" transform="rotate(-35 168 182)" fill="rgba(159,225,203,0.88)" />

          {/* Small trailing drops */}
          <path
            className="ail-drop ail-drop-1"
            d="M134 160 c6 8 10 13 10 18 a10 10 0 1 1 -20 0 c0-5 4-10 10-18 Z"
            fill="rgba(255,255,255,0.45)"
          />
          <path
            className="ail-drop ail-drop-2"
            d="M210 104 c5 6 8 10 8 14 a8 8 0 1 1 -16 0 c0-4 3-8 8-14 Z"
            fill="rgba(159,225,203,0.55)"
          />

          {/* Tiny sparkle dots near cloud */}
          <circle cx="122" cy="148" r="2.5" fill="rgba(255,255,255,0.30)" />
          <circle cx="148" cy="104" r="2"   fill="rgba(159,225,203,0.45)" />
        </g>

        {/* ── SENSOR group — parallax mid ── */}
        <g
          ref={sensorRef}
          className="ail-sensor-group"
          style={{ transition: 'transform 0.50s cubic-bezier(0.25,0.46,0.45,0.94)', willChange: 'transform' }}
        >
          {/* Sensor post */}
          <ellipse cx="594" cy="258" rx="12" ry="5" fill="rgba(255,255,255,0.50)" />
          <path d="M594 256 L594 196" stroke="rgba(255,255,255,0.82)" strokeWidth="5" strokeLinecap="round" />
          {/* Sensor glow bg */}
          <circle cx="594" cy="192" r="18" fill="url(#ailSensorGlow)" filter="url(#ailBlurGlow)" className="ail-sensor-glow" />
          {/* Sensor LED */}
          <circle cx="594" cy="192" r="5" fill="#C9FFE9" className="ail-sensor-dot" />

          {/* Signal arcs — staggered fade */}
          <path className="ail-arc ail-arc-0" d="M556 192 a38 18 0 0 1 76 0" stroke="rgba(255,255,255,0.38)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path className="ail-arc ail-arc-1" d="M542 192 a52 25 0 0 1 104 0" stroke="rgba(255,255,255,0.26)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path className="ail-arc ail-arc-2" d="M528 192 a66 32 0 0 1 132 0" stroke="rgba(255,255,255,0.16)" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Wi-Fi glyph top-right */}
          <path className="ail-arc ail-arc-0" d="M622 100 a60 26 0 0 1 108 0" stroke="rgba(255,255,255,0.28)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path className="ail-arc ail-arc-1" d="M638 118 a36 16 0 0 1 76 0"  stroke="rgba(255,255,255,0.22)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <circle cx="676" cy="132" r="6" fill="rgba(255,255,255,0.38)" className="ail-sensor-dot" />

          {/* Spark dots near sensor */}
          <circle cx="542" cy="240" r="2.5" fill="rgba(159,225,203,0.38)" className="ail-spark ail-spark-1" />
          <circle cx="650" cy="232" r="2"   fill="rgba(255,255,255,0.28)" className="ail-spark ail-spark-2" />
          <circle cx="720" cy="178" r="2.5" fill="rgba(159,225,203,0.32)" className="ail-spark ail-spark-0" />

          {/* Small decorative leaf sprouts at base */}
          <ellipse cx="118" cy="262" rx="18" ry="8" transform="rotate(-22 118 262)" fill="rgba(159,225,203,0.32)" />
          <ellipse cx="700" cy="256" rx="16" ry="7" transform="rotate(24 700 256)"  fill="rgba(255,255,255,0.22)" />
        </g>
      </svg>
    </div>
  );
}
