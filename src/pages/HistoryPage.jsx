import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { fetchHistory } from '../services/plantService';
import '../css/app.css';

export default function HistoryPage() {
  const { plants, showToast } = useApp();

  const [selectedPlantId, setSelectedPlantId] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ambil riwayat dari API
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

  useEffect(() => {
    loadHistory();
  }, [selectedPlantId, selectedType]);

  const totalCount = logs.length;
  const autoCount = logs.filter((l) => l.type === 'auto').length;
  const manualCount = logs.filter((l) => l.type === 'manual').length;

  const handleExport = () => {
    showToast('Fitur ekspor akan hadir dalam pembaruan berikutnya 🚀', 'warning');
  };

  const handleReset = () => {
    setSelectedPlantId('all');
    setSelectedType('all');
  };

  const formatDateTime = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const groupLogsByDate = (logList) => {
    const groups = {};
    logList.forEach((log) => {
      const dateStr = new Date(log.time).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(log);
    });
    return groups;
  };

  const grouped = groupLogsByDate(logs);

  return (
    <Layout title="Riwayat Penyiraman">
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
            <h3>Belum ada riwayat</h3>
            <p>Riwayat penyiraman akan muncul di sini setelah ada aktivitas.</p>
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
                      <div className="timeline-info">
                        <div className="timeline-title">
                          {log.plantEmoji} {log.plantName}
                        </div>
                        <div className="timeline-desc">
                          {isAuto ? 'Disiram Otomatis' : `Disiram Manual${log.by ? ` oleh ${log.by}` : ''}`}
                          · Kelembaban: <strong>{log.before}%</strong> → <strong>{log.after}%</strong>
                        </div>
                      </div>
                      <div className="timeline-meta">
                        <span className={`badge ${isAuto ? 'badge-green' : 'badge-blue'}`}>
                          {isAuto ? 'Otomatis' : 'Manual'}
                        </span>
                        <span className="timeline-time">{formatDateTime(log.time)}</span>
                        <span className="timeline-duration">{log.duration} menit</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
