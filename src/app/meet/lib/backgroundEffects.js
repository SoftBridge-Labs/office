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

export async function createBackgroundEffectStream(sourceStream, effect) {
  if (typeof window === 'undefined' || !sourceStream?.getVideoTracks().length || effect === 'none') {
    return { stream: sourceStream, stop: () => {} };
  }

  const video = document.createElement('video');
  video.srcObject = sourceStream;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  await video.play();

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const context = canvas.getContext('2d', { alpha: false });
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
  let backgroundImage = null;
  if (effect?.startsWith('/')) {
    backgroundImage = new Image();
    backgroundImage.src = effect;
    await backgroundImage.decode();
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
      context.filter = effect === 'blur' ? 'blur(16px)' : 'none';
      if (backgroundImage) context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
      else {
        context.fillStyle = '#6f8d7b';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      if (effect === 'blur') context.drawImage(video, -16, -16, canvas.width + 32, canvas.height + 32);
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
