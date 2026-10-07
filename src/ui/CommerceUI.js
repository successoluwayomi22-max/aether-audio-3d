import { PRODUCT, formatPrice, getFinish } from '../commerce/productData.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_RE = /^[A-Za-z0-9][A-Za-z0-9\s-]{2,11}$/;
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;

export class CommerceUI {
  constructor({ store, onFinishChange, onInspect, onResetView, onViewMode }) {
    this.store = store;
    this.onFinishChange = onFinishChange;
    this.onInspect = onInspect;
    this.onResetView = onResetView;
    this.onViewMode = onViewMode;
    this.finishId = PRODUCT.finishes[0].id;
    this.quantity = 1;
    this.viewMode = '3d';
    this.unsubscribe = this.store.subscribe(() => this.renderState());
    this.bind();
    this.renderState();
  }

  bind() {
    document.querySelectorAll('[data-finish]').forEach((btn) => {
      btn.addEventListener('click', () => this.selectFinish(btn.dataset.finish));
    });

    const qtyInput = document.getElementById('qty-input');
    const qtyDown = document.getElementById('qty-down');
    const qtyUp = document.getElementById('qty-up');
    if (qtyDown) qtyDown.addEventListener('click', () => this.setQuantity(this.quantity - 1));
    if (qtyUp) qtyUp.addEventListener('click', () => this.setQuantity(this.quantity + 1));
    if (qtyInput) {
      qtyInput.addEventListener('change', () => this.setQuantity(Number(qtyInput.value)));
    }

    const addBtn = document.getElementById('add-to-cart-btn');
    if (addBtn) addBtn.addEventListener('click', () => this.addToCart());

    const buyBtn = document.getElementById('buy-now-btn');
    if (buyBtn) {
      buyBtn.addEventListener('click', () => {
        this.addToCart();
        this.openCheckout();
      });
    }

    const wishBtn = document.getElementById('wishlist-btn');
    if (wishBtn) {
      wishBtn.addEventListener('click', () => {
        this.store.toggleWishlist(this.finishId);
      });
    }

    document.getElementById('cart-open-btn')?.addEventListener('click', () => this.openCart());
    document.getElementById('mobile-cart-btn')?.addEventListener('click', () => this.openCart());
    document.getElementById('cart-close-btn')?.addEventListener('click', () => this.closeCart());
    document.getElementById('cart-backdrop')?.addEventListener('click', () => this.closeCart());
    document.getElementById('continue-shopping-btn')?.addEventListener('click', () => this.closeCart());
    document.getElementById('checkout-open-btn')?.addEventListener('click', () => this.openCheckout());

    document.getElementById('checkout-close-btn')?.addEventListener('click', () => this.closeCheckout());
    document.getElementById('checkout-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      this.submitCheckout();
    });

    document.getElementById('reset-view-btn')?.addEventListener('click', () => this.onResetView?.());
    document.getElementById('inspect-btn')?.addEventListener('click', () => this.onInspect?.(true));
    document.getElementById('mobile-inspect-btn')?.addEventListener('click', () => this.onInspect?.(true));
    document.getElementById('mobile-home-btn')?.addEventListener('click', () => {
      this.onInspect?.(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.querySelectorAll('[data-view-mode]').forEach((btn) => {
      btn.addEventListener('click', () => this.setViewMode(btn.dataset.viewMode));
    });

    document.getElementById('cart-lines')?.addEventListener('click', (event) => {
      const target = event.target.closest('[data-cart-action]');
      if (!target) return;
      const { cartAction, finish } = target.dataset;
      if (cartAction === 'inc') this.store.setQuantity(finish, this.itemQty(finish) + 1);
      if (cartAction === 'dec') this.store.setQuantity(finish, this.itemQty(finish) - 1);
      if (cartAction === 'remove') this.store.remove(finish);
    });

    this.selectFinish(this.finishId, { silent: true });
  }

  itemQty(finishId) {
    return this.store.items.find((item) => item.finishId === finishId)?.quantity || 0;
  }

  selectFinish(id, { silent } = {}) {
    this.finishId = getFinish(id).id;
    document.querySelectorAll('[data-finish]').forEach((btn) => {
      btn.classList.toggle('is-selected', btn.dataset.finish === this.finishId);
      btn.setAttribute('aria-pressed', String(btn.dataset.finish === this.finishId));
    });
    const finish = getFinish(this.finishId);
    const label = document.getElementById('selected-finish-label');
    if (label) label.textContent = finish.name;
    if (!silent) this.onFinishChange?.(this.finishId);
    this.renderState();
  }

  setQuantity(value) {
    this.quantity = Math.max(1, Math.min(9, Number(value) || 1));
    const input = document.getElementById('qty-input');
    if (input) input.value = String(this.quantity);
  }

  addToCart() {
    const finish = getFinish(this.finishId);
    this.store.addItem({
      id: PRODUCT.id,
      sku: PRODUCT.sku,
      name: PRODUCT.fullName,
      finishId: finish.id,
      finishName: finish.name,
      price: PRODUCT.price,
      quantity: this.quantity
    });
    this.showToast(`${PRODUCT.name} added to cart`);
    this.openCart();
  }

  setViewMode(mode) {
    this.viewMode = mode === 'image' ? 'image' : '3d';
    document.querySelectorAll('[data-view-mode]').forEach((btn) => {
      btn.classList.toggle('is-selected', btn.dataset.viewMode === this.viewMode);
    });
    document.getElementById('product-still')?.classList.toggle('is-visible', this.viewMode === 'image');
    this.onViewMode?.(this.viewMode);
  }

  openCart() {
    document.getElementById('cart-drawer')?.classList.add('is-open');
    document.getElementById('cart-backdrop')?.classList.add('is-open');
    document.getElementById('cart-drawer')?.setAttribute('aria-hidden', 'false');
  }

  closeCart() {
    document.getElementById('cart-drawer')?.classList.remove('is-open');
    document.getElementById('cart-backdrop')?.classList.remove('is-open');
    document.getElementById('cart-drawer')?.setAttribute('aria-hidden', 'true');
  }

  openCheckout() {
    if (this.store.items.length === 0) {
      this.showToast('Your cart is empty');
      return;
    }
    this.closeCart();
    const overlay = document.getElementById('checkout-overlay');
    overlay?.classList.add('is-open');
    overlay?.setAttribute('aria-hidden', 'false');
    this.showCheckoutStep('form');
  }

  closeCheckout() {
    const overlay = document.getElementById('checkout-overlay');
    overlay?.classList.remove('is-open');
    overlay?.setAttribute('aria-hidden', 'true');
  }

  showCheckoutStep(step) {
    document.getElementById('checkout-form-panel')?.classList.toggle('is-hidden', step !== 'form');
    document.getElementById('checkout-confirm-panel')?.classList.toggle('is-hidden', step !== 'confirm');
  }

  validateCheckout(form) {
    const errors = {};
    const values = Object.fromEntries(new FormData(form).entries());
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'region', 'postal', 'country'];
    required.forEach((key) => {
      if (!String(values[key] || '').trim()) errors[key] = 'Required';
    });
    if (values.email && !EMAIL_RE.test(values.email.trim())) errors.email = 'Enter a valid email';
    if (values.phone && !PHONE_RE.test(values.phone.trim())) errors.phone = 'Enter a valid phone number';
    if (values.postal && !ZIP_RE.test(values.postal.trim())) errors.postal = 'Enter a valid postal code';
    return { values, errors };
  }

  renderFieldErrors(errors) {
    document.querySelectorAll('[data-error-for]').forEach((el) => {
      const key = el.dataset.errorFor;
      el.textContent = errors[key] || '';
    });
  }

  submitCheckout() {
    const form = document.getElementById('checkout-form');
    if (!form) return;
    const { values, errors } = this.validateCheckout(form);
    this.renderFieldErrors(errors);
    if (Object.keys(errors).length) {
      this.showToast('Please correct the highlighted fields');
      return;
    }

    const order = this.store.savePendingOrder({
      customer: {
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim()
      },
      delivery: {
        address: values.address.trim(),
        city: values.city.trim(),
        region: values.region.trim(),
        postal: values.postal.trim(),
        country: values.country.trim()
      }
    });

    document.getElementById('confirm-order-id').textContent = order.id;
    document.getElementById('confirm-order-total').textContent = formatPrice(order.total);
    document.getElementById('confirm-order-email').textContent = order.customer.email;
    this.showCheckoutStep('confirm');
  }

  showToast(message) {
    const toast = document.getElementById('app-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  renderState() {
    const snap = this.store.snapshot();
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = String(snap.count);
      el.hidden = snap.count === 0;
    });

    const wishBtn = document.getElementById('wishlist-btn');
    if (wishBtn) {
      const on = this.store.isWishlisted(this.finishId);
      wishBtn.classList.toggle('is-active', on);
      wishBtn.setAttribute('aria-pressed', String(on));
      wishBtn.title = on ? 'Remove from wishlist' : 'Save to wishlist';
    }

    const lines = document.getElementById('cart-lines');
    if (lines) {
      if (snap.items.length === 0) {
        lines.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
      } else {
        lines.innerHTML = snap.items
          .map(
            (item) => `
          <article class="cart-line">
            <div>
              <strong>${item.name}</strong>
              <span>${item.finishName}</span>
            </div>
            <div class="cart-line-controls">
              <button type="button" data-cart-action="dec" data-finish="${item.finishId}" aria-label="Decrease quantity">−</button>
              <span>${item.quantity}</span>
              <button type="button" data-cart-action="inc" data-finish="${item.finishId}" aria-label="Increase quantity">+</button>
              <button type="button" class="cart-remove" data-cart-action="remove" data-finish="${item.finishId}">Remove</button>
            </div>
            <div class="cart-line-price">${formatPrice(item.price * item.quantity)}</div>
          </article>`
          )
          .join('');
      }
    }

    document.querySelectorAll('[data-cart-subtotal]').forEach((el) => {
      el.textContent = formatPrice(snap.subtotal);
    });
    const checkoutBtn = document.getElementById('checkout-open-btn');
    if (checkoutBtn) checkoutBtn.disabled = snap.items.length === 0;

    const summary = document.getElementById('checkout-summary-lines');
    if (summary) {
      summary.innerHTML = snap.items
        .map(
          (item) =>
            `<div class="summary-row"><span>${item.name} · ${item.finishName} × ${item.quantity}</span><span>${formatPrice(item.price * item.quantity)}</span></div>`
        )
        .join('');
    }
  }

  destroy() {
    this.unsubscribe?.();
  }
}
