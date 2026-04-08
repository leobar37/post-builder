// GymSpace Instagram Post Builder - Main Application (TypeScript)

import type { Post, Slide, AppState, ExportProgress, PublishResult } from './types/post.types';
import { exportService } from './services/export.service';
import { publishService } from './services/publish.service';
import { postsData, iconSVGs } from './posts-data';

export class PostBuilderApp {
  private state: AppState;
  private readonly publicationOrder: number[] = [
    1, 2, 3, 4, 5, 6, 7, 12, 8, 9, 10, 11, 13, 14, 15, 16,
  ];

  // DOM Elements cache
  private elements: Map<string, HTMLElement> = new Map();

  constructor() {
    this.state = {
      currentPostId: 1,
      currentSlide: 0,
      zoomLevel: 50,
      isGalleryView: false,
      isExporting: false,
    };

    this.init();
  }

  private init(): void {
    const publicationIds = this.getPublicationPostIds();
    if (publicationIds.length > 0 && !publicationIds.includes(this.state.currentPostId)) {
      this.state.currentPostId = publicationIds[0];
    }

    this.cacheDOM();
    this.bindEvents();
    this.renderPostsList();
    this.renderCurrentPost();
    this.updateUI();
  }

  private cacheDOM(): void {
    const selectors = [
      'postsList',
      'postContainer',
      'canvasArea',
      'galleryView',
      'galleryGrid',
      'postCounter',
      'postTitle',
      'zoomValue',
      'previewWrapper',
      'btnPrev',
      'btnNext',
      'btnZoomOut',
      'btnZoomIn',
      'btnExport',
      'btnExportAll',
      'btnPublish',
      'btnGallery',
      'exportOverlay',
      'exportStatus',
      'exportProgress',
    ];

    selectors.forEach((id) => {
      const el = document.getElementById(id);
      if (el) this.elements.set(id, el);
    });
  }

  private getElement(id: string): HTMLElement | undefined {
    return this.elements.get(id);
  }

  private bindEvents(): void {
    // Navigation
    this.getElement('btnPrev')?.addEventListener('click', () => this.prevPost());
    this.getElement('btnNext')?.addEventListener('click', () => this.nextPost());

    // Zoom
    this.getElement('btnZoomOut')?.addEventListener('click', () => this.zoomOut());
    this.getElement('btnZoomIn')?.addEventListener('click', () => this.zoomIn());

    // Export
    this.getElement('btnExport')?.addEventListener('click', () => this.exportCurrentPost());
    this.getElement('btnExportAll')?.addEventListener('click', () => this.exportAllPosts());

    // Publish
    this.getElement('btnPublish')?.addEventListener('click', () => this.publishCurrentPost());

    // Gallery toggle
    this.getElement('btnGallery')?.addEventListener('click', () => this.toggleGalleryView());

    // Keyboard navigation
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.state.isGalleryView) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (this.isCarouselPost()) {
            this.prevSlide();
          } else {
            this.prevPost();
          }
          break;
        case 'ArrowRight':
          if (this.isCarouselPost()) {
            this.nextSlide();
          } else {
            this.nextPost();
          }
          break;
        case 'Escape':
          if (this.state.isExporting) this.hideExportOverlay();
          break;
      }
    });
  }

  private isCarouselPost(): boolean {
    const post = postsData[this.state.currentPostId];
    return post?.slides !== undefined && post.slides.length > 0;
  }

  // Expose postsData for global access
  get postsData() {
    return postsData;
  }

  private getCurrentPost(): Post | undefined {
    return postsData[this.state.currentPostId];
  }

  private getPublicationPostIds(): number[] {
    return this.publicationOrder.filter((id) => Boolean(postsData[id]));
  }

  private getPublicationPosts(): Post[] {
    return this.getPublicationPostIds()
      .map((id) => postsData[id])
      .filter((post): post is Post => Boolean(post));
  }

  // Navigation methods
  private prevPost(): void {
    const publicationIds = this.getPublicationPostIds();
    const currentIndex = publicationIds.indexOf(this.state.currentPostId);
    if (currentIndex > 0) {
      this.goToPost(publicationIds[currentIndex - 1]);
    }
  }

  private nextPost(): void {
    const publicationIds = this.getPublicationPostIds();
    const currentIndex = publicationIds.indexOf(this.state.currentPostId);
    if (currentIndex >= 0 && currentIndex < publicationIds.length - 1) {
      this.goToPost(publicationIds[currentIndex + 1]);
    }
  }

  private goToPost(postId: number): void {
    if (postsData[postId] && this.getPublicationPostIds().includes(postId)) {
      this.state.currentPostId = postId;
      this.state.currentSlide = 0;
      this.renderPostsList();
      this.renderCurrentPost();
      this.updateUI();
    }
  }

  // Slide navigation
  private prevSlide(): void {
    const post = this.getCurrentPost();
    if (!post?.slides || post.slides.length === 0) return;

    this.state.currentSlide = Math.max(0, this.state.currentSlide - 1);
    this.updateSlideVisibility();
  }

  private nextSlide(): void {
    const post = this.getCurrentPost();
    if (!post?.slides || post.slides.length === 0) return;

    this.state.currentSlide = Math.min(post.slides.length - 1, this.state.currentSlide + 1);
    this.updateSlideVisibility();
  }

  private goToSlide(index: number): void {
    const post = this.getCurrentPost();
    if (!post?.slides || post.slides.length === 0) return;

    this.state.currentSlide = Math.max(0, Math.min(post.slides.length - 1, index));
    this.updateSlideVisibility();
  }

  private updateSlideVisibility(): void {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.slide-dot');

    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === this.state.currentSlide);
    });

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.state.currentSlide);
    });

    const slideCounter = document.querySelector('.slide-number');
    if (slideCounter) {
      slideCounter.textContent = `${this.state.currentSlide + 1}/${slides.length}`;
    }
  }

  // Zoom methods
  private zoomOut(): void {
    if (this.state.zoomLevel > 25) {
      this.state.zoomLevel -= 25;
      this.updateZoom();
    }
  }

  private zoomIn(): void {
    if (this.state.zoomLevel < 100) {
      this.state.zoomLevel += 25;
      this.updateZoom();
    }
  }

  private updateZoom(): void {
    const zoomValue = this.getElement('zoomValue');
    if (zoomValue) {
      zoomValue.textContent = `${this.state.zoomLevel}%`;
    }

    const previewWrapper = this.getElement('previewWrapper');
    if (previewWrapper) {
      previewWrapper.style.transform = `scale(${this.state.zoomLevel / 100})`;
    }
  }

  // Gallery view
  private toggleGalleryView(): void {
    this.state.isGalleryView = !this.state.isGalleryView;
    const galleryView = this.getElement('galleryView');
    const canvasArea = this.getElement('canvasArea');

    if (this.state.isGalleryView) {
      this.renderGallery();
      if (galleryView) galleryView.style.display = 'block';
      if (canvasArea) canvasArea.style.display = 'none';
    } else {
      if (galleryView) galleryView.style.display = 'none';
      if (canvasArea) canvasArea.style.display = 'block';
    }
  }

  // Export methods
  private async exportCurrentPost(): Promise<void> {
    const post = this.getCurrentPost();
    if (!post) return;

    this.setExporting(true);

    try {
      const totalSlides = post.slides?.length || 0;
      if (totalSlides > 1) {
        await this.exportCarouselPostAsZip(post);
      } else {
        const html = this.getHtmlForPostExport(post);
        if (!html) {
          throw new Error('No se pudo generar el HTML de exportación');
        }

        const result = await exportService.exportPost(post.id, html, 'png');
        if (!result.success) {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      this.setExporting(false);
    }
  }

  private async exportAllPosts(): Promise<void> {
    const postIds = this.getPublicationPostIds();
    const totalPosts = postIds.length;

    this.setExporting(true);
    this.showExportStatus('Preparing export...', 0, totalPosts);

    const getHtmlForPost = (postId: number): string | null => {
      const post = postsData[postId];
      if (!post) return null;
      return this.getHtmlForPostExport(post, 0);
    };

    const onProgress = (progress: ExportProgress) => {
      this.showExportStatus(
        `Exporting post ${progress.current} of ${progress.total}...`,
        progress.current,
        progress.total,
      );
    };

    try {
      const results = await exportService.exportMultiplePosts(postIds, getHtmlForPost, onProgress);

      this.showExportStatus(
        `Export complete! ${results.success} succeeded, ${results.failed} failed.`,
        totalPosts,
        totalPosts,
      );

      setTimeout(() => this.hideExportOverlay(), 2000);
    } catch (error) {
      console.error('Batch export failed:', error);
      alert('Batch export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      this.setExporting(false);
    }
  }

  private async exportCarouselPostAsZip(post: Post): Promise<void> {
    const totalSlides = post.slides?.length || 0;
    if (totalSlides <= 1) {
      throw new Error('Este post no tiene múltiples slides');
    }

    this.showExportStatus(`Exporting slide 1 of ${totalSlides}...`, 0, totalSlides);

    const files: Array<{ filename: string; blob: Blob }> = [];

    for (let slideIndex = 0; slideIndex < totalSlides; slideIndex++) {
      const html = this.getHtmlForPostExport(post, slideIndex);
      if (!html) {
        throw new Error(`No se pudo generar el HTML para el slide ${slideIndex + 1}`);
      }

      const slideFilename = `gymspace_post_${String(post.id).padStart(2, '0')}_slide_${String(
        slideIndex + 1,
      ).padStart(2, '0')}.png`;

      const result = await exportService.exportPost(post.id, html, 'png', {
        download: false,
        filename: slideFilename,
      });

      if (!result.success || !result.blob) {
        throw new Error(result.error || `No se pudo exportar el slide ${slideIndex + 1}`);
      }

      files.push({ filename: result.filename, blob: result.blob });
      this.showExportStatus(
        `Exporting slide ${slideIndex + 1} of ${totalSlides}...`,
        slideIndex + 1,
        totalSlides,
      );
    }

    const zipFilename = `gymspace_post_${String(post.id).padStart(2, '0')}_slides.zip`;
    await this.downloadZip(files, zipFilename);
    this.showExportStatus(`ZIP listo: ${zipFilename}`, totalSlides, totalSlides);
  }

  private getHtmlForPostExport(post: Post, slideIndex?: number): string | null {
    const previousSlide = this.state.currentSlide;
    const tempDiv = document.createElement('div');

    try {
      if (typeof slideIndex === 'number') {
        this.state.currentSlide = slideIndex;
      }

      tempDiv.innerHTML = this.buildPostHTML(post);
      document.body.appendChild(tempDiv);

      const postElement = tempDiv.querySelector(`#post-${post.id}`) as HTMLElement | null;
      if (!postElement) {
        return null;
      }

      return this.prepareHtmlForExport(postElement);
    } finally {
      if (tempDiv.parentNode) {
        tempDiv.parentNode.removeChild(tempDiv);
      }
      this.state.currentSlide = previousSlide;
    }
  }

  private async downloadZip(
    files: Array<{ filename: string; blob: Blob }>,
    filename: string,
  ): Promise<void> {
    const JSZipCtor = (window as Window & { JSZip?: any }).JSZip;
    if (!JSZipCtor) {
      throw new Error('JSZip no está cargado');
    }

    const zip = new JSZipCtor();
    files.forEach((file) => {
      zip.file(file.filename, file.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private prepareHtmlForExport(element: HTMLElement): string {
    const clone = element.cloneNode(true) as HTMLElement;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="/src/base.css">
        <link rel="stylesheet" href="/src/components.css">
      </head>
      <body class="export-mode" style="width: 1080px; height: 1080px; margin: 0; padding: 0; overflow: hidden;">
        <style>
          .export-mode .post-slide {
            width: 100% !important;
            height: 100% !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            transform: none !important;
          }
        </style>
        ${clone.outerHTML}
      </body>
      </html>
    `;
  }

  private getCriticalCss(): string {
    // Critical CSS inlined to ensure styles are always available
    return `
      /* CSS Variables - Use system fonts for reliable rendering */
      :root {
        --gs-orange: #F57E24;
        --gs-orange-light: #FF9144;
        --gs-orange-dark: #E56614;
        --gs-dark: #2D3C53;
        --gs-dark-light: #3D4C63;
        --gs-dark-darker: #1D2C43;
        --gs-emerald: #059669;
        --gs-emerald-light: #10B981;
        --landing-bg: #fffdf9;
        --landing-surface: #ffffff;
        --landing-surface-soft: #fff7ef;
        --landing-text: #1f2937;
        --landing-text-soft: #374151;
        --landing-text-muted: #6b7280;
        --landing-brand: #f57e24;
        --landing-brand-2: #ff9144;
        --landing-accent: #059669;
        --landing-border: rgba(245, 126, 36, 0.18);
        --landing-shadow: 0 16px 40px rgba(17, 24, 39, 0.08);
        --landing-glow: 0 0 0 1px rgba(245, 126, 36, 0.12), 0 18px 40px rgba(245, 126, 36, 0.2);
        --bg-primary: #f8f6f3;
        --bg-secondary: #fffdf9;
        --bg-card: rgba(255, 255, 255, 0.95);
        --text-primary: #1f2937;
        --text-secondary: #4b5563;
        --text-muted: #6b7280;
        --border-color: rgba(245, 126, 36, 0.15);
        --border-hover: rgba(245, 126, 36, 0.3);
        /* Use same fonts as the viewer */
        --font-display: 'Sora', sans-serif;
        --font-body: 'Manrope', sans-serif;
        --shadow-glow: 0 0 20px rgba(245, 126, 36, 0.3), 0 0 40px rgba(245, 126, 36, 0.15);
        --shadow-card: 0 16px 40px rgba(17, 24, 39, 0.08);
        --shadow-card-hover: 0 20px 50px rgba(17, 24, 39, 0.12);
      }

      /* Reset */
      *, *::before, *::after {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      /* Base */
      html, body {
        font-family: var(--font-body);
        background: var(--bg-primary);
        color: var(--text-primary);
      }

      /* Typography */
      h1, h2, h3, h4, h5, h6 {
        font-family: var(--font-display);
        font-weight: 700;
        line-height: 1.2;
      }

      /* Post Slide Container */
      .post-slide {
        width: 1080px;
        height: 1080px;
        background:
          radial-gradient(circle at 10% -20%, rgba(245, 126, 36, 0.20), transparent 45%),
          radial-gradient(circle at 95% 10%, rgba(5, 150, 105, 0.14), transparent 42%),
          linear-gradient(180deg, #fffaf4 0%, #fff 35%, #fffbf6 100%);
        border-radius: 32px;
        position: relative;
        overflow: hidden;
        box-shadow:
          0 50px 100px -20px rgba(0, 0, 0, 0.15),
          0 0 0 1px rgba(245, 126, 36, 0.1);
      }

      .post-content {
        position: relative;
        z-index: 10;
        height: 100%;
        padding: 48px 56px 52px 56px;
        display: flex;
        flex-direction: column;
      }

      .post-header {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 28px;
        flex-shrink: 0;
      }

      .post-logo {
        width: 52px;
        height: 52px;
        background: linear-gradient(135deg, var(--gs-orange) 0%, var(--gs-orange-light) 100%);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 12px 28px -6px rgba(245, 126, 36, 0.35);
      }

      .post-logo svg {
        width: 28px;
        height: 28px;
        color: white;
      }

      .post-brand {
        font-family: var(--font-display);
        font-size: 32px;
        font-weight: 700;
        color: var(--landing-text);
        letter-spacing: -0.5px;
      }

      .post-badge {
        margin-left: auto;
        font-size: 12px;
        font-weight: 700;
        color: #b45309;
        background: rgba(245, 126, 36, 0.2);
        padding: 7px 16px;
        border-radius: 9999px;
        border: 1px solid rgba(245, 126, 36, 0.35);
        text-transform: uppercase;
        letter-spacing: 0.6px;
      }

      .post-title {
        font-family: var(--font-display);
        font-size: 56px;
        font-weight: 800;
        line-height: 1.1;
        color: var(--landing-text);
        margin-bottom: 20px;
        letter-spacing: -1.5px;
      }

      .post-subtitle {
        font-size: 24px;
        color: var(--landing-text-soft);
        line-height: 1.5;
        margin-bottom: 36px;
        font-weight: 500;
      }

      .post-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 36px;
      }

      .post-stat {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92));
        border: 1px solid var(--landing-border);
        border-radius: 16px;
        padding: 24px 20px;
        text-align: center;
        box-shadow: var(--landing-shadow);
      }

      .post-stat-value {
        font-family: var(--font-display);
        font-size: 40px;
        font-weight: 800;
        color: var(--gs-orange);
        line-height: 1;
        margin-bottom: 8px;
      }

      .post-stat-label {
        font-size: 14px;
        color: var(--landing-text-muted);
        line-height: 1.4;
        font-weight: 500;
      }

      .post-features {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 36px;
      }

      .post-feature {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92));
        border: 1px solid var(--landing-border);
        border-radius: 16px;
        padding: 24px 20px;
        box-shadow: var(--landing-shadow);
      }

      .post-feature-icon {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, rgba(245, 126, 36, 0.15) 0%, rgba(245, 126, 36, 0.08) 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
        border: 1px solid rgba(245, 126, 36, 0.25);
      }

      .post-feature-icon svg {
        width: 22px;
        height: 22px;
        color: var(--gs-orange);
      }

      .post-feature-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--landing-text);
        margin-bottom: 6px;
        font-family: var(--font-display);
      }

      .post-feature-desc {
        font-size: 13px;
        color: var(--landing-text-muted);
        line-height: 1.5;
      }

      .post-cta {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: linear-gradient(135deg, var(--gs-orange) 0%, var(--gs-orange-light) 100%);
        color: white;
        font-size: 22px;
        font-weight: 700;
        padding: 22px 40px;
        border-radius: 16px;
        border: none;
        box-shadow: 0 14px 32px -6px rgba(245, 126, 36, 0.45);
      }

      .post-cta-note {
        font-size: 16px;
        color: var(--landing-text-muted);
        font-weight: 500;
      }

      .carousel-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      .carousel-slide {
        display: none;
        height: 100%;
      }

      .carousel-slide.active {
        display: flex;
        flex-direction: column;
      }

      .slide-number {
        position: absolute;
        bottom: 48px;
        right: 56px;
        font-family: var(--font-display);
        font-size: 13px;
        font-weight: 600;
        color: white;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        padding: 8px 14px;
        border-radius: 16px;
        letter-spacing: 0.5px;
        z-index: 100;
      }

      .post-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .bg-glow {
        position: absolute;
        border-radius: 50%;
        filter: blur(100px);
        opacity: 0.25;
      }

      .bg-glow-1 {
        width: 500px;
        height: 500px;
        background: var(--gs-orange);
        top: -150px;
        right: -150px;
      }

      .bg-glow-2 {
        width: 350px;
        height: 350px;
        background: var(--gs-emerald);
        bottom: 100px;
        left: -100px;
        opacity: 0.15;
      }

      .bg-grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(245, 126, 36, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(245, 126, 36, 0.03) 1px, transparent 1px);
        background-size: 50px 50px;
      }

      .floating-badge-row {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 12px;
        min-height: 0;
      }

      .floating-badge {
        background: rgba(37, 211, 102, 0.1);
        border: 1px solid rgba(37, 211, 102, 0.25);
        border-radius: 12px;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        backdrop-filter: blur(10px);
        max-width: min(360px, 100%);
      }

      .floating-badge svg {
        width: 18px;
        height: 18px;
        color: #25D366;
        flex-shrink: 0;
      }

      .floating-badge span {
        color: var(--landing-text);
        font-size: 14px;
        font-weight: 700;
        line-height: 1.2;
      }

      /* Layout utilities */
      .metrics-grid {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 0 20px;
      }

      .metric-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 250, 245, 0.9) 100%);
        border: 1px solid var(--landing-border);
        border-radius: 20px;
        padding: 28px 32px;
        display: flex;
        align-items: flex-start;
        gap: 24px;
        box-shadow: 0 4px 20px rgba(245, 126, 36, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
        position: relative;
        overflow: hidden;
      }

      .metric-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--gs-orange) 0%, var(--gs-orange-light) 100%);
      }

      .metric-number {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, var(--gs-orange) 0%, var(--gs-orange-light) 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-display);
        font-size: 20px;
        font-weight: 800;
        color: white;
        box-shadow: 0 4px 15px rgba(245, 126, 36, 0.3);
      }

      .metric-icon {
        width: 40px;
        height: 40px;
        color: var(--gs-orange);
        opacity: 0.8;
      }

      .metric-icon svg {
        width: 100%;
        height: 100%;
        stroke-width: 1.5;
      }

      .metric-card-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .metric-label {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--gs-orange);
        opacity: 0.8;
      }

      .metric-title {
        font-family: var(--font-display);
        font-size: 28px;
        font-weight: 800;
        color: var(--landing-text);
        line-height: 1.2;
      }

      .metric-desc {
        font-size: 16px;
        color: var(--landing-text-muted);
        line-height: 1.5;
        margin-top: 4px;
      }

      /* Comparison cards */
      .comparison-card {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92));
        border: 1px solid var(--landing-border);
        border-radius: 20px;
        padding: 28px;
        box-shadow: var(--landing-shadow);
      }

      .comparison-card.negative {
        border-color: rgba(239, 68, 68, 0.2);
      }

      .comparison-card.negative .comparison-title {
        color: #dc2626;
      }

      .comparison-card.positive {
        border-color: rgba(5, 150, 105, 0.2);
      }

      .comparison-card.positive .comparison-title {
        color: #059669;
      }

      .comparison-title {
        font-family: var(--font-display);
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 20px;
      }

      .comparison-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .comparison-list li {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 0;
        font-size: 20px;
        color: var(--landing-text-soft);
      }

      /* Stats Grid */
      .stats-grid-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }

      .stats-grid-card {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92));
        border: 1px solid var(--landing-border);
        border-radius: 20px;
        padding: 32px 24px;
        text-align: center;
        box-shadow: var(--landing-shadow);
      }

      .stats-grid-icon {
        width: 56px;
        height: 56px;
        margin: 0 auto 20px;
        color: var(--gs-orange);
      }

      .stats-grid-icon svg {
        width: 100%;
        height: 100%;
      }

      .stats-grid-value {
        font-size: 56px;
        font-weight: 800;
        color: var(--gs-orange);
        font-family: var(--font-display);
        margin-bottom: 10px;
        line-height: 1;
      }

      .stats-grid-label {
        font-size: 15px;
        color: var(--landing-text-muted);
        line-height: 1.4;
      }

      /* Solution Features */
      .solution-features-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
      }

      .solution-feature-card {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92));
        border: 1px solid var(--landing-border);
        border-radius: 20px;
        padding: 32px 24px;
        text-align: center;
        box-shadow: var(--landing-shadow);
      }

      .solution-feature-icon {
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, rgba(245, 126, 36, 0.15) 0%, rgba(245, 126, 36, 0.08) 100%);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 18px;
        border: 1px solid rgba(245, 126, 36, 0.25);
      }

      .solution-feature-icon svg {
        width: 30px;
        height: 30px;
        color: var(--gs-orange);
      }

      .solution-feature-title {
        font-size: 20px;
        font-weight: 700;
        color: var(--landing-text);
        margin-bottom: 10px;
        font-family: var(--font-display);
      }

      .solution-feature-desc {
        font-size: 14px;
        color: var(--landing-text-muted);
        line-height: 1.5;
      }

      /* Problem slide styles */
      .problem-warning-badge {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.05));
        border: 2px solid rgba(239, 68, 68, 0.25);
        border-radius: 50px;
        padding: 14px 28px;
        box-shadow: 0 4px 15px rgba(239, 68, 68, 0.1);
      }

      .problem-warning-icon {
        font-size: 24px;
      }

      .problem-warning-text {
        font-size: 14px;
        font-weight: 700;
        color: #dc2626;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .problem-big-stat {
        background: linear-gradient(135deg, rgba(245, 126, 36, 0.12), rgba(245, 126, 36, 0.05));
        border: 2px solid rgba(245, 126, 36, 0.25);
        border-radius: 20px;
        padding: 40px 60px;
        box-shadow: 0 8px 30px rgba(245, 126, 36, 0.15);
      }

      .problem-stat-value {
        font-size: 80px;
        font-weight: 800;
        color: var(--gs-orange);
        font-family: var(--font-display);
        line-height: 1;
        margin-bottom: 8px;
        text-shadow: 0 2px 20px rgba(245, 126, 36, 0.3);
      }

      .problem-stat-label {
        font-size: 20px;
        color: var(--landing-text-soft);
        font-weight: 500;
      }

      .problem-message {
        font-size: 22px;
        color: var(--landing-text-muted);
        font-style: italic;
        max-width: 650px;
        line-height: 1.5;
      }

      /* Two Column Layout */
      .post-two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        align-items: center;
      }
    `;
  }

  private setExporting(value: boolean): void {
    this.state.isExporting = value;
    const overlay = this.getElement('exportOverlay');
    if (overlay) {
      overlay.style.display = value ? 'flex' : 'none';
    }
  }

  private showExportStatus(message: string, current: number, total: number): void {
    const status = this.getElement('exportStatus');
    const progress = this.getElement('exportProgress');

    if (status) status.textContent = message;
    if (progress) {
      const percentage = total > 0 ? (current / total) * 100 : 0;
      progress.style.width = `${percentage}%`;
    }
  }

  private hideExportOverlay(): void {
    this.setExporting(false);
  }

  // Publish methods
  private async publishCurrentPost(): Promise<void> {
    const post = this.getCurrentPost();
    if (!post) return;

    // Get Instagram credentials
    const username = prompt('Ingresa tu usuario de Instagram:');
    if (!username) return;

    const password = prompt('Ingresa tu contraseña de Instagram:');
    if (!password) return;

    this.setExporting(true);
    this.showExportStatus('Generando imagen para Instagram...', 0, 3);

    try {
      // Generate HTML for export
      const html = this.getHtmlForPostExport(post);
      if (!html) {
        throw new Error('No se pudo generar el HTML de exportación');
      }

      this.showExportStatus('Preparando publicación...', 1, 3);

      // Build caption from description and hashtags
      const caption = this.buildCaption(post);

      console.log('[App] Publishing to Instagram...');
      console.log('[App] Username:', username);
      console.log('[App] Caption length:', caption.length);

      this.showExportStatus('Publicando en Instagram...', 2, 3);

      // Publish to Instagram
      const result: PublishResult = await publishService.publishToInstagram({
        postId: post.id,
        html,
        caption,
        username,
        password,
      });

      if (result.success) {
        this.showExportStatus('¡Publicado exitosamente!', 3, 3);
        console.log('[App] Published successfully:', result.postUrl);
        alert('¡Post publicado exitosamente en Instagram!');
      } else {
        throw new Error(result.error || 'Error al publicar');
      }

      setTimeout(() => this.hideExportOverlay(), 2000);
    } catch (error) {
      console.error('[App] Publish failed:', error);
      alert('Error al publicar: ' + (error instanceof Error ? error.message : 'Unknown error'));
      this.hideExportOverlay();
    } finally {
      this.setExporting(false);
    }
  }

  private buildCaption(post: Post): string {
    const parts: string[] = [];

    // Add description if available
    if (post.description) {
      parts.push(post.description);
    }

    // Add hashtags if available
    if (post.hashtags && post.hashtags.length > 0) {
      if (parts.length > 0) parts.push('');
      parts.push(post.hashtags.map((tag) => `#${tag}`).join(' '));
    }

    return parts.join('\n');
  }

  // Rendering methods (simplified - full implementation would include all slide types)
  private renderPostsList(): void {
    const postsList = this.getElement('postsList');
    if (!postsList) return;

    postsList.innerHTML = this.getPublicationPosts()
      .map(
        (post) => `
      <div class="post-item ${post.id === this.state.currentPostId ? 'active' : ''}" data-post-id="${post.id}">
        <div class="post-item-thumb">${post.id}</div>
        <div class="post-item-info">
          <div class="post-item-title">${post.title}</div>
          <div class="post-item-meta">
            <span class="post-item-badge badge-${post.pilarColor}">${post.day}</span>
            ${post.type}
          </div>
        </div>
        <button class="post-item-metadata-btn" title="Ver descripción y hashtags" data-post-id="${post.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="5" r="2"/>
            <circle cx="12" cy="12" r="2"/>
            <circle cx="12" cy="19" r="2"/>
          </svg>
        </button>
      </div>
    `,
      )
      .join('');

    postsList.querySelectorAll('.post-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('.post-item-metadata-btn')) {
          return;
        }
        const postId = parseInt((item as HTMLElement).dataset.postId || '1');
        this.goToPost(postId);
      });
    });

    postsList.querySelectorAll('.post-item-metadata-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const postId = parseInt((btn as HTMLElement).dataset.postId || '1');
        this.showPostMetadata(postId);
      });
    });
  }

  showPostMetadata(postId: number): void {
    const post = postsData[postId];
    if (!post) return;

    const hashtagsText = post.hashtags?.map((tag: string) => `#${tag}`).join(' ') || '';
    const descriptionText = post.description || 'Sin descripción';

    const modal = document.createElement('div');
    modal.className = 'metadata-modal';
    modal.innerHTML = `
      <div class="metadata-modal-overlay" onclick="this.parentElement.remove()"></div>
      <div class="metadata-modal-content">
        <button class="metadata-modal-close" onclick="this.closest('.metadata-modal').remove()">×</button>
        <h3>${post.title}</h3>
        <div class="metadata-section">
          <label>Descripción</label>
          <textarea readonly class="metadata-description">${descriptionText}</textarea>
          <button class="metadata-copy-btn" onclick="navigator.clipboard.writeText('${descriptionText.replace(/'/g, "\\'")} ${hashtagsText}'); this.textContent='¡Copiado!'; setTimeout(() => this.textContent='Copiar todo', 2000)">Copiar todo</button>
        </div>
        <div class="metadata-section">
          <label>Hashtags (${post.hashtags?.length || 0})</label>
          <div class="metadata-hashtags">${hashtagsText}</div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', closeOnEscape);
      }
    };
    document.addEventListener('keydown', closeOnEscape);
  }

  private renderCurrentPost(): void {
    const postContainer = this.getElement('postContainer');
    if (!postContainer) return;

    const post = this.getCurrentPost();
    if (!post) return;

    postContainer.innerHTML = this.buildPostHTML(post);

    // Bind slide events if carousel
    if (this.isCarouselPost()) {
      this.bindSlideEvents();
    }
  }

  private buildPostHTML(post: Post): string {
    const isCarousel = post.slides && post.slides.length > 0;

    const headerHTML = `
      <div class="post-header">
        <div class="post-logo">
          ${iconSVGs['dumbbell'] || ''}
        </div>
        <span class="post-brand">GymSpace</span>
        <span class="post-badge">TODO-EN-UNO</span>
      </div>
    `;

    let contentHTML: string;

    if (isCarousel && post.slides) {
      contentHTML = this.buildCarouselHTML(post);
    } else {
      contentHTML = this.buildSinglePostHTML(post);
    }

    const floatingBadgeHTML = post.hasFloatingBadge
      ? `
      <div class="floating-badge">
        ${iconSVGs[post.floatingBadge?.icon || ''] || ''}
        <span>${post.floatingBadge?.text || ''}</span>
      </div>
    `
      : '';

    return `
      <div class="post-slide" id="post-${post.id}" data-post-id="${post.id}">
        <div class="bg-glow bg-glow-1"></div>
        <div class="bg-glow bg-glow-2"></div>
        <div class="bg-grid"></div>
        <div class="post-content">
          ${headerHTML}
          ${post.hasFloatingBadge ? `<div class="floating-badge-row">${floatingBadgeHTML}</div>` : ''}
          ${contentHTML}
        </div>
        ${isCarousel ? this.buildSlideNavigation(post.slides?.length || 0) : ''}
      </div>
    `;
  }

  private buildCarouselHTML(post: Post): string {
    if (!post.slides) return '';

    const slidesHTML = post.slides
      .map(
        (slide, index) => `
      <div class="carousel-slide ${index === this.state.currentSlide ? 'active' : ''}" data-slide-index="${index}" style="height: 100%;">
        <div style="height: 100%; display: flex; flex-direction: column;">
          ${this.buildSlideContent(slide, post)}
        </div>
      </div>
    `,
      )
      .join('');

    return `
      <div class="carousel-container" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
        ${slidesHTML}
      </div>
    `;
  }

  private buildSlideContent(slide: Slide, post: Post): string {
    const safeSlide: Slide = {
      ...slide,
      subtitle: typeof slide.subtitle === 'string' ? slide.subtitle : '',
    };
    const layout = safeSlide.layout || safeSlide.content || 'default';

    switch (layout) {
      case 'cover':
        return this.buildCoverSlide(safeSlide, post);
      case 'metric-detail':
        return this.buildMetricDetailSlide(safeSlide, post);
      case 'stats-grid':
        return this.buildStatsGridSlide(safeSlide, post);
      case 'solution-slide':
        return this.buildSolutionSlide(safeSlide, post);
      case 'problem-slide':
        return this.buildProblemSlide(safeSlide, post);
      case 'final-cta':
        return this.buildFinalCTASlide(safeSlide, post);
      case 'hook-cards':
        return this.buildHookCardsSlide(safeSlide, post);
      case 'two-col-comparison':
        return this.buildComparisonSlide(safeSlide, post);
      case 'numbered-list':
        return this.buildNumberedListSlide(safeSlide, post);
      case 'error-detail':
        return this.buildErrorDetailSlide(safeSlide, post);
      case 'error-card':
        return this.buildErrorCardSlide(safeSlide, post);
      case 'app-list':
        return this.buildAppListSlide(safeSlide, post);
      case 'cost-breakdown':
        return this.buildCostBreakdownSlide(safeSlide, post);
      case 'solution-showcase':
        return this.buildSolutionShowcaseSlide(safeSlide, post);
      case 'benefits':
        return this.buildBenefitsSlide(safeSlide, post);
      case 'center-focus':
        return this.buildCenterFocusSlide(safeSlide, post);
      case 'growth-journey':
        return this.buildGrowthJourneySlide(safeSlide, post);
      case 'feature-focus':
        return this.buildFeatureFocusSlide(safeSlide, post);
      case 'comparison-insight':
        return this.buildComparisonInsightSlide(safeSlide, post);
      case 'process-breakdown':
        return this.buildProcessBreakdownSlide(safeSlide, post);
      case 'mobile-onboarding-flow':
        return this.buildMobileOnboardingFlowSlide(safeSlide, post);
      case 'conversion-cta':
        return this.buildConversionCtaSlide(safeSlide, post);
      case 'two-col':
        return this.buildTwoColSlide(safeSlide, post);
      default:
        return this.buildDefaultSlide(safeSlide, post);
    }
  }

  private buildSinglePostHTML(post: Post): string {
    const featuresHTML = post.features
      .map(
        (feature) => `
      <div class="post-feature">
        <div class="post-feature-icon">
          ${iconSVGs[feature.icon] || ''}
        </div>
        <div class="post-feature-title">${feature.title}</div>
        <div class="post-feature-desc">${feature.desc}</div>
      </div>
    `,
      )
      .join('');

    const statsHTML = post.stats
      .map(
        (stat) => `
      <div class="post-stat">
        <div class="post-stat-value">${stat.value}</div>
        <div class="post-stat-label">${stat.label}</div>
      </div>
    `,
      )
      .join('');

    return `
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: flex-start; gap: 24px; min-height: 0;">
        <div style="flex-shrink: 0;">
          <h1 class="post-title" style="margin-bottom: 20px; font-size: 60px; line-height: 1.15;">${post.title}</h1>
          <p class="post-subtitle" style="margin-bottom: 32px; font-size: 26px; line-height: 1.5;">${post.subtitle}</p>
        </div>
        <div class="post-stats" style="margin-bottom: 24px; gap: 20px; flex-shrink: 0;">
          ${statsHTML}
        </div>
        <div class="post-features" style="margin-bottom: 32px;">
          ${featuresHTML}
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildCTA(post: Post): string {
    return `
      <div style="flex-shrink: 0; display: flex; align-items: center; gap: 24px; padding-top: 8px;">
        <button class="post-cta" style="padding: 20px 36px; font-size: 24px;">${post.cta}</button>
        <span class="post-cta-note" style="font-size: 16px;">${post.ctaNote}</span>
      </div>
    `;
  }

  private buildSlideNavigation(totalSlides: number): string {
    const dotsHTML = Array.from({ length: totalSlides }, (_, i) =>
      i === this.state.currentSlide
        ? `<button class="slide-dot active" data-slide="${i}"></button>`
        : `<button class="slide-dot" data-slide="${i}"></button>`,
    ).join('');

    return `
      <div class="slide-navigation">
        <button class="slide-nav-prev">←</button>
        <div class="slide-dots">${dotsHTML}</div>
        <button class="slide-nav-next">→</button>
        <span class="slide-number">${this.state.currentSlide + 1}/${totalSlides}</span>
      </div>
    `;
  }

  private bindSlideEvents(): void {
    const prevBtn = document.querySelector('.slide-nav-prev');
    const nextBtn = document.querySelector('.slide-nav-next');
    const dots = document.querySelectorAll('.slide-dot');

    prevBtn?.addEventListener('click', () => this.prevSlide());
    nextBtn?.addEventListener('click', () => this.nextSlide());

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => this.goToSlide(index));
    });
  }

  private renderGallery(): void {
    const galleryView = this.getElement('galleryView');
    if (!galleryView) return;

    galleryView.innerHTML = `
      <div class="instagram-profile">
        <div class="instagram-header">
          <div class="instagram-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6.5 6.5h11M6.5 17.5h11M6 20v-6.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5V20M6 4v6.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V4"/>
            </svg>
          </div>
          <div class="instagram-profile-info">
            <div class="instagram-username">gymspace.app</div>
            <div class="instagram-stats">
              <div class="instagram-stat"><strong>${this.getPublicationPostIds().length}</strong> posts</div>
              <div class="instagram-stat"><strong>2.4k</strong> followers</div>
              <div class="instagram-stat"><strong>180</strong> following</div>
            </div>
            <div class="instagram-bio">
              <div class="instagram-bio-title">GymSpace</div>
              <div>Todo-en-uno para tu gimnasio 🏋️‍♂️<br>Software de gestión · WhatsApp · Reportes<br>30 días gratis 👇</div>
            </div>
          </div>
        </div>
        <div class="instagram-tabs">
          <div class="instagram-tab active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Posts
          </div>
        </div>
        <div class="gallery-grid" id="galleryGrid">
          ${this.buildGalleryGrid()}
        </div>
      </div>
    `;

    // Re-bind click handlers
    const galleryGrid = document.getElementById('galleryGrid');
    galleryGrid?.querySelectorAll('.gallery-item').forEach((item) => {
      item.addEventListener('click', () => {
        const postId = parseInt((item as HTMLElement).dataset.postId || '1');
        this.goToPost(postId);
        this.toggleGalleryView();
      });
    });
  }

  private buildGalleryGrid(): string {
    return this.getPublicationPosts()
      .map((post) => {
        const isCarousel = post.slides && post.slides.length > 0;
        const likes = 100 + Math.floor(Math.random() * 150);
        const comments = 10 + Math.floor(Math.random() * 30);
        const previewHTML = this.buildGalleryPreviewHTML(post);

        return `
        <div class="gallery-item" data-post-id="${post.id}">
          <div class="gallery-item-thumb">
            <div class="gallery-item-preview-wrapper">
              <div class="gallery-item-preview-content">
                ${previewHTML}
              </div>
            </div>
            ${isCarousel ? `<div class="carousel-indicator">${post.slides?.length}</div>` : ''}
          </div>
          <div class="gallery-item-overlay">
            <div class="gallery-item-stat">❤️ ${likes}</div>
            <div class="gallery-item-stat">💬 ${comments}</div>
          </div>
        </div>
      `;
      })
      .join('');
  }

  private buildGalleryPreviewHTML(post: Post): string {
    const previousSlide = this.state.currentSlide;

    try {
      if (post.slides?.length) {
        this.state.currentSlide = 0;
      }

      return this.buildPostHTML(post);
    } finally {
      this.state.currentSlide = previousSlide;
    }
  }

  private buildCoverSlide(slide: Slide, post: Post): string {
    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px; justify-content: center; align-items: center; text-align: center;">
        <div style="display: inline-flex; align-items: center; gap: 10px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08)); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 50px; padding: 12px 24px; margin-bottom: 32px;">
          <span style="font-size: 24px;">🚨</span>
          <span style="font-size: 16px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 1px;">${slide.warning || 'Alerta'}</span>
        </div>
        <h1 style="font-size: 68px; font-weight: 800; color: var(--landing-text); margin-bottom: 20px; font-family: var(--font-display); line-height: 1.1;">
          ${slide.title}
        </h1>
        <p style="font-size: 30px; color: var(--landing-text-soft); margin-bottom: 48px; max-width: 700px; line-height: 1.4;">
          ${slide.subtitle}
        </p>
        ${
          slide.stat
            ? `
        <div style="background: linear-gradient(135deg, rgba(245, 126, 36, 0.12), rgba(245, 126, 36, 0.05)); border: 2px solid rgba(245, 126, 36, 0.3); border-radius: 20px; padding: 32px 48px; margin-bottom: 48px;">
          <div style="font-size: 72px; font-weight: 800; color: #F57E24; font-family: var(--font-display); margin-bottom: 8px;">${slide.stat}</div>
          <div style="font-size: 22px; color: var(--landing-text-soft);">${slide.statLabel}</div>
        </div>
        `
            : ''
        }
        <div style="display: flex; align-items: center; gap: 12px; color: var(--landing-text-muted); font-size: 16px;">
          <span>Desliza para descubrirlos</span>
          <span style="font-size: 20px;">→</span>
        </div>
      </div>
    `;
  }

  private buildMetricDetailSlide(slide: Slide, post: Post): string {
    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(245, 126, 36, 0.12), rgba(245, 126, 36, 0.05)); border: 1px solid rgba(245, 126, 36, 0.2); border-radius: 50px; padding: 10px 20px;">
            <span style="font-size: 18px;">📊</span>
            <span style="font-size: 14px; font-weight: 700; color: var(--gs-orange);">Métrica Clave</span>
          </div>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 24px;">
          <div>
            <div style="font-size: 20px; font-weight: 700; color: var(--landing-text-soft); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">${slide.metricName}</div>
            <div style="font-size: 96px; font-weight: 800; color: var(--gs-orange); font-family: var(--font-display); line-height: 1;">${slide.metricValue}</div>
          </div>
          <p style="font-size: 22px; color: var(--landing-text-soft); max-width: 700px; line-height: 1.5;">${slide.description}</p>
          ${
            slide.whyItMatters
              ? `
          <div style="background: linear-gradient(135deg, rgba(5, 150, 105, 0.08), rgba(5, 150, 105, 0.02)); border: 1px solid rgba(5, 150, 105, 0.15); border-radius: 16px; padding: 20px 28px; max-width: 650px;">
            <div style="font-size: 16px; font-weight: 700; color: #059669; margin-bottom: 4px;">¿Por qué importa?</div>
            <div style="font-size: 18px; color: #059669; line-height: 1.4;">${slide.whyItMatters}</div>
          </div>
          `
              : ''
          }
          ${
            slide.stat
              ? `
          <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, rgba(245, 126, 36, 0.1), rgba(245, 126, 36, 0.03)); border: 1px solid rgba(245, 126, 36, 0.2); border-radius: 16px; padding: 16px 28px;">
            <span style="font-size: 36px; font-weight: 800; color: #F57E24; font-family: var(--font-display);">${slide.stat}</span>
            <span style="font-size: 15px; color: var(--landing-text-soft); text-align: left; line-height: 1.3;">${slide.statLabel}</span>
          </div>
          `
              : ''
          }
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildStatsGridSlide(slide: Slide, post: Post): string {
    const statsHTML = (slide.stats || [])
      .map(
        (stat: { value: string; label: string; icon?: string }) => `
      <div style="background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92)); border: 1px solid var(--landing-border); border-radius: 20px; padding: 32px 24px; text-align: center; box-shadow: var(--landing-shadow);">
        <div style="width: 56px; height: 56px; margin: 0 auto 16px; color: var(--gs-orange);">${iconSVGs[stat.icon || ''] || iconSVGs['dumbbell']}</div>
        <div style="font-size: 56px; font-weight: 800; color: var(--gs-orange); font-family: var(--font-display); margin-bottom: 8px;">${stat.value}</div>
        <div style="font-size: 20px; color: var(--landing-text-muted); line-height: 1.4;">${stat.label}</div>
      </div>
    `,
      )
      .join('');

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px;">
        <div class="post-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 40px;">
          <div style="text-align: center;">
            <h1 class="post-title" style="font-size: 56px; line-height: 1.15; margin-bottom: 16px;">${slide.title}</h1>
            <p class="post-subtitle" style="font-size: 26px; color: var(--landing-text-soft);">${slide.subtitle}</p>
          </div>
          <div style="display: grid; grid-template-columns: repeat(${slide.stats?.length === 3 ? '3' : '2'}, 1fr); gap: 20px;">
            ${statsHTML}
          </div>
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildSolutionSlide(slide: Slide, post: Post): string {
    const featuresHTML = (slide.features || [])
      .map(
        (feature: { icon: string; title: string; desc: string }) => `
      <div style="background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92)); border: 1px solid var(--landing-border); border-radius: 20px; padding: 36px 28px; text-align: center; box-shadow: var(--landing-shadow);">
        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, rgba(245, 126, 36, 0.15) 0%, rgba(245, 126, 36, 0.08) 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; border: 1px solid rgba(245, 126, 36, 0.25);">
          <div style="width: 32px; height: 32px; color: var(--gs-orange);">${iconSVGs[feature.icon] || iconSVGs['dumbbell']}</div>
        </div>
        <div style="font-size: 22px; font-weight: 700; color: var(--landing-text); margin-bottom: 10px; font-family: var(--font-display);">${feature.title}</div>
        <div style="font-size: 16px; color: var(--landing-text-muted); line-height: 1.5;">${feature.desc}</div>
      </div>
    `,
      )
      .join('');

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px;">
        <div class="post-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 36px;">
          <div style="text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(5, 150, 105, 0.12), rgba(5, 150, 105, 0.05)); border: 1px solid rgba(5, 150, 105, 0.2); border-radius: 50px; padding: 10px 20px; margin-bottom: 20px;">
              <span style="font-size: 18px;">✓</span>
              <span style="font-size: 14px; font-weight: 700; color: #059669;">La Solución</span>
            </div>
            <h1 class="post-title" style="font-size: 52px; line-height: 1.15; margin-bottom: 16px;">${slide.title}</h1>
            <p class="post-subtitle" style="font-size: 24px; color: var(--landing-text-soft);">${slide.subtitle}</p>
          </div>
          <div style="display: grid; grid-template-columns: repeat(${slide.features?.length === 3 ? '3' : '2'}, 1fr); gap: 20px;">
            ${featuresHTML}
          </div>
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildProblemSlide(slide: Slide, post: Post): string {
    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px;">
        <div class="post-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 32px;">
          <div style="display: inline-flex; align-items: center; gap: 10px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08)); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 50px; padding: 12px 24px;">
            <span style="font-size: 22px;">🚨</span>
            <span style="font-size: 15px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px;">${slide.warning || 'Alerta de rentabilidad'}</span>
          </div>
          <div>
            <h1 class="post-title" style="font-size: 60px; line-height: 1.15; margin-bottom: 16px;">${slide.title}</h1>
            <p class="post-subtitle" style="font-size: 24px; color: var(--landing-text-soft);">${slide.subtitle}</p>
          </div>
          ${
            slide.stat && typeof slide.stat === 'object' && 'value' in slide.stat
              ? `
          <div style="background: linear-gradient(135deg, rgba(245, 126, 36, 0.12), rgba(245, 126, 36, 0.05)); border: 2px solid rgba(245, 126, 36, 0.25); border-radius: 20px; padding: 36px 56px;">
            <div style="font-size: 72px; font-weight: 800; color: var(--gs-orange); font-family: var(--font-display); margin-bottom: 8px;">${(slide.stat as { value: string }).value}</div>
            <div style="font-size: 18px; color: var(--landing-text-soft); max-width: 320px;">${(slide.stat as { label: string }).label}</div>
          </div>
          `
              : ''
          }
          ${slide.message ? `<div style="font-size: 20px; color: var(--landing-text-muted); font-style: italic; max-width: 650px; line-height: 1.5;">${slide.message}</div>` : ''}
        </div>
      </div>
    `;
  }

  private buildFinalCTASlide(slide: Slide, post: Post): string {
    const featuresHTML = (slide.features || [])
      .map(
        (feature: { icon: string; title: string; desc: string }) => `
      <div style="flex: 1; background: linear-gradient(135deg, rgba(245, 126, 36, 0.08), rgba(245, 126, 36, 0.02)); border: 1px solid rgba(245, 126, 36, 0.15); border-radius: 16px; padding: 28px 20px; text-align: center;">
        <div style="width: 48px; height: 48px; margin: 0 auto 16px; color: #F57E24;">${iconSVGs[feature.icon] || iconSVGs['dumbbell']}</div>
        <div style="font-size: 18px; font-weight: 700; color: var(--landing-text); margin-bottom: 8px;">${feature.title}</div>
        <div style="font-size: 14px; color: var(--landing-text-soft); line-height: 1.5;">${feature.desc}</div>
      </div>
    `,
      )
      .join('');

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px; justify-content: center; align-items: center; text-align: center;">
        <div style="display: inline-flex; align-items: center; gap: 10px; background: linear-gradient(135deg, rgba(5, 150, 105, 0.12), rgba(5, 150, 105, 0.05)); border: 1px solid rgba(5, 150, 105, 0.2); border-radius: 50px; padding: 12px 24px; margin-bottom: 28px;">
          <span style="font-size: 24px;">🎯</span>
          <span style="font-size: 16px; font-weight: 700; color: #059669;">¿Listo para cambiar?</span>
        </div>
        <h1 style="font-size: 52px; font-weight: 800; color: var(--landing-text); margin-bottom: 16px; font-family: var(--font-display); line-height: 1.15;">
          ${slide.title}
        </h1>
        <p style="font-size: 24px; color: var(--landing-text-soft); margin-bottom: 36px; max-width: 650px; line-height: 1.4;">
          ${slide.subtitle}
        </p>
        ${
          slide.features
            ? `
        <div style="display: flex; gap: 20px; width: 100%; max-width: 800px; margin-bottom: 36px;">
          ${featuresHTML}
        </div>
        `
            : ''
        }
        ${
          slide.stat
            ? `
        <div style="background: linear-gradient(135deg, rgba(245, 126, 36, 0.15), rgba(245, 126, 36, 0.05)); border: 2px solid rgba(245, 126, 36, 0.3); border-radius: 20px; padding: 28px 48px; margin-bottom: 32px;">
          <div style="font-size: 56px; font-weight: 800; color: #F57E24; font-family: var(--font-display); margin-bottom: 4px;">${slide.stat}</div>
          <div style="font-size: 18px; color: var(--landing-text-soft);">${slide.statLabel}</div>
        </div>
        `
            : ''
        }
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildHookCardsSlide(slide: Slide, post: Post): string {
    const statsHTML = (slide.stats || [])
      .map(
        (stat: { value: string; label: string }) => `
      <div style="background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92)); border: 1px solid var(--landing-border); border-radius: 16px; padding: 24px 16px; text-align: center; box-shadow: var(--landing-shadow);">
        <div style="font-size: 44px; font-weight: 800; color: var(--gs-orange); font-family: var(--font-display); margin-bottom: 8px; line-height: 1;">${stat.value}</div>
        <div style="font-size: 13px; color: var(--landing-text-muted); line-height: 1.4;">${stat.label}</div>
      </div>
    `,
      )
      .join('');

    const featuresHTML = (slide.features || [])
      .map(
        (feature: { icon: string; title: string; desc: string }) => `
      <div style="background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92)); border: 1px solid var(--landing-border); border-radius: 16px; padding: 20px 16px; text-align: center; box-shadow: var(--landing-shadow);">
        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, rgba(245, 126, 36, 0.15) 0%, rgba(245, 126, 36, 0.08) 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; border: 1px solid rgba(245, 126, 36, 0.25);">
          <div style="width: 20px; height: 20px; color: var(--gs-orange);">${iconSVGs[feature.icon] || iconSVGs['dumbbell']}</div>
        </div>
        <div style="font-size: 15px; font-weight: 700; color: var(--landing-text); margin-bottom: 6px; font-family: var(--font-display);">${feature.title}</div>
        <div style="font-size: 12px; color: var(--landing-text-muted); line-height: 1.5;">${feature.desc}</div>
      </div>
    `,
      )
      .join('');

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px;">
        <div class="post-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 28px;">
          <div style="text-align: center;">
            <h1 class="post-title" style="font-size: 48px; line-height: 1.15; margin-bottom: 12px;">${slide.title}</h1>
            <p class="post-subtitle" style="font-size: 22px; color: var(--landing-text-soft);">${slide.subtitle}</p>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            ${statsHTML}
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
            ${featuresHTML}
          </div>
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildComparisonSlide(slide: Slide, post: Post): string {
    const subtitle = this.getSafeSubtitle(slide);
    const beforeItems = (slide.before?.items || [])
      .map(
        (item: string) => `
      <li style="padding: 14px 0; font-size: 20px;"><span style="color: #dc2626; margin-right: 12px; font-size: 22px;">✕</span> ${item}</li>
    `,
      )
      .join('');

    const afterItems = (slide.after?.items || [])
      .map(
        (item: string) => `
      <li style="padding: 14px 0; font-size: 20px;"><span style="color: #059669; margin-right: 12px; font-size: 22px;">✓</span> ${item}</li>
    `,
      )
      .join('');

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 8px 40px 0;">
        <div class="post-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <div>
            <h1 class="post-title" style="margin-bottom: 8px; font-size: 58px; line-height: 1.1;">${slide.title}</h1>
            ${subtitle ? `<p class="post-subtitle" style="margin-bottom: 14px; font-size: 22px;">${subtitle}</p>` : ''}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="background: linear-gradient(180deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02)); border: 2px solid rgba(239, 68, 68, 0.2); border-radius: 20px; padding: 24px;">
              <div style="font-size: 24px; font-weight: 700; color: #dc2626; margin-bottom: 14px; font-family: var(--font-display);">${slide.before?.title || 'Antes'}</div>
              <ul style="list-style: none; color: var(--landing-text-soft);">
                ${beforeItems}
              </ul>
            </div>
            <div style="background: linear-gradient(180deg, rgba(5, 150, 105, 0.08), rgba(5, 150, 105, 0.02)); border: 2px solid rgba(5, 150, 105, 0.2); border-radius: 20px; padding: 24px;">
              <div style="font-size: 24px; font-weight: 700; color: #059669; margin-bottom: 14px; font-family: var(--font-display);">${slide.after?.title || 'Después'}</div>
              <ul style="list-style: none; color: var(--landing-text);">
                ${afterItems}
              </ul>
            </div>
          </div>
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildProcessBreakdownSlide(slide: Slide, post: Post): string {
    const subtitle = this.getSafeSubtitle(slide);
    const isDigitalFlow = Boolean(slide.digitalTotal);
    const stepsHTML = (slide.steps || [])
      .map(
        (step: { label: string; time?: string; icon?: string; note?: string }, index: number) => `
      <div style="display: flex; align-items: center; gap: 16px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92)); border: 1px solid ${isDigitalFlow ? 'rgba(5, 150, 105, 0.22)' : 'rgba(239, 68, 68, 0.2)'}; border-radius: 16px; padding: 18px 20px; box-shadow: var(--landing-shadow);">
        <div style="width: 42px; height: 42px; border-radius: 11px; background: ${isDigitalFlow ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.18), rgba(5, 150, 105, 0.08))' : 'linear-gradient(135deg, rgba(245, 126, 36, 0.18), rgba(245, 126, 36, 0.08))'}; border: 1px solid ${isDigitalFlow ? 'rgba(5, 150, 105, 0.3)' : 'rgba(245, 126, 36, 0.28)'}; display: flex; align-items: center; justify-content: center; color: ${isDigitalFlow ? '#059669' : 'var(--gs-orange)'}; flex-shrink: 0;">
          ${
            step.icon
              ? `<div style="width: 20px; height: 20px;">${iconSVGs[step.icon] || ''}</div>`
              : `<div style="font-size: 18px; font-weight: 800; font-family: var(--font-display);">${index + 1}</div>`
          }
        </div>
        <div style="flex: 1;">
          <div style="font-size: 21px; font-weight: 700; color: var(--landing-text); font-family: var(--font-display); line-height: 1.25;">${step.label}</div>
          ${step.note ? `<div style="font-size: 14px; color: var(--landing-text-muted); margin-top: 4px;">${step.note}</div>` : ''}
        </div>
        ${
          step.time
            ? `<div style="font-size: 15px; font-weight: 700; color: ${isDigitalFlow ? '#059669' : '#dc2626'}; background: ${isDigitalFlow ? 'rgba(5, 150, 105, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border: 1px solid ${isDigitalFlow ? 'rgba(5, 150, 105, 0.25)' : 'rgba(239, 68, 68, 0.25)'}; border-radius: 9999px; padding: 8px 12px; flex-shrink: 0;">${step.time}</div>`
            : ''
        }
      </div>
    `,
      )
      .join('');

    const totalLabel = slide.manualTotal || slide.digitalTotal || '';
    const totalColor = isDigitalFlow ? '#059669' : '#dc2626';
    const totalBg = isDigitalFlow
      ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.12), rgba(5, 150, 105, 0.04))'
      : 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.04))';

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 8px 40px 0;">
        <div style="text-align: center; margin-bottom: 12px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 9999px; margin-bottom: 12px; font-size: 13px; font-weight: 700; color: ${totalColor}; background: ${totalBg}; border: 1px solid ${isDigitalFlow ? 'rgba(5, 150, 105, 0.24)' : 'rgba(239, 68, 68, 0.24)'};">
            ${isDigitalFlow ? 'Flujo digital' : 'Flujo tradicional'}
          </div>
          <h1 class="post-title" style="font-size: 52px; line-height: 1.1; margin-bottom: 8px;">${slide.title}</h1>
          ${subtitle ? `<p class="post-subtitle" style="font-size: 22px; color: var(--landing-text-soft);">${subtitle}</p>` : ''}
        </div>
        <div class="post-body" style="flex: 1; display: flex; flex-direction: column; justify-content: flex-start; gap: 12px;">
          ${stepsHTML}
        </div>
        <div style="display: flex; align-items: center; justify-content: center; margin-top: 12px; margin-bottom: 10px;">
          <div style="display: inline-flex; align-items: center; gap: 10px; border-radius: 14px; padding: 12px 22px; background: ${totalBg}; border: 1px solid ${isDigitalFlow ? 'rgba(5, 150, 105, 0.26)' : 'rgba(239, 68, 68, 0.26)'};">
            <span style="font-size: 14px; font-weight: 700; color: var(--landing-text-soft);">Total</span>
            <span style="font-size: 30px; font-weight: 800; color: ${totalColor}; font-family: var(--font-display); line-height: 1;">${totalLabel}</span>
          </div>
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildMobileOnboardingFlowSlide(slide: Slide, post: Post): string {
    const stages = slide.mockupStages || [];
    const stagesHTML = stages
      .map(
        (stage: { title: string; subtitle: string; icon: string }, index: number) => `
      <div style="display: flex; align-items: center; gap: 12px; background: rgba(255, 255, 255, 0.96); border: 1px solid var(--landing-border); border-radius: 14px; padding: 12px; box-shadow: var(--landing-shadow);">
        <div style="width: 34px; height: 34px; border-radius: 10px; background: rgba(245, 126, 36, 0.12); border: 1px solid rgba(245, 126, 36, 0.25); display: flex; align-items: center; justify-content: center; color: var(--gs-orange); flex-shrink: 0;">
          <div style="width: 18px; height: 18px;">${iconSVGs[stage.icon] || iconSVGs['dumbbell']}</div>
        </div>
        <div style="flex: 1;">
          <div style="font-size: 15px; font-weight: 700; color: var(--landing-text); font-family: var(--font-display);">${stage.title}</div>
          <div style="font-size: 12px; color: var(--landing-text-muted);">${stage.subtitle}</div>
        </div>
        <div style="width: 24px; height: 24px; border-radius: 9999px; background: rgba(5, 150, 105, 0.12); color: #059669; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${index + 1}
        </div>
      </div>
    `,
      )
      .join('');

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 10px 40px 0;">
        <div style="text-align: center; margin-bottom: 14px;">
          <h1 class="post-title" style="font-size: 50px; line-height: 1.12; margin-bottom: 8px;">${slide.title}</h1>
          <p class="post-subtitle" style="font-size: 22px; color: var(--landing-text-soft);">${slide.subtitle}</p>
        </div>
        <div class="post-body" style="flex: 1; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 22px; align-items: center;">
          <div style="background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92)); border: 1px solid var(--landing-border); border-radius: 24px; padding: 20px; box-shadow: var(--landing-shadow);">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
              <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(37, 211, 102, 0.14); color: #128C7E; display: flex; align-items: center; justify-content: center;">
                <div style="width: 18px; height: 18px;">${iconSVGs['message-square'] || ''}</div>
              </div>
              <div style="font-size: 14px; font-weight: 700; color: var(--landing-text);">WhatsApp enviado</div>
              <div style="margin-left: auto; font-size: 12px; color: var(--landing-text-muted);">Ahora</div>
            </div>
            <div style="background: rgba(245, 126, 36, 0.08); border: 1px solid rgba(245, 126, 36, 0.24); border-radius: 12px; padding: 12px; font-size: 13px; color: var(--landing-text-soft); margin-bottom: 14px;">
              Hola, completa tu registro y firma aquí para activar tu acceso.
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="background: rgba(255, 255, 255, 0.9); border: 1px solid var(--landing-border); border-radius: 10px; padding: 10px;">
                <div style="font-size: 11px; color: var(--landing-text-muted); margin-bottom: 4px;">Formulario</div>
                <div style="height: 6px; border-radius: 9999px; background: rgba(5, 150, 105, 0.24); margin-bottom: 6px;"></div>
                <div style="height: 6px; border-radius: 9999px; background: rgba(245, 126, 36, 0.24); margin-bottom: 6px;"></div>
                <div style="height: 6px; border-radius: 9999px; background: rgba(17, 24, 39, 0.12);"></div>
              </div>
              <div style="background: rgba(255, 255, 255, 0.9); border: 1px solid var(--landing-border); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="width: 24px; height: 24px; color: #059669; margin-bottom: 4px;">${iconSVGs['check-circle'] || ''}</div>
                <div style="font-size: 11px; font-weight: 700; color: #059669;">Firma validada</div>
              </div>
            </div>
          </div>
          <div style="background: linear-gradient(180deg, rgba(250, 250, 250, 0.95), rgba(255, 255, 255, 0.92)); border: 1px solid var(--landing-border); border-radius: 28px; padding: 12px; box-shadow: var(--landing-shadow);">
            <div style="background: #0f172a; border-radius: 22px; padding: 14px; min-height: 420px;">
              <div style="display: flex; justify-content: center; margin-bottom: 10px;">
                <div style="width: 88px; height: 5px; border-radius: 9999px; background: rgba(255, 255, 255, 0.35);"></div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${stagesHTML}
              </div>
            </div>
          </div>
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildConversionCtaSlide(slide: Slide, post: Post): string {
    const subtitle = this.getSafeSubtitle(slide);
    const proofPointsHTML = (slide.proofPoints || [])
      .map(
        (point: string) => `
      <div style="display: flex; align-items: flex-start; gap: 12px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92)); border: 1px solid var(--landing-border); border-radius: 14px; padding: 14px 16px;">
        <div style="width: 22px; height: 22px; color: #059669; flex-shrink: 0;">${iconSVGs['check-circle'] || ''}</div>
        <div style="font-size: 18px; color: var(--landing-text-soft); line-height: 1.35;">${point}</div>
      </div>
    `,
      )
      .join('');

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 4px 40px 0;">
        <div style="text-align: center; margin-bottom: 12px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(5, 150, 105, 0.12), rgba(5, 150, 105, 0.05)); border: 1px solid rgba(5, 150, 105, 0.22); border-radius: 9999px; padding: 9px 16px; margin-bottom: 12px; font-size: 13px; font-weight: 700; color: #059669;">
            Todo en un solo flujo digital
          </div>
          <h1 class="post-title" style="font-size: 52px; line-height: 1.1; margin-bottom: 8px;">${slide.title}</h1>
          ${subtitle ? `<p class="post-subtitle" style="font-size: 22px; color: var(--landing-text-soft);">${subtitle}</p>` : ''}
        </div>
        <div class="post-body" style="flex: 1; display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 20px; align-items: center;">
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${proofPointsHTML}
          </div>
          <div style="background: linear-gradient(135deg, rgba(245, 126, 36, 0.14), rgba(245, 126, 36, 0.04)); border: 1px solid rgba(245, 126, 36, 0.28); border-radius: 22px; padding: 24px; text-align: center;">
            <div style="font-size: 13px; font-weight: 700; color: var(--landing-text-soft); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 10px;">Tiempo de onboarding</div>
            <div style="font-size: 84px; font-weight: 800; color: var(--gs-orange); line-height: 0.95; font-family: var(--font-display); margin-bottom: 10px;">${typeof slide.stat === 'string' ? slide.stat : ''}</div>
            <div style="font-size: 20px; color: var(--landing-text-soft); margin-bottom: 18px;">${slide.statLabel || ''}</div>
            <div style="display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; color: #059669; background: rgba(5, 150, 105, 0.1); border: 1px solid rgba(5, 150, 105, 0.2); border-radius: 9999px; padding: 8px 12px;">
              <span style="width: 16px; height: 16px;">${iconSVGs.check || ''}</span>
              Listo para entrenar en minutos
            </div>
          </div>
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildNumberedListSlide(slide: Slide, post: Post): string {
    const subtitle = this.getSafeSubtitle(slide);
    const itemsHTML = (slide.items || [])
      .map(
        (item: { number: string; icon?: string; title: string; desc: string }) => `
      <div style="background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92)); border: 1px solid var(--landing-border); border-radius: 20px; padding: 28px; box-shadow: var(--landing-shadow);">
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
          <div style="width: 48px; height: 48px; background: linear-gradient(135deg, var(--gs-orange), var(--gs-orange-light)); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 800; font-family: var(--font-display);">${item.number}</div>
          ${item.icon ? `<div style="width: 32px; height: 32px; color: var(--gs-orange);">${iconSVGs[item.icon] || ''}</div>` : ''}
        </div>
        <div style="font-size: 15px; font-weight: 700; color: var(--gs-orange); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Métrica clave</div>
        <div style="font-size: 22px; font-weight: 700; color: var(--landing-text); margin-bottom: 8px; font-family: var(--font-display);">${item.title}</div>
        <div style="font-size: 16px; color: var(--landing-text-muted); line-height: 1.5;">${item.desc}</div>
      </div>
    `,
      )
      .join('');

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 10px 40px 0;">
        <div style="text-align: center; margin-bottom: 10px;">
          <div style="display: inline-block; background: linear-gradient(135deg, rgba(245, 126, 36, 0.12), rgba(245, 126, 36, 0.05)); border: 1px solid rgba(245, 126, 36, 0.2); border-radius: 50px; padding: 10px 20px; margin-bottom: 12px; font-size: 14px; font-weight: 700; color: var(--gs-orange);">
            ${slide.pill || 'Métricas Esenciales'}
          </div>
          <h1 class="post-title" style="font-size: 48px; line-height: 1.15; margin-bottom: 8px;">${slide.title}</h1>
          ${subtitle ? `<p class="post-subtitle" style="font-size: 22px; color: var(--landing-text-soft);">${subtitle}</p>` : ''}
        </div>
        <div class="post-body" style="flex: 1; display: flex; flex-direction: column; justify-content: flex-start; padding-top: 4px;">
          <div style="display: grid; grid-template-columns: repeat(${slide.items?.length === 3 ? '3' : '2'}, 1fr); gap: 20px;">
            ${itemsHTML}
          </div>
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private getSafeSubtitle(slide: Slide): string {
    if (typeof slide.subtitle !== 'string') return '';

    const subtitle = slide.subtitle.trim();
    if (!subtitle) return '';

    const loweredSubtitle = subtitle.toLowerCase();
    if (loweredSubtitle === 'undefined' || loweredSubtitle === 'null') {
      return '';
    }

    return subtitle;
  }

  private buildErrorDetailSlide(slide: Slide, post: Post): string {
    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.05)); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 50px; padding: 10px 20px;">
            <span style="font-size: 18px;">⚠️</span>
            <span style="font-size: 14px; font-weight: 700; color: #dc2626;">${slide.subtitle}</span>
          </div>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 28px;">
          <div style="width: 120px; height: 120px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.03) 100%); border: 2px solid rgba(239, 68, 68, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <div style="width: 56px; height: 56px; color: #dc2626;">${iconSVGs[slide.icon || ''] || iconSVGs['x-circle']}</div>
          </div>
          <div style="max-width: 750px;">
            <div style="font-size: 22px; font-weight: 700; color: #dc2626; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px;">El Error</div>
            <div style="font-size: 40px; font-weight: 800; color: var(--landing-text); margin-bottom: 20px; font-family: var(--font-display); line-height: 1.15;">${slide.error}</div>
            <div style="font-size: 22px; color: var(--landing-text-soft); line-height: 1.5; margin-bottom: 28px; max-width: 650px; margin-left: auto; margin-right: auto;">${slide.description}</div>
            ${
              slide.stat
                ? `
            <div style="display: inline-flex; align-items: center; gap: 16px; background: linear-gradient(135deg, rgba(245, 126, 36, 0.1), rgba(245, 126, 36, 0.03)); border: 1px solid rgba(245, 126, 36, 0.2); border-radius: 16px; padding: 16px 28px; margin-bottom: 28px;">
              <span style="font-size: 36px; font-weight: 800; color: #F57E24; font-family: var(--font-display);">${slide.stat}</span>
              <span style="font-size: 15px; color: var(--landing-text-soft); text-align: left; line-height: 1.3; max-width: 160px;">${slide.statLabel}</span>
            </div>
            `
                : ''
            }
            ${
              slide.solution
                ? `
            <div style="background: linear-gradient(135deg, rgba(5, 150, 105, 0.08), rgba(5, 150, 105, 0.02)); border: 1px solid rgba(5, 150, 105, 0.15); border-radius: 16px; padding: 24px 32px;">
              <div style="font-size: 16px; font-weight: 700; color: #059669; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">✓ La Solución</div>
              <div style="font-size: 24px; color: #059669; line-height: 1.4; font-weight: 600;">${slide.solution}</div>
            </div>
            `
                : ''
            }
          </div>
        </div>
      </div>
    `;
  }

  private buildErrorCardSlide(slide: Slide, post: Post): string {
    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08)); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 50px; padding: 10px 20px; font-size: 14px; font-weight: 700; color: #dc2626;">
            <span style="font-size: 16px;">⚠️</span> ${slide.subtitle}
          </div>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 28px;">
          <div style="width: 140px; height: 140px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.05) 100%); border: 2px solid rgba(239, 68, 68, 0.25); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(239, 68, 68, 0.15);">
            <div style="width: 64px; height: 64px; color: #dc2626;">${iconSVGs[slide.icon || ''] || iconSVGs['x-circle']}</div>
          </div>
          <div style="max-width: 700px;">
            <div style="font-size: 42px; font-weight: 800; color: #dc2626; margin-bottom: 16px; font-family: var(--font-display); line-height: 1.15;">${slide.error}</div>
            ${
              slide.stat
                ? `
            <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, rgba(245, 126, 36, 0.12), rgba(245, 126, 36, 0.05)); border: 1px solid rgba(245, 126, 36, 0.25); border-radius: 12px; padding: 12px 24px; margin-bottom: 20px;">
              <span style="font-size: 32px; font-weight: 800; color: #F57E24; font-family: var(--font-display);">${slide.stat}</span>
              <span style="font-size: 14px; color: var(--landing-text-soft); text-align: left; line-height: 1.3; max-width: 140px;">${slide.statLabel}</span>
            </div>
            `
                : ''
            }
            ${
              slide.solution
                ? `
            <div style="font-size: 26px; color: #059669; line-height: 1.4; font-weight: 600; background: linear-gradient(135deg, rgba(5, 150, 105, 0.08), rgba(5, 150, 105, 0.03)); border-left: 4px solid #059669; padding: 16px 24px; border-radius: 0 12px 12px 0;">
              <span style="color: #059669; margin-right: 8px;">✓</span> ${slide.solution}
            </div>
            `
                : ''
            }
          </div>
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildAppListSlide(slide: Slide, post: Post): string {
    const appsHTML = (slide.apps || [])
      .map(
        (app: { icon: string; name: string; desc: string }) => `
      <div style="background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92)); border: 1px solid var(--landing-border); border-radius: 16px; padding: 24px; display: flex; align-items: center; gap: 16px; box-shadow: var(--landing-shadow);">
        <div style="width: 56px; height: 56px; background: linear-gradient(135deg, rgba(245, 126, 36, 0.15) 0%, rgba(245, 126, 36, 0.08) 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(245, 126, 36, 0.25); flex-shrink: 0;">
          <div style="width: 28px; height: 28px; color: var(--gs-orange);">${iconSVGs[app.icon] || iconSVGs['dumbbell']}</div>
        </div>
        <div>
          <div style="font-size: 20px; font-weight: 700; color: var(--landing-text); margin-bottom: 4px; font-family: var(--font-display);">${app.name}</div>
          <div style="font-size: 15px; color: var(--landing-text-muted); line-height: 1.4;">${app.desc}</div>
        </div>
      </div>
    `,
      )
      .join('');

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 class="post-title" style="font-size: 48px; line-height: 1.15; margin-bottom: 12px;">${slide.title}</h1>
          <p class="post-subtitle" style="font-size: 22px; color: var(--landing-text-soft);">${slide.subtitle}</p>
        </div>
        <div class="post-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <div style="display: flex; flex-direction: column; gap: 16px;">
            ${appsHTML}
          </div>
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildCostBreakdownSlide(slide: Slide, post: Post): string {
    const costItemsHTML = (slide.costs || [])
      .map(
        (item) => `
      <div style="display: flex; justify-content: space-between; align-items: center; background: ${item.label?.includes('Total') ? 'linear-gradient(180deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))' : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92))'}; border: 1px solid ${item.label?.includes('Total') ? 'rgba(239, 68, 68, 0.2)' : 'var(--landing-border)'}; border-radius: 16px; padding: 24px 28px; box-shadow: var(--landing-shadow);">
        <span style="font-size: 18px; font-weight: 600; color: ${item.label?.includes('Total') ? '#dc2626' : 'var(--landing-text)'};">${item.label || item.item}</span>
        <span style="font-size: 24px; font-weight: 800; color: ${item.label?.includes('Total') ? '#dc2626' : 'var(--gs-orange)'}; font-family: var(--font-display);">${item.value || item.cost}</span>
      </div>
    `,
      )
      .join('');

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(239, 68, 68, 0.05)); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 50px; padding: 10px 20px; margin-bottom: 16px;">
            <span style="font-size: 18px;">💸</span>
            <span style="font-size: 14px; font-weight: 700; color: #dc2626;">Tu dinero se va aquí</span>
          </div>
          <h1 class="post-title" style="font-size: 48px; line-height: 1.15; margin-bottom: 12px;">${slide.title}</h1>
          <p class="post-subtitle" style="font-size: 22px; color: var(--landing-text-soft);">${slide.subtitle}</p>
        </div>
        <div class="post-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 16px;">
          ${costItemsHTML}
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildSolutionShowcaseSlide(slide: Slide, post: Post): string {
    const featuresHTML = (slide.features || [])
      .map(
        (feature: { icon: string; title: string; desc: string }) => `
      <div style="display: flex; align-items: flex-start; gap: 16px; background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92)); border: 1px solid var(--landing-border); border-radius: 16px; padding: 24px; box-shadow: var(--landing-shadow);">
        <div style="width: 52px; height: 52px; background: linear-gradient(135deg, rgba(245, 126, 36, 0.15) 0%, rgba(245, 126, 36, 0.08) 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(245, 126, 36, 0.25); flex-shrink: 0;">
          <div style="width: 26px; height: 26px; color: var(--gs-orange);">${iconSVGs[feature.icon] || iconSVGs['dumbbell']}</div>
        </div>
        <div>
          <div style="font-size: 20px; font-weight: 700; color: var(--landing-text); margin-bottom: 6px; font-family: var(--font-display);">${feature.title}</div>
          <div style="font-size: 15px; color: var(--landing-text-muted); line-height: 1.5;">${feature.desc}</div>
        </div>
      </div>
    `,
      )
      .join('');

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(5, 150, 105, 0.12), rgba(5, 150, 105, 0.05)); border: 1px solid rgba(5, 150, 105, 0.2); border-radius: 50px; padding: 10px 20px; margin-bottom: 16px;">
            <span style="font-size: 18px;">✓</span>
            <span style="font-size: 14px; font-weight: 700; color: #059669;">La Solución Integral</span>
          </div>
          <h1 class="post-title" style="font-size: 48px; line-height: 1.15; margin-bottom: 12px;">${slide.title}</h1>
          <p class="post-subtitle" style="font-size: 22px; color: var(--landing-text-soft);">${slide.subtitle}</p>
        </div>
        <div class="post-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 16px;">
          ${featuresHTML}
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildBenefitsSlide(slide: Slide, post: Post): string {
    const benefitsHTML = (slide.benefits || [])
      .map(
        (benefit: { icon: string; title: string; desc: string }) => `
      <div style="background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92)); border: 1px solid var(--landing-border); border-radius: 20px; padding: 32px 24px; text-align: center; box-shadow: var(--landing-shadow);">
        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, rgba(245, 126, 36, 0.15) 0%, rgba(245, 126, 36, 0.08) 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; border: 1px solid rgba(245, 126, 36, 0.25);">
          <div style="width: 32px; height: 32px; color: var(--gs-orange);">${iconSVGs[benefit.icon] || iconSVGs['dumbbell']}</div>
        </div>
        <div style="font-size: 22px; font-weight: 700; color: var(--landing-text); margin-bottom: 10px; font-family: var(--font-display);">${benefit.title}</div>
        <div style="font-size: 16px; color: var(--landing-text-muted); line-height: 1.5;">${benefit.desc}</div>
      </div>
    `,
      )
      .join('');

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 class="post-title" style="font-size: 48px; line-height: 1.15; margin-bottom: 12px;">${slide.title}</h1>
          <p class="post-subtitle" style="font-size: 22px; color: var(--landing-text-soft);">${slide.subtitle}</p>
        </div>
        <div class="post-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <div style="display: grid; grid-template-columns: repeat(${slide.benefits?.length === 3 ? '3' : '2'}, 1fr); gap: 20px;">
            ${benefitsHTML}
          </div>
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildCenterFocusSlide(slide: Slide, post: Post): string {
    const statValue =
      typeof slide.stat === 'object' && slide.stat && 'value' in slide.stat
        ? (slide.stat as { value: string }).value
        : typeof slide.stat === 'string'
          ? slide.stat
          : '';
    const statLabel =
      typeof slide.stat === 'object' && slide.stat && 'label' in slide.stat
        ? (slide.stat as { label: string }).label
        : slide.statLabel || '';

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px; justify-content: center; align-items: center; text-align: center;">
        <h1 class="post-title" style="font-size: 96px; margin-bottom: 24px; line-height: 1;">${statValue}</h1>
        <p class="post-subtitle" style="margin-bottom: 16px; font-size: 28px; font-weight: 600;">${statLabel}</p>
        <p style="font-size: 22px; color: var(--landing-text-muted); max-width: 600px; line-height: 1.5;">${slide.subtitle}</p>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildGrowthJourneySlide(slide: Slide, post: Post): string {
    const growthStat =
      typeof slide.stat === 'object' && slide.stat && 'from' in slide.stat
        ? (slide.stat as { from: string; to: string; period: string; growth: string })
        : null;

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          ${
            slide.badge
              ? `
          <div style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(5, 150, 105, 0.12), rgba(5, 150, 105, 0.05)); border: 1px solid rgba(5, 150, 105, 0.2); border-radius: 50px; padding: 10px 20px; margin-bottom: 16px;">
            <span style="font-size: 18px;">🏆</span>
            <span style="font-size: 14px; font-weight: 700; color: #059669;">${slide.badge}</span>
          </div>
          `
              : ''
          }
          <h1 class="post-title" style="font-size: 48px; line-height: 1.15; margin-bottom: 12px;">${slide.title}</h1>
          <p class="post-subtitle" style="font-size: 22px; color: var(--landing-text-soft);">${slide.subtitle}</p>
        </div>
        <div class="post-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 32px;">
          ${
            growthStat
              ? `
          <div style="display: flex; align-items: center; justify-content: center; gap: 24px;">
            <div style="text-align: center;">
              <div style="font-size: 48px; font-weight: 800; color: var(--landing-text-muted); font-family: var(--font-display);">${growthStat.from}</div>
              <div style="font-size: 14px; color: var(--landing-text-muted);">socios</div>
            </div>
            <div style="font-size: 36px; color: var(--gs-orange);">→</div>
            <div style="text-align: center;">
              <div style="font-size: 72px; font-weight: 800; color: var(--gs-orange); font-family: var(--font-display);">${growthStat.to}</div>
              <div style="font-size: 14px; color: var(--landing-text-muted);">socios</div>
            </div>
          </div>
          <div style="display: flex; gap: 32px;">
            <div style="background: linear-gradient(135deg, rgba(245, 126, 36, 0.12), rgba(245, 126, 36, 0.05)); border: 1px solid rgba(245, 126, 36, 0.25); border-radius: 16px; padding: 16px 28px;">
              <div style="font-size: 32px; font-weight: 800; color: #F57E24; font-family: var(--font-display);">${growthStat.growth}</div>
              <div style="font-size: 14px; color: var(--landing-text-soft);">crecimiento</div>
            </div>
            <div style="background: linear-gradient(135deg, rgba(245, 126, 36, 0.12), rgba(245, 126, 36, 0.05)); border: 1px solid rgba(245, 126, 36, 0.25); border-radius: 16px; padding: 16px 28px;">
              <div style="font-size: 32px; font-weight: 800; color: #F57E24; font-family: var(--font-display);">${growthStat.period}</div>
              <div style="font-size: 14px; color: var(--landing-text-soft);">tiempo</div>
            </div>
          </div>
          `
              : ''
          }
          ${slide.location ? `<div style="font-size: 18px; color: var(--landing-text-muted);">📍 ${slide.location}</div>` : ''}
          ${
            slide.testimonial
              ? `
          <div style="background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92)); border: 1px solid var(--landing-border); border-radius: 20px; padding: 28px 36px; max-width: 700px; box-shadow: var(--landing-shadow);">
            <div style="font-size: 22px; color: var(--landing-text); line-height: 1.5; font-style: italic; margin-bottom: 16px;">"${slide.testimonial.quote}"</div>
            <div style="font-size: 16px; color: var(--landing-text-muted);">— ${slide.testimonial.author}</div>
          </div>
          `
              : ''
          }
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildFeatureFocusSlide(slide: Slide, post: Post): string {
    const featuresHTML = (slide.features || [])
      .map(
        (feature: { icon: string; title: string; desc: string }) => `
      <div style="background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 249, 241, 0.92)); border: 1px solid var(--landing-border); border-radius: 20px; padding: 36px 28px; text-align: center; box-shadow: var(--landing-shadow);">
        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, rgba(245, 126, 36, 0.15) 0%, rgba(245, 126, 36, 0.08) 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; border: 1px solid rgba(245, 126, 36, 0.25);">
          <div style="width: 32px; height: 32px; color: var(--gs-orange);">${iconSVGs[feature.icon] || iconSVGs['dumbbell']}</div>
        </div>
        <div style="font-size: 22px; font-weight: 700; color: var(--landing-text); margin-bottom: 10px; font-family: var(--font-display);">${feature.title}</div>
        <div style="font-size: 16px; color: var(--landing-text-muted); line-height: 1.5;">${feature.desc}</div>
      </div>
    `,
      )
      .join('');

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 class="post-title" style="font-size: 48px; line-height: 1.15; margin-bottom: 12px;">${slide.title}</h1>
          <p class="post-subtitle" style="font-size: 22px; color: var(--landing-text-soft);">${slide.subtitle}</p>
        </div>
        <div class="post-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
          <div style="display: grid; grid-template-columns: repeat(${slide.features?.length === 3 ? '3' : '2'}, 1fr); gap: 20px;">
            ${featuresHTML}
          </div>
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildComparisonInsightSlide(slide: Slide, post: Post): string {
    const beforeItems = (slide.before?.items || [])
      .map(
        (item: string) => `
      <li style="padding: 10px 0; font-size: 17px; color: #dc2626;"><span style="margin-right: 10px;">✕</span> ${item}</li>
    `,
      )
      .join('');

    const afterItems = (slide.after?.items || [])
      .map(
        (item: string) => `
      <li style="padding: 10px 0; font-size: 17px; color: #059669;"><span style="margin-right: 10px;">✓</span> ${item}</li>
    `,
      )
      .join('');

    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 8px 40px 0;">
        <div style="text-align: left; margin-bottom: 14px;">
          <h1 class="post-title" style="font-size: 52px; line-height: 1.12; margin-bottom: 8px;">${slide.title}</h1>
          <p class="post-subtitle" style="font-size: 22px; color: var(--landing-text-soft);">${slide.subtitle}</p>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="background: linear-gradient(180deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02)); border: 2px solid rgba(239, 68, 68, 0.2); border-radius: 20px; padding: 24px;">
              <div style="font-size: 24px; font-weight: 700; color: #dc2626; margin-bottom: 14px; font-family: var(--font-display);">${slide.before?.title}</div>
              <ul style="list-style: none;">
                ${beforeItems}
              </ul>
            </div>
            <div style="background: linear-gradient(180deg, rgba(5, 150, 105, 0.08), rgba(5, 150, 105, 0.02)); border: 2px solid rgba(5, 150, 105, 0.2); border-radius: 20px; padding: 24px;">
              <div style="font-size: 24px; font-weight: 700; color: #059669; margin-bottom: 14px; font-family: var(--font-display);">${slide.after?.title}</div>
              <ul style="list-style: none;">
                ${afterItems}
              </ul>
            </div>
          </div>
          ${
            slide.insight
              ? `
          <div style="margin-top: 24px; background: linear-gradient(135deg, rgba(245, 126, 36, 0.1), rgba(245, 126, 36, 0.03)); border: 1px solid rgba(245, 126, 36, 0.2); border-radius: 16px; padding: 20px 28px; text-align: center;">
            <div style="font-size: 15px; color: var(--landing-text-soft); line-height: 1.5;">${slide.insight}</div>
          </div>
          `
              : ''
          }
        <div style="flex: 1;"></div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildTwoColSlide(slide: Slide, post: Post): string {
    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px;">
        <h1 class="post-title" style="margin-bottom: 16px; font-size: 48px;">${slide.title}</h1>
        <p class="post-subtitle" style="margin-bottom: 32px; font-size: 24px;">${slide.subtitle}</p>
        <div class="post-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          ${slide.content || ''}
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private buildDefaultSlide(slide: Slide, post: Post): string {
    return `
      <div style="flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 0 40px;">
        <h1 class="post-title" style="margin-bottom: 20px; font-size: 56px;">${slide.title}</h1>
        <p class="post-subtitle" style="margin-bottom: 32px; font-size: 24px;">${slide.subtitle}</p>
        <div class="post-body" style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          ${slide.content || ''}
        </div>
        ${this.buildCTA(post)}
      </div>
    `;
  }

  private splitTitleWithAccent(title: string): string {
    return title;
  }

  private updateUI(): void {
    const post = this.getCurrentPost();
    if (!post) return;

    const postTitle = this.getElement('postTitle');
    const postCounter = this.getElement('postCounter');

    if (postTitle) postTitle.textContent = post.title;
    if (postCounter) {
      const publicationIds = this.getPublicationPostIds();
      const currentIndex = publicationIds.indexOf(this.state.currentPostId);
      const currentPosition = currentIndex >= 0 ? currentIndex + 1 : this.state.currentPostId;
      postCounter.textContent = `${currentPosition} / ${publicationIds.length}`;
    }

    this.updateZoom();
  }
}

// Export for global access
declare global {
  interface Window {
    PostBuilderApp: typeof PostBuilderApp;
  }
}

window.PostBuilderApp = PostBuilderApp;
