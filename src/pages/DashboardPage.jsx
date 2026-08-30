import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { waterPlantApi } from '../services/plantService';
import '../css/app.css';

export default function DashboardPage() {
  const { user, plants, showToast, loadPlants } = useApp();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const getGreeting = () => {
      const h = new Date().getHours();
      if (h < 11) return 'Selamat pagi';
      if (h < 15) return 'Selamat siang';
      if (h < 18) return 'Selamat sore';
      return 'Selamat malam';
    };
    setGreeting(getGreeting());
  }, []);

  const totalPlants = plants.length;
  const goodCount = plants.filter((p) => p.status === 'good').length;
  const warningCount = plants.filter((p) => p.status === 'warning').length;

  const handleWaterNow = async (e, plant) => {
    e.stopPropagation(); // Prevent card navigation
    try {
      await waterPlantApi(plant.id);
      showToast(`Perintah terkirim. ${plant.name} sedang disiram. 💧`, 'success');
      await loadPlants();
    } catch (err) {
      showToast(err.message || 'Gagal menyiram tanaman', 'error');
    }
  };

  const getMoistureColor = (pct, min, max) => {
    if (pct === null || pct === undefined) return 'var(--color-text-muted, #9BB5AC)';
    if (pct < min) return 'var(--color-warning)';
    if (pct > max) return 'var(--color-info)';
    return 'var(--color-primary)';
  };

  const formatTime = (minutes) => {
    if (minutes === undefined || minutes === null) return 'Belum sync';
    if (minutes < 60) return `${minutes} menit lalu`;
    const h = Math.floor(minutes / 60);
    return `${h} jam lalu`;
  };

  return (
    <Layout title="Dashboard">
      {/* Greeting */}
      <div className="greeting-section">
        <h2 className="greeting-title" id="greeting-text">
          {greeting}, {user.name.split(' ')[0]}. Begini kondisi kebunmu hari ini.
        </h2>
        <p className="greeting-sub">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid" role="region" aria-label="Ringkasan kebun">
        <div className="summary-card">
          <div className="summary-icon green" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div className="summary-count">{totalPlants}</div>
            <div className="summary-label">Total Tanaman</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon green" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <div className="summary-count">{goodCount}</div>
            <div className="summary-label">Kondisi Baik</div>
          </div>
        </div>
        <div className="summary-card">
          <div className={`summary-icon ${warningCount > 0 ? 'yellow' : 'green'}`} aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <div className="summary-count">{warningCount}</div>
            <div className="summary-label">Perlu Perhatian</div>
          </div>
        </div>
      </div>

      {/* Plants Grid Header */}
      <div className="section-header">
        <h2>Tanaman Kamu</h2>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/manage-plants')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah Tanaman
        </button>
      </div>

      {/* Grid of Plants */}
      {plants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3>Kebunmu masih kosong</h3>
          <p>Yuk tambahkan tanaman pertamamu dan biarkan Tanamanku mulai menjaganya.</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/manage-plants')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tambah Tanaman
          </button>
        </div>
      ) : (
        <div className="plants-grid" id="plants-grid" role="list" aria-label="Daftar tanaman">
          {plants.map((plant, index) => {
            const isWarning = plant.status === 'warning';
            const mColor = getMoistureColor(plant.moisture, plant.moistureMin, plant.moistureMax);
            return (
              <div
                key={plant.id}
                className="plant-card ambient-float"
                onClick={() => navigate(`/plant-detail?id=${plant.id}`)}
                role="listitem"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className={`plant-card-accent ${isWarning ? 'warning' : ''}`}></div>
                <div className="plant-card-header">
                  <div className="plant-icon">{plant.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div className="plant-name">{plant.name}</div>
                    <div className="plant-type text-xs text-muted">{plant.type}</div>
                  </div>
                  <span className={`badge ${isWarning ? 'badge-yellow' : 'badge-green'} badge-dot`}>
                    {isWarning ? 'Perlu Dicek' : 'Aktif'}
                  </span>
                </div>

                <div className="plant-moisture">
                  <div className="moisture-header">
                    <span className="moisture-label">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }}
                      >
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                      </svg>
                      Kelembaban Tanah
                    </span>
                    <span className="moisture-value" style={{ color: mColor }}>
                      {plant.moisture !== null && plant.moisture !== undefined ? `${plant.moisture}%` : '--'}
                    </span>
                  </div>
                  <div className="moisture-bar">
                    <div
                      className="moisture-fill shimmer-wrap"
                      style={{
                        width: `${plant.moisture !== null && plant.moisture !== undefined ? plant.moisture : 0}%`,
                        background: `linear-gradient(90deg, ${mColor}88, ${mColor})`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted">
                    <span>Min: {plant.moistureMin}%</span>
                    <span>Max: {plant.moistureMax}%</span>
                  </div>
                </div>

                <div className="plant-card-footer">
                  <span className="plant-last-update">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    Update: {formatTime(plant.lastUpdate)}
                  </span>
                  <div className="plant-actions">
                    <button className="btn btn-secondary btn-xs" onClick={(e) => handleWaterNow(e, plant)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                      </svg>
                      Siram
                    </button>
                    <button className="btn btn-ghost btn-xs" onClick={() => navigate(`/plant-detail?id=${plant.id}`)}>
                      Detail →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
