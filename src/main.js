import { SceneManager } from './scene/SceneManager.js';
import { ScrollTimeline } from './scroll/ScrollTimeline.js';
import { HUDOverlay } from './ui/HUDOverlay.js';
import { CartStore } from './commerce/CartStore.js';
import { getFinish } from './commerce/productData.js';
import { CommerceUI } from './ui/CommerceUI.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('webgl-container');
  if (!container) return;

  const sceneManager = new SceneManager(container);
  const hudOverlay = new HUDOverlay(sceneManager);
  const store = new CartStore();

  const scrollTimeline = new ScrollTimeline({
    onUpdate: (progress) => {
      sceneManager.setScrollProgress(progress);
      hudOverlay.update(progress);
    }
  });

  sceneManager.setScrollProgress(0);
  hudOverlay.update(0);
  scrollTimeline.updateUI();
  sceneManager.setFinish(getFinish('whitesmoke'));

  const commerce = new CommerceUI({
    store,
    onFinishChange: (id) => sceneManager.setFinish(getFinish(id)),
    onInspect: (enabled) => {
      sceneManager.setInspectMode(enabled);
      scrollTimeline.setPaused(Boolean(enabled));
    },
    onResetView: () => {
      sceneManager.resetView();
      sceneManager.setInspectMode(false);
      scrollTimeline.setPaused(false);
    },
    onViewMode: (mode) => {
      sceneManager.setViewEnabled(mode === '3d');
    }
  });

  const reserveForm = document.getElementById('reserve-form');
  const finishSelect = document.getElementById('input-finish');
  if (reserveForm) {
    reserveForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const mapped = {
        whitesmoke: 'whitesmoke',
        'matte-charcoal': 'charcoal',
        'olive-titanium': 'olive'
      };
      const finishId = mapped[finishSelect?.value] || 'whitesmoke';
      commerce.selectFinish(finishId);
      commerce.addToCart();
      document.getElementById('reserve-modal')?.close();
      commerce.openCheckout();
    });
  }

  if (finishSelect) {
    finishSelect.addEventListener('change', () => {
      const mapped = {
        whitesmoke: 'whitesmoke',
        'matte-charcoal': 'charcoal',
        'olive-titanium': 'olive'
      };
      commerce.selectFinish(mapped[finishSelect.value] || 'whitesmoke');
    });
  }

  const menuBtn = document.getElementById('menu-matrix-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
    });
  }

  let running = true;
  function animate(timestamp) {
    if (!running) return;
    const time = timestamp * 0.001;
    scrollTimeline.tick(timestamp);
    sceneManager.render(time);
    hudOverlay.update(scrollTimeline.progress);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  requestAnimationFrame(() => {
    document.getElementById('loading-veil')?.classList.add('is-gone');
  });

  document.getElementById('checkout-done-btn')?.addEventListener('click', () => {
    commerce.closeCheckout();
  });

  window.addEventListener('pagehide', () => {
    running = false;
    commerce.destroy();
    sceneManager.earbuds?.dispose();
  });
});
