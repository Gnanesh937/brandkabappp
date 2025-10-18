// script.js
// Global cart: array of {id, name, price, qty}
const cart = [];

// Elements
const productGrid = document.getElementById('product-grid');
const cartToggle = document.getElementById('cart-toggle');
const cartBadge = document.getElementById('cart-badge');
const cartPanel = document.getElementById('cart-panel');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartBtn = document.getElementById('close-cart');
const clearCartBtn = document.getElementById('clear-cart');
const cartList = document.getElementById('cart-list');
const emptyMessage = document.getElementById('empty-message');
const subtotalAmt = document.getElementById('subtotal-amt');
const totalAmt = document.getElementById('total-amt');
const placeOrderBtn = document.getElementById('place-order');
const yearEl = document.getElementById('year');

if (yearEl) yearEl.textContent = new Date().getFullYear();

/* Utility: format currency */
function formatCurrency(num) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(num);
  } catch (e) {
    return '$' + num.toFixed(2);
  }
}

/* Product helpers */
function readProductFromCard(card) {
  return {
    id: card.dataset.id,
    name: card.dataset.name,
    price: Number(card.dataset.price || 0),
    desc: card.dataset.desc || ''
  };
}

function readQtyInput(id) {
  const input = document.getElementById(`qty-${id}`);
  if (!input) return 1;
  let val = parseInt(input.value, 10);
  if (Number.isNaN(val) || val < 1) val = 1;
  input.value = val;
  return val;
}

/* Cart operations */
function addToCart(product, qty = 1) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, qty });
  }
  renderCart();
}

function removeFromCart(id) {
  const idx = cart.findIndex(i => i.id === id);
  if (idx > -1) {
    cart.splice(idx, 1);
    renderCart();
  }
}

function clearCart() {
  cart.length = 0;
  renderCart();
}

function calculateSubtotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

/* Render cart UI */
function renderCart() {
  // Badge count: total items
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  cartBadge.textContent = totalItems;

  // Empty view
  if (cart.length === 0) {
    emptyMessage.style.display = '';
    cartList.innerHTML = '';
    placeOrderBtn.disabled = true;
    subtotalAmt.textContent = formatCurrency(0);
    totalAmt.textContent = formatCurrency(0);
    return;
  }
  emptyMessage.style.display = 'none';
  cartList.innerHTML = '';

  cart.forEach(item => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.setAttribute('data-id', item.id);

    const left = document.createElement('div');
    left.className = 'left';

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = `${item.name}`;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${formatCurrency(item.price)} × ${item.qty} = ${formatCurrency(item.price * item.qty)}`;

    left.appendChild(name);
    left.appendChild(meta);

    // Actions (remove)
    const actions = document.createElement('div');
    actions.className = 'item-actions';

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-item';
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.setAttribute('aria-label', `Remove ${item.name} from cart`);
    removeBtn.addEventListener('click', () => {
      removeFromCart(item.id);
      cartToggle.focus();
    });

    actions.appendChild(removeBtn);

    li.appendChild(left);
    li.appendChild(actions);
    cartList.appendChild(li);
  });

  const subtotal = calculateSubtotal();
  subtotalAmt.textContent = formatCurrency(subtotal);
  // For demo, subtotal == total (no taxes/shipping); but leaving a separate field
  totalAmt.textContent = formatCurrency(subtotal);
  placeOrderBtn.disabled = false;
}

/* Event delegation: Add to cart buttons & qty +/- */
productGrid.addEventListener('click', (e) => {
  const addBtn = e.target.closest('.btn-add');
  const incr = e.target.closest('.qty-incr');
  const decr = e.target.closest('.qty-decr');

  if (incr) {
    const id = incr.dataset.for;
    const input = document.getElementById(`qty-${id}`);
    if (input) input.value = Math.max(1, parseInt(input.value || '1', 10) + 1);
    return;
  }
  if (decr) {
    const id = decr.dataset.for;
    const input = document.getElementById(`qty-${id}`);
    if (input) input.value = Math.max(1, parseInt(input.value || '1', 10) - 1);
    return;
  }
  if (!addBtn) return;

  // find product card
  const card = addBtn.closest('.card');
  if (!card) return;
  const product = readProductFromCard(card);
  const qty = readQtyInput(product.id);
  addToCart(product, qty);

  // simple feedback
  addBtn.disabled = true;
  const prev = addBtn.textContent;
  addBtn.textContent = 'Added';
  setTimeout(() => {
    addBtn.disabled = false;
    addBtn.textContent = prev;
  }, 700);
});

/* Cart panel toggling and accessibility (focus trap) */
let lastFocusedEl = null;

function openCart() {
  lastFocusedEl = document.activeElement;
  cartPanel.setAttribute('aria-hidden', 'false');
  cartOverlay.classList.remove('hidden');
  cartOverlay.setAttribute('aria-hidden', 'false');
  cartToggle.setAttribute('aria-expanded', 'true');

  // make first focusable element in cart focused
  const focusables = getFocusableElements(cartPanel);
  if (focusables.length) {
    focusables[0].focus();
  }
  document.addEventListener('focus', maintainFocus, true);
  document.addEventListener('keydown', handleKeyDown);
}

function closeCart() {
  cartPanel.setAttribute('aria-hidden', 'true');
  cartOverlay.classList.add('hidden');
  cartOverlay.setAttribute('aria-hidden', 'true');
  cartToggle.setAttribute('aria-expanded', 'false');

  document.removeEventListener('focus', maintainFocus, true);
  document.removeEventListener('keydown', handleKeyDown);

  // restore focus
  if (lastFocusedEl) lastFocusedEl.focus();
}

cartToggle.addEventListener('click', () => {
  const hidden = cartPanel.getAttribute('aria-hidden') === 'true';
  if (hidden) openCart();
  else closeCart();
});

closeCartBtn.addEventListener('click', () => {
  closeCart();
});

cartOverlay.addEventListener('click', () => {
  closeCart();
});

function getFocusableElements(container) {
  if (!container) return [];
  const selectors = [
    'a[href]:not([disabled])',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ];
  return Array.from(container.querySelectorAll(selectors.join(','))).filter(el => el.offsetParent !== null);
}

// Keep focus trapped inside cart when open
function maintainFocus(e) {
  if (cartPanel.getAttribute('aria-hidden') === 'true') return;
  if (!cartPanel.contains(e.target)) {
    e.stopPropagation();
    const focusables = getFocusableElements(cartPanel);
    if (focusables.length) focusables[0].focus();
  }
}

// Handle keyboard: ESC to close, TAB cycling
function handleKeyDown(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeCart();
    return;
  }
  if (e.key === 'Tab') {
    const focusables = getFocusableElements(cartPanel);
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

/* Clear cart */
clearCartBtn.addEventListener('click', () => {
  clearCart();
  cartToggle.focus();
});

/* Place order via WhatsApp */
placeOrderBtn.addEventListener('click', () => {
  if (cart.length === 0) return;
  // Build message
  let message = 'Hello, I would like to place an order.%0A';
  cart.forEach(item => {
    message += `• ${item.name} (ID: ${item.id}) x ${item.qty}%0A`;
  });
  const subtotal = calculateSubtotalForMessage();
  message += `%0ASubtotal: ${formatCurrency(subtotal)}%0A`;
  message += `%0ATotal: ${formatCurrency(subtotal)}%0A`;
  message += `%0AShipping instructions: [add here]%0A`;
  message += `%0AName: [your name]%0AContact: [your phone/email]`;

  // Placeholder number: +1234567890 (for wa.me, use digits only)
  const phone = '1234567890';
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(decodeURIComponent(message))}`;
  window.open(url, '_blank', 'noopener');
});

/* Helper to compute subtotal for message */
function calculateSubtotalForMessage() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

/* Initial render */
renderCart();

/* Keyboard usability for product cards: Enter adds with chosen qty */
productGrid.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const card = e.target.closest('.card');
    if (!card) return;
    const addButton = card.querySelector('.btn-add');
    if (addButton) addButton.click();
  }
});

/* Ensure inputs are valid numbers on blur */
productGrid.addEventListener('focusout', (e) => {
  const input = e.target.closest('.qty-input');
  if (!input) return;
  let val = parseInt(input.value, 10);
  if (Number.isNaN(val) || val < 1) val = 1;
  input.value = val;
});

/* Accessibility: allow Esc to close overlay when cart open (global listener) */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && cartPanel.getAttribute('aria-hidden') === 'false') {
    closeCart();
  }
});
