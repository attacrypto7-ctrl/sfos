import React, { useState, useEffect, useRef } from 'react';

export default function CameraCaptureModal({
  isOpen,
  onClose,
  onPhotoCaptured,
  title = 'Kamera Live Tanamanku',
  subtitle = 'Posisikan daun atau tanaman di dalam bingkai untuk diagnosa AI',
  confirmLabel = 'Gunakan Foto Ini & Analisa AI',
}) {
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [isStarting, setIsStarting] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileFallbackRef = useRef(null);

  // Start / restart live camera stream
  const startCamera = async (mode) => {
    setIsStarting(true);
    setCameraError('');

    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Gagal akses kamera dengan facingMode:', mode, err);
      // Fallback try without facingMode constraint (e.g. desktop webcam)
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr) {
        setCameraError(
          'Tidak dapat mengakses kamera web Anda. Pastikan izin kamera telah diberikan atau gunakan tombol unggah file.'
        );
      }
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera(facingMode);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  // Handle shutter snap
  const handleSnap = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `live_camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const previewUrl = URL.createObjectURL(blob);
          setCapturedBlob(file);
          setCapturedImage(previewUrl);

          // Stop camera while previewing
          if (stream) {
            stream.getTracks().forEach((t) => t.stop());
            setStream(null);
          }
        }
      },
      'image/jpeg',
      0.9
    );
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCapturedBlob(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (capturedBlob && onPhotoCaptured) {
      onPhotoCaptured(capturedBlob);
      handleClose();
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCapturedImage(null);
    setCapturedBlob(null);
    setCameraError('');
    onClose();
  };

  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  const handleFallbackFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setCapturedBlob(file);
      setCapturedImage(previewUrl);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#111A16',
          borderRadius: '28px',
          maxWidth: '560px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(29, 158, 117, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          color: '#FFFFFF',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#1D9E75' }}>📷</span> {title}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>{subtitle}</p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#FFFFFF',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            &times;
          </button>
        </div>

        {/* Viewfinder / Video Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '360px',
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Hasil Tangkapan Kamera"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : cameraError ? (
            <div style={{ textAlign: 'center', padding: '24px', maxWidth: '380px' }}>
              <span style={{ fontSize: '36px', display: 'block', marginBottom: '10px' }}>⚠️</span>
              <p style={{ fontSize: '13px', color: '#FCA5A5', lineHeight: 1.6, margin: '0 0 16px' }}>{cameraError}</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => fileFallbackRef.current?.click()}
                style={{ borderRadius: '9999px' }}
              >
                📁 Pilih Foto dari Perangkat
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Viewfinder Target Framing UI */}
              <div
                style={{
                  position: 'absolute',
                  inset: '30px',
                  border: '2px solid rgba(29, 158, 117, 0.5)',
                  borderRadius: '20px',
                  pointerEvents: 'none',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
                }}
              >
                {/* Corner Accents */}
                <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '20px', height: '20px', borderTop: '4px solid #1D9E75', borderLeft: '4px solid #1D9E75', borderTopLeftRadius: '16px' }} />
                <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '20px', height: '20px', borderTop: '4px solid #1D9E75', borderRight: '4px solid #1D9E75', borderTopRightRadius: '16px' }} />
                <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #1D9E75', borderLeft: '4px solid #1D9E75', borderBottomLeftRadius: '16px' }} />
                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderBottom: '4px solid #1D9E75', borderRight: '4px solid #1D9E75', borderBottomRightRadius: '16px' }} />
                
                <div style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, textAlign: 'center', fontSize: '11px', color: '#9FE1CB', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                  Posisikan Tanaman di Sini
                </div>
              </div>

              {/* Camera Switch button */}
              <button
                onClick={toggleFacingMode}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                }}
                title="Putar Kamera Depan/Belakang"
              >
                🔄
              </button>
            </>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <input
            type="file"
            accept="image/*"
            ref={fileFallbackRef}
            onChange={handleFallbackFile}
            style={{ display: 'none' }}
          />
        </div>

        {/* Modal Controls */}
        <div
          style={{
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#15221D',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {capturedImage ? (
            <div style={{ display: 'flex', width: '100%', gap: '12px', justifyContent: 'space-between' }}>
              <button
                onClick={handleRetake}
                className="btn btn-outline btn-sm"
                style={{ color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.25)', borderRadius: '9999px', padding: '8px 18px' }}
              >
                🔄 Ambil Ulang
              </button>
              <button
                onClick={handleConfirm}
                className="btn btn-primary btn-sm"
                style={{
                  borderRadius: '9999px',
                  padding: '8px 22px',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(29, 158, 117, 0.4)',
                }}
              >
                ✨ {confirmLabel}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => fileFallbackRef.current?.click()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                📁 Unggah File
              </button>

              {/* Big Shutter Button */}
              <button
                onClick={handleSnap}
                disabled={isStarting || Boolean(cameraError)}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'transparent',
                  border: '4px solid #FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  outline: 'none',
                  padding: 0,
                  transition: 'transform 0.15s ease',
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.92)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                title="Ambil Foto"
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#1D9E75',
                    boxShadow: '0 0 12px rgba(29, 158, 117, 0.6)',
                  }}
                />
              </button>

              <div style={{ width: '80px' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
