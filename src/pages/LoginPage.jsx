import React, { useState, useTransition } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PendingApprovalModal from '../components/PendingApprovalModal';
import AuthIllustration from '../components/AuthIllustration';
import '../css/auth.css';

export default function LoginPage() {
  const { loginUser } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passError, setPassError] = useState('');

  const [apiError, setApiError] = useState('');
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingSupportPhone, setPendingSupportPhone] = useState('');

  // Animasi zoom-in ilustrasi — state lokal, tidak naik ke context/parent besar.
  // Saat isZooming true, class .illustration-zoom ditambah ke wrapper ilustrasi.
  // CSS @keyframes murni (transform+opacity) yang menangani animasinya —
  // berjalan di compositor thread, tidak membebani main thread / INP.
  const [isZooming, setIsZooming] = useState(false);

  // startTransition: tandai update error display sebagai non-urgent
  // sehingga browser dapat memprioritaskan visual feedback klik (spinner)
  // terlebih dahulu sebelum merender pesan error.
  const [, startTransition] = useTransition();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // URGENT: Reset loading + trigger zoom-in ilustrasi — visual feedback langsung
    setLoading(true);
    setIsZooming(true);

    // NON-URGENT: Reset error states — tidak perlu blok interaksi
    startTransition(() => {
      setEmailError('');
      setPassError('');
      setApiError('');
    });

    // Validasi sinkronus — ringan, hanya string check
    let valid = true;
    let newEmailError = '';
    let newPassError  = '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newEmailError = 'Masukkan alamat email yang valid.';
      valid = false;
    }
    if (!password || password.length < 6) {
      newPassError = 'Kata sandi minimal 6 karakter.';
      valid = false;
    }

    if (!valid) {
      // NON-URGENT: tampilkan pesan error
      startTransition(() => {
        setEmailError(newEmailError);
        setPassError(newPassError);
      });
      // URGENT: batalkan loading + zoom saat validasi gagal
      setLoading(false);
      setIsZooming(false);
      return;
    }

    try {
      await loginUser(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'pending_approval') {
        setPendingSupportPhone(err.supportPhone || '');
        setShowPendingModal(true);
      } else {
        // NON-URGENT: tampilkan error API
        startTransition(() => {
          setApiError(err.message || 'Login gagal, coba lagi.');
        });
      }
    } finally {
      setLoading(false);
      setIsZooming(false);
    }
  };

  return (
    <div className="auth-body" style={{ width: '100%' }}>
      {showPendingModal && (
        <PendingApprovalModal
          onClose={() => setShowPendingModal(false)}
          supportPhone={pendingSupportPhone}
        />
      )}
      <div className="auth-layout">
        {/* Left Panel */}
        <div className="auth-panel-left" role="complementary" aria-label="Informasi produk">
          <div className="auth-ill-decor" aria-hidden="true">
            <svg className="auth-decor-leaf auth-decor-f1" viewBox="0 0 24 24" fill="none">
              <ellipse cx="12" cy="12" rx="8.5" ry="5" transform="rotate(-30 12 12)" fill="currentColor" opacity="0.85" />
              <path d="M12 15 L12 9" stroke="rgba(255,255,255,0.9)" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <svg className="auth-decor-drop auth-decor-f2" viewBox="0 0 24 24" fill="none">
              <path d="M12 3.2c3.1 4.1 5.6 6.6 5.6 9.4a5.6 5.6 0 1 1-11.2 0C6.4 9.8 8.9 7.3 12 3.2Z" fill="currentColor" />
            </svg>
            <svg className="auth-decor-sprout auth-decor-f3" viewBox="0 0 24 24" fill="none">
              <path d="M12 22V15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M12 17c0-2.4-1.4-4.4-3.8-5.4.4 2.4 1.6 4.2 3.8 5.4Z" fill="currentColor" />
              <path d="M12 15c0-2.4 1.4-4.4 3.8-5.4-.4 2.4-1.6 4.2-3.8 5.4Z" fill="currentColor" />
            </svg>
            <svg className="auth-decor-leaf auth-decor-f4" viewBox="0 0 24 24" fill="none">
              <ellipse cx="12" cy="12" rx="8" ry="4.6" transform="rotate(32 12 12)" fill="currentColor" opacity="0.85" />
              <path d="M12 9 L12 14" stroke="rgba(255,255,255,0.9)" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <svg className="auth-decor-drop auth-decor-f5" viewBox="0 0 24 24" fill="none">
              <path d="M12 3.2c3.1 4.1 5.6 6.6 5.6 9.4a5.6 5.6 0 1 1-11.2 0C6.4 9.8 8.9 7.3 12 3.2Z" fill="currentColor" opacity="0.8" />
            </svg>
            <svg className="auth-decor-sprout auth-decor-f6" viewBox="0 0 24 24" fill="none">
              <path d="M12 22V15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M12 17c0-2.4-1.4-4.4-3.8-5.4.4 2.4 1.6 4.2 3.8 5.4Z" fill="currentColor" />
              <path d="M12 15c0-2.4 1.4-4.4 3.8-5.4-.4 2.4-1.6 4.2-3.8 5.4Z" fill="currentColor" opacity="0.8" />
            </svg>
          </div>
          <div className="auth-brand">
            <div className="auth-brand-logo">
              <img src="/Logo Kebunku.png" alt="Kebunku Logo" width="112" height="112" />
            </div>
            <h1 className="auth-brand-name">Tanamanku</h1>
            <p className="auth-brand-tagline">Dipantau AI, bukan cuma sensor.</p>
          </div>

          <AuthIllustration isZooming={isZooming} />

          <div className="auth-features" role="list">
            <div className="auth-feature-item" role="listitem">
              <div className="auth-feature-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span>Pantau kelembaban tanah real-time</span>
            </div>
            <div className="auth-feature-item" role="listitem">
              <div className="auth-feature-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span>Analisis kesehatan tanaman via AI</span>
            </div>
            <div className="auth-feature-item" role="listitem">
              <div className="auth-feature-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span>Riwayat &amp; insight tiap tanaman</span>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-panel-right" role="main">
          <Link to="/" className="auth-back" aria-label="Kembali ke beranda">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Beranda
          </Link>

          <div className="auth-header">
            <h1>Selamat Datang Kembali</h1>
            <p>Masuk untuk terus memantau kebunmu.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate aria-label="Formulir masuk">
            <div className="form-group">
              <label className="form-label" htmlFor="email">Alamat Email</label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  type="email"
                  id="email"
                  className={`form-input ${emailError ? 'error' : ''}`}
                  placeholder="kamu@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <span className={`form-error ${emailError ? 'show' : ''}`} role="alert">{emailError}</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Kata Sandi</label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`form-input has-right-icon ${passError ? 'error' : ''}`}
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Tampilkan/sembunyikan kata sandi"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <span className={`form-error ${passError ? 'show' : ''}`} role="alert">{passError}</span>
            </div>

            <div className="auth-forgot">
              <Link to="/forgot-password">Lupa kata sandi?</Link>
            </div>

            {apiError && (
              <div className="form-error show" role="alert" style={{ textAlign: 'center', marginBottom: '8px' }}>
                {apiError}
              </div>
            )}
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Masuk'}
            </button>
          </form>

          <div className="auth-footer">
            Belum punya akun? <Link to="/register">Daftar sekarang</Link>
          </div>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '16px' }}>
            Dipantau AI, bukan cuma sensor.
          </p>
        </div>
      </div>
    </div>
  );
}
