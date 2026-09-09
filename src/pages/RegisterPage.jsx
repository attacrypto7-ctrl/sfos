import React, { useState, useEffect, useTransition } from 'react';
import { Link } from 'react-router-dom';
import { registerApi } from '../services/plantService';
import AuthIllustration from '../components/AuthIllustration';
import '../css/auth.css';

const WHATSAPP_URL = 'https://wa.me/6285215002047';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [registered, setRegistered] = useState(false);

  // Animasi zoom-in ilustrasi — state lokal, tidak naik ke context/parent besar.
  // Saat isZooming true, class .illustration-zoom ditambah ke wrapper ilustrasi.
  // CSS @keyframes murni (transform+opacity) yang menangani animasinya —
  // berjalan di compositor thread, tidak membebani main thread / INP.
  const [isZooming, setIsZooming] = useState(false);

  // startTransition: tandai update error display sebagai non-urgent
  // sehingga browser dapat memprioritaskan visual feedback klik (spinner)
  // terlebih dahulu sebelum merender pesan error.
  const [, startTransition] = useTransition();

  const [strengthScore, setStrengthScore] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState('');

  useEffect(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    setStrengthScore(score);
    const labels = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
    setStrengthLabel(labels[score] || '');
  }, [password]);

  const getStrengthClass = () => ['', 'weak', 'medium', 'strong', 'strong'][strengthScore] || '';

  const handleSubmit = async (e) => {
    e.preventDefault();

    // URGENT: Reset error + trigger zoom-in ilustrasi — visual feedback langsung
    setIsZooming(true);

    // NON-URGENT: reset error display
    startTransition(() => {
      setApiError('');
    });

    // Validasi sinkronus
    if (!name || !email || !password || !confirmPassword) {
      startTransition(() => {
        setApiError('Semua kolom wajib diisi.');
      });
      setIsZooming(false);
      return;
    }
    if (password !== confirmPassword) {
      startTransition(() => {
        setApiError('Konfirmasi kata sandi tidak cocok.');
      });
      setIsZooming(false);
      return;
    }
    if (password.length < 8) {
      startTransition(() => {
        setApiError('Kata sandi minimal 8 karakter.');
      });
      setIsZooming(false);
      return;
    }

    setLoading(true);
    try {
      await registerApi({ name, phone, email, password });
      setRegistered(true);
    } catch (err) {
      startTransition(() => {
        setApiError(err.message || 'Pendaftaran gagal, coba lagi.');
      });
    } finally {
      setLoading(false);
      setIsZooming(false);
    }
  };

  // ── Success State ──
  if (registered) {
    return (
      <div className="auth-body" style={{ width: '100%' }}>
        <div className="auth-layout">
          <div className="auth-panel-left" role="complementary">
            <div className="auth-brand">
              <div className="auth-brand-logo">
                <img src="/Logo Kebunku.png" alt="Kebunku Logo" width="80" height="80" />
              </div>
              <h1 className="auth-brand-name">Kebunku</h1>
              <p className="auth-brand-tagline">Pertanian Cerdas Berbasis IoT</p>
            </div>
          </div>

          <div className="auth-panel-right" role="main">
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(29,158,117,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1A2B25', marginBottom: '12px' }}>
                Pendaftaran Berhasil!
              </h2>
              <p style={{ fontSize: '14px', color: '#3D5A50', lineHeight: 1.7, marginBottom: '8px', maxWidth: '320px', margin: '0 auto 8px' }}>
                Akunmu sudah dibuat dan sedang menunggu persetujuan admin.
              </p>
              <p style={{ fontSize: '14px', color: '#3D5A50', lineHeight: 1.7, marginBottom: '32px', maxWidth: '320px', margin: '0 auto 32px' }}>
                Hubungi Customer Service kami untuk mempercepat aktivasi akun.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '320px', margin: '0 auto' }}>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    background: '#25D366', color: '#fff',
                    padding: '14px 24px', borderRadius: '9999px',
                    fontWeight: 700, fontSize: '15px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(37,211,102,0.35)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Hubungi CS via WhatsApp
                </a>
                <Link
                  to="/login"
                  style={{
                    display: 'block', textAlign: 'center',
                    padding: '12px 24px', borderRadius: '9999px',
                    border: '1.5px solid #DCF0E9',
                    color: '#1D9E75', fontWeight: 600, fontSize: '14px',
                    textDecoration: 'none',
                  }}
                >
                  Kembali ke Halaman Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form State ──
  return (
    <div className="auth-body" style={{ width: '100%' }}>
      <div className="auth-layout">
        {/* Left Panel */}
        <div className="auth-panel-left" role="complementary" aria-label="Informasi pendaftaran">
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
              <img src="/Logo Kebunku.png" alt="Kebunku Logo" width="80" height="80" />
            </div>
            <h1 className="auth-brand-name">Kebunku</h1>
            <p className="auth-brand-tagline">Pertanian Cerdas Berbasis IoT</p>
          </div>

          <AuthIllustration isZooming={isZooming} />

          <div className="auth-features" role="list">
            <div className="auth-feature-item" role="listitem">
              <div className="auth-feature-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span>Diaktifkan setelah verifikasi admin</span>
            </div>
            <div className="auth-feature-item" role="listitem">
              <div className="auth-feature-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span>Kelola tanaman tanpa batas</span>
            </div>
            <div className="auth-feature-item" role="listitem">
              <div className="auth-feature-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span>Dukungan tim kami 24/7</span>
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
            <h1>Buat Akun Baru</h1>
            <p>Daftarkan dirimu — akun akan aktif setelah disetujui admin.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate aria-label="Formulir pendaftaran">
            <div className="auth-row">
              <div className="form-group">
                <label className="form-label" htmlFor="name">Nama Lengkap</label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input type="text" id="name" className="form-input" placeholder="Nama kamu"
                    autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">No. HP (opsional)</label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 9.67a19.79 19.79 0 0 1-3-8.59A2 2 0 0 1 3.62 1H7a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <input type="tel" id="phone" className="form-input" placeholder="08xx-xxxx-xxxx"
                    autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Alamat Email</label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input type="email" id="email" className="form-input" placeholder="kamu@email.com"
                  autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Kata Sandi</label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input type={showPassword ? 'text' : 'password'} id="password"
                  className="form-input has-right-icon" placeholder="Minimal 8 karakter"
                  autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="input-icon-right" onClick={() => setShowPassword(!showPassword)}
                  aria-label="Tampilkan/sembunyikan kata sandi">
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="password-strength" aria-live="polite">
                <div className="password-strength-bar">
                  {[1,2,3,4].map((n) => (
                    <div key={n} className={`strength-seg ${password && strengthScore >= n ? getStrengthClass() : ''}`} aria-hidden="true" />
                  ))}
                </div>
                <span className="strength-label">{password ? strengthLabel : ''}</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">Konfirmasi Kata Sandi</label>
              <div className="input-wrapper">
                <span className="input-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input type="password" id="confirm-password" className="form-input"
                  placeholder="Ulangi kata sandi" autoComplete="new-password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
            </div>

            {apiError && (
              <div className="form-error show" role="alert" style={{ textAlign: 'center', marginBottom: '8px' }}>
                {apiError}
              </div>
            )}
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <span className="spinner"></span> : 'Daftar Sekarang'}
            </button>
          </form>

          <div className="auth-footer">
            Sudah punya akun? <Link to="/login">Masuk di sini</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
