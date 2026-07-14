'use client';

import { useState, useEffect, useRef } from 'react';
import TopNav from '@/app/components/TopNav';
import AppDisabled from '@/app/components/AppDisabled';
import { api } from '@/lib/api';
import styles from '../page.module.css';

export default function WhiteboardPage() {
  const [userProfile, setUserProfile] = useState(null);
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState('pencil'); // 'pencil' | 'rectangle' | 'circle'
  const [appDisabled, setAppDisabled] = useState(false);
  const isDrawing = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localUser = localStorage.getItem('sb_user');
      if (localUser) {
        try { setUserProfile(JSON.parse(localUser)); } catch (e) {}
      }
    }
    
    // Check if whiteboard is enabled
    api.getWhiteboards().catch(e => {
      if (e.message?.toLowerCase().includes('disabled') || e.status === 403) setAppDisabled(true);
    }).then(res => {
      if (res && (res.status === 403 || res.message?.toLowerCase().includes('disabled'))) setAppDisabled(true);
    });

    // Initialize canvas sizing
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 500;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // Fill background white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pencil') {
      isDrawing.current = true;
      lastX.current = x;
      lastY.current = y;
    } else {
      drawShape(x, y);
    }
  };

  const draw = (e) => {
    if (!isDrawing.current || tool !== 'pencil') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX.current, lastY.current);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.stroke();

    lastX.current = x;
    lastY.current = y;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const drawShape = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'transparent';
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;

    if (tool === 'rectangle') {
      ctx.strokeRect(x - 50, y - 30, 100, 60);
    } else if (tool === 'circle') {
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  if (appDisabled) {
    return (
      <div className={styles.container}>
        <TopNav userProfile={userProfile} isLoggedOut={!userProfile} />
        <AppDisabled appName="Whiteboard" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TopNav userProfile={userProfile} isLoggedOut={!userProfile} />
      
      <main className={styles.mainPanel}>
        <header className={styles.header}>
          <h2 className={styles.pageTitle}>Whiteboard & Sketch</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            
            {/* Color picker */}
            <input 
              type="color" 
              value={color} 
              onChange={e => setColor(e.target.value)} 
              style={{ width: '32px', height: '32px', border: 'none', borderRadius: '50%', cursor: 'pointer', outline: 'none' }} 
            />

            {/* Brush Size selector */}
            <select 
              value={brushSize} 
              onChange={e => setBrushSize(parseInt(e.target.value))}
              style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: '#ffffff', fontSize: '0.85rem' }}
            >
              <option value="2">2px (Fine)</option>
              <option value="4">4px (Medium)</option>
              <option value="8">8px (Thick)</option>
              <option value="16">16px (Bold)</option>
            </select>

            {/* Tools Selector */}
            <div style={{ display: 'flex', background: '#f5f5f3', padding: '2px', borderRadius: '8px' }}>
              <button 
                onClick={() => setTool('pencil')}
                style={{ padding: '0.4rem 0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', background: tool === 'pencil' ? 'var(--text-main)' : 'transparent', color: tool === 'pencil' ? '#fff' : 'var(--text-main)' }}
              >
                Pencil
              </button>
              <button 
                onClick={() => setTool('rectangle')}
                style={{ padding: '0.4rem 0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', background: tool === 'rectangle' ? 'var(--text-main)' : 'transparent', color: tool === 'rectangle' ? '#fff' : 'var(--text-main)' }}
              >
                Rect
              </button>
              <button 
                onClick={() => setTool('circle')}
                style={{ padding: '0.4rem 0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', background: tool === 'circle' ? 'var(--text-main)' : 'transparent', color: tool === 'circle' ? '#fff' : 'var(--text-main)' }}
              >
                Circle
              </button>
            </div>

            <button 
              onClick={clearCanvas}
              style={{ padding: '0.45rem 1rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Clear Board
            </button>
          </div>
        </header>

        {/* Canvas container */}
        <div style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid var(--border-subtle)', overflow: 'hidden', cursor: 'crosshair', boxShadow: '0 8px 30px rgba(0,0,0,0.02)' }}>
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
        
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
          * Choose Pencil to sketch freehand, or Rect / Circle to place shape stamps by clicking anywhere on the board.
        </p>
      </main>
    </div>
  );
}
