import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import { useApp } from '../context/AppContext';
import '../css/landing.css';

export default function LandingPage() {
  const { landingSeen, markLandingSeen } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(!landingSeen);

  const cardTiltRefs = useRef([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            revealObserver.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    reveals.forEach((el) => revealObserver.observe(el));
    return () => revealObserver.disconnect();
  }, []);

  const handleLoadingComplete = useCallback(() => {
    markLandingSeen();
    setLoading(false);
  }, [markLandingSeen]);

  useEffect(() => {
    document.body.style.overflow = loading ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [loading]);

  const handleAnchorClick = (e, selector) => {
    const target = document.querySelector(selector);
    if (target && target.scrollIntoView) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCardMove = useCallback((e, index) => {
    const card = cardTiltRefs.current[index];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty('--rx', `${(-py * 10).toFixed(2)}deg`);
    card.style.setProperty('--ry', `${(px * 12).toFixed(2)}deg`);
  }, []);

  const resetCardTilt = useCallback((index) => {
    const card = cardTiltRefs.current[index];
    if (!card) return;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  }, []);

  return (
    <div className={`landing-body${loading ? ' is-loading' : ' is-loaded'}`}>
      {loading && (
        <LoadingScreen label="Memuat platform kebun anda..." onComplete={handleLoadingComplete} />
      )}

      {/* ── Navbar — Glassmorphism ── */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Navigasi utama">
        <Link to="/" className="nav-logo" aria-label="Tanamanku beranda">
          <div className="nav-logo-mark">
            <img src="/Logo Kebunku.png" alt="Logo Tanamanku" width="40" height="40" fetchpriority="high" decoding="async" />
          </div>
          <span className="nav-logo-name">Tanamanku</span>
        </Link>
        <div className="nav-links" role="list">
          <a href="#platform-flow" role="listitem" onClick={(e) => handleAnchorClick(e, '#platform-flow')}>Cara Kerja</a>
          <a href="#account-steps" role="listitem" onClick={(e) => handleAnchorClick(e, '#account-steps')}>Cara Buat Akun</a>
          <a href="#features" role="listitem" onClick={(e) => handleAnchorClick(e, '#features')}>Fitur AI</a>
          <a href="#contact" role="listitem" onClick={(e) => handleAnchorClick(e, '#contact')}>Instalasi</a>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="btn btn-ghost btn-sm">Masuk</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Mulai Gratis</Link>
        </div>
        <button
          className="nav-menu-btn"
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span><span></span><span></span>
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="mobile-nav-panel">
          <a href="#platform-flow" onClick={(e) => { handleAnchorClick(e, '#platform-flow'); setMobileMenuOpen(false); }}>Cara Kerja</a>
          <a href="#account-steps" onClick={(e) => { handleAnchorClick(e, '#account-steps'); setMobileMenuOpen(false); }}>Cara Buat Akun</a>
          <a href="#features" onClick={(e) => { handleAnchorClick(e, '#features'); setMobileMenuOpen(false); }}>Fitur AI</a>
          <a href="#contact" onClick={(e) => { handleAnchorClick(e, '#contact'); setMobileMenuOpen(false); }}>Instalasi</a>
          <Link to="/login" className="btn btn-outline btn-sm" style={{justifyContent:'center'}} onClick={() => setMobileMenuOpen(false)}>Masuk</Link>
          <Link to="/register" className="btn btn-primary btn-sm" style={{justifyContent:'center'}} onClick={() => setMobileMenuOpen(false)}>Mulai Gratis</Link>
        </div>
      )}

      {/* ── Hero Section ── */}
      <section className="hero" id="hero" aria-labelledby="hero-headline">
        <div className="hero-bg ambient-drift"></div>

        <div className="hero-contour" aria-hidden="true">
          <svg viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice">
            <path d="M0,400 Q360,320 720,400 T1440,400 L1440,800 L0,800 Z" fill="#1D9E75" />
            <path d="M0,500 Q360,420 720,500 T1440,500 L1440,800 L0,800 Z" fill="#0F6E56" />
            <path d="M0,600 Q360,520 720,600 T1440,600 L1440,800 L0,800 Z" fill="#9FE1CB" />
          </svg>
        </div>

        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-eyebrow" aria-label="Tag produk">
              <span className="eyebrow-dot" aria-hidden="true"></span>
              Platform Pertanian Cerdas
            </div>
            <h1 className="hero-title" id="hero-headline">
              Platform yang<br />
              <span className="highlight">Mengenal Setiap Pohonmu</span>
            </h1>
            <p className="hero-desc">
              Tanamanku menggabungkan data sensor real-time, irigasi presisi, dan kekuatan AI untuk memberi insight mendalam tentang setiap tanaman di kebunmu.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary btn-lg hero-cta-btn">
                Mulai Sekarang
              </Link>
              <a href="#platform-flow" onClick={(e) => handleAnchorClick(e, '#platform-flow')} className="btn btn-outline btn-lg hero-cta-btn">
                Pelajari Cara Kerja
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-illustration-wrap">
              <span className="hero-illustration-caption">Smart Garden AI</span>
              <div className="hero-illustration">
                <svg viewBox="0 0 480 420" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="480" height="420" rx="24" fill="#F2FBF7" />
                  <ellipse cx="240" cy="360" rx="200" ry="40" fill="#E1F5EE" />
                  <path d="M40 340 Q120 300 200 330 Q280 300 360 330 Q430 310 440 340 L440 400 L40 400 Z" fill="#9FE1CB" opacity="0.5" />
                  <path d="M60 355 Q140 325 220 345 Q300 315 380 345 L380 400 L60 400 Z" fill="#1D9E75" opacity="0.25" />

                  <g transform="translate(195, 180)">
                    <rect x="17" y="110" width="16" height="50" rx="4" fill="#8B6914" />
                    <ellipse cx="25" cy="100" rx="42" ry="36" fill="#2AB88A" />
                    <ellipse cx="25" cy="80" rx="35" ry="30" fill="#1D9E75" />
                    <ellipse cx="25" cy="62" rx="26" ry="24" fill="#0F6E56" />
                    <ellipse cx="18" cy="72" rx="10" ry="8" fill="#4DD9A8" opacity="0.4" />
                  </g>

                  <g transform="translate(80, 210)">
                    <rect x="12" y="80" width="12" height="40" rx="3" fill="#8B6914" />
                    <ellipse cx="18" cy="74" rx="30" ry="26" fill="#2AB88A" />
                    <ellipse cx="18" cy="58" rx="24" ry="20" fill="#1D9E75" />
                    <ellipse cx="18" cy="44" rx="18" ry="16" fill="#0F6E56" />
                  </g>

                  <g transform="translate(340, 200)">
                    <rect x="12" y="90" width="12" height="45" rx="3" fill="#8B6914" />
                    <ellipse cx="18" cy="82" rx="34" ry="30" fill="#2AB88A" />
                    <ellipse cx="18" cy="65" rx="28" ry="22" fill="#1D9E75" />
                    <ellipse cx="18" cy="50" rx="20" ry="18" fill="#0F6E56" />
                  </g>

                  <g transform="translate(148, 230)">
                    <rect x="9" y="20" width="6" height="100" rx="3" fill="#64748B" />
                    <rect x="0" y="0" width="24" height="22" rx="5" fill="#1D9E75" />
                    <rect x="3" y="3" width="18" height="16" rx="3" fill="#0F6E56" />
                    <path d="M27 5 Q34 11 27 17" stroke="#1D9E75" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <path d="M31 1 Q42 11 31 21" stroke="#9FE1CB" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </g>

                  <g transform="translate(160, 320)">
                    <rect x="0" y="0" width="8" height="30" rx="4" fill="#64748B" />
                    <rect x="2" y="2" width="4" height="10" rx="2" fill="#1D9E75" />
                  </g>

                  <g fill="#1D9E75" opacity="0.6">
                    <path d="M310 160 Q314 150 318 160 Q318 168 314 168 Q310 168 310 160Z" />
                    <path d="M325 140 Q328 132 331 140 Q331 146 328 146 Q325 146 325 140Z" />
                    <path d="M298 150 Q301 143 304 150 Q304 155 301 155 Q298 155 298 150Z" />
                  </g>

                  <g transform="translate(390, 60)">
                    <circle cx="20" cy="20" r="18" fill="#FDD34D" opacity="0.9" />
                    <circle cx="20" cy="20" r="12" fill="#FBBF24" />
                    <g stroke="#FDD34D" strokeWidth="2" strokeLinecap="round" opacity="0.7">
                      <line x1="20" y1="0" x2="20" y2="-8" />
                      <line x1="20" y1="40" x2="20" y2="48" />
                      <line x1="0" y1="20" x2="-8" y2="20" />
                      <line x1="40" y1="20" x2="48" y2="20" />
                      <line x1="5.8" y1="5.8" x2="0.1" y2="0.1" />
                      <line x1="34.2" y1="5.8" x2="39.9" y2="0.1" />
                      <line x1="5.8" y1="34.2" x2="0.1" y2="39.9" />
                      <line x1="34.2" y1="34.2" x2="39.9" y2="39.9" />
                    </g>
                  </g>

                  <g transform="translate(50, 60)" opacity="0.85">
                    <ellipse cx="50" cy="30" rx="30" ry="20" fill="white" />
                    <ellipse cx="30" cy="36" rx="24" ry="16" fill="white" />
                    <ellipse cx="70" cy="36" rx="24" ry="16" fill="white" />
                  </g>
                </svg>
              </div>
            </div>

            {/* Floating cards — 3D tilt on mouse move */}
            <div
              className="hero-float-card card-1"
              ref={(el) => (cardTiltRefs.current[0] = el)}
              onMouseMove={(e) => handleCardMove(e, 0)}
              onMouseLeave={() => resetCardTilt(0)}
            >
              <div className="hero-float-inner" style={{ animationDelay: '0.2s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
                <div>
                  <div style={{ fontSize: '11px', color: '#6B8C80', fontWeight: 500 }}>Kelembaban Tanah</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#1D9E75' }}>Sensor Real-time</div>
                </div>
              </div>
            </div>
            <div
              className="hero-float-card card-2"
              ref={(el) => (cardTiltRefs.current[1] = el)}
              onMouseMove={(e) => handleCardMove(e, 1)}
              onMouseLeave={() => resetCardTilt(1)}
            >
              <div className="hero-float-inner" style={{ animationDelay: '0.9s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2.5">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                </svg>
                <div>
                  <div style={{ fontSize: '11px', color: '#6B8C80', fontWeight: 500 }}>Analisa AI</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#7E22CE' }}>Deteksi Dini Penyakit</div>
                </div>
              </div>
            </div>
            <div
              className="hero-float-card card-3"
              ref={(el) => (cardTiltRefs.current[2] = el)}
              onMouseMove={(e) => handleCardMove(e, 2)}
              onMouseLeave={() => resetCardTilt(2)}
            >
              <div className="hero-float-inner" style={{ animationDelay: '1.6s' }}>
                <span style={{ fontSize: '18px' }}>&#127795;</span>
                <div>
                  <div style={{ fontSize: '11px', color: '#6B8C80', fontWeight: 500 }}>Memory Pohon</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1D9E75' }}>Riwayat &amp; Insight</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,40 Q360,80 720,40 T1440,40 L1440,80 L0,80 Z" fill="#F6FAF8" />
          </svg>
        </div>
      </section>

      {/* ── Section 1: Cara Kerja Platform (4 Langkah Visual) ── */}
      <section className="platform-flow-section" id="platform-flow" aria-labelledby="pf-title">
        <div className="section-inner">
          <p className="section-eyebrow">Alur Kerja Cerdas</p>
          <h2 className="section-title" id="pf-title">Bagaimana Tanamanku Bekerja</h2>
          <p className="section-sub">Empat pilar terpadu: dari pembacaan sensor tanah hingga memori cerdas berbasis AI di dashboard.</p>

          <div className="flow-grid">
            <div className="flow-card reveal">
              <div className="flow-card-header">
                <div className="flow-badge-num">1</div>
                <div className="flow-icon-box" style={{ background: 'rgba(29,158,117,0.12)', color: '#1D9E75' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="flow-card-title">Sensor Pantau Kondisi Tanah</h3>
              <p className="flow-card-desc">
                Sensor kelembaban membaca kondisi tanah setiap pohon secara <b>real-time</b> 24/7 dan mengirimkan datanya langsung ke cloud.
              </p>
            </div>

            <div className="flow-card reveal" style={{ transitionDelay: '.1s' }}>
              <div className="flow-card-header">
                <div className="flow-badge-num">2</div>
                <div className="flow-icon-box" style={{ background: 'rgba(14,165,233,0.12)', color: '#0284C7' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.07 4.93a10 10 0 1 1-14.14 0" />
                  </svg>
                </div>
              </div>
              <h3 className="flow-card-title">Sistem Siram Otomatis</h3>
              <p className="flow-card-desc">
                Irigasi presisi menyiram tanaman sesuai kebutuhan spesifik — tidak kurang, tidak boros air, dan bisa dikontrol manual dari jarak jauh.
              </p>
            </div>

            <div className="flow-card reveal" style={{ transitionDelay: '.2s' }}>
              <div className="flow-card-header">
                <div className="flow-badge-num">3</div>
                <div className="flow-icon-box" style={{ background: 'rgba(168,85,247,0.12)', color: '#9333EA' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </div>
              <h3 className="flow-card-title">Foto Dianalisis AI Cerdas</h3>
              <p className="flow-card-desc">
                Ambil foto daun atau tanaman, AI menganalisis gejala visual untuk <b>deteksi dini penyakit &amp; hama</b> lengkap dengan rekomendasi penanganan.
              </p>
            </div>

            <div className="flow-card reveal" style={{ transitionDelay: '.3s' }}>
              <div className="flow-card-header">
                <div className="flow-badge-num">4</div>
                <div className="flow-icon-box" style={{ background: 'rgba(245,158,11,0.12)', color: '#D97706' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                  </svg>
                </div>
              </div>
              <h3 className="flow-card-title">Memory &amp; Insight Setiap Pohon</h3>
              <p className="flow-card-desc">
                Seluruh riwayat penyiraman, tren kelembaban, catatan fisik, dan foto membentuk &ldquo;memori&rdquo; tiap pohon untuk keputusan pertanian yang lebih tepat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Cara Buat Akun (3 Langkah & Alur Approval) ── */}
      <section className="account-flow-section" id="account-steps" aria-labelledby="af-title">
        <div className="section-inner">
          <p className="section-eyebrow">Alur Pendaftaran</p>
          <h2 className="section-title" id="af-title">Cara Mulai Menggunakan Tanamanku</h2>
          <p className="section-sub">
            Kami menjaga kualitas data dan keamanan kebun Anda melalui proses verifikasi terkelola.
          </p>

          <div className="account-steps-container">
            <div className="account-step-card reveal">
              <div className="step-badge">Langkah 1</div>
              <div className="step-icon-round">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </div>
              <h3 className="step-card-title">Daftar Akun Baru</h3>
              <p className="step-card-desc">
                Isi form pendaftaran singkat dengan nama, email, dan kata sandi Anda. Hanya butuh kurang dari 1 menit.
              </p>
            </div>

            <div className="step-divider" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="account-step-card reveal" style={{ transitionDelay: '.15s' }}>
              <div className="step-badge highlight-badge">Langkah 2</div>
              <div className="step-icon-round highlight-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="step-card-title">Persetujuan Tim Admin</h3>
              <p className="step-card-desc">
                Akun diverifikasi admin untuk menjamin integritas data dan kecocokan profil kebun Anda. Anda dapat menghubungi CS untuk mempercepat aktivasi.
              </p>
            </div>

            <div className="step-divider" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            <div className="account-step-card reveal" style={{ transitionDelay: '.3s' }}>
              <div className="step-badge">Langkah 3</div>
              <div className="step-icon-round">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="step-card-title">Mulai Pantau &amp; Analisis</h3>
              <p className="step-card-desc">
                Akses dashboard penuh, daftarkan pohon, gunakan fitur analisis foto AI, dan konsultasikan kondisi kebun ke Taku AI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features" id="features" aria-labelledby="features-title">
        <div className="section-inner">
          <p className="section-eyebrow">Keunggulan Platform</p>
          <h2 className="section-title" id="features-title">Kekuatan Data &amp; AI di Kebun Anda</h2>
          <p className="section-sub">Bukan sekadar alat penyiram otomatis — Tanamanku adalah platform analitik dan kecerdasan buatan untuk hasil panen optimal.</p>

          <div className="features-grid">
            <div className="feature-card reveal">
              <div className="feature-icon" style={{ color: '#9333EA' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                </svg>
              </div>
              <h3 className="feature-title">Deteksi Penyakit via Foto AI</h3>
              <p className="feature-desc">Cukup foto daun atau tanaman yang bermasalah. AI langsung menganalisis dan memberikan saran penanganan dalam Bahasa Indonesia.</p>
            </div>

            <div className="feature-card reveal" style={{ transitionDelay: '.1s' }}>
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="feature-title">Asisten Cerdas &ldquo;Taku AI&rdquo;</h3>
              <p className="feature-desc">Tanya jawab seputar perawatan kebun. Taku memahami konteks sensor, riwayat siram, dan catatan setiap tanaman Anda secara mendalam.</p>
            </div>

            <div className="feature-card reveal" style={{ transitionDelay: '.2s' }}>
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <h3 className="feature-title">Sensor &amp; Irigasi Presisi</h3>
              <p className="feature-desc">Sensor kelembaban tanah memberikan umpan data real-time, memungkinkan algoritma menyiram tanaman pada ambang batas yang paling ideal.</p>
            </div>

            <div className="feature-card reveal" style={{ transitionDelay: '.3s' }}>
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="feature-title">Timeline &amp; Memory Pohon</h3>
              <p className="feature-desc">Setiap dokumentasi foto, hasil cek laboratorium/AI, dan catatan lapangan tersimpan rapi sebagai riwayat hidup tiap pohon.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Hubungi Kami / Bantuan Instalasi (CTA Baru) ── */}
      <section className="contact-install-section" id="contact" aria-labelledby="contact-title">
        <div className="section-inner">
          <div className="contact-install-card reveal">
            <div className="contact-install-info">
              <span className="contact-badge">Layanan Instalasi &amp; Konsultasi</span>
              <h2 id="contact-title" className="contact-title">Tim Kami Bantu Instalasi Langsung di Lokasi Kebun Anda</h2>
              <p className="contact-desc">
                Tidak perlu pusing urusan teknis sensor atau konfigurasi. Teknisi Tanamanku siap datang langsung untuk survei, pemasangan perangkat IoT, dan pendampingan penggunaan dashboard.
              </p>
              <div className="contact-details">
                <div className="contact-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.67a19.79 19.79 0 0 1-3-8.59A2 2 0 0 1 3.62 1H7a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>WhatsApp: <b>0852-1500-2047</b></span>
                </div>
                <div className="contact-item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Respon Cepat &middot; Senin – Minggu</span>
                </div>
              </div>
            </div>

            <div className="contact-install-action">
              <a
                href="https://wa.me/6285215002047"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp"
                aria-label="Hubungi Customer Service Tanamanku via WhatsApp"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>Chat Tim Instalasi</span>
              </a>
              <span className="contact-note">Konsultasikan kebutuhan lahan Anda secara gratis</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section" aria-labelledby="cta-title">
        <div className="cta-inner">
          <h2 id="cta-title" className="reveal">Siap Menghubungkan Kebun Anda ke AI?</h2>
          <p className="reveal" style={{ transitionDelay: '.1s' }}>
            Bergabunglah dengan para pemilik kebun dan petani modern yang mengandalkan data serta AI untuk tanaman yang lebih sehat dan hasil yang lebih melimpah.
          </p>
          <div className="cta-btns reveal" style={{ transitionDelay: '.2s' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Daftar Sekarang &mdash; Gratis
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">Sudah Punya Akun? Masuk</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer" role="contentinfo">
        <div className="footer-rings" aria-hidden="true">
          <span></span><span></span>
        </div>
        <div className="footer-inner">
          <div className="footer-brand-block">
            <div className="footer-logo">
              <div className="footer-logo-mark">
                <img src="/Logo Kebunku.png" alt="Logo Tanamanku" width="36" height="36" loading="lazy" decoding="async" />
              </div>
              <span className="footer-brand-name">Tanamanku</span>
            </div>
            <p className="footer-tagline">Platform pertanian cerdas berbasis data &amp; AI.</p>
          </div>
          <p className="footer-copy">&copy; 2026 Tanamanku &middot; Smart Agriculture Platform</p>
        </div>
      </footer>
    </div>
  );
}

