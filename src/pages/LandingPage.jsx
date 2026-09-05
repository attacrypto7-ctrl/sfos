import React, { useEffect, useState, useRef } from 'react';
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

  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => {
      markLandingSeen();
      setLoading(false);
    }, 3600);
    return () => window.clearTimeout(timer);
  }, [loading, markLandingSeen]);

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

  const handleCardMove = (e, index) => {
    const card = cardTiltRefs.current[index];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty('--rx', `${(-py * 10).toFixed(2)}deg`);
    card.style.setProperty('--ry', `${(px * 12).toFixed(2)}deg`);
  };

  const resetCardTilt = (index) => {
    const card = cardTiltRefs.current[index];
    if (!card) return;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
  };

  return (
    <div className={`landing-body${loading ? ' is-loading' : ' is-loaded'}`}>
      {loading && (
        <LoadingScreen label="Memuat kebun anda..." />
      )}

      {/* ── Navbar — Glassmorphism ── */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`} role="navigation" aria-label="Navigasi utama">
        <Link to="/" className="nav-logo" aria-label="Kebunku beranda">
          <div className="nav-logo-mark">
            <img src="/Logo Kebunku.png" alt="Logo Kebunku" width="40" height="40" />
          </div>
          <span className="nav-logo-name">Kebunku</span>
        </Link>
        <div className="nav-links" role="list">
          <a href="#features" role="listitem" onClick={(e) => handleAnchorClick(e, '#features')}>Fitur</a>
          <a href="#how-it-works" role="listitem" onClick={(e) => handleAnchorClick(e, '#how-it-works')}>Cara Kerja</a>
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
          <a href="#features" onClick={(e) => { handleAnchorClick(e, '#features'); setMobileMenuOpen(false); }}>Fitur</a>
          <a href="#how-it-works" onClick={(e) => { handleAnchorClick(e, '#how-it-works'); setMobileMenuOpen(false); }}>Cara Kerja</a>
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
              Pertanian Berbasis IoT
            </div>
            <h1 className="hero-title" id="hero-headline">
              Kebunmu Tumbuh,<br />
              <span className="highlight">Kami yang Jaga</span>
            </h1>
            <p className="hero-desc">
              Kebunku memantau dan menyiram tanamanmu secara otomatis, kapan pun, di mana pun kamu berada.
            </p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-primary btn-lg hero-cta-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Mulai Sekarang
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg hero-cta-btn">Masuk Akun</Link>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-illustration-wrap">
              <span className="hero-illustration-caption">Ilustrasi</span>
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

                  <g transform="translate(140, 200)" opacity="0.5" stroke="#1D9E75" fill="none" strokeLinecap="round">
                    <path d="M10 20 Q18 12 26 20" strokeWidth="2" />
                    <path d="M5 14 Q18 4 31 14" strokeWidth="2" />
                    <circle cx="18" cy="24" r="2.5" fill="#1D9E75" />
                  </g>

                  <g transform="translate(320, 280)" opacity="0.3">
                    <path d="M0 20 Q15 0 30 20 Q15 15 0 20Z" fill="#1D9E75" />
                    <line x1="15" y1="0" x2="15" y2="20" stroke="#0F6E56" strokeWidth="1" />
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
                  <div style={{ fontSize: '11px', color: '#6B8C80', fontWeight: 500 }}>Kelembaban</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#1D9E75' }}>72%</div>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div>
                  <div style={{ fontSize: '11px', color: '#6B8C80', fontWeight: 500 }}>Siram Otomatis</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F6E56' }}>Aktif &#10003;</div>
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
                  <div style={{ fontSize: '11px', color: '#6B8C80', fontWeight: 500 }}>Kondisi</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1D9E75' }}>Sangat Baik</div>
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

      {/* ── Features ── */}
      <section className="features" id="features" aria-labelledby="features-title">
        <div className="section-inner">
          <p className="section-eyebrow">Kenapa Kebunku?</p>
          <h2 className="section-title" id="features-title">Teknologi yang Bekerja untuk Kebunmu</h2>
          <p className="section-sub">Dari sensor tanah hingga AI cerdas — semua bekerja bersama agar tanamanmu selalu mendapatkan yang terbaik.</p>

          <div className="features-grid">
            <div className="feature-card reveal">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <h3 className="feature-title">Selalu Terpantau</h3>
              <p className="feature-desc">Kelembaban tanah, kondisi tanaman, semua bisa kamu lihat langsung dari genggaman. Data real-time setiap saat.</p>
            </div>
            <div className="feature-card reveal" style={{ transitionDelay: '.1s' }}>
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.07 4.93a10 10 0 1 1-14.14 0" />
                </svg>
              </div>
              <h3 className="feature-title">Siram Otomatis, Tanpa Ribet</h3>
              <p className="feature-desc">Tanaman haus? Kebunku sudah tahu duluan dan langsung bertindak. AI kami memastikan tidak ada yang disiram berlebihan.</p>
            </div>
            <div className="feature-card reveal" style={{ transitionDelay: '.2s' }}>
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="feature-title">Riwayat Lengkap</h3>
              <p className="feature-desc">Pantau perjalanan setiap tanamanmu, dari awal ditanam hingga sekarang. Data historis untuk keputusan yang lebih cerdas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="how-it-works" id="how-it-works" aria-labelledby="hiw-title">
        <div className="section-inner">
          <p className="section-eyebrow">Cara Kerja</p>
          <h2 className="section-title" id="hiw-title">Mulai dalam 3 Langkah Mudah</h2>
          <p className="section-sub">Tidak perlu jadi ahli teknologi. Kebunku dirancang sederhana dan langsung bisa dipakai.</p>

          <div className="steps-grid">
            <div className="step-item reveal">
              <div className="step-number">1</div>
              <h3 className="step-title">Daftar & Tambah Tanaman</h3>
              <p className="step-desc">Buat akun gratis, lalu daftarkan tanaman-tanamanmu beserta info dasarnya. Mudah seperti mengisi formulir singkat.</p>
            </div>
            <div className="step-item reveal" style={{ transitionDelay: '.15s' }}>
              <div className="step-number">2</div>
              <h3 className="step-title">Pasang Sensor di Kebun</h3>
              <p className="step-desc">Hubungkan perangkat sensor IoT ke tanamanmu. Sensor akan mulai membaca data kelembaban secara real-time.</p>
            </div>
            <div className="step-item reveal" style={{ transitionDelay: '.3s' }}>
              <div className="step-number">3</div>
              <h3 className="step-title">Biarkan Kebunku Bekerja</h3>
              <p className="step-desc">AI kami memantau 24/7 dan menyiram otomatis saat dibutuhkan. Kamu tinggal duduk santai dan lihat tanamanmu tumbuh.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section" aria-labelledby="cta-title">
        <div className="cta-inner">
          <h2 id="cta-title" className="reveal">Siap Mulai Bertani Lebih Cerdas?</h2>
          <p className="reveal" style={{ transitionDelay: '.1s' }}>Bergabung dengan ribuan petani yang sudah merasakan kemudahan Kebunku. Gratis untuk 30 hari pertama.</p>
          <div className="cta-btns reveal" style={{ transitionDelay: '.2s' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Mulai Sekarang — Gratis
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">Sudah punya akun? Masuk</Link>
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
                <img src="/Logo Kebunku.png" alt="Logo Kebunku" width="36" height="36" />
              </div>
              <span className="footer-brand-name">Kebunku</span>
            </div>
            <p className="footer-tagline">Menjaga tanaman, menumbuhkan hasil.</p>
          </div>
          <p className="footer-copy">&copy; 2026 Kebunku &middot; Aplikasi Pertanian Nomor Satu</p>
        </div>
      </footer>
    </div>
  );
}
