import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';
import { chatTakuApi, fetchChatHistoryApi } from '../services/plantService';
import '../css/app.css';

export default function TakuChatPage() {
  const { plants, showToast } = useApp();
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history when selected plant changes
  const loadHistory = async (plantId) => {
    setLoadingHistory(true);
    try {
      const history = await fetchChatHistoryApi(plantId || null);
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        // Welcome message from Taku if history is empty
        setMessages([
          {
            id: 'welcome-msg',
            role: 'assistant',
            content: 'Halo! Saya Taku, asisten AI Tanamanku. Ada yang ingin kamu tanyakan seputar kondisi tanaman, jadwal penyiraman, atau diagnosa tanamanmu hari ini?',
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error('Gagal memuat riwayat chat:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory(selectedPlantId);
  }, [selectedPlantId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = typeof customText === 'string' ? customText : inputMessage;
    if (!textToSend || !textToSend.trim() || sending) return;

    const userText = textToSend.trim();
    setInputMessage('');

    // Append user message immediately
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userText,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await chatTakuApi(userText, selectedPlantId || null);
      const aiReplyMsg = {
        id: `reply-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiReplyMsg]);
    } catch (err) {
      showToast(err.message || 'Gagal berkomunikasi dengan Taku AI', 'error');
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Maaf, terjadi gangguan saat memproses jawaban. Silakan coba kirim ulang pertanyaanmu.',
          created_at: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    'Bagaimana kondisi tanaman saya hari ini?',
    'Kapan waktu terbaik menyiram tanaman?',
    'Apa tanda tanaman kekurangan unsur hara?',
    'Bagaimana cara mencegah hama kutu daun?',
  ];

  const selectedPlant = plants.find((p) => p.id === selectedPlantId);

  return (
    <Layout title="Tanya Taku AI">
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)', minHeight: '520px' }}>
        {/* Header Bar: Context Selector */}
        <div
          style={{
            background: 'var(--color-white, #fff)',
            padding: '16px 20px',
            borderRadius: '20px 20px 0 0',
            border: '1px solid var(--color-border, #E2E8F0)',
            borderBottom: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1D9E75, #0F6E56)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 4px 12px rgba(29,158,117,0.25)',
              }}
            >
              🌿
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                Taku AI &mdash; Asisten Pertanian
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
                {selectedPlant
                  ? `Konteks Tanaman: ${selectedPlant.name} (${selectedPlant.type})`
                  : 'Konteks: Semua Tanaman di Tanamanmu'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-sub)', fontWeight: 600 }}>Pilih Tanaman:</span>
            <select
              className="form-input"
              value={selectedPlantId}
              onChange={(e) => setSelectedPlantId(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '10px', minWidth: '160px' }}
            >
              <option value="">Semua Tanaman (Umum)</option>
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.emoji || '🌱'} {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages Body */}
        <div
          style={{
            flex: 1,
            background: 'var(--color-surface, #F6FAF8)',
            border: '1px solid var(--color-border, #E2E8F0)',
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {loadingHistory ? (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--color-text-muted)' }}>
              <span className="spinner"></span>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>Memuat percakapan...</p>
            </div>
          ) : (
            messages.map((m, index) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id || index}
                  style={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '10px',
                    maxWidth: '85%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  {!isUser && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#1D9E75',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        flexShrink: 0,
                      }}
                    >
                      🌿
                    </div>
                  )}

                  <div>
                    <div
                      className={isUser ? 'bg-[#109E75] text-white' : 'bg-[#109E75] text-white'}
                      style={{
                        padding: '12px 16px',
                        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isUser ? '#109E75' : '#109E75',
                        color: '#FFFFFF',
                        border: 'none',
                        boxShadow: '0 4px 14px rgba(29,158,117,0.2)',
                        fontSize: '14px',
                        lineHeight: 1.65,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.content}
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--color-text-muted)',
                        marginTop: '4px',
                        display: 'block',
                        textAlign: isUser ? 'right' : 'left',
                        padding: '0 4px',
                      }}
                    >
                      {m.created_at ? new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {sending && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', alignSelf: 'flex-start' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#1D9E75',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                }}
              >
                🌿
              </div>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '18px 18px 18px 4px',
                  background: '#FFFFFF',
                  border: '1px solid var(--color-border, #E2E8F0)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--color-text-sub)',
                  fontSize: '13px',
                }}
              >
                <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
                Taku sedang berpikir...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div
          style={{
            background: 'var(--color-white, #fff)',
            padding: '10px 16px',
            borderLeft: '1px solid var(--color-border, #E2E8F0)',
            borderRight: '1px solid var(--color-border, #E2E8F0)',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p)}
              disabled={sending}
              style={{
                background: 'var(--color-surface, #F6FAF8)',
                border: '1px solid var(--color-border, #E2E8F0)',
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '12px',
                color: 'var(--color-text)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--color-border, #E2E8F0)')}
            >
              💬 {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          style={{
            background: 'var(--color-white, #fff)',
            padding: '14px 16px',
            borderRadius: '0 0 20px 20px',
            border: '1px solid var(--color-border, #E2E8F0)',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tanyakan apa saja ke Taku AI... (Enter untuk kirim)"
            rows={1}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--color-border, #CBD5E1)',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={sending || !inputMessage.trim()}
            className="btn btn-primary"
            style={{ borderRadius: '12px', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {sending ? (
              <span className="spinner" style={{ width: '16px', height: '16px' }}></span>
            ) : (
              <>
                <span>Kirim</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
}
