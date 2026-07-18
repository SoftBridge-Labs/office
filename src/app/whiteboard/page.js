'use client';

import { useState, useEffect, useRef } from 'react';
import TopNav from '@/app/components/TopNav';
import AppDisabled from '@/app/components/AppDisabled';
import { api } from '@/lib/api';
import { jsPDF } from 'jspdf';
import pptxgen from 'pptxgenjs';
import styles from '../page.module.css';

export default function WhiteboardPage() {
  const [userProfile, setUserProfile] = useState(null);
  const canvasRef = useRef(null);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState('pencil'); // 'pencil' | 'rectangle' | 'circle'
  const [appDisabled, setAppDisabled] = useState(false);
  const [slides, setSlides] = useState([null]); // array of data URLs
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const containerRef = useRef(null);
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
      // Fill background white only if no slide data exists
      if (!slides[currentSlideIndex]) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = slides[currentSlideIndex];
      }
    }
  }, [currentSlideIndex]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(lastX.current, lastY.current);
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.stroke();

    lastX.current = x;
    lastY.current = y;
  };


  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveCurrentSlide();
  };

  const saveCurrentSlide = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 1.0);
    setSlides(prev => {
      const newSlides = [...prev];
      newSlides[currentSlideIndex] = dataUrl;
      return newSlides;
    });
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    saveCurrentSlide();
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
    saveCurrentSlide();
  };

  const handleAddSlide = () => {
    saveCurrentSlide();
    setSlides(prev => [...prev, null]);
    setCurrentSlideIndex(slides.length);
  };

  const handleNextSlide = () => {
    saveCurrentSlide();
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrevSlide = () => {
    saveCurrentSlide();
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const exportPDF = () => {
    saveCurrentSlide(); // Ensure latest changes are saved to state
    setTimeout(() => {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvasRef.current.width, canvasRef.current.height]
      });

      slides.forEach((slideData, idx) => {
        const data = slideData || canvasRef.current.toDataURL('image/jpeg', 1.0); // fallback if null
        if (idx > 0) doc.addPage();
        doc.addImage(data, 'JPEG', 0, 0, canvasRef.current.width, canvasRef.current.height);
      });
      doc.save('Whiteboard_Export.pdf');
    }, 100);
  };

  const exportPPT = () => {
    saveCurrentSlide();
    setTimeout(() => {
      const pres = new pptxgen();
      slides.forEach((slideData) => {
        const slide = pres.addSlide();
        const data = slideData || canvasRef.current.toDataURL('image/jpeg', 1.0);
        slide.addImage({ data: data, x: 0, y: 0, w: '100%', h: '100%' });
      });
      pres.writeFile({ fileName: 'Whiteboard_Export.pptx' });
    }, 100);
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
        <header className={styles.header} style={{ marginBottom: '1rem' }}>
          <h2 className={styles.pageTitle}>Whiteboard & Sketch</h2>
        </header>

        {/* Canvas container with floating toolbar */}
        <div ref={containerRef} style={{ position: 'relative', background: '#ffffff', borderRadius: '24px', border: '1px solid rgba(226, 232, 240, 0.8)', overflow: 'hidden', cursor: 'crosshair', boxShadow: '0 12px 40px rgba(0,0,0,0.06)', minHeight: '500px' }}>
          
          {/* Floating Toolbar */}
          <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)', padding: '0.5rem 1rem', borderRadius: '100px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.8)', zIndex: 10 }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRight: '1px solid rgba(0,0,0,0.1)', paddingRight: '1rem' }}>
              <input 
                type="color" 
                value={color} 
                onChange={e => setColor(e.target.value)} 
                style={{ width: '28px', height: '28px', border: 'none', borderRadius: '50%', cursor: 'pointer', outline: 'none', padding: 0, background: 'transparent' }} 
              />
              <select 
                value={brushSize} 
                onChange={e => setBrushSize(parseInt(e.target.value))}
                style={{ padding: '0.3rem 0.5rem', borderRadius: '8px', border: 'none', background: 'rgba(0,0,0,0.04)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', fontWeight: 600, color: '#334155' }}
              >
                <option value="2">2px</option>
                <option value="4">4px</option>
                <option value="8">8px</option>
                <option value="16">16px</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                onClick={() => setTool('pencil')}
                className={`tool-btn ${tool === 'pencil' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>edit</span>
              </button>
              <button 
                onClick={() => setTool('rectangle')}
                className={`tool-btn ${tool === 'rectangle' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>rectangle</span>
              </button>
              <button 
                onClick={() => setTool('circle')}
                className={`tool-btn ${tool === 'circle' ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>circle</span>
              </button>
            </div>

            <div style={{ borderLeft: '1px solid rgba(0,0,0,0.1)', paddingLeft: '1rem' }}>
              <button 
                onClick={clearCanvas}
                className="clear-btn"
                style={{ padding: '0.4rem 1rem', background: 'linear-gradient(135deg, #fee2e2, #fecaca)', color: '#dc2626', border: 'none', borderRadius: '20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)', transition: 'all 0.2s' }}
              >
                Clear
              </button>
            </div>

            {/* Presentation Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid rgba(0,0,0,0.1)', paddingLeft: '1rem' }}>
              <button onClick={handlePrevSlide} disabled={currentSlideIndex === 0} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: currentSlideIndex === 0 ? 'not-allowed' : 'pointer', color: currentSlideIndex === 0 ? '#cbd5e1' : '#475569' }}>
                <span className="material-symbols-outlined">navigate_before</span>
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Slide {currentSlideIndex + 1}/{slides.length}</span>
              <button onClick={handleNextSlide} disabled={currentSlideIndex === slides.length - 1} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: currentSlideIndex === slides.length - 1 ? 'not-allowed' : 'pointer', color: currentSlideIndex === slides.length - 1 ? '#cbd5e1' : '#475569' }}>
                <span className="material-symbols-outlined">navigate_next</span>
              </button>
              <button onClick={handleAddSlide} style={{ padding: '4px', background: '#f1f5f9', borderRadius: '4px', border: 'none', cursor: 'pointer', color: '#0f172a', display: 'flex' }} title="Add Slide">
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', borderLeft: '1px solid rgba(0,0,0,0.1)', paddingLeft: '1rem' }}>
              <button onClick={exportPDF} style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>PDF</button>
              <button onClick={exportPPT} style={{ padding: '6px 12px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>PPT</button>
              <button onClick={toggleFullScreen} style={{ padding: '4px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex' }} title="Full Screen">
                <span className="material-symbols-outlined">fullscreen</span>
              </button>
            </div>
          </div>

          <canvas 
            ref={canvasRef}
            style={{ display: 'block', touchAction: 'none', width: '100%', height: '100%' }}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
        
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '1.25rem', textAlign: 'center', fontWeight: 500 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem', verticalAlign: 'middle', marginRight: '4px', color: '#3b82f6' }}>info</span>
          Choose Pencil to sketch freehand, or Rect / Circle to place shape stamps by clicking anywhere on the board.
        </p>

        <style>{`
          .tool-btn {
            padding: 0.4rem;
            border: none;
            borderRadius: 50%;
            cursor: pointer;
            background: transparent;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            border-radius: 50%;
            width: 36px;
            height: 36px;
          }
          .tool-btn:hover {
            background: rgba(0,0,0,0.05);
            color: #0f172a;
          }
          .tool-btn.active {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          }
          .clear-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(220, 38, 38, 0.2) !important;
          }
          .clear-btn:active {
            transform: translateY(0);
          }
        `}</style>
      </main>
    </div>
  );
}
