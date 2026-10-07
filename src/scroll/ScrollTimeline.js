import Lenis from 'lenis';

/**
 * Orchestrates scroll-driven progression using Lenis for smooth inertia.
 * Maps total page scroll [0..1] across the 7 extended sections and product choreography.
 */
export class ScrollTimeline {
  constructor(options = {}) {
    this.onUpdateCallback = options.onUpdate || (() => {});
    this.progress = 0;
    this.paused = false;

    this.sections = document.querySelectorAll('.story-section');
    this.sectionCount = this.sections.length || 6;
    this.trackerThumb = document.getElementById('scroll-thumb');
    this.trackerCurrent = document.getElementById('tracker-current');
    this.navLinks = document.querySelectorAll('.nav-link');

    this.initLenis();
    this.bindNavEvents();
  }

  initLenis() {
    this.lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.95
    });

    this.lenis.on('scroll', () => {
      if (this.paused) return;
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      this.progress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;

      this.updateUI();
      this.onUpdateCallback(this.progress);
    });
  }

  bindNavEvents() {
    this.navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPercent = parseFloat(link.getAttribute('data-target') || '0');
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const targetScroll = targetPercent * maxScroll;

        this.lenis.scrollTo(targetScroll, {
          duration: 1.6
        });
      });
    });

    const brandLogo = document.getElementById('nav-brand-logo');
    if (brandLogo) {
      brandLogo.addEventListener('click', (e) => {
        e.preventDefault();
        this.lenis.scrollTo(0, { duration: 1.6 });
      });
    }

    const modal = document.getElementById('reserve-modal');
    const bottomCta = document.getElementById('bottom-pill-cta');
    if (bottomCta) {
      bottomCta.addEventListener('click', () => {
        document.getElementById('add-to-cart-btn')?.click();
      });
    }

    const navReserve = document.getElementById('nav-reserve-btn');
    if (navReserve) {
      navReserve.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('cart-open-btn')?.click();
      });
    }

    const primaryCta = document.getElementById('primary-cta-btn');
    if (primaryCta) {
      primaryCta.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('add-to-cart-btn')?.click();
      });
    }

    const modalClose = document.getElementById('modal-close-btn');
    if (modalClose && modal) {
      modalClose.addEventListener('click', () => {
        modal.close();
      });
    }
  }

  updateUI() {
    // 1. Update Tracker Thumb
    if (this.trackerThumb) {
      const trackHeight = 140 - 20;
      this.trackerThumb.style.transform = `translateY(${this.progress * trackHeight}px)`;
    }

    // 2. Active Section Index across 7 sections
    const slice = 1 / this.sectionCount;
    const sectionIndex = Math.min(Math.floor(this.progress / slice), this.sectionCount - 1);

    if (this.trackerCurrent) {
      this.trackerCurrent.textContent = String(sectionIndex + 1).padStart(2, '0');
    }

    // 3. Highlight Nav Links
    this.navLinks.forEach((link) => {
      const targetPercent = parseFloat(link.getAttribute('data-target') || '0');
      const diff = Math.abs(this.progress - targetPercent);
      if (diff < slice * 0.7) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // 4. Staggered Section Opacity Transitions
    this.sections.forEach((section, idx) => {
      const start = idx * slice;
      const end = (idx + 1) * slice;
      const isActive = (this.progress >= start - 0.04 && this.progress <= end + 0.04);

      if (isActive) {
        section.classList.add('is-active');
      } else {
        section.classList.remove('is-active');
      }
    });
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
    if (this.paused) this.lenis.stop();
    else this.lenis.start();
  }

  tick(time) {
    if (!this.paused) this.lenis.raf(time);
  }
}
