import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { waterPlantApi } from '../services/plantService';
import '../css/app.css';

// ── Helpers ─────────────────────────────────────────────────

function getMoistureColor(pct, min, max) {
  if (pct === null || pct === undefined) return '#9BB5AC';
  if (pct < min) return '#F5A623';
  if (pct > max) return '#3B8BF7';
  return '#1D9E75';
}

function getMoistureBg(pct, min, max) {
  if (pct === null || pct === undefined) return 'rgba(155,181,172,0.12)';
  if (pct < min) return 'rgba(245,166,35,0.1)';
  if (pct > max) return 'rgba(59,139,247,0.1)';
  return 'rgba(29,158,117,0.1)';
}

function getMoistureLabel(pct, min, max) {
  if (pct === null || pct === undefined) return 'Tidak ada data';
  if (pct < min) return 'Terlalu Kering';
  if (pct > max) return 'Terlalu Basah';
  return 'Optimal';
}

function computeHealthScore(plants) {
  if (!plants || plants.length === 0) return 0;
  let total = 0;
  for (const p of plants) {
    if (p.moisture === null || p.moisture === undefined) {
      total += 40; // no sensor data — penalized
    } else if (p.moisture < p.moistureMin) {
      // how far below min
      const gap = p.moistureMin - p.moisture;
      total += Math.max(0, 100 - gap * 3);
    } else if (p.moisture > p.moistureMax) {
      const gap = p.moisture - p.moistureMax;
      total += Math.max(0, 100 - gap * 2);
    } else {
      // in range — score based on how centred it is
      const centre = (p.moistureMin + p.moistureMax) / 2;
      const range = (p.moistureMax - p.moistureMin) / 2;
      const deviation = Math.abs(p.moisture - centre) / (range || 1);
      total += 100 - deviation * 20;
    }
  }
  return Math.round(total / plants.length);
}

function getScoreLabel(score) {
  if (score >= 85) return { text: 'Sangat Baik', color: '#1D9E75' };
  if (score >= 65) return { text: 'Baik', color: '#28B585' };
  if (score >= 45) return { text: 'Cukup', color: '#F5A623' };
  return { text: 'Perlu Perhatian', color: '#E84545' };
}

function formatTime(minutes) {
  if (minutes === null || minutes === undefined) return '–';
  if (minutes < 60) return `${minutes}m lalu`;
  return `${Math.floor(minutes / 60)}j lalu`;
}

// ── Bar Chart Canvas ─────────────────────────────────────────

function MoistureBarChart({ plants, loading }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !plants.length) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.parentElement.offsetWidth || 600;
    const H = 220;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const padL = 12, padR = 12, padT = 16, padB = 48;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;
    const n = plants.length;
    const barW = Math.min(48, (chartW / n) * 0.55);
    const gap = chartW / n;

    // Grid lines at 25, 50, 75, 100
    [0, 25, 50, 75, 100].forEach((v) => {
      const y = padT + chartH - (v / 100) * chartH;
      ctx.strokeStyle = v === 0 ? '#DCF0E9' : '#EDF7F3';
      ctx.lineWidth = v === 0 ? 1.5 : 1;
      ctx.setLineDash(v === 0 ? [] : [4, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      ctx.setLineDash([]);

      if (v > 0) {
        ctx.fillStyle = '#9BB5AC';
        ctx.font = `10px Plus Jakarta Sans, sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(v + '%', 2, y + 3);
      }
    });

    plants.forEach((plant, i) => {
      const cx = padL + gap * i + gap / 2;
      const pct = plant.moisture ?? 0;
      const barH = (pct / 100) * chartH;
      const x = cx - barW / 2;
      const y = padT + chartH - barH;
      const color = getMoistureColor(plant.moisture, plant.moistureMin, plant.moistureMax);

      // Threshold zone (min–max band)
      const yMin = padT + chartH - (plant.moistureMin / 100) * chartH;
      const yMax = padT + chartH - (plant.moistureMax / 100) * chartH;
      ctx.fillStyle = 'rgba(29,158,117,0.07)';
      ctx.fillRect(cx - barW / 2 - 6, yMax, barW + 12, yMin - yMax);

      // Bar with rounded top
      if (pct > 0) {
        const r = Math.min(6, barW / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + barW - r, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
        ctx.lineTo(x + barW, padT + chartH);
        ctx.lineTo(x, padT + chartH);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();

        // Gradient fill
        const grad = ctx.createLinearGradient(0, y, 0, padT + chartH);
        grad.addColorStop(0, color);
        grad.addColorStop(1, color + '55');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Value label on top of bar
      if (plant.moisture !== null && plant.moisture !== undefined) {
        ctx.fillStyle = color;
        ctx.font = `bold 11px Plus Jakarta Sans, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(pct + '%', cx, Math.max(padT + 12, y - 6));
      } else {
        ctx.fillStyle = '#9BB5AC';
        ctx.font = `11px Plus Jakarta Sans, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('–', cx, padT + chartH - 8);
      }

      // Emoji + name below
      ctx.font = `16px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(plant.emoji || '🌱', cx, H - padB + 20);

      ctx.fillStyle = '#3D5A50';
      ctx.font = `bold 10px Plus Jakarta Sans, sans-serif`;
      ctx.textAlign = 'center';
      const label = plant.name.length > 8 ? plant.name.slice(0, 7) + '…' : plant.name;
      ctx.fillText(label, cx, H - padB + 36);
    });
  }, [plants, loading]);

  if (loading) {
    return (
      <div className="chart-skeleton" aria-hidden="true">
        {[58, 44, 72, 52, 66, 40, 78, 47].map((h, i) => (
          <div key={i} className="skeleton-bar" style={{ height: `${h}%` }}></div>
        ))}
      </div>
    );
  }
  if (!plants.length) return null;
  return <canvas ref={canvasRef} aria-label="Bar chart perbandingan kelembaban tanaman" role="img" />;
}

// ── Health Score Gauge ────────────────────────────────────────

function HealthGauge({ score, animated }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!animated) { setDisplayed(score); return; }
    let start = 0;
    const step = score / 50;
    const timer = setInterval(() => {
      start += step;
      if (start >= score) { setDisplayed(score); clearInterval(timer); }
      else setDisplayed(Math.round(start));
    }, 16);
    return () => clearInterval(timer);
  }, [score, animated]);

  const { text, color } = getScoreLabel(score);
  const r = 52;
  const c = 2 * Math.PI * r;
  // Arc spans 270° (from 135° to 405°), offset the dash accordingly
  const arcLen = c * 0.75;
  const dash = (displayed / 100) * arcLen;
  const offset = c * 0.625; // rotate so arc starts bottom-left

  return (
    <div className="health-gauge-wrap" aria-label={`Skor kesehatan kebun ${score}`}>
      <svg width="136" height="136" viewBox="0 0 136 136" aria-hidden="true">
        {/* Background track */}
        <circle
          cx="68" cy="68" r={r}
          fill="none" stroke="#EDF7F3" strokeWidth="10"
          strokeDasharray={`${arcLen} ${c - arcLen}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <circle
          cx="68" cy="68" r={r}
          fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1), stroke 0.6s ease' }}
        />
      </svg>
      <div className="health-gauge-center">
        <div className="health-gauge-score" style={{ color }}>{displayed}</div>
        <div className="health-gauge-label">/ 100</div>
      </div>
      <div className="health-gauge-status" style={{ color }}>{text}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function GardenOverviewPage() {
  const { plants, plantsLoading, showToast, loadPlants } = useApp();
  const navigate = useNavigate();
  const [wateringId, setWateringId] = useState(null);
  const [gaugeAnimated, setGaugeAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setGaugeAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const healthScore = computeHealthScore(plants);
  const { color: scoreColor } = getScoreLabel(healthScore);

  const criticalPlants = plants.filter((p) => p.status === 'warning');
  const goodPlants = plants.filter((p) => p.status !== 'warning');

  const avgMoisture = (() => {
    const withData = plants.filter((p) => p.moisture !== null && p.moisture !== undefined);
    if (!withData.length) return null;
    return Math.round(withData.reduce((s, p) => s + p.moisture, 0) / withData.length);
  })();

  const driestPlant = plants
    .filter((p) => p.moisture !== null)
    .sort((a, b) => a.moisture - b.moisture)[0] || null;

  const lastSyncMin = (() => {
    const withSync = plants.filter((p) => p.lastUpdate !== null && p.lastUpdate !== undefined);
    if (!withSync.length) return null;
    return Math.min(...withSync.map((p) => p.lastUpdate));
  })();

  const handleWater = useCallback(async (e, plant) => {
    e.stopPropagation();
    if (wateringId) return;
    setWateringId(plant.id);
    try {
      await waterPlantApi(plant.id);
      showToast(`💧 ${plant.name} sedang disiram`, 'success');
      await loadPlants();
    } catch (err) {
      showToast(err.message || 'Gagal mengirim perintah siram', 'error');
    } finally {
      setWateringId(null);
    }
  }, [wateringId, showToast, loadPlants]);

  // ── Empty state ──
  if (plants.length === 0) {
    return (
      <Layout title="Kebun Saya">
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3>Kebunmu masih kosong</h3>
          <p>Tambahkan tanaman pertamamu untuk mulai memantau kesehatan kebun secara menyeluruh.</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/manage-plants')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tambah Tanaman
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Kebun Saya">

      {/* ── Top Row: Health Score + Stats ── */}
      <div className="garden-top-row">

        {/* Health Score Card */}
        <div className="garden-health-card">
          <div className="garden-health-header">
            <div>
              <h2 className="garden-section-title">Skor Kesehatan Kebun</h2>
              <p className="garden-section-sub">Berdasarkan {plants.length} tanaman aktif</p>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => loadPlants()}
              aria-label="Refresh data"
              title="Refresh"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </button>
          </div>
          <div className="garden-health-body">
            <HealthGauge score={healthScore} animated={gaugeAnimated} />
            <div className="garden-health-breakdown">
              <div className="garden-breakdown-item">
                <div className="garden-breakdown-dot" style={{ background: '#1D9E75' }}></div>
                <span>Optimal</span>
                <strong>{plants.filter(p => p.moisture !== null && p.moisture >= p.moistureMin && p.moisture <= p.moistureMax).length}</strong>
              </div>
              <div className="garden-breakdown-item">
                <div className="garden-breakdown-dot" style={{ background: '#F5A623' }}></div>
                <span>Perlu Dicek</span>
                <strong>{criticalPlants.length}</strong>
              </div>
              <div className="garden-breakdown-item">
                <div className="garden-breakdown-dot" style={{ background: '#9BB5AC' }}></div>
                <span>Tidak Ada Data</span>
                <strong>{plants.filter(p => p.moisture === null || p.moisture === undefined).length}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="garden-stats-col">
          <div className="garden-stat-card">
            <div className="garden-stat-icon" style={{ background: 'rgba(29,158,117,0.1)', color: '#1D9E75' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div>
              <div className="garden-stat-val">
                {avgMoisture !== null ? `${avgMoisture}%` : '–'}
              </div>
              <div className="garden-stat-lbl">Rata-rata Kelembaban</div>
            </div>
          </div>

          <div className="garden-stat-card">
            <div className="garden-stat-icon" style={{ background: 'rgba(245,166,35,0.1)', color: '#F5A623' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <div className="garden-stat-val">{criticalPlants.length}</div>
              <div className="garden-stat-lbl">Perlu Perhatian</div>
            </div>
          </div>

          <div className="garden-stat-card">
            <div className="garden-stat-icon" style={{ background: 'rgba(59,139,247,0.1)', color: '#3B8BF7' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <div>
              <div className="garden-stat-val">
                {lastSyncMin !== null ? formatTime(lastSyncMin) : '–'}
              </div>
              <div className="garden-stat-lbl">Sinkronisasi Terakhir</div>
            </div>
          </div>

          <div className="garden-stat-card">
            <div className="garden-stat-icon" style={{ background: 'rgba(29,158,117,0.1)', color: '#1D9E75' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <div className="garden-stat-val">
                {driestPlant ? (
                  <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {driestPlant.emoji} {driestPlant.name}
                  </span>
                ) : '–'}
              </div>
              <div className="garden-stat-lbl">Paling Kering</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Moisture Comparison Bar Chart ── */}
      <div className="card card-flat garden-chart-card">
        <div className="garden-section-header">
          <div>
            <h3 className="garden-section-title">Perbandingan Kelembaban</h3>
            <p className="garden-section-sub">Seluruh tanaman — zona hijau = rentang ideal masing-masing</p>
          </div>
        </div>
        <div className="garden-chart-wrap">
          <MoistureBarChart plants={plants} loading={plantsLoading} />
        </div>
      </div>

      {/* ── Critical Plants (warning only) ── */}
      {criticalPlants.length > 0 && (
        <div className="garden-critical-section">
          <div className="garden-section-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="garden-alert-dot"></div>
              <h3 className="garden-section-title" style={{ color: '#E84545' }}>
                Butuh Tindakan Segera
              </h3>
            </div>
            <span className="badge badge-red">{criticalPlants.length} tanaman</span>
          </div>
          <div className="garden-heatmap-grid">
            {criticalPlants.map((plant) => (
              <PlantHeatCard
                key={plant.id}
                plant={plant}
                urgent
                watering={wateringId === plant.id}
                onWater={(e) => handleWater(e, plant)}
                onDetail={() => navigate(`/plant-detail?id=${plant.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── All Plants Heatmap ── */}
      <div>
        <div className="garden-section-header" style={{ marginBottom: 'var(--space-4)' }}>
          <h3 className="garden-section-title">Semua Tanaman</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/manage-plants')}>
            + Tambah Tanaman
          </button>
        </div>
        <div className="garden-heatmap-grid">
          {plants.map((plant) => (
            <PlantHeatCard
              key={plant.id}
              plant={plant}
              urgent={false}
              watering={wateringId === plant.id}
              onWater={(e) => handleWater(e, plant)}
              onDetail={() => navigate(`/plant-detail?id=${plant.id}`)}
            />
          ))}
        </div>
      </div>

    </Layout>
  );
}

// ── Plant Heat Card Component ─────────────────────────────────

function PlantHeatCard({ plant, urgent, watering, onWater, onDetail }) {
  const hasMoisture = plant.moisture !== null && plant.moisture !== undefined;
  const color = getMoistureColor(plant.moisture, plant.moistureMin, plant.moistureMax);
  const bg = getMoistureBg(plant.moisture, plant.moistureMin, plant.moistureMax);
  const label = getMoistureLabel(plant.moisture, plant.moistureMin, plant.moistureMax);
  const pct = hasMoisture ? plant.moisture : 0;

  // How far into the ideal range (0–100%)
  const rangeWidth = plant.moistureMax - plant.moistureMin;
  const inRangePos = hasMoisture
    ? Math.max(0, Math.min(100, ((plant.moisture - plant.moistureMin) / (rangeWidth || 1)) * 100))
    : null;

  return (
    <div
      className={`garden-heat-card ${urgent ? 'urgent' : ''}`}
      style={{ '--card-accent': color, '--card-bg': bg }}
      onClick={onDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onDetail()}
      aria-label={`Detail ${plant.name}`}
    >
      <div className="garden-heat-top">
        <div className="garden-heat-emoji">{plant.emoji || '🌱'}</div>
        <div className="garden-heat-info">
          <div className="garden-heat-name">{plant.name}</div>
          <div className="garden-heat-type">{plant.type}</div>
        </div>
        <div className="garden-heat-badge">
          {hasMoisture ? (
            <span className="garden-heat-pct" style={{ color }}>{plant.moisture}%</span>
          ) : (
            <span className="garden-heat-pct" style={{ color: '#9BB5AC' }}>–</span>
          )}
        </div>
      </div>

      {/* Moisture range bar */}
      <div className="garden-heat-bar-wrap">
        <div className="garden-heat-bar-track">
          {/* Ideal zone highlight */}
          <div
            className="garden-heat-bar-ideal"
            style={{
              left: `${plant.moistureMin}%`,
              width: `${rangeWidth}%`,
            }}
          />
          {/* Fill */}
          <div
            className="garden-heat-bar-fill"
            style={{ width: `${pct}%`, background: color }}
          />
          {/* Needle marker */}
          {hasMoisture && (
            <div className="garden-heat-bar-needle" style={{ left: `${pct}%`, background: color }} />
          )}
        </div>
        <div className="garden-heat-bar-labels">
          <span>{plant.moistureMin}%</span>
          <span style={{ color, fontWeight: 600 }}>{label}</span>
          <span>{plant.moistureMax}%</span>
        </div>
      </div>

      {/* Footer */}
      <div className="garden-heat-footer">
        <span className="garden-heat-update">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {formatTime(plant.lastUpdate)}
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-xs garden-heat-btn-water"
            style={{ '--btn-color': color }}
            onClick={onWater}
            disabled={watering}
            aria-label={`Siram ${plant.name}`}
          >
            {watering ? (
              <span className="spinner" style={{ width: '10px', height: '10px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            )}
            Siram
          </button>
          <button
            className="btn btn-ghost btn-xs"
            onClick={(e) => { e.stopPropagation(); onDetail(); }}
            aria-label={`Lihat detail ${plant.name}`}
          >
            Detail →
          </button>
        </div>
      </div>
    </div>
  );
}
