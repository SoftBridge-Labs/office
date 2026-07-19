'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { io } from 'socket.io-client';

const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.NEXT_PUBLIC_API_URL) return window.__ENV__.NEXT_PUBLIC_API_URL;
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

export default function GlobalLayoutHelper() {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [dialog, setDialog] = useState(null); // { type, message, resolve }

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.alert = (msg) => {
      const event = new CustomEvent('show-custom-dialog', {
        detail: { type: 'alert', message: String(msg) }
      });
      window.dispatchEvent(event);
    };

    window.confirmAsync = (msg) => {
      return new Promise((resolve) => {
        const event = new CustomEvent('show-custom-dialog', {
          detail: { type: 'confirm', message: String(msg), resolve }
        });
        window.dispatchEvent(event);
      });
    };

    const handleDialog = (e) => {
      setDialog(e.detail);
    };

    window.addEventListener('show-custom-dialog', handleDialog);
    return () => {
      window.removeEventListener('show-custom-dialog', handleDialog);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const uid = localStorage.getItem('sb_uid');
    if (!uid) return;

    // Only establish background notification socket if we are NOT on the /ping chat page
    if (pathname.startsWith('/ping')) return;

    const url = getApiUrl();
    const bgSocket = io(`${url}/workspace/ping`, {
      auth: { token: uid },
      transports: ['websocket', 'polling']
    });

    bgSocket.on('new_message', (msg) => {
      if (msg.senderUid !== uid && msg.type !== 'system') {
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {});
        } catch (e) {}
      }
    });

    return () => {
      bgSocket.disconnect();
    };
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(sessionStorage.getItem('sb_mobile_dismissed') === 'true');
    }
  }, []);

  useEffect(() => {
    // 1. Mobile Detection
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // Show notice under 1024px
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // 2. Hash Change / Event Listener for Bottom Sheet
    const handleHashChange = () => {
      if (window.location.hash === '#startup-support') {
        setIsOpen(true);
      }
    };

    const handleOpenEvent = () => {
      setIsOpen(true);
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('open-startup-support', handleOpenEvent);
    
    // Check initial hash
    handleHashChange();

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('open-startup-support', handleOpenEvent);
    };
  }, []);

  const closeBottomSheet = () => {
    setIsOpen(false);
    if (window.location.hash === '#startup-support') {
      // Remove hash without reloading
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('sb_mobile_dismissed', 'true');
  };

  return (
    <>
      {/* Professional Mobile Suggestion Banner */}
      {isMobile && !dismissed && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#4f46e5', // Brand theme color
          color: '#ffffff',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.5rem',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>laptop_mac</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.4 }}>
              For the best experience, please use a desktop computer. Mobile apps will be available soon!
            </span>
          </div>
          <button 
            onClick={handleDismiss}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              padding: '0.3rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: '1rem',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Startup Support Bottom Sheet */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={closeBottomSheet}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '95vh',
              boxShadow: '0 -20px 25px -5px rgba(0, 0, 0, 0.1), 0 -10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderBottom: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.25rem 2rem',
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
            }}>
              <div>
                <h3 style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#0f172a'
                }}>
                  Apply for Startup Support
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.1rem' }}>
                  Provide details about your startup to apply for softbridge support program.
                </p>
              </div>
              <button 
                onClick={closeBottomSheet}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  transition: 'background-color 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            {/* Content / Iframe */}
            <div style={{ 
              padding: '1rem', 
              backgroundColor: '#f8fafc',
              flex: 1, 
              overflowY: 'auto',
              minHeight: '600px'
            }}>
              <iframe 
                src="https://forms.softbridgelabs.in/form/6a423feb203629cb06e01af7?embed=true" 
                width="100%" 
                height="600px" 
                frameBorder="0"
                style={{ borderRadius: '12px', background: '#ffffff', border: '1px solid rgba(0, 0, 0, 0.05)' }}
              />
              <div style={{ fontFamily: 'sans-serif', fontSize: '11px', color: '#666', textAlign: 'center', marginTop: '8px' }}>
                Powered by <a href="https://forms.softbridgelabs.in" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>SoftBridge Forms</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Dialog Alert / Confirm Modal */}
      {dialog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '2rem',
            width: '100%',
            maxWidth: '450px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: "'Outfit', sans-serif"
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                backgroundColor: dialog.type === 'confirm' ? '#eff6ff' : '#fef2f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: dialog.type === 'confirm' ? '#3b82f6' : '#ef4444',
                flexShrink: 0
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                  {dialog.type === 'confirm' ? 'help_outline' : 'info'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                  {dialog.type === 'confirm' ? 'Confirm Action' : 'Notification'}
                </h3>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
                  {dialog.message}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              {dialog.type === 'confirm' && (
                <button
                  onClick={() => {
                    dialog.resolve(false);
                    setDialog(null);
                  }}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => {
                  if (dialog.resolve) dialog.resolve(true);
                  setDialog(null);
                }}
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: dialog.type === 'confirm' ? '#ef4444' : '#4f46e5',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.95)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'none'}
              >
                {dialog.type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Style overrides for animations */}
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
