import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    let valid = true;
    setEmailError('');
    setPassError('');
    setApiError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Masukkan alamat email yang valid.');
      valid = false;
    }
    if (!password || password.length < 6) {
      setPassError('Kata sandi minimal 6 karakter.');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      await loginUser(email, password);
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.message || 'Login gagal, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-body" style={{ width: '100%' }}>
      <div className="auth-layout">
        {/* Left Panel */}
        <div className="auth-panel-left" role="complementary" aria-label="Informasi produk">
          <div className="auth-brand">
            <div className="auth-brand-logo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="auth-brand-name">Tanamanku</h1>
            <p className="auth-brand-tagline">Aplikasi Pertanian Nomor Satu</p>
          </div>

          <div className="auth-illustration" aria-hidden="true">
            <svg viewBox="0 0 360 260" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="360" height="260" rx="20" fill="rgba(255,255,255,0.08)" />
              <ellipse cx="180" cy="220" rx="140" ry="28" fill="rgba(255,255,255,0.08)" />
              <g transform="translate(120,80)">
                <rect x="17" y="90" width="14" height="50" rx="4" fill="rgba(139,105,20,0.7)" />
                <ellipse cx="24" cy="82" rx="38" ry="32" fill="rgba(255,255,255,0.2)" />
                <ellipse cx="24" cy="64" rx="30" ry="26" fill="rgba(255,255,255,0.15)" />
                <ellipse cx="24" cy="48" rx="22" ry="20" fill="rgba(255,255,255,0.1)" />
              </g>
              <g transform="translate(200,100)">
                <rect x="13" y="75" width="12" height="40" rx="3" fill="rgba(139,105,20,0.7)" />
                <ellipse cx="19" cy="68" rx="30" ry="26" fill="rgba(255,255,255,0.18)" />
                <ellipse cx="19" cy="53" rx="24" ry="20" fill="rgba(255,255,255,0.12)" />
                <ellipse cx="19" cy="40" rx="18" ry="15" fill="rgba(255,255,255,0.08)" />
              </g>
              <g transform="translate(80,130)">
                <rect x="9" y="20" width="5" height="70" rx="2.5" fill="rgba(255,255,255,0.5)" />
                <rect x="0" y="0" width="22" height="20" rx="5" fill="rgba(255,255,255,0.3)" />
                <path d="M26 4 Q32 10 26 16" stroke="rgba(255,255,255,0.6)" strokeWidth="2" fill="none" strokeLinecap="round" />
              </g>
              <path d="M280 80 Q284 70 288 80 Q288 88 284 88 Q280 88 280 80Z" fill="rgba(255,255,255,0.4)" />
              <path d="M295 60 Q298 52 301 60 Q301 66 298 66 Q295 66 295 60Z" fill="rgba(255,255,255,0.3)" />
              <g transform="translate(75,120)" stroke="rgba(255,255,255,0.5)" fill="none" strokeLinecap="round">
                <path d="M7 15 Q15 7 23 15" strokeWidth="2" />
                <path d="M2 9 Q15 -1 28 9" strokeWidth="1.5" />
                <circle cx="15" cy="19" r="2" fill="rgba(255,255,255,0.5)" />
              </g>
            </svg>
          </div>

          <div className="auth-features" role="list">
            <div className="auth-feature-item" role="listitem">
              <div className="auth-feature-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <span>Pantau kelembaban tanah real-time</span>
            </div>
            <div className="auth-feature-item" role="listitem">
              <div className="auth-feature-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.07 4.93a10 10 0 1 1-14.14 0" />
                </svg>
              </div>
              <span>Sistem Irigasi Otomatis berbasis AI</span>
            </div>
            <div className="auth-feature-item" role="listitem">
              <div className="auth-feature-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <span>Riwayat penyiraman lengkap</span>
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
        </div>
      </div>
    </div>
  );
}
