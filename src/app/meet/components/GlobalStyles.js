import React from 'react';

export default function GlobalStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; font-family: 'Inter', -apple-system, sans-serif; }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

      @keyframes floatUp {
        0% { opacity: 0; transform: translateY(16px) scale(0.9); }
        10% { opacity: 1; transform: translateY(0) scale(1); }
        85% { opacity: 1; }
        100% { opacity: 0; transform: translateY(-60px) scale(0.95); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes modalIn {
        from { opacity: 0; transform: scale(0.94) translateY(12px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      @keyframes audioBar {
        0%, 100% { transform: scaleY(0.5); }
        50% { transform: scaleY(1.5); }
      }

      .meet-control-btn {
        transition: all 0.18s cubic-bezier(.4,0,.2,1);
      }
      .meet-control-btn:hover {
        transform: scale(1.1);
      }
    `}</style>
  );
}
