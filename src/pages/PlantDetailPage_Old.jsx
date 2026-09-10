import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import PhotoUploadModal from '../components/PhotoUploadModal';
import {
  fetchPlantById,
  waterPlantApi,
  toggleAutoWaterApi,
  fetchPlantChartHistory,
} from '../services/plantService';
import '../css/app.css';

export default function PlantDetailPage() {
  const { showToast, user } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const plantId = query.get('id');

  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState('daily');
  const [chartData, setChartData] = useState(null);
  const [chartLoading, setChartLoading] = useState(false);
  const [watering, setWatering] = useState(false);
  const [waterMsg, setWaterMsg] = useState('');
  const canvasRef = useRef(null);

  // Photo States
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Load photos from backend
  const loadPhotos = async () => {
    if (!plantId) return;
    setPhotosLoading(true);
    try {
      const { images } = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/plants/${plantId}/images`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tmk_token')}`,
        },
      }).then(r => r.json());
      setPhotos(images || []);
    } catch (err) {
      console.error('Gagal load foto tanaman:', err.message);
    } finally {
      setPhotosLoading(false);
    }
  };

  // Handle photo upload (auto-assign to this plant)
  const handlePhotoUpload = async (uploadData) => {
    if (!plantId) return;
    setUploadingPhoto(true);
    try {
      const { uploadPlantImageApi } = await import('../services/plantService');
      await uploadPlantImageApi(plantId, uploadData.imageBase64, uploadData.caption);
      showToast('✅ Foto berhasil diunggah ke tanaman ini', 'success');
      await loadPhotos();
      setShowPhotoUploadModal(false);
    } catch (err) {
      showToast(err.message || 'Gagal mengunggah foto', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Load data tanaman dari API
  const loadPlant = async () => {
    if (!plantId) {
      navigate('/dashboard');
      return;
    }
    try {
      const data = await fetchPlantById(plantId);
      setPlant(data);
    } catch (err) {
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Load chart data
  const loadChartData = async () => {
    if (!plantId) return;
    setChartLoading(true);
    try {
      const data = await fetchPlantChartHistory(plantId, chartMode);
      setChartData(data);
    } catch (err) {
      console.error('Gagal load chart:', err.message);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    loadPlant();
    loadPhotos();
  }, [plantId]);

  // Polling setiap 60 detik untuk refresh data sensor real
  useEffect(() => {
    if (!plantId) return;
    const interval = setInterval(() => {
      loadPlant();
    }, 60000);
    return () => clearInterval(interval);
  }, [plantId]);

  // Load chart ketika chartMode berubah
  useEffect(() => {
    loadChartData();
  }, [plantId, chartMode]);

  // Render chart ketika data chart tersedia
  useEffect(() => {
    if (chartData && canvasRef.current) {
      drawChart(chartData.values, chartData.labels);
    }
  }, [chartData, plant]);

  if (loading) {
    return (
      <Layout title="Detail Tanaman">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <span className="spinner" style={{ width: '32px', height: '32px', borderColor: 'var(--color-border)', borderTopColor: 'var(--color-primary)' }}></span>
        </div>
      </Layout>
    );
  }

  if (!plant) return null;

  const hasMoisture = plant.moisture !== null && plant.moisture !== undefined;
  const moistureDisplay = hasMoisture ? plant.moisture : '--';

  function getMoistureColor(pct, min, max) {
    if (pct === null || pct === undefined) return 'var(--color-text-muted, #9BB5AC)';
    if (pct < min) return 'var(--color-warning)';
    if (pct > max) return 'var(--color-info)';
    return 'var(--color-primary)';
  }

  const mColor = getMoistureColor(plant.moisture, plant.moistureMin, plant.moistureMax);
  // isWarning: device ada tapi tidak sync > 30 menit, ATAU moisture null (belum ada data)
  const hasSynced = plant.lastUpdate !== null && plant.lastUpdate !== undefined && plant.lastUpdate < 999;
  const isWarning = !hasSynced || plant.lastUpdate > 30;

  const formatTime = (minutes) => {
    if (minutes === undefined || minutes === null || minutes >= 999) return 'Belum pernah sync';
    if (minutes < 60) return `${minutes} menit lalu`;
    const h = Math.floor(minutes / 60);
    return `${h} jam lalu`;
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatDateTime = (isoStr) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // hasDevice: apakah device record sudah terdaftar di DB (dari backend)
  // hasSynced: apakah device sudah pernah kirim data sensor
  const deviceConnected = Boolean(plant.hasDevice);
  const deviceLabel = deviceConnected
    ? (plant.deviceId || 'Terdaftar')
    : 'Belum Dipasang';
  const r = 54;
  const c = 2 * Math.PI * r;
  const dash = hasMoisture ? (plant.moisture / 100) * c : 0;

  const drawChart = (data, labels) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const W = canvas.parentElement.offsetWidth || 700;
    const H = 200;

    canvas.width = W * window.devicePixelRatio;
    canvas.height = H * window.devicePixelRatio;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, W, H);

    // Kalau tidak ada data sensor, tampilkan pesan kosong di canvas
    if (!data || data.length === 0) {
      ctx.fillStyle = '#9BB5AC';
      ctx.font = '13px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Belum ada data sensor', W / 2, H / 2);
      return;
    }

    const padL = 36, padR = 16, padT = 16, padB = 36;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const minV = 0, maxV = 100;
    const n = data.length;

    // Grid lines
    ctx.strokeStyle = '#EDF7F3';
    ctx.lineWidth = 1;
    [0, 25, 50, 75, 100].forEach((v) => {
      const y = padT + chartH - ((v - minV) / (maxV - minV)) * chartH;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.fillStyle = '#9BB5AC';
      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(v + '%', padL - 6, y + 4);
    });

    // Threshold zone
    const thMin = padT + chartH - ((plant.moistureMin - minV) / (maxV - minV)) * chartH;
    const thMax = padT + chartH - ((plant.moistureMax - minV) / (maxV - minV)) * chartH;
    ctx.fillStyle = 'rgba(29,158,117,0.05)';
    ctx.fillRect(padL, thMax, chartW, thMin - thMax);

    // Points
    const pts = data.map((v, i) => ({
      x: padL + (i / (n - 1)) * chartW,
      y: padT + chartH - ((v - minV) / (maxV - minV)) * chartH,
    }));

    // Area fill gradient
    const grad = ctx.createLinearGradient(0, padT, 0, H);
    grad.addColorStop(0, 'rgba(29,158,117,0.18)');
    grad.addColorStop(1, 'rgba(29,158,117,0)');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, H - padB);
    pts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[n - 1].x, H - padB);
    ctx.fillStyle = grad;
    ctx.fill();

    // Smooth spline line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1].x + pts[i].x) / 2;
      ctx.bezierCurveTo(cpx, pts[i - 1].y, cpx, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = '#1D9E75';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Render nodes
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#1D9E75';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    });

    // Draw Labels
    ctx.fillStyle = '#9BB5AC';
    ctx.font = '10px Plus Jakarta Sans, sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((lbl, i) => {
      ctx.fillText(lbl, pts[i].x, H - padB + 18);
    });
  };

  const handleWaterNow = async () => {
    if (watering) return;
    setWatering(true);
    setWaterMsg('Perintah terkirim. Tanamanmu akan disiram sebentar lagi.');
    try {
      await waterPlantApi(plant.id);
      showToast(`💧 ${plant.name} sedang disiram`, 'success');
      // Refresh data setelah 3 detik untuk lihat update
      setTimeout(async () => {
        await loadPlant();
        setWaterMsg('');
        setWatering(false);
        showToast(`✅ ${plant.name} berhasil disiram`, 'success');
      }, 3000);
    } catch (err) {
      showToast(err.message || 'Gagal mengirim perintah siram', 'error');
      setWaterMsg('');
      setWatering(false);
    }
  };

  const handleAutoWaterToggle = async (e) => {
    const enabled = e.target.checked;
    try {
      await toggleAutoWaterApi(plant.id, enabled);
      setPlant((prev) => ({ ...prev, autoWater: enabled }));
      showToast(
        enabled ? '🤖 Siram otomatis diaktifkan' : '⏸️ Siram otomatis dinonaktifkan',
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Gagal mengubah mode siram', 'error');
    }
  };

  const hasDocPhoto = photos.some((p) => !p.is_analysis_photo);

  return (
    <Layout title="Detail Tanaman">
      {/* Hidden file inputs */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={analyzeInputRef}
        onChange={handleAnalyzeFileSelected}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        accept="image/*"
        ref={docInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setPhotoDocFile(file);
            setPhotoDocPreview(URL.createObjectURL(file));
          }
        }}
        style={{ display: 'none' }}
      />

      {/* Banner Rekomendasi Foto Tanaman */}
      {!hasDocPhoto && !bannerDismissed && (
        <div
          className="plant-doc-banner"
          style={{
            background: 'linear-gradient(135deg, rgba(29,158,117,0.12), rgba(168,85,247,0.08))',
            border: '1.5px dashed var(--color-primary, #1D9E75)',
            borderRadius: 'var(--radius-lg, 16px)',
            padding: '16px 20px',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🌿</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-text, #1A2B25)', fontSize: '14px' }}>
                Tanaman ini belum punya foto asli kebun
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--color-text-sub, #4D6B60)' }}>
                Tambahkan foto &amp; catatan kondisi pohon untuk melengkapi riwayat memori kebunmu.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowPhotoDocModal(true)}
              style={{ borderRadius: '9999px', fontSize: '13px' }}
            >
              + Tambah Foto Sekarang
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setBannerDismissed(true)}
              style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}
            >
              Nanti Saja
            </button>
          </div>
        </div>
      )}

      {/* Detail Header Card */}
      <div className="detail-header-card" role="region" aria-label="Info tanaman">
        <div className="detail-plant-info">
          <div className="detail-plant-icon" id="plant-emoji" aria-hidden="true">
            {plant.emoji}
          </div>
          <div>
            <h2 className="detail-plant-name">{plant.name}</h2>
            <div className="detail-plant-meta">
              <span className="detail-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>{plant.type}</span>
              </span>
              <span className="detail-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>Sejak {formatDate(plant.startDate)}</span>
              </span>
              <span className="detail-meta-item">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
                <span style={{ color: deviceConnected ? 'inherit' : 'var(--color-text-muted)' }}>
                  {deviceLabel}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="detail-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Tombol Analisa Kesehatan AI */}
          <button
            className="btn"
            style={{
              background: 'linear-gradient(135deg, #7E22CE, #9333EA)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              boxShadow: '0 4px 14px rgba(147, 51, 234, 0.3)',
            }}
            onClick={() => {
              setCameraPurpose('analyze');
              setIsCameraOpen(true);
            }}
            disabled={analyzing}
            aria-label="Buka kamera live untuk analisa kesehatan tanaman dengan AI"
          >
            {analyzing ? (
              <>
                <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}></span>
                Menganalisis AI...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Buka Kamera / Analisa AI
              </>
            )}
          </button>

          {/* Tombol Siram Sekarang */}
          <button
            className={`btn btn-primary flex items-center gap-2 btn-water-now ${watering ? 'watering' : ''}`}
            onClick={handleWaterNow}
            disabled={watering}
            aria-label="Siram tanaman sekarang"
          >
            {watering ? (
              <>
                <span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'var(--color-primary)' }}></span>
                Menyiram...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
                Siram Sekarang
              </>
            )}
          </button>
          {waterMsg && <p className="text-xs text-muted" style={{ color: 'var(--color-primary)', width: '100%' }} aria-live="polite">{waterMsg}</p>}
        </div>
      </div>

      {/* Detail Grid */}
      <div className="detail-grid">
        {/* Left Columns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          
          {/* Gauge */}
          <div className="moisture-gauge-section" role="region" aria-label="Kelembaban saat ini">
            <h3 className="text-lg text-bold mb-4">Kelembaban Saat Ini</h3>
            <div className="gauge-big pulse-breathe" style={{ position: 'relative' }}>
              <div className="sonar-ring" style={{ inset: '-10px', opacity: 0.35 }}></div>
              <div className="sonar-ring" style={{ inset: '-10px', opacity: 0.2, animationDelay: '1.2s' }}></div>
              <svg id="gauge-svg" width="128" height="128" viewBox="0 0 128 128" aria-hidden="true">
                <circle cx="64" cy="64" r={r} fill="none" stroke="#EDF7F3" strokeWidth="10" />
                <circle
                  cx="64"
                  cy="64"
                  r={r}
                  fill="none"
                  stroke={mColor}
                  strokeWidth="10"
                  strokeDasharray={`${dash} ${c}`}
                  strokeDashoffset={c * 0.25}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }}
                />
              </svg>
              <div className="gauge-center-text">
                <div className="gauge-pct" aria-label="Kelembaban saat ini">
                  {hasMoisture ? `${plant.moisture}%` : '--'}
                </div>
                <div className="gauge-sub">Kelembaban</div>
              </div>
            </div>
            <div className="gauge-stats" role="list" aria-label="Statistik kelembaban">
              <div className="gauge-stat" role="listitem">
                <div className="gauge-stat-val">{hasMoisture ? `${plant.moisture}%` : '--'}</div>
                <div className="gauge-stat-lbl">Sekarang</div>
              </div>
              <div className="gauge-stat" role="listitem">
                <div className="gauge-stat-val">{plant.moistureMin}%</div>
                <div className="gauge-stat-lbl">Min Ideal</div>
              </div>
              <div className="gauge-stat" role="listitem">
                <div className="gauge-stat-val">{plant.moistureMax}%</div>
                <div className="gauge-stat-lbl">Max Ideal</div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="chart-section" role="region" aria-label="Grafik tren kelembaban">
            <div className="chart-header">
              <h3 className="text-lg text-bold">Tren Kelembaban</h3>
              <div className="chart-tabs" role="tablist" aria-label="Pilih rentang waktu">
                <button
                  className={`chart-tab ${chartMode === 'daily' ? 'active' : ''}`}
                  onClick={() => setChartMode('daily')}
                  role="tab"
                  aria-selected={chartMode === 'daily'}
                >
                  Harian
                </button>
                <button
                  className={`chart-tab ${chartMode === 'weekly' ? 'active' : ''}`}
                  onClick={() => setChartMode('weekly')}
                  role="tab"
                  aria-selected={chartMode === 'weekly'}
                >
                  Mingguan
                </button>
              </div>
            </div>
            <div className="chart-canvas-wrap">
              {chartLoading || !chartData ? (
                <div className="chart-skeleton-line" aria-hidden="true">
                  <div className="skeleton-line" style={{ width: '92%' }}></div>
                  <div className="skeleton-line" style={{ width: '76%' }}></div>
                  <div className="skeleton-line" style={{ width: '84%' }}></div>
                  <div className="skeleton-line" style={{ width: '62%' }}></div>
                </div>
              ) : (
                <canvas id="moistureChart" ref={canvasRef} aria-label="Grafik kelembaban tanah" role="img"></canvas>
              )}
            </div>
          </div>

          {/* Log */}
          <div className="card card-flat" role="region" aria-label="Riwayat penyiraman">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-bold">Riwayat Penyiraman</h3>
              <Link to="/history" className="btn btn-ghost btn-xs">
                Lihat Semua →
              </Link>
            </div>
            <div className="history-log" id="water-log" aria-live="polite">
              {(!plant.waterLog || plant.waterLog.length === 0) ? (
                <p className="text-sm text-muted">Belum ada penyiraman.</p>
              ) : (
                plant.waterLog.slice(0, 6).map((log) => {
                  const isAuto = log.type === 'auto';
                  return (
                    <div className="log-item" key={log.id}>
                      <div className={`log-dot ${isAuto ? 'auto' : 'manual'}`}></div>
                      <div className="log-content">
                        <div className="log-title">
                          {isAuto ? 'Disiram Otomatis' : `Disiram Manual oleh ${log.by || 'Anda'}`}
                        </div>
                        <div className="log-time">
                          {formatDateTime(log.time)}
                          {log.before != null && log.after != null ? ` · ${log.before}% → ${log.after}%` : ''}
                          {log.duration != null ? ` · ${log.duration} mnt` : ''}
                        </div>
                      </div>
                      <div className="log-badge">
                        <span className={`badge ${isAuto ? 'badge-green' : 'badge-blue'} text-xs`}>
                          {isAuto ? 'Otomatis' : 'Manual'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Columns: Control Card */}
        <div>
          <div className="water-control-card" role="region" aria-label="Kontrol penyiraman">
            <div className="water-control-header">
              <h3>Kontrol Penyiraman</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                Atur penyiraman tanaman ini
              </p>
            </div>
            <div className="water-control-body">
              {/* Auto Water toggle */}
              <div className="auto-water-row" role="group" aria-labelledby="auto-water-label">
                <div className="auto-water-top">
                  <div className="auto-water-title" id="auto-water-label">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="2"
                      style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }}
                    >
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.07 4.93a10 10 0 1 1-14.14 0" />
                    </svg>
                    Siram Hingga Optimal
                  </div>
                  <label className="toggle" aria-label="Aktifkan siram hingga optimal">
                    <input type="checkbox" id="auto-water-toggle" checked={plant.autoWater} onChange={handleAutoWaterToggle} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <p className="auto-water-desc">
                  Sistem akan menyiram secara bertahap hingga kelembaban tanah mencapai kondisi ideal, lalu berhenti otomatis.
                </p>
              </div>

              {/* Manual water button */}
              <button
                className={`btn btn-water-now ${watering ? 'watering' : ''}`}
                onClick={handleWaterNow}
                disabled={watering}
                aria-label="Siram tanaman sekarang secara manual"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
                Siram Sekarang
              </button>

              <div className="divider"></div>

              {/* Device Info */}
              <div>
                <p className="text-xs text-muted text-semibold mb-2" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  Info Perangkat
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Device ID</span>
                    <span className="text-semibold" style={{ color: deviceConnected ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                      {deviceLabel}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Status</span>
                    <span className={`badge ${
                      !deviceConnected ? 'badge-yellow'
                      : !hasSynced ? 'badge-yellow'
                      : isWarning ? 'badge-yellow'
                      : 'badge-green'
                    } badge-dot text-xs`}>
                      {!deviceConnected ? 'Belum Dipasang'
                        : !hasSynced ? 'Belum Ada Data'
                        : isWarning ? 'Perlu Dicek'
                        : 'Terhubung'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Last sync</span>
                    <span className="text-semibold">
                      {!deviceConnected
                        ? '—'
                        : formatTime(plant.lastUpdate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="divider"></div>

              {/* Threshold Display */}
              <div>
                <p className="text-xs text-muted text-semibold mb-3" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>
                  Ambang Kelembaban
                </p>
                <div className="moisture-bar" style={{ height: '10px', marginBottom: 'var(--space-2)' }}>
                  <div className="moisture-fill" style={{ width: `${hasMoisture ? plant.moisture : 0}%`, background: mColor }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted">
                  <span>
                    Min: <strong className="text-primary">{plant.moistureMin}%</strong>
                  </span>
                  <span>
                    Sekarang: <strong className="text-primary">{hasMoisture ? `${plant.moisture}%` : '--'}</strong>
                  </span>
                  <span>
                    Max: <strong className="text-primary">{plant.moistureMax}%</strong>
                  </span>
                </div>
              </div>

              <button className="btn btn-outline w-full" style={{ justifyContent: 'center' }} onClick={() => navigate('/manage-plants')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Pengaturan Tanaman
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: Memori & Riwayat Foto Tanaman ── */}
      <div className="card mt-6" style={{ marginTop: 'var(--space-6)', padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 className="text-lg text-bold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📸</span> Memori &amp; Riwayat Diagnosa AI
            </h3>
            <p className="text-xs text-muted" style={{ margin: '4px 0 0' }}>
              Dokumentasi visual, catatan lapangan, dan riwayat analisis kesehatan tanaman dari waktu ke waktu.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => docInputRef.current?.click() || setShowPhotoDocModal(true)}
            >
              + Foto Lapangan
            </button>
            <button
              className="btn btn-sm"
              style={{ background: '#9333EA', color: '#fff' }}
              onClick={() => analyzeInputRef.current?.click()}
            >
              🔍 Analisa AI Baru
            </button>
          </div>
        </div>

        {photosLoading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <span className="spinner"></span>
            <p className="text-xs text-muted mt-2">Memuat memori foto...</p>
          </div>
        ) : photos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--color-surface, #F6FAF8)', borderRadius: 'var(--radius-md, 12px)' }}>
            <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>🌱</span>
            <p className="text-semibold text-sm" style={{ color: 'var(--color-text)' }}>Belum Ada Foto Tanaman</p>
            <p className="text-xs text-muted" style={{ maxWidth: '380px', margin: '4px auto 16px' }}>
              Ambil foto daun untuk didiagnosa AI atau tambahkan foto perkembangan fisik pohonmu.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-primary btn-sm" onClick={() => analyzeInputRef.current?.click()}>
                🔍 Foto &amp; Analisa AI
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => setShowPhotoDocModal(true)}>
                📸 Tambah Foto Biasa
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {photos.map((item) => {
              const isAi = item.is_analysis_photo;
              const hasAnalysis = Boolean(item.analysis);
              const statusColor = item.analysis?.status === 'sehat'
                ? '#1D9E75'
                : item.analysis?.status === 'terindikasi_penyakit'
                ? '#EF4444'
                : '#F59E0B';
              const statusLabel = item.analysis?.status === 'sehat'
                ? '✅ Sehat'
                : item.analysis?.status === 'terindikasi_penyakit'
                ? '⚠️ Terindikasi Penyakit'
                : item.analysis?.status === 'perlu_perhatian'
                ? '⚡ Perlu Perhatian'
                : 'Diagnosa AI';

              return (
                <div
                  key={item.id}
                  style={{
                    border: '1px solid var(--color-border, #E2E8F0)',
                    borderRadius: 'var(--radius-lg, 16px)',
                    overflow: 'hidden',
                    background: 'var(--color-white, #fff)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ position: 'relative', height: '180px', background: '#F1F5F9', overflow: 'hidden' }}>
                    <img
                      src={item.photo_url}
                      alt="Foto Tanaman"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                    <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                      {isAi ? (
                        <span
                          style={{
                            background: statusColor,
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          }}
                        >
                          {statusLabel}
                        </span>
                      ) : (
                        <span
                          style={{
                            background: 'rgba(0,0,0,0.65)',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: '9999px',
                          }}
                        >
                          📷 Foto Lapangan
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <p className="text-xs text-muted" style={{ marginBottom: '6px' }}>
                        {formatDateTime(item.created_at)}
                      </p>
                      {item.catatan && (
                        <p style={{ fontSize: '13px', color: 'var(--color-text)', fontStyle: 'italic', marginBottom: '8px' }}>
                          &ldquo;{item.catatan}&rdquo;
                        </p>
                      )}
                      {hasAnalysis && (
                        <div
                          style={{
                            background: 'var(--color-surface, #F6FAF8)',
                            padding: '10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: 'var(--color-text)',
                            lineHeight: 1.5,
                            maxHeight: '120px',
                            overflowY: 'auto',
                            borderLeft: `3px solid ${statusColor}`,
                          }}
                        >
                          {item.analysis.hasil_analisis}
                        </div>
                      )}
                    </div>

                    {hasAnalysis && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ alignSelf: 'flex-start', marginTop: '10px', padding: '4px 0', color: 'var(--color-primary)', fontSize: '12px' }}
                        onClick={() => setAnalysisResult({
                          photoUrl: item.photo_url,
                          hasil: item.analysis.hasil_analisis,
                          status: item.analysis.status,
                          analyzedAt: item.analysis.analyzed_at,
                        })}
                      >
                        Lihat Diagnosa Lengkap &rarr;
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal: Hasil Diagnosa AI ── */}
      {analysisResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setAnalysisResult(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>🌿</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--color-text, #1A2B25)' }}>
                  Hasil Analisa AI Tanaman
                </h3>
              </div>
              <button
                onClick={() => setAnalysisResult(null)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748B' }}
                aria-label="Tutup popup"
              >
                &times;
              </button>
            </div>

            {analysisResult.photoUrl && (
              <div style={{ width: '100%', height: '220px', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', background: '#F1F5F9' }}>
                <img src={analysisResult.photoUrl} alt="Foto yang dianalisis" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                  background: analysisResult.status === 'sehat'
                    ? '#1D9E75'
                    : analysisResult.status === 'terindikasi_penyakit'
                    ? '#EF4444'
                    : '#F59E0B',
                }}
              >
                {analysisResult.status === 'sehat'
                  ? 'Kondisi Sehat'
                  : analysisResult.status === 'terindikasi_penyakit'
                  ? 'Terindikasi Penyakit / Hama'
                  : 'Perlu Perhatian Khusus'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {formatDateTime(analysisResult.analyzedAt)}
              </span>
            </div>

            <div
              style={{
                background: 'var(--color-surface, #F6FAF8)',
                padding: '16px',
                borderRadius: '16px',
                fontSize: '14px',
                lineHeight: 1.7,
                color: 'var(--color-text, #1A2B25)',
                whiteSpace: 'pre-wrap',
                marginBottom: '20px',
                border: '1px solid rgba(29,158,117,0.15)',
              }}
            >
              {analysisResult.hasil}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setAnalysisResult(null)}
              >
                Tutup
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setAnalysisResult(null);
                  navigate('/taku');
                }}
              >
                💬 Tanya Solusi ke Taku AI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Tambah Foto Dokumentasi Lapangan ── */}
      {showPhotoDocModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowPhotoDocModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--color-text, #1A2B25)' }}>
                Tambah Foto Dokumentasi
              </h3>
              <button
                onClick={() => setShowPhotoDocModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748B' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleDocSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Pilih Foto Tanaman
                </label>
                {photoDocPreview ? (
                  <div style={{ position: 'relative', width: '100%', height: '180px', borderRadius: '12px', overflow: 'hidden', marginBottom: '8px' }}>
                    <img src={photoDocPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoDocFile(null);
                        setPhotoDocPreview(null);
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        cursor: 'pointer',
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => docInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--color-border, #CBD5E1)',
                      borderRadius: '12px',
                      padding: '30px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'var(--color-surface, #F6FAF8)',
                    }}
                  >
                    <span style={{ fontSize: '32px' }}>📷</span>
                    <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'var(--color-text-sub)' }}>
                      Klik untuk memilih foto dari galeri atau kamera
                    </p>
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Catatan Lapangan (Opsional)
                </label>
                <textarea
                  className="form-input"
                  style={{ width: '100%', minHeight: '80px', padding: '10px', fontSize: '13px' }}
                  placeholder="Contoh: Pohon ini agak miring ke barat, daun baru mulai tumbuh lebat."
                  value={photoDocCatatan}
                  onChange={(e) => setPhotoDocCatatan(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowPhotoDocModal(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={uploadingDoc || !photoDocFile}
                >
                  {uploadingDoc ? <span className="spinner"></span> : 'Simpan Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Modal: Live Camera Capture ── */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={handleLivePhotoCaptured}
        title={cameraPurpose === 'analyze' ? 'Kamera AI Diagnosa Tanaman' : 'Kamera Foto Lapangan'}
        subtitle={
          cameraPurpose === 'analyze'
            ? 'Arahkan kamera ke daun atau bagian tanaman yang ingin dianalisis'
            : 'Ambil foto kondisi terkini pohon untuk dokumentasi'
        }
        confirmLabel={cameraPurpose === 'analyze' ? 'Kirim Foto & Analisa AI' : 'Gunakan Foto Ini'}
      />
    </Layout>
  );
}
