import React, { useState, useRef, useEffect } from 'react';

const Icon = ({ name, size = 20, className = '', style = {}, ...props }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size, ...style }} {...props}>{name}</span>
);

export default function PingAttachment({ att, setLightboxUrl, setLightboxType }) {
  const getFilename = () => {
    return att.originalName || (att.fileName ? att.fileName.split('/').pop() : 'Attachment');
  };

  const CustomAudioPlayer = ({ url }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
  
    const togglePlay = () => {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
  
    const handleTimeUpdate = () => {
      setCurrentTime(audioRef.current.currentTime);
    };
  
    const handleLoadedMetadata = () => {
      setDuration(audioRef.current.duration);
    };
  
    const formatTime = (time) => {
      if (isNaN(time) || !isFinite(time)) return '0:00';
      const mins = Math.floor(time / 60);
      const secs = Math.floor(time % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
  
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, padding: '4px 8px' }}>
        <audio 
          ref={audioRef} 
          src={url} 
          onTimeUpdate={handleTimeUpdate} 
          onLoadedMetadata={handleLoadedMetadata} 
          onEnded={() => setIsPlaying(false)} 
        />
        <button onClick={togglePlay} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#111827' }}>
          <Icon name={isPlaying ? "pause" : "play_arrow"} size={22} />
        </button>
        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <div style={{ flex: 1, height: '4px', background: '#d1d5db', borderRadius: '2px', position: 'relative', minWidth: '40px' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: '#0ea5e9', borderRadius: '2px', width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
        </div>
        <Icon name="volume_up" size={18} style={{ color: '#4b5563', cursor: 'pointer' }} />
        <Icon name="more_vert" size={18} style={{ color: '#4b5563', cursor: 'pointer' }} />
      </div>
    );
  };

  if (att.fileType === 'image') {
    return (
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e5e7eb', cursor: 'zoom-in', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}
           onClick={() => { setLightboxUrl(att.url); setLightboxType('image'); }}>
        <img
          src={att.url}
          alt="uploaded"
          style={{ display: 'block', maxWidth: '100%', maxHeight: '300px', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(255,255,255,0.8)', padding: '4px', borderRadius: '50%', backdropFilter: 'blur(4px)' }}>
          <Icon name="zoom_in" size={16} style={{ color: '#111827', display: 'block' }} />
        </div>
      </div>
    );
  }

  if (att.fileType === 'video') {
    return (
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#000', cursor: 'zoom-in', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <video
          src={att.url}
          onClick={() => { setLightboxUrl(att.url); setLightboxType('video'); }}
          style={{ display: 'block', maxWidth: '100%', maxHeight: '300px' }}
        />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '12px', pointerEvents: 'none', backdropFilter: 'blur(4px)' }}>
          <Icon name="play_arrow" size={32} style={{ color: '#fff', display: 'block' }} />
        </div>
      </div>
    );
  }

  if (att.fileType === 'audio') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', background: '#e0f2fe', borderRadius: '28px', border: '1px solid #bae6fd', maxWidth: '340px' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(14,165,233,0.3)' }}>
          <Icon name="mic" size={22} style={{ color: '#fff' }} />
        </div>
        <CustomAudioPlayer url={att.url} />
      </div>
    );
  }

  // Generic File Fallback
  return (
    <a href={att.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', transition: 'background 0.2s, box-shadow 0.2s', cursor: 'pointer' }}
           onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)'; }}
           onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.boxShadow = 'none'; }}>
        <div style={{ width: 40, height: 40, borderRadius: '8px', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="insert_drive_file" size={24} style={{ color: '#6b7280' }} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {getFilename()}
          </div>
          {att.size && (
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {(att.size / 1024).toFixed(1)} KB
            </div>
          )}
        </div>
        <Icon name="download" size={20} style={{ color: '#9ca3af' }} />
      </div>
    </a>
  );
}
