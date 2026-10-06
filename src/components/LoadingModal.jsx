import React, { useState, useEffect } from 'react';

const LoadingModal = ({ isLoading = false, progress = 0, message = 'Loading data...' }) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      // Smooth progress animation
      const timer = setTimeout(() => {
        setDisplayProgress(Math.min(progress, 99));
      }, 100);
      return () => clearTimeout(timer);
    } else if (!isLoading && displayProgress > 0) {
      // Complete animation
      setDisplayProgress(100);
      const finalTimer = setTimeout(() => {
        setDisplayProgress(0);
        setIsVisible(false);
      }, 500);
      return () => clearTimeout(finalTimer);
    }
  }, [progress, isLoading]);

  if (!isVisible && displayProgress === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        opacity: isLoading ? 1 : 0.8,
        transition: 'opacity 0.3s ease-in-out',
        pointerEvents: isLoading ? 'auto' : 'none',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px 64px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          maxWidth: '500px',
          width: '90%',
          transform: isLoading ? 'scale(1)' : 'scale(0.9)',
          opacity: isLoading ? 1 : 0.9,
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-in-out',
          animation: isLoading ? 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        }}
      >
        {/* Loading spinner */}
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              border: '4px solid #f0f0f0',
              borderTop: '4px solid #16A34A',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes popIn {
              0% {
                transform: scale(0.5);
                opacity: 0;
              }
              70% {
                transform: scale(1.05);
              }
              100% {
                transform: scale(1);
                opacity: 1;
              }
            }
          `}</style>
        </div>

        {/* Message */}
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '24px',
          letterSpacing: '-0.02em',
        }}>
          {message}
        </h2>

        {/* Progress bar */}
        <div style={{
          background: '#e5e7eb',
          height: '8px',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '16px',
        }}>
          <div
            style={{
              height: '100%',
              background: '#3F8432',
              width: `${displayProgress}%`,
              transition: 'width 0.3s ease-out',
              borderRadius: '4px',
            }}
          />
        </div>

        {/* Percentage text */}
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500',
          letterSpacing: '0.05em',
        }}>
          {displayProgress}%
        </div>

        {/* Loading tips */}
        {isLoading && (
          <div style={{
            marginTop: '24px',
            fontSize: '12px',
            color: '#9ca3af',
            lineHeight: '1.6',
            fontStyle: 'italic',
          }}>
            <p>Fetching satellite imagery, weather data, and analytics...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingModal;
