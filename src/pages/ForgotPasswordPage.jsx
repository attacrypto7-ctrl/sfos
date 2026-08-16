import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/auth.css';
import { forgotPasswordApi } from '../services/plantService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    try {
      await forgotPasswordApi(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Gagal mengirim permintaan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-body" style={{ width: '100%' }}>
      <div className="auth-layout">
        {/* Left Panel */}
        <div className="auth-panel-left" role="complementary">
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
            <svg viewBox="0 0 360 240" fill="none">
              <rect width="360" height="240" rx="20" fill="rgba(255,255,255,0.08)" />
              <g transform="translate(130,60)">
                <rect x="10" y="50" width="80" height="65" rx="12" fill="rgba(255,255,255,0.2)" />
                <path d="M25 50 V30 a25 25 0 0 1 50 0 V50" stroke="rgba(255,255,255,0.5)" strokeWidth="8" strokeLinecap="round" fill="none" />
                <circle cx="50" cy="82" r="12" fill="rgba(255,255,255,0.4)" />
                <rect x="46" y="82" width="8" height="16" rx="4" fill="rgba(255,255,255,0.5)" />
              </g>
              <g transform="translate(50,150)" opacity="0.5">
                <rect x="0" y="0" width="60" height="40" rx="6" fill="rgba(255,255,255,0.3)" />
                <polyline points="0,0 30,22 60,0" stroke="rgba(255,255,255,0.6)" strokeWidth="2" fill="none" />
              </g>
              <circle cx="60" cy="80" r="3" fill="rgba(255,255,255,0.4)" />
              <circle cx="300" cy="60" r="2.5" fill="rgba(255,255,255,0.35)" />
              <circle cx="320" cy="160" r="3" fill="rgba(255,255,255,0.45)" />
            </svg>
          </div>
          <div className="auth-features">
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <span>Link reset dikirim ke emailmu</span>
            </div>
            <div className="auth-feature-item">
              <div className="auth-feature-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span>Link berlaku selama 30 menit</span>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-panel-right" role="main">
          <Link to="/login" className="auth-back" aria-label="Kembali ke halaman masuk">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Kembali Masuk
          </Link>

          {!submitted ? (
            <div id="forgot-form-wrap">
              <div className="auth-header">
                <h1>Lupa Kata Sandi?</h1>
                <p>Masukkan email kamu dan kami akan kirimkan link untuk mereset kata sandimu.</p>
              </div>

              <form className="auth-form" onSubmit={handleSubmit} noValidate aria-label="Formulir lupa kata sandi">
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
                      className="form-input"
                      placeholder="kamu@email.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <span className="text-xs text-muted" id="email-hint">Masukkan email yang kamu daftarkan.</span>
                </div>

                {error && (
                  <p className="form-error" role="alert" style={{ color: 'var(--color-danger, #e53e3e)', fontSize: '0.875rem', marginBottom: '8px' }}>
                    {error}
                  </p>
                )}

                <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                  {loading ? <span className="spinner"></span> : 'Kirim Link Reset'}
                </button>
              </form>

              <div className="auth-footer">
                Ingat kata sandinya? <Link to="/login">Masuk di sini</Link>
              </div>
            </div>
          ) : (
            <div className="auth-success show" role="status" aria-live="polite">
              <div className="success-icon" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2>Email Terkirim!</h2>
              <p>Kami sudah mengirimkan link reset kata sandi ke emailmu. Cek inbox atau folder spam kamu.</p>
              <p className="text-sm text-muted">Link berlaku selama 30 menit.</p>
              <Link to="/login" className="btn btn-primary" style={{ marginTop: '16px' }}>Kembali Masuk</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
