const CART_KEY = 'void-cart-v1';
const WISHLIST_KEY = 'void-wishlist-v1';
const ORDER_KEY = 'void-pending-order-v1';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can fail in private mode; keep in-memory state.
  }
}

export class CartStore {
  constructor() {
    this.listeners = new Set();
    this.items = Array.isArray(readJson(CART_KEY, [])) ? readJson(CART_KEY, []) : [];
    this.wishlist = Array.isArray(readJson(WISHLIST_KEY, [])) ? readJson(WISHLIST_KEY, []) : [];
    this.pendingOrder = readJson(ORDER_KEY, null);
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    writeJson(CART_KEY, this.items);
    writeJson(WISHLIST_KEY, this.wishlist);
    this.listeners.forEach((fn) => fn(this.snapshot()));
  }

  snapshot() {
    const subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return {
      items: this.items.map((item) => ({ ...item })),
      wishlist: [...this.wishlist],
      count: this.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      total: subtotal,
      pendingOrder: this.pendingOrder
    };
  }

  addItem(product) {
    const quantity = Math.max(1, Math.min(9, Number(product.quantity) || 1));
    const existing = this.items.find(
      (item) => item.id === product.id && item.finishId === product.finishId
    );
    if (existing) {
      existing.quantity = Math.min(9, existing.quantity + quantity);
    } else {
      this.items.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        finishId: product.finishId,
        finishName: product.finishName,
        price: product.price,
        quantity
      });
    }
    this.emit();
  }

  setQuantity(finishId, quantity) {
    const item = this.items.find((entry) => entry.finishId === finishId);
    if (!item) return;
    const next = Math.max(0, Math.min(9, Number(quantity) || 0));
    if (next === 0) {
      this.items = this.items.filter((entry) => entry.finishId !== finishId);
    } else {
      item.quantity = next;
    }
    this.emit();
  }

  remove(finishId) {
    this.items = this.items.filter((entry) => entry.finishId !== finishId);
    this.emit();
  }

  clear() {
    this.items = [];
    this.emit();
  }

  toggleWishlist(finishId) {
    if (this.wishlist.includes(finishId)) {
      this.wishlist = this.wishlist.filter((id) => id !== finishId);
    } else {
      this.wishlist = [...this.wishlist, finishId];
    }
    this.emit();
    return this.wishlist.includes(finishId);
  }

  isWishlisted(finishId) {
    return this.wishlist.includes(finishId);
  }

  savePendingOrder(order) {
    this.pendingOrder = {
      ...order,
      id: `VOID-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      paymentStatus: 'not_processed',
      items: this.items.map((item) => ({ ...item })),
      total: this.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    };
    writeJson(ORDER_KEY, this.pendingOrder);
    this.emit();
    return this.pendingOrder;
  }

  clearPendingOrder() {
    this.pendingOrder = null;
    try {
      localStorage.removeItem(ORDER_KEY);
    } catch {
      /* ignore */
    }
    this.emit();
  }
}
