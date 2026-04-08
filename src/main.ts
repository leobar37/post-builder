import './base.css';
import './components.css';
import { PostBuilderApp } from './app';
import { initVideoIntegration } from './video-integration';

// Extend Window interface
declare global {
  interface Window {
    app: PostBuilderApp;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new PostBuilderApp();
  initVideoIntegration();
});
