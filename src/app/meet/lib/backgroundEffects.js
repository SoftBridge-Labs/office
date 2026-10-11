'use client';

let segmenterScriptPromise;

function loadSegmenterScript() {
  if (typeof window !== 'undefined' && window.SelfieSegmentation) return Promise.resolve();
  if (!segmenterScriptPromise) {
    segmenterScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return segmenterScriptPromise;
}

const PRESET_BACKGROUNDS = {
  office: '/backgrounds/Office.png',
  garden: '/backgrounds/Garden.png',
  home: '/backgrounds/Home.png',
  sea: '/backgrounds/Sea.png',
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) return reject(new Error('No image source provided'));
    const img = new Image();
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load background image: ${src}`));
    img.src = src;
    if (img.complete && img.naturalWidth > 0) {
      resolve(img);
    }
  });
}

function drawCover(ctx, img, targetWidth, targetHeight) {
  const imgWidth = img.naturalWidth || img.width;
  const imgHeight = img.naturalHeight || img.height;
  if (!imgWidth || !imgHeight) {
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    return;
  }

  const targetRatio = targetWidth / targetHeight;
  const imgRatio = imgWidth / imgHeight;
  let sWidth, sHeight, sx, sy;

  if (imgRatio > targetRatio) {
    sHeight = imgHeight;
    sWidth = imgHeight * targetRatio;
    sx = (imgWidth - sWidth) / 2;
    sy = 0;
  } else {
    sWidth = imgWidth;
    sHeight = imgWidth / targetRatio;
    sx = 0;
    sy = (imgHeight - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
}

export async function createBackgroundEffectStream(sourceStream, effect) {
  if (typeof window === 'undefined' || !sourceStream?.getVideoTracks().length || effect === 'none') {
    return { stream: sourceStream, stop: () => {} };
  }

  const video = document.createElement('video');
  video.srcObject = sourceStream;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  try {
    await video.play();
  } catch {
    // Autoplay policy or video play interrupted
  }

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const context = canvas.getContext('2d');
  const foregroundCanvas = document.createElement('canvas');
  foregroundCanvas.width = canvas.width;
  foregroundCanvas.height = canvas.height;
  const foregroundContext = foregroundCanvas.getContext('2d');

  await loadSegmenterScript();
  let resolveMask;
  const segmenter = new window.SelfieSegmentation({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
  });
  segmenter.setOptions({ modelSelection: 1 });
  segmenter.onResults(results => resolveMask?.(results.segmentationMask));

  const outputStream = canvas.captureStream(24);
  const sourceAudio = sourceStream.getAudioTracks()[0];
  if (sourceAudio) outputStream.addTrack(sourceAudio.clone());

  let stopped = false;
  let frameId = null;
  let processing = false;
  let lastFrame = 0;

  // Resolve effect string if it is an ID or preset
  let resolvedEffect = effect;
  if (typeof effect === 'string' && effect !== 'none' && effect !== 'blur') {
    if (PRESET_BACKGROUNDS[effect]) {
      resolvedEffect = PRESET_BACKGROUNDS[effect];
    } else if (effect.startsWith('custom-')) {
      try {
        const stored = JSON.parse(localStorage.getItem('sb_meet_backgrounds') || '[]');
        const found = stored.find(b => b.id === effect);
        if (found?.effect) resolvedEffect = found.effect;
      } catch {}
    }
  }

  let backgroundImage = null;
  const isImageEffect = Boolean(
    resolvedEffect &&
    resolvedEffect !== 'none' &&
    resolvedEffect !== 'blur' &&
    (
      resolvedEffect.startsWith('/') ||
      resolvedEffect.startsWith('data:image/') ||
      resolvedEffect.startsWith('blob:') ||
      resolvedEffect.startsWith('http://') ||
      resolvedEffect.startsWith('https://') ||
      /\.(png|jpe?g|webp|svg|gif)($|\?)/i.test(resolvedEffect)
    )
  );

  if (isImageEffect) {
    try {
      backgroundImage = await loadImage(resolvedEffect);
    } catch (err) {
      console.warn('[Meet] Failed to load background image:', err);
    }
  }

  const render = async timestamp => {
    if (stopped) return;
    frameId = requestAnimationFrame(render);
    if (processing || timestamp - lastFrame < 66 || video.readyState < 2) return;
    processing = true;
    lastFrame = timestamp;

    try {
      const mask = await new Promise(resolve => {
        resolveMask = resolve;
        segmenter.send({ image: video });
      });

      context.save();
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (effect === 'blur') {
        context.filter = 'blur(16px)';
        context.drawImage(video, -16, -16, canvas.width + 32, canvas.height + 32);
      } else if (backgroundImage) {
        // Draw image keeping natural cover aspect ratio
        drawCover(context, backgroundImage, canvas.width, canvas.height);
      } else {
        // Graceful dark studio gradient if loading or fallback
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1e293b');
        gradient.addColorStop(1, '#0f172a');
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.restore();

      foregroundContext.clearRect(0, 0, canvas.width, canvas.height);
      foregroundContext.drawImage(video, 0, 0, canvas.width, canvas.height);
      foregroundContext.globalCompositeOperation = 'destination-in';
      foregroundContext.drawImage(mask, 0, 0, canvas.width, canvas.height);
      foregroundContext.globalCompositeOperation = 'source-over';
      context.drawImage(foregroundCanvas, 0, 0);
    } catch (error) {
      console.warn('[Meet] Background effect frame failed:', error);
    } finally {
      processing = false;
    }
  };

  frameId = requestAnimationFrame(render);

  return {
    stream: outputStream,
    stop: () => {
      stopped = true;
      if (frameId) cancelAnimationFrame(frameId);
      segmenter.close();
      video.pause();
      video.srcObject = null;
      outputStream.getTracks().forEach(track => track.stop());
    },
  };
}
