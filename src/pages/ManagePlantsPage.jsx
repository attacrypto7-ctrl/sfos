import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Layout from '../components/Layout';
import { createPlantApi, updatePlantApi, deletePlantApi } from '../services/plantService';
import '../css/app.css';

const EMOJIS = ['🌳', '🌿', '🌱', '🍃', '🥑', '🌾', '🍋', '🥭', '🍇', '🌵', '🎋', '🌴'];

export default function ManagePlantsPage() {
  const { plants, showToast, loadPlants } = useApp();

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [emoji, setEmoji] = useState('🌳');
  const [deviceId, setDeviceId] = useState('');
  const [moistureMin, setMoistureMin] = useState(50);
  const [moistureMax, setMoistureMax] = useState(80);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !type.trim()) {
      showToast('Nama dan jenis tanaman wajib diisi', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const plantData = {
        name: name.trim(),
        type: type.trim(),
        emoji,
        deviceId: deviceId.trim() || undefined,
        moistureMin: Number(moistureMin),
        moistureMax: Number(moistureMax),
      };

      if (editingId) {
        await updatePlantApi(editingId, plantData);
        showToast(`✅ ${name} berhasil diperbarui`, 'success');
      } else {
        await createPlantApi(plantData);
        showToast(`🌱 ${name} berhasil ditambahkan!`, 'success');
      }

      await loadPlants();
      resetForm();
    } catch (err) {
      showToast(err.message || 'Terjadi kesalahan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (plant) => {
    setEditingId(plant.id);
    setName(plant.name);
    setType(plant.type);
    setEmoji(plant.emoji);
    setDeviceId(plant.lastUpdate !== null && plant.lastUpdate !== undefined ? (plant.deviceId || '') : '');
    setMoistureMin(plant.moistureMin);
    setMoistureMax(plant.moistureMax);
  };

  const handleDelete = async (plant) => {
    if (window.confirm(`Hapus ${plant.name}? Data tidak dapat dipulihkan.`)) {
      try {
        await deletePlantApi(plant.id);
        showToast(`🗑️ ${plant.name} dihapus`, 'warning');
        await loadPlants();
        if (editingId === plant.id) {
          resetForm();
        }
      } catch (err) {
        showToast(err.message || 'Gagal menghapus tanaman', 'error');
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setType('');
    setEmoji('🌳');
    setDeviceId('');
    setMoistureMin(50);
    setMoistureMax(80);
  };

  return (
    <Layout title="Manajemen Tanaman">
      <div className="manage-layout">
        
        {/* Left column: List */}
        <div role="region" aria-label="Daftar tanaman">
          <div className="section-header mb-4">
            <h2>Tanaman Terdaftar</h2>
          </div>
          <div className="plant-list-items" id="plant-list">
            {plants.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-12) var(--space-4)' }}>
                <div className="empty-state-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3>Belum ada tanaman</h3>
                <p>Tambahkan tanaman pertamamu menggunakan form di samping.</p>
              </div>
            ) : (
              plants.map((plant) => (
                <div className="plant-list-item" key={plant.id}>
                  <div className="plant-list-icon">{plant.emoji}</div>
                  <div className="plant-list-info">
                    <div className="plant-list-name">{plant.name}</div>
                    <div className="plant-list-sub">
                      {plant.type} · Threshold: {plant.moistureMin}%–{plant.moistureMax}%
                      {plant.lastUpdate !== null && plant.lastUpdate !== undefined && plant.deviceId && plant.deviceId !== '-'
                        ? ` · ${plant.deviceId}`
                        : ' · Sensor belum dipasang'}
                    </div>
                  </div>
                  <div className="plant-list-actions">
                    <button className="btn btn-secondary btn-xs" onClick={() => handleEdit(plant)}>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-xs" onClick={() => handleDelete(plant)}>
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Sticky Form */}
        <div className="form-card" role="complementary" aria-label="Form tambah atau edit tanaman">
          <div className="form-card-header">
            <h3>{editingId ? 'Edit Tanaman' : 'Tambah Tanaman Baru'}</h3>
            <p>Isi informasi tanaman dan hubungkan dengan sensor IoT.</p>
          </div>
          <div className="form-card-body">
            <form onSubmit={handleSubmit} noValidate>
              
              {/* Emoji Picker */}
              <div className="form-group">
                <label className="form-label">Ikon Tanaman</label>
                <div className="emoji-grid" role="group" aria-label="Pilih ikon tanaman">
                  {EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      className={`emoji-btn ${emoji === em ? 'selected' : ''}`}
                      onClick={() => setEmoji(em)}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="plant-name">Nama Tanaman</label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="plant-name"
                    className="form-input"
                    placeholder="cth: Durian Black Thorn #1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="plant-type">Jenis Tanaman</label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="plant-type"
                    className="form-input"
                    placeholder="cth: Durian, Manggis, Rambutan"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="device-id">ID Perangkat Sensor</label>
                <div className="input-wrapper">
                  <span className="input-icon" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="device-id"
                    className="form-input"
                    placeholder="cth: DEV-001 (opsional)"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                  />
                </div>
                <span className="text-xs text-muted">Kosongkan untuk digenerate otomatis.</span>
              </div>

              {/* Moisture range selectors */}
              <div className="form-group">
                <label className="form-label">Ambang Kelembaban Ideal</label>
                <div className="threshold-row" role="group" aria-label="Pengaturan ambang kelembaban">
                  <div className="threshold-item">
                    <div className="threshold-header">
                      <label className="form-label" htmlFor="moisture-min" style={{ margin: 0 }}>Minimum</label>
                      <span className="threshold-val" aria-live="polite">{moistureMin}%</span>
                    </div>
                    <input
                      type="range"
                      id="moisture-min"
                      min="10"
                      max="90"
                      value={moistureMin}
                      step="5"
                      onChange={(e) => setMoistureMin(e.target.value)}
                      aria-label="Kelembaban minimum"
                    />
                  </div>
                  <div className="threshold-item">
                    <div className="threshold-header">
                      <label className="form-label" htmlFor="moisture-max" style={{ margin: 0 }}>Maksimum</label>
                      <span className="threshold-val" aria-live="polite">{moistureMax}%</span>
                    </div>
                    <input
                      type="range"
                      id="moisture-max"
                      min="10"
                      max="100"
                      value={moistureMax}
                      step="5"
                      onChange={(e) => setMoistureMax(e.target.value)}
                      aria-label="Kelembaban maksimum"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center' }} disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white', width: '16px', height: '16px' }}></span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      {editingId ? 'Simpan Perubahan' : 'Tambah Tanaman'}
                    </>
                  )}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-ghost w-full" onClick={resetForm} style={{ justifyContent: 'center' }}>
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
