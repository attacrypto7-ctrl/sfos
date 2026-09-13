import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { adminListUsersApi } from '../services/plantService';

/**
 * NotificationPanel
 *
 * Dropdown panel notifikasi real — bukan toast statis.
 * Data diambil dari:
 *   1. plants (context) — tanaman status 'warning'  → alert perlu perhatian
 *   2. plants (context) — tanaman dengan lastUpdate  → update penyiraman terbaru
 *   3. adminListUsersApi('pending')                  → pending approval (admin only)
 *
 * Props:
 *   open       {boolean}   — controlled dari parent (Layout)
 *   closing    {boolean}   — panel sedang fade-out, tetap ter-render dulu
 *   onClose    {function}  — dipanggil saat kursor keluar / tutup panel
 */
export default function NotificationPanel({ open, closing = false, onClose }) {
  const { plants, user } = useApp();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';

  // Pending approvals — hanya di-fetch kalau role admin dan panel dibuka
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    if (!isAdmin) return;
    setPendingLoading(true);
    try {
      const data = await adminListUsersApi('pending');
      setPendingUsers(data);
    } catch {
      setPendingUsers([]);
    } finally {
      setPendingLoading(false);
    }
  }, [isAdmin]);

// Fetch pending saat panel pertama dibuka
  useEffect(() => {
    if (open && isAdmin) {
      fetchPending();
    }
  }, [open, isAdmin, fetchPending]);

  // ── Bangun daftar notifikasi dari data real ──────────────────

  /** 1. Tanaman yang butuh perhatian */
  const warningPlants = plants.filter((p) => p.status === 'warning');

  /** 2. Update penyiraman terbaru — tanaman yang punya lastUpdate,
   *     diurutkan dari paling baru, maks 3 item */
  const recentUpdates = [...plants]
    .filter((p) => p.lastUpdate !== null && p.lastUpdate !== undefined)
    .sort((a, b) => (a.lastUpdate ?? Infinity) - (b.lastUpdate ?? Infinity))
    .slice(0, 3);

  /** Total badge count — apa yang perlu tindakan user */
  const totalCount = warningPlants.length + (isAdmin ? pendingUsers.length : 0);

  const formatLastUpdate = (minutes) => {
    if (minutes === undefined || minutes === null) return '';
    if (minutes < 60) return `${minutes} menit lalu`;
    const h = Math.floor(minutes / 60);
    return `${h} jam lalu`;
  };

  const isEmpty =
    warningPlants.length === 0 &&
    recentUpdates.length === 0 &&
    (!isAdmin || (!pendingLoading && pendingUsers.length === 0));

  // Saat dalam mode fade-out (closing), panel tetap di-render agar transisi
  // keluar terlihat — jadi hanya unmount penuh setelah animasi selesai.
  if (!open && !closing) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: 0,
        width: '340px',
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 200,
        overflow: 'hidden',
        /* Animasi masuk: fade-in + slide-down tipis (200ms ease-out).
           Saat closing: transisi CSS menghaluskan fade-out keluar. */
        opacity: closing ? 0 : 1,
        transform: closing ? 'translateY(-6px)' : 'none',
        transition: 'opacity 200ms ease-out, transform 200ms ease-out',
        animation: closing ? 'none' : 'notifDropIn 200ms ease-out',
      }}
      role="dialog"
      aria-label="Panel notifikasi"
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px 12px',
        borderBottom: '1px solid var(--color-border-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', color: 'var(--color-text)' }}>
            Notifikasi
          </span>
          {totalCount > 0 && (
            <span style={{
              background: 'var(--color-danger)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: 'var(--radius-full)',
              padding: '1px 7px',
              lineHeight: '18px',
              minWidth: '18px',
              textAlign: 'center',
            }}>
              {totalCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-muted)', padding: '2px',
            borderRadius: 'var(--radius-sm)', display: 'flex',
          }}
          aria-label="Tutup panel notifikasi"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Body — scrollable */}
      <div style={{ maxHeight: '420px', overflowY: 'auto' }}>

        {/* ── Empty State ── */}
        {isEmpty && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '36px 24px', gap: '10px',
            color: 'var(--color-text-muted)',
          }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'var(--color-primary-pale)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <p style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-sub)', margin: 0 }}>
              Belum ada notifikasi
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: 0, textAlign: 'center' }}>
              Notifikasi akan muncul saat ada tanaman yang butuh perhatian atau aktivitas baru.
            </p>
          </div>
        )}

        {/* ── Bagian 1: Tanaman Butuh Perhatian ── */}
        {warningPlants.length > 0 && (
          <section>
            <div style={{
              padding: '8px 16px 4px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Perlu Perhatian
            </div>
            {warningPlants.map((plant) => (
              <button
                key={plant.id}
                onClick={() => { navigate(`/plant-detail?id=${plant.id}`); onClose(); }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  width: '100%', padding: '10px 16px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-warning-pale)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                {/* Ikon warning */}
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--color-warning-pale)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2.5">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                    {plant.name} butuh perhatian
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    {plant.moisture !== null && plant.moisture !== undefined
                      ? `Kelembaban: ${plant.moisture}% (min ${plant.moistureMin}%, maks ${plant.moistureMax}%)`
                      : 'Periksa kondisi tanaman'}
                  </p>
                </div>
                {/* Dot indikator merah */}
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--color-warning)', flexShrink: 0, marginTop: '5px',
                }} />
              </button>
            ))}
          </section>
        )}

        {/* Separator */}
        {warningPlants.length > 0 && (recentUpdates.length > 0 || (isAdmin && pendingUsers.length > 0)) && (
          <div style={{ height: '1px', background: 'var(--color-border-soft)', margin: '2px 0' }} />
        )}

        {/* ── Bagian 2: Update Penyiraman Terbaru ── */}
        {recentUpdates.length > 0 && (
          <section>
            <div style={{
              padding: '8px 16px 4px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Update Terbaru
            </div>
            {recentUpdates.map((plant) => (
              <button
                key={plant.id}
                onClick={() => { navigate(`/plant-detail?id=${plant.id}`); onClose(); }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  width: '100%', padding: '10px 16px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-primary-ghost)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                {/* Ikon tetes air */}
                <div style={{
                  width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--color-primary-pale)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                    {plant.name} diperbarui
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    {plant.moisture !== null && plant.moisture !== undefined
                      ? `Kelembaban: ${plant.moisture}%`
                      : 'Belum ada data sensor'}
                    {plant.lastUpdate !== null && plant.lastUpdate !== undefined
                      ? ` · ${formatLastUpdate(plant.lastUpdate)}`
                      : ''}
                  </p>
                </div>
              </button>
            ))}
          </section>
        )}

        {/* Separator */}
        {recentUpdates.length > 0 && isAdmin && pendingUsers.length > 0 && (
          <div style={{ height: '1px', background: 'var(--color-border-soft)', margin: '2px 0' }} />
        )}

        {/* ── Bagian 3: Pending Approval (admin only) ── */}
        {isAdmin && (
          <>
            {pendingLoading && (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
              </div>
            )}
            {!pendingLoading && pendingUsers.length > 0 && (
              <section>
                <div style={{
                  padding: '8px 16px 4px',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Menunggu Persetujuan
                </div>
                {pendingUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { navigate('/admin/approval'); onClose(); }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                      width: '100%', padding: '10px 16px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-info-pale)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    {/* Avatar inisial */}
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                      background: 'var(--color-info-pale)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700, color: 'var(--color-info)',
                    }}>
                      {(u.name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 2px', fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                        {u.name} mendaftar
                      </p>
                      <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {u.email} · Menunggu persetujuan
                      </p>
                    </div>
                    {/* Dot indikator biru */}
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: 'var(--color-info)', flexShrink: 0, marginTop: '5px',
                    }} />
                  </button>
                ))}
              </section>
            )}
          </>
        )}
      </div>

      {/* Footer — link ke halaman relevan */}
      {!isEmpty && (
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--color-border-soft)',
          display: 'flex', gap: '8px', justifyContent: 'flex-end',
        }}>
          {warningPlants.length > 0 && (
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => { navigate('/garden'); onClose(); }}
            >
              Lihat Tanaman →
            </button>
          )}
          {isAdmin && pendingUsers.length > 0 && (
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => { navigate('/admin/approval'); onClose(); }}
            >
              Kelola Akun →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
