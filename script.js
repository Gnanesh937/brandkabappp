// script.js
// Global cart array holds objects: { id, name, price, qty }
const cart = [];

// DOM elements
const productGrid = document.getElementById('product-grid');
const cartItemsList = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const cartCountEl = document.getElementById('cart-count');
const cartEmptyMessage = document.getElementById('cart-empty-message');
const placeOrderBtn = document.getElementById('place-order');
const cartToggleBtn = document.getElementById('cart-toggle');
const shoppingCartEl = document.getElementById('shopping-cart');
const closeCartBtn = document.getElementById('close-cart');
const yearEl = document.getElementById('year');

// Set current year
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Utility: format currency
function formatCurrency(value) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
  } catch (e) {
    return '$' + value.toFixed(2);
  }
}

// Find product details from card element
function getProductFromCard(cardEl) {
  return {
    id: cardEl.dataset.id,
    name: cardEl.dataset.name,
    price: parseFloat(cardEl.dataset.price),
    desc: cardEl.dataset.desc || ''
  };
}

// Add product to cart (increment quantity if exists)
function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  }
  renderCart();
}

// Remove product from cart entirely
function removeFromCart(productId) {
  const idx = cart.findIndex(item => item.id === productId);
  if (idx >= 0) {
    cart.splice(idx, 1);
    renderCart();
  }
}

// Calculate total
function calculateTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

// Render cart UI
function renderCart() {
  // Update count
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  cartCountEl.textContent = totalQty;

  // Toggle empty message
  if (cart.length === 0) {
    cartEmptyMessage.style.display = '';
    cartItemsList.innerHTML = '';
    placeOrderBtn.disabled = true;
  } else {
    cartEmptyMessage.style.display = 'none';
    placeOrderBtn.disabled = false;

    // Clear and repopulate list
    cartItemsList.innerHTML = '';
    cart.forEach(item => {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.setAttribute('data-id', item.id);

      const left = document.createElement('div');
      left.className = 'cart-item-left';

      const name = document.createElement('p');
      name.className = 'cart-item-name';
      name.textContent = `${item.name}`;

      const meta = document.createElement('p');
      meta.className = 'cart-item-meta';
      meta.textContent = `Price: ${formatCurrency(item.price)} · Qty: ${item.qty}`;

      left.appendChild(name);
      left.appendChild(meta);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-item';
      removeBtn.textContent = 'Remove';
      removeBtn.setAttribute('aria-label', `Remove ${item.name} from cart`);
      removeBtn.addEventListener('click', () => {
        removeFromCart(item.id);
        // Focus back to cart toggle for keyboard users
        cartToggleBtn.focus();
      });

      li.appendChild(left);
      li.appendChild(removeBtn);
      cartItemsList.appendChild(li);
    });
  }

  // Update total
  const total = calculateTotal();
  cartTotalEl.textContent = formatCurrency(total);

  // ARIA: announce update via live region attributes already set
}

// Event delegation for Add to Cart buttons
productGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.add-to-cart');
  if (!btn) return;

  const card = btn.closest('.product-card');
  if (!card) return;

  const product = getProductFromCard(card);
  addToCart(product);

  // Give brief visual feedback
  btn.textContent = 'Added';
  btn.disabled = true;
  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = 'Add to Cart';
  }, 800);
});

// Also allow Enter key on product card to add to cart (accessibility)
productGrid.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const card = e.target.closest('.product-card');
    if (card) {
      const product = getProductFromCard(card);
      addToCart(product);
    }
  }
});

// Place order via WhatsApp
placeOrderBtn.addEventListener('click', () => {
  if (cart.length === 0) return;

  const phone = '1234567890'; // placeholder without '+' for wa.me
  let message = 'Hello, I would like to place an order:%0A'; // %0A newline safe string for wa.me link
  cart.forEach(item => {
    message += `• ${item.name} (ID: ${item.id}) x ${item.qty} — ${formatCurrency(item.price * item.qty)}%0A`;
  });
  const total = calculateTotal();
  message += `%0ATotal: ${formatCurrency(total)}%0A`;
  message += `%0AShipping & payment instructions: [please add any request here]%0A`;
  message += `%0ACustomer: [Your name]%0AContact: [Your phone/email]`;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(decodeURIComponent(message))}`;
  // Open in new tab
  window.open(url, '_blank', 'noopener');
});

// Cart toggle for small screens
cartToggleBtn.addEventListener('click', () => {
  const expanded = cartToggleBtn.getAttribute('aria-expanded') === 'true';
  cartToggleBtn.setAttribute('aria-expanded', String(!expanded));
  // For mobile, toggle class open to slide in/out
  shoppingCartEl.classList.toggle('open');
});

// Close cart button (mobile)
closeCartBtn.addEventListener('click', () => {
  shoppingCartEl.classList.remove('open');
  cartToggleBtn.setAttribute('aria-expanded', 'false');
  cartToggleBtn.focus();
});

// Clicking outside the cart on small screens closes cart
document.addEventListener('click', (e) => {
  const isClickInside = shoppingCartEl.contains(e.target) || cartToggleBtn.contains(e.target);
  // Only on small screens
  if (window.matchMedia('(max-width: 640px)').matches && !isClickInside) {
    if (shoppingCartEl.classList.contains('open')) {
      shoppingCartEl.classList.remove('open');
      cartToggleBtn.setAttribute('aria-expanded', 'false');
    }
  }
});

// Keyboard accessibility: ESC closes cart on small screens
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (shoppingCartEl.classList.contains('open')) {
      shoppingCartEl.classList.remove('open');
      cartToggleBtn.setAttribute('aria-expanded', 'false');
      cartToggleBtn.focus();
    }
  }
});

// Initial render
renderCart();