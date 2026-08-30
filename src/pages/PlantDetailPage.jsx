import React, { useEffect, useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
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
  const [watering, setWatering] = useState(false);
  const [waterMsg, setWaterMsg] = useState('');
  const canvasRef = useRef(null);

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
    try {
      const data = await fetchPlantChartHistory(plantId, chartMode);
      setChartData(data);
    } catch (err) {
      console.error('Gagal load chart:', err.message);
    }
  };

  useEffect(() => {
    loadPlant();
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
  const isWarning = plant.lastUpdate === null || plant.lastUpdate === undefined || plant.lastUpdate > 30;

  const formatTime = (minutes) => {
    if (minutes === undefined || minutes === null) return 'Tidak diketahui';
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

  // Device dianggap "belum terpasang" kalau belum pernah kirim data (lastUpdate null)
  const deviceConnected = plant.lastUpdate !== null && plant.lastUpdate !== undefined;
  const deviceLabel = deviceConnected ? plant.deviceId : 'Belum Dipasang';
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

  return (
    <Layout title="Detail Tanaman">
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
        <div className="detail-actions">
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
          {waterMsg && <p className="text-xs text-muted" style={{ color: 'var(--color-primary)' }} aria-live="polite">{waterMsg}</p>}
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
              <canvas id="moistureChart" ref={canvasRef} aria-label="Grafik kelembaban tanah" role="img"></canvas>
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
                    <span className={`badge ${deviceConnected ? (isWarning ? 'badge-yellow' : 'badge-green') : 'badge-yellow'} badge-dot text-xs`}>
                      {!deviceConnected ? 'Belum Dipasang' : isWarning ? 'Perlu Dicek' : 'Terhubung'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Last sync</span>
                    <span className="text-semibold">
                      {plant.lastUpdate !== null && plant.lastUpdate !== undefined
                        ? formatTime(plant.lastUpdate)
                        : 'Belum pernah sync'}
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
    </Layout>
  );
}
