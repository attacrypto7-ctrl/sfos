import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import CameraCaptureModal from '../components/CameraCaptureModal';
import {
  fetchHistory,
  fetchPhotosHistoryApi,
  analyzePlantPhotoApi,
} from '../services/plantService';
import '../css/app.css';

export default function HistoryPage() {
  const { plants, showToast } = useApp();

  const [activeTab, setActiveTab] = useState('irrigation'); // 'irrigation' | 'photos'
  const [selectedPlantId, setSelectedPlantId] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [logs, setLogs] = useState([]);
  const [photosHistory, setPhotosHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(false);

  // Live Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [targetPlantForCamera, setTargetPlantForCamera] = useState('');
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [selectedAnalysisDetail, setSelectedAnalysisDetail] = useState(null);

  // Ambil riwayat penyiraman
  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory(selectedPlantId, selectedType);
      setLogs(data);
    } catch (err) {
      showToast('Gagal memuat riwayat penyiraman', 'error');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Ambil riwayat foto & diagnosa AI
  const loadPhotosHistory = async () => {
    setPhotosLoading(true);
    try {
      const data = await fetchPhotosHistoryApi(selectedPlantId);
      setPhotosHistory(data || []);
    } catch (err) {
      showToast('Gagal memuat riwayat foto tanaman', 'error');
      setPhotosHistory([]);
    } finally {
      setPhotosLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'irrigation') {
      loadHistory();
    } else {
      loadPhotosHistory();
    }
  }, [selectedPlantId, selectedType, activeTab]);

  const totalCount = logs.length;
  const autoCount = logs.filter((l) => l.type === 'auto').length;
  const manualCount = logs.filter((l) => l.type === 'manual').length;

  const totalPhotosCount = photosHistory.length;
  const aiAnalysesCount = photosHistory.filter((p) => p.isAnalysis).length;

  const handleExport = () => {
    showToast('Fitur ekspor akan hadir dalam pembaruan berikutnya 🚀', 'warning');
  };

  const handleReset = () => {
    setSelectedPlantId('all');
    setSelectedType('all');
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const formatFullDate = (isoStr) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupLogsByDate = (logList) => {
    const groups = {};
    logList.forEach((log) => {
      const dateStr = new Date(log.time).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(log);
    });
    return groups;
  };

  const handleCameraCapture = async (file) => {
    const plantId = (targetPlantForCamera && targetPlantForCamera !== 'all')
      ? targetPlantForCamera
      : (selectedPlantId !== 'all' ? selectedPlantId : plants[0]?.id);

    if (!plantId) {
      showToast('Belum ada tanaman terdaftar. Tambahkan tanaman terlebih dahulu.', 'warning');
      return;
    }

    setAnalyzingPhoto(true);
    showToast('🔍 Mengirim foto & menganalisis dengan AI...', 'info');

    try {
      const res = await analyzePlantPhotoApi(plantId, file);
      setSelectedAnalysisDetail({
        photoUrl: res.photo?.photo_url,
        hasil: res.hasil,
        status: res.status,
        analyzedAt: new Date().toISOString(),
      });
      showToast('✅ Analisis AI selesai & foto tersimpan!', 'success');
      loadPhotosHistory();
    } catch (err) {
      showToast(err.message || 'Gagal menganalisis foto tanaman.', 'error');
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const grouped = groupLogsByDate(logs);

  return (
    <Layout title="Riwayat &amp; Log Kebun">
      {/* Header Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', background: 'var(--color-surface, #F6FAF8)', padding: '4px', borderRadius: '14px', border: '1px solid var(--color-border, #E2E8F0)' }}>
          <button
            onClick={() => setActiveTab('irrigation')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'irrigation' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'irrigation' ? 'var(--color-primary, #1D9E75)' : 'var(--color-text-sub)',
              fontWeight: 700,
              boxShadow: activeTab === 'irrigation' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              borderRadius: '10px',
              padding: '8px 16px',
            }}
          >
            💧 Riwayat Penyiraman ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'photos' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'photos' ? '#9333EA' : 'var(--color-text-sub)',
              fontWeight: 700,
              boxShadow: activeTab === 'photos' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
              borderRadius: '10px',
              padding: '8px 16px',
            }}
          >
            📸 Foto &amp; Diagnosa AI ({totalPhotosCount})
          </button>
        </div>

        <button
          onClick={() => {
            setTargetPlantForCamera(selectedPlantId !== 'all' ? selectedPlantId : (plants[0]?.id || ''));
            setIsCameraOpen(true);
          }}
          className="btn btn-sm"
          style={{
            background: 'linear-gradient(135deg, #7E22CE, #9333EA)',
            color: '#fff',
            fontWeight: 700,
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(147, 51, 234, 0.25)',
          }}
        >
          📷 Buka Kamera / Foto Baru
        </button>
      </div>

      {/* ── Tab 1: Riwayat Penyiraman ── */}
      {activeTab === 'irrigation' && (
        <>
          {/* Stats Row */}
          <div className="summary-grid" style={{ marginBottom: 'var(--space-6)' }} role="region" aria-label="Statistik penyiraman">
            <div className="summary-card">
              <div className="summary-icon blue" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div>
                <div className="summary-count">{totalCount}</div>
                <div className="summary-label">Total Siram</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon green" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.07 4.93a10 10 0 1 1-14.14 0" />
                </svg>
              </div>
              <div>
                <div className="summary-count">{autoCount}</div>
                <div className="summary-label">Siram Otomatis</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon blue" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <div>
                <div className="summary-count">{manualCount}</div>
                <div className="summary-label">Siram Manual</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="history-filters" role="search" aria-label="Filter riwayat">
            <div className="filter-group">
              <label className="filter-label" htmlFor="filter-plant">Tanaman</label>
              <select
                className="form-input form-select"
                id="filter-plant"
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(e.target.value)}
                aria-label="Pilih tanaman"
              >
                <option value="all">Semua Tanaman</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label" htmlFor="filter-type">Jenis Penyiraman</label>
              <select
                className="form-input form-select"
                id="filter-type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                aria-label="Pilih jenis penyiraman"
              >
                <option value="all">Semua</option>
                <option value="auto">Otomatis</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div className="filter-actions">
              <button className="btn btn-ghost btn-sm" onClick={handleReset} aria-label="Reset semua filter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
                </svg>
                Reset
              </button>
              <button className="btn btn-secondary btn-sm" onClick={handleExport} aria-label="Ekspor data riwayat" style={{ marginLeft: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Ekspor
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="timeline" id="history-timeline" aria-live="polite" role="region" aria-label="Timeline riwayat penyiraman">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
                <span className="spinner" style={{ width: '28px', height: '28px', borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}></span>
              </div>
            ) : totalCount === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h3>Belum ada riwayat penyiraman</h3>
                <p>Riwayat penyiraman otomatis dan manual akan tercatat rapi di sini.</p>
              </div>
            ) : (
              Object.entries(grouped).map(([date, items]) => (
                <div className="timeline-day" key={date}>
                  <div className="timeline-day-header">{date}</div>
                  <div className="timeline-items">
                    {items.map((log) => {
                      const isAuto = log.type === 'auto';
                      return (
                        <div className="timeline-item" key={log.id}>
                          {/* Photo thumbnail or icon */}
                          {log.plantPhoto ? (
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                flexShrink: 0,
                                border: '1.5px solid rgba(29,158,117,0.2)',
                              }}
                            >
                              <img src={log.plantPhoto} alt={log.plantName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ) : (
                            <div className={`timeline-icon ${isAuto ? 'auto' : 'manual'}`}>
                              {isAuto ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="3" />
                                  <path d="M19.07 4.93a10 10 0 1 1-14.14 0" />
                                </svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                                </svg>
                              )}
                            </div>
                          )}

                          <div className="timeline-info">
                            <div className="timeline-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{log.plantEmoji}</span>
                              <strong>{log.plantName}</strong>
                            </div>
                            <div className="timeline-desc">
                              {isAuto ? 'Disiram Otomatis' : `Disiram Manual${log.by ? ` oleh ${log.by}` : ''}`}
                              {log.before != null && log.after != null
                                ? <> &middot; Kelembaban: <strong>{log.before}%</strong> &rarr; <strong>{log.after}%</strong></>
                                : null}
                            </div>
                          </div>
                          <div className="timeline-meta">
                            <span className={`badge ${isAuto ? 'badge-green' : 'badge-blue'}`}>
                              {isAuto ? 'Otomatis' : 'Manual'}
                            </span>
                            <span className="timeline-time">{formatDateTime(log.time)}</span>
                            {log.duration != null && <span className="timeline-duration">{log.duration} menit</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── Tab 2: Galeri Foto & Diagnosa AI ── */}
      {activeTab === 'photos' && (
        <div>
          {/* Stats Bar */}
          <div className="summary-grid" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="summary-card">
              <div className="summary-icon blue">
                <span style={{ fontSize: '20px' }}>📸</span>
              </div>
              <div>
                <div className="summary-count">{totalPhotosCount}</div>
                <div className="summary-label">Total Foto Tersimpan</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon green">
                <span style={{ fontSize: '20px' }}>✨</span>
              </div>
              <div>
                <div className="summary-count">{aiAnalysesCount}</div>
                <div className="summary-label">Diagnosa AI Selesai</div>
              </div>
            </div>
          </div>

          {/* Plant Filter */}
          <div className="history-filters" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="filter-group">
              <label className="filter-label" htmlFor="filter-plant-photo">Filter Tanaman</label>
              <select
                className="form-input form-select"
                id="filter-plant-photo"
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(e.target.value)}
              >
                <option value="all">Semua Tanaman</option>
                {plants.map((p) => (
                  <option key={p.id} value={p.id}>{p.emoji || '🌱'} {p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {photosLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
              <span className="spinner" style={{ width: '28px', height: '28px' }}></span>
            </div>
          ) : photosHistory.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <span style={{ fontSize: '32px' }}>📷</span>
              </div>
              <h3>Belum ada foto tanaman yang diunggah</h3>
              <p>Ambil foto tanaman lewat kamera web untuk memantau visual dan mendapatkan diagnosa penyakit AI.</p>
              <button
                className="btn btn-primary btn-sm mt-3"
                onClick={() => {
                  setTargetPlantForCamera(plants[0]?.id || '');
                  setIsCameraOpen(true);
                }}
              >
                📷 Buka Kamera Sekarang
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {photosHistory.map((item) => {
                const statusColor = item.analysis?.status === 'sehat'
                  ? '#1D9E75'
                  : item.analysis?.status === 'terindikasi_penyakit'
                  ? '#EF4444'
                  : '#F59E0B';
                const statusLabel = item.analysis?.status === 'sehat'
                  ? '✅ Kondisi Sehat'
                  : item.analysis?.status === 'terindikasi_penyakit'
                  ? '⚠️ Terindikasi Penyakit'
                  : item.analysis?.status === 'perlu_perhatian'
                  ? '⚡ Perlu Perhatian'
                  : '📷 Foto Lapangan';

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--color-white, #FFFFFF)',
                      border: '1px solid var(--color-border, #E2E8F0)',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ position: 'relative', height: '200px', background: '#F1F5F9' }}>
                      <img
                        src={item.photoUrl}
                        alt={`Foto ${item.plantName}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        <span
                          style={{
                            background: item.isAnalysis ? statusColor : 'rgba(0,0,0,0.7)',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <div style={{ position: 'absolute', bottom: '10px', left: '12px', background: 'rgba(0,0,0,0.6)', padding: '3px 8px', borderRadius: '6px', color: '#fff', fontSize: '11px' }}>
                        {item.plantEmoji} {item.plantName}
                      </div>
                    </div>

                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', margin: '0 0 8px' }}>
                          📅 {formatFullDate(item.createdAt)}
                        </p>
                        {item.note && (
                          <p style={{ fontSize: '13px', color: 'var(--color-text)', fontStyle: 'italic', marginBottom: '10px' }}>
                            &ldquo;{item.note}&rdquo;
                          </p>
                        )}
                        {item.analysis && (
                          <div
                            style={{
                              background: 'var(--color-surface, #F6FAF8)',
                              padding: '10px 12px',
                              borderRadius: '10px',
                              fontSize: '12px',
                              lineHeight: 1.55,
                              color: 'var(--color-text)',
                              borderLeft: `3px solid ${statusColor}`,
                              maxHeight: '100px',
                              overflowY: 'auto',
                            }}
                          >
                            {item.analysis.hasil_analisis}
                          </div>
                        )}
                      </div>

                      {item.analysis && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ alignSelf: 'flex-start', marginTop: '12px', padding: '4px 0', color: 'var(--color-primary)', fontSize: '12px', fontWeight: 600 }}
                          onClick={() => setSelectedAnalysisDetail({
                            photoUrl: item.photoUrl,
                            hasil: item.analysis.hasil_analisis,
                            status: item.analysis.status,
                            analyzedAt: item.analysis.analyzed_at,
                            plantName: item.plantName,
                          })}
                        >
                          Baca Rekomendasi Lengkap &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Detail Diagnosa AI ── */}
      {selectedAnalysisDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 1500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedAnalysisDetail(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                🌿 Diagnosa AI {selectedAnalysisDetail.plantName ? `&mdash; ${selectedAnalysisDetail.plantName}` : ''}
              </h3>
              <button
                onClick={() => setSelectedAnalysisDetail(null)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748B' }}
              >
                &times;
              </button>
            </div>

            {selectedAnalysisDetail.photoUrl && (
              <div style={{ width: '100%', height: '220px', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px', background: '#F1F5F9' }}>
                <img src={selectedAnalysisDetail.photoUrl} alt="Foto Diagnosa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#fff',
                  background: selectedAnalysisDetail.status === 'sehat'
                    ? '#1D9E75'
                    : selectedAnalysisDetail.status === 'terindikasi_penyakit'
                    ? '#EF4444'
                    : '#F59E0B',
                }}
              >
                {selectedAnalysisDetail.status === 'sehat'
                  ? 'Kondisi Sehat'
                  : selectedAnalysisDetail.status === 'terindikasi_penyakit'
                  ? 'Terindikasi Penyakit / Hama'
                  : 'Perlu Perhatian Khusus'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {formatFullDate(selectedAnalysisDetail.analyzedAt)}
              </span>
            </div>

            <div
              style={{
                background: 'var(--color-surface, #F6FAF8)',
                padding: '16px',
                borderRadius: '16px',
                fontSize: '13.5px',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                marginBottom: '20px',
                border: '1px solid rgba(29,158,117,0.15)',
              }}
            >
              {selectedAnalysisDetail.hasil}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setSelectedAnalysisDetail(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Live Camera Modal ── */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handleCameraCapture}
        title="Kamera Live &amp; Analisa AI"
        subtitle="Arahkan kamera ke tanaman untuk menyimpan foto dan mendapatkan diagnosa penyakit AI"
        confirmLabel="Simpan &amp; Analisa AI"
      />
    </Layout>
  );
}

