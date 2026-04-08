// Video Integration - Bridge between vanilla JS and React/Remotion
// This module allows the existing PostBuilderApp to trigger video previews

let videoPreviewRoot = null;

/**
 * Initialize the video preview system
 * Call this once when the app starts
 */
export function initVideoIntegration() {
  // Add video preview container to DOM if not exists
  if (!document.getElementById('videoPreviewContainer')) {
    const container = document.createElement('div');
    container.id = 'videoPreviewContainer';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      z-index: 9999;
      display: none;
      align-items: center;
      justify-content: center;
    `;

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: white;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 20px;
      cursor: pointer;
      z-index: 10000;
    `;
    closeBtn.onclick = closeVideoPreview;

    // Video container
    const videoWrapper = document.createElement('div');
    videoWrapper.id = 'videoPreviewWrapper';
    videoWrapper.style.cssText = `
      width: 405px;
      height: 720px;
      background: #000;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    `;

    // Loading state
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'videoPreviewLoading';
    loadingDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-family: Sora, sans-serif;
      text-align: center;
    `;
    loadingDiv.innerHTML = `
      <div style="width: 40px; height: 40px; border: 3px solid #F57E24; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
      <p>Cargando video...</p>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;

    container.appendChild(closeBtn);
    container.appendChild(videoWrapper);
    videoWrapper.appendChild(loadingDiv);
    document.body.appendChild(container);
  }

  // Add keyboard shortcut to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeVideoPreview();
    }
  });
}

/**
 * Show video preview with Remotion composition
 * @param {string} videoUrl - URL of the generated video from Minimax
 * @param {string} topic - Topic of the video (excel-management, member-retention, etc.)
 * @param {string} brandColor - Brand color hex code
 */
export function previewVideo(videoUrl, topic = 'excel-management', brandColor = '#F57E24') {
  const container = document.getElementById('videoPreviewContainer');
  const wrapper = document.getElementById('videoPreviewWrapper');

  if (!container || !wrapper) {
    console.error('Video preview container not found');
    return;
  }

  // Show container
  container.style.display = 'flex';

  // For now, use a simple video element
  // In a full implementation, this would mount a React/Remotion component
  wrapper.innerHTML = `
    <div style="position: relative; width: 100%; height: 100%; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);">
      <!-- Video Element -->
      <video
        src="${videoUrl}"
        style="width: 100%; height: 100%; object-fit: cover;"
        autoplay
        loop
        playsinline
      ></video>

      <!-- GymSpace Logo Overlay -->
      <div style="
        position: absolute;
        top: 24px;
        left: 24px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10;
      ">
        <div style="
          width: 36px;
          height: 36px;
          background: ${brandColor};
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M6.5 6.5h11M6.5 17.5h11M6 20v-6.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5V20M6 4v6.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V4"/>
          </svg>
        </div>
        <span style="
          color: white;
          font-family: Sora, sans-serif;
          font-size: 20px;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        ">GymSpace</span>
      </div>

      <!-- Outro Overlay -->
      <div style="
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 30%;
        background: linear-gradient(to top, ${brandColor}dd, transparent);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        padding-bottom: 40px;
        z-index: 10;
      ">
        <h2 style="
          color: white;
          font-family: Sora, sans-serif;
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 12px 0;
          text-align: center;
          padding: 0 30px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">${getTopicText(topic)}</h2>
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: white;
          color: ${brandColor};
          padding: 10px 20px;
          border-radius: 25px;
          font-family: Manrope, sans-serif;
          font-size: 14px;
          font-weight: 700;
        ">
          <span>Descarga la app</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17L17 7M17 7H7M17 7V17"/>
          </svg>
        </div>
      </div>
    </div>
  `;
}

/**
 * Get display text for topic
 */
function getTopicText(topic) {
  const texts = {
    'excel-management': 'Deja de perder dinero con Excel',
    'member-retention': 'Retén a tus socios automáticamente',
    'whatsapp-automation': 'Automatiza tu WhatsApp',
    'analytics': 'Conoce tus números en tiempo real'
  };
  return texts[topic] || 'Transforma tu gimnasio';
}

/**
 * Close video preview
 */
export function closeVideoPreview() {
  const container = document.getElementById('videoPreviewContainer');
  if (container) {
    container.style.display = 'none';
    // Stop any playing videos
    const video = container.querySelector('video');
    if (video) {
      video.pause();
      video.src = '';
    }
  }
}

/**
 * Check if video preview is currently open
 */
export function isVideoPreviewOpen() {
  const container = document.getElementById('videoPreviewContainer');
  return container && container.style.display === 'flex';
}

// Expose to window for global access
if (typeof window !== 'undefined') {
  window.previewVideo = previewVideo;
  window.closeVideoPreview = closeVideoPreview;
  window.isVideoPreviewOpen = isVideoPreviewOpen;
}
