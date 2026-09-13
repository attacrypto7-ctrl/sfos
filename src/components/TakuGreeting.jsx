/**
 * TakuGreeting.jsx
 * AI Greeting dengan animations sync ke voice
 */

import React, { useState, useEffect } from 'react';
import { generateGreeting, speakText, stopSpeech, isSpeaking } from '../services/takuAiService';

export default function TakuGreeting({ plants = [], onComplete = () => {}, autoPlay = true }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [greetingData, setGreetingData] = useState(null);
  const [currentAnimation, setCurrentAnimation] = useState(null);
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    // Generate greeting on mount
    const data = generateGreeting(plants);
    setGreetingData(data);
    setTimeline(data.timeline);

    if (autoPlay) {
      playGreeting(data);
    }
  }, [plants, autoPlay]);

  // Track animation timeline
  useEffect(() => {
    if (!isPlaying || !timeline.length) return;

    const intervals = timeline.map((item) => {
      return setTimeout(() => {
        setCurrentAnimation(item);
      }, item.time);
    });

    return () => intervals.forEach(clearInterval);
  }, [isPlaying, timeline]);

  const playGreeting = async (data = greetingData) => {
    if (!data) return;

    setIsPlaying(true);

    await new Promise((resolve) => {
      speakText(data.text, {
        rate: 0.95,
        pitch: 1.1,
        volume: 1,
        onStart: () => console.log('🎤 Taku mulai berbicara...'),
        onEnd: () => {
          setIsPlaying(false);
          resolve();
          setTimeout(onComplete, 1000);
        },
        onError: (err) => {
          console.error('Error:', err);
          setIsPlaying(false);
          resolve();
        },
      });
    });
  };

  const handlePause = () => {
    stopSpeech();
    setIsPlaying(false);
  };

  const handleResume = () => {
    if (greetingData) {
      playGreeting();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5000,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8)',
          maxWidth: '600px',
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Taku AI Icon */}
        <div
          style={{
            fontSize: '60px',
            marginBottom: 'var(--space-4)',
            animation: isPlaying ? 'pulse 1.5s infinite' : 'none',
          }}
        >
          🤖
        </div>

        <h2 style={{ marginTop: 0, marginBottom: 'var(--space-2)', color: '#1A2B25' }}>
            Taku AI - Asisten Tanaman Anda
        </h2>

        {/* Greeting Text */}
        <div
          style={{
            fontSize: 'var(--font-size-base)',
            color: '#1A2B25',
            marginBottom: 'var(--space-6)',
            lineHeight: 1.6,
            minHeight: '100px',
            animation:
              currentAnimation?.action === 'show-greeting'
                ? 'fadeIn 0.5s ease-in-out'
                : 'none',
          }}
        >
          {greetingData?.text.substring(0, Math.min(greetingData.text.length, 150))}...
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
          {isPlaying ? (
            <button
              className="btn btn-secondary"
              onClick={handlePause}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              ⏸️ Jeda
            </button>
          ) : (
            <>
              <button
                className="btn btn-primary"
                onClick={handleResume}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                🎤 Dengarkan Laporan
              </button>
              <button
                className="btn btn-ghost"
                onClick={onComplete}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                ✕ Tutup
              </button>
            </>
          )}
        </div>

        {/* Status indicator */}
        <div style={{ marginTop: 'var(--space-4)', fontSize: '12px', color: '#9BB5AC' }}>
          {isPlaying ? '🔴 Sedang berbicara...' : '⚪ Siap'}
        </div>

        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
