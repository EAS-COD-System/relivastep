/* ============================================
RELIVASTEP — script.js
Cart management, upsell modals, UI helpers
============================================ */

// ── Product catalogue ──────────────────────
const PRODUCTS = {
foot: {
id: ‘foot’,
name: ‘ReviveMate Foot Massager’,
desc: ‘EMS foot therapy — 6 modes’,
price: 3499,
img: ‘assets/hero-foot.jpeg’,
},
body: {
id: ‘body’,
name: ‘ReliefKit Body Massager’,
desc: ‘5-in-1 full body percussion’,
price: 2999,
img: ‘assets/hero-body.jpeg’,
}
};

const DISCOUNTS = {
foot_in_cart:  { id: ‘body’, discountedPrice: 1999, saving: 1000 },
body_in_cart:  { id: ‘foot’, discountedPrice: 2499, saving: 1000 },
};

// ── Cart persistence ────────────────────────
function getCart() {
try {
return JSON.parse(localStorage.getItem(‘relivastep_cart’) || ‘[]’);
} catch { return []; }
}

function saveCart(cart) {
localStorage.setItem(‘relivastep_cart’, JSON.stringify(cart));
updateCartCount();
}

function addToCart(productId, customPrice = null) {
const cart = getCart();
const existing = cart.find(i => i.id === productId);
if (existing) {
existing.qty += 1;
} else {
const product = PRODUCTS[productId];
cart.push({
id: productId,
name: product.name,
desc: product.desc,
price: customPrice !== null ? customPrice : product.price,
originalPrice: product.price,
img: product.img,
qty: 1,
});
}
saveCart(cart);
updateCartCount();
}

function removeFromCart(productId) {
const cart = getCart().filter(i => i.id !== productId);
saveCart(cart);
if (typeof renderCart === ‘function’) renderCart();
}

function updateQuantity(productId, delta) {
const cart = getCart();
const item = cart.find(i => i.id === productId);
if (!item) return;
item.qty = Math.max(1, item.qty + delta);
saveCart(cart);
if (typeof renderCart === ‘function’) renderCart();
}

function updateCartCount() {
const cart = getCart();
const total = cart.reduce((sum, i) => sum + i.qty, 0);
document.querySelectorAll(’.cart-count’).forEach(el => {
el.textContent = total;
el.style.display = total > 0 ? ‘flex’ : ‘none’;
});
}

function cartTotal() {
return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function cartOriginalTotal() {
return getCart().reduce((sum, i) => sum + i.originalPrice * i.qty, 0);
}

// ── Upsell modal ────────────────────────────
let modalDismissed = false;

function showUpsellModal(triggerProductId) {
if (modalDismissed) return;
const offer = DISCOUNTS[triggerProductId + ‘_in_cart’];
if (!offer) return;

const upsellProduct = PRODUCTS[offer.id];
const modal = document.getElementById(‘upsell-modal’);
if (!modal) return;

// Populate modal
document.getElementById(‘modal-product-img’).src = upsellProduct.img;
document.getElementById(‘modal-product-name’).textContent = upsellProduct.name;
document.getElementById(‘modal-sale-price’).textContent = ’KES ’ + offer.discountedPrice.toLocaleString();
document.getElementById(‘modal-orig-price’).textContent = ’KES ’ + upsellProduct.price.toLocaleString();
document.getElementById(‘modal-save-tag’).textContent = ’Save KES ’ + offer.saving.toLocaleString();

// Accept button action
const acceptBtn = document.getElementById(‘modal-accept’);
acceptBtn.onclick = function () {
addToCart(offer.id, offer.discountedPrice);
closeModal();
showToast(‘🎉 ’ + upsellProduct.name + ’ added to cart!’);
};

modal.classList.add(‘active’);
}

function closeModal() {
const modal = document.getElementById(‘upsell-modal’);
if (modal) modal.classList.remove(‘active’);
modalDismissed = true;
}

// ── Toast notification ──────────────────────
function showToast(message) {
const existing = document.querySelector(’.toast’);
if (existing) existing.remove();

const toast = document.createElement(‘div’);
toast.className = ‘toast’;
toast.textContent = message;
toast.style.cssText = `position:fixed; bottom:100px; right:24px; z-index:9999; background:var(--navy); color:white; padding:14px 22px; border-radius:12px; font-size:0.9rem; font-weight:600; box-shadow:0 8px 32px rgba(30,42,94,0.3); transform:translateY(20px); opacity:0; transition:all 0.3s ease; font-family:var(--font-body); border-left:4px solid var(--teal); max-width:300px;`;
document.body.appendChild(toast);
requestAnimationFrame(() => {
toast.style.transform = ‘translateY(0)’;
toast.style.opacity = ‘1’;
});
setTimeout(() => {
toast.style.transform = ‘translateY(20px)’;
toast.style.opacity = ‘0’;
setTimeout(() => toast.remove(), 300);
}, 3200);
}

// ── Add to cart handler (landing pages) ────
function handleAddToCart(productId) {
addToCart(productId);
showToast(‘✓ Added to cart!’);
setTimeout(() => showUpsellModal(productId), 600);
}

// ── Cart page renderer ──────────────────────
function renderCart() {
const cart = getCart();
const container = document.getElementById(‘cart-items’);
const summaryContainer = document.getElementById(‘cart-summary-content’);
const emptyState = document.getElementById(‘cart-empty’);
const cartContent = document.getElementById(‘cart-content’);

if (!container) return;

if (cart.length === 0) {
if (emptyState) emptyState.style.display = ‘block’;
if (cartContent) cartContent.style.display = ‘none’;
return;
}

if (emptyState) emptyState.style.display = ‘none’;
if (cartContent) cartContent.style.display = ‘grid’;

// Render cart items
container.innerHTML = ‘’;
cart.forEach(item => {
const isSaved = item.price < item.originalPrice;
const saving = (item.originalPrice - item.price) * item.qty;
const card = document.createElement(‘div’);
card.className = ‘cart-item-card fade-up visible’;
card.innerHTML = `<img src="${item.img}" alt="${item.name}" class="cart-item-img" onerror="this.style.background='#e0f5f5'"> <div class="cart-item-details"> <div class="cart-item-name">${item.name}</div> <div class="cart-item-desc">${item.desc}</div> <div class="qty-row"> <div class="qty-controls"> <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button> <span class="qty-display">${item.qty}</span> <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button> </div> <button class="remove-btn" onclick="removeFromCart('${item.id}')">🗑 Remove</button> </div> </div> <div class="cart-item-price"> <div class="cart-item-unit">KES ${(item.price * item.qty).toLocaleString()}</div> ${isSaved ?`<div class="cart-item-original">KES ${(item.originalPrice * item.qty).toLocaleString()}</div>
<div class="cart-item-saved">Save KES ${saving.toLocaleString()}</div>`: ''} </div>`;
container.appendChild(card);
});

// Cart bump — offer missing product
renderCartBump(cart);

// Summary
if (summaryContainer) renderSummary(cart);
}

function renderCartBump(cart) {
const bumpContainer = document.getElementById(‘cart-bump’);
if (!bumpContainer) return;

const ids = cart.map(i => i.id);
const hasFoot = ids.includes(‘foot’);
const hasBody = ids.includes(‘body’);

if (hasFoot && hasBody) {
bumpContainer.innerHTML = ‘’;
return;
}

let offerProductId, discountedPrice, saving;
if (hasFoot && !hasBody) {
offerProductId = ‘body’; discountedPrice = 1999; saving = 1000;
} else if (hasBody && !hasFoot) {
offerProductId = ‘foot’; discountedPrice = 2499; saving = 1000;
} else {
bumpContainer.innerHTML = ‘’;
return;
}

const product = PRODUCTS[offerProductId];
bumpContainer.innerHTML = `<div class="cart-bump-card"> <div class="cart-bump-tag">🔥 Upgrade Offer — One-Time Deal</div> <div class="cart-bump-row"> <img src="${product.img}" alt="${product.name}" class="cart-bump-img" onerror="this.style.background='#e0f5f5'"> <div class="cart-bump-details"> <div class="cart-bump-name">${product.name}</div> <div class="cart-bump-desc">${product.desc}</div> <div class="cart-bump-price-row"> <span class="cart-bump-price">KES ${discountedPrice.toLocaleString()}</span> <span class="cart-bump-orig">KES ${product.price.toLocaleString()}</span> <span class="cart-bump-save">Save KES ${saving.toLocaleString()}</span> </div> <button class="btn btn-primary btn-sm" onclick="addBumpProduct('${offerProductId}', ${discountedPrice})"> + Add to Order </button> </div> </div> </div>`;
}

function addBumpProduct(productId, price) {
addToCart(productId, price);
renderCart();
showToast(‘🎉 Added to your order!’);
}

function renderSummary(cart) {
const container = document.getElementById(‘cart-summary-content’);
if (!container) return;

const subtotal = cartTotal();
const original = cartOriginalTotal();
const savings = original - subtotal;
const shipping = subtotal >= 2000 ? 0 : 200;

container.innerHTML = `<div class="summary-line"><span>Subtotal</span><span>KES ${subtotal.toLocaleString()}</span></div> ${savings > 0 ?`<div class="summary-line"><span>Your Savings</span><span class="savings">−KES ${savings.toLocaleString()}</span></div>`: ''} <div class="summary-line"><span>Delivery</span><span>${shipping === 0 ? '<span style="color:var(--green);font-weight:600">FREE</span>' : 'KES ' + shipping}</span></div> <div class="summary-line total"><span>Total</span><span>KES ${(subtotal + shipping).toLocaleString()}</span></div>`;
}

// ── Demo checkout ────────────────────────────
function handleCheckout() {
const phoneInput = document.getElementById(‘phone-input’);
const nameInput = document.getElementById(‘name-input’);
const phone = phoneInput ? phoneInput.value.trim() : ‘’;
const name = nameInput ? nameInput.value.trim() : ‘’;
const cart = getCart();

if (!name) {
phoneInput && nameInput && nameInput.focus();
showToast(‘⚠️ Please enter your full name’);
return;
}

const phoneRegex = /^(07|01)\d{8}$/;
if (!phoneRegex.test(phone)) {
if (phoneInput) phoneInput.focus();
showToast(‘⚠️ Enter a valid Kenyan number (07XXXXXXXX)’);
return;
}

if (cart.length === 0) {
showToast(‘Your cart is empty!’);
return;
}

const itemsList = cart.map(i =>
`• ${i.name} × ${i.qty} — KES ${(i.price * i.qty).toLocaleString()}`
).join(’\n’);

const total = cartTotal();
const shipping = total >= 2000 ? 0 : 200;

alert(
`✅ ORDER PLACED SUCCESSFULLY!
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Name: ${name}
📱 Phone: ${phone}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${itemsList}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚚 Shipping: ${shipping === 0 ? ‘FREE’ : ’KES ’ + shipping}
💰 TOTAL: KES ${(total + shipping).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Expected delivery: 1–3 business days
💚 Payment via M-PESA on delivery

Thank you, ${name}! Our team will call
you within 2 hours to confirm. 🇰🇪`
);

localStorage.removeItem(‘relivastep_cart’);
updateCartCount();
window.location.href = ‘index.html’;
}

// ── FAQ accordion ────────────────────────────
function initFAQ() {
document.querySelectorAll(’.faq-question’).forEach(btn => {
btn.addEventListener(‘click’, () => {
const item = btn.closest(’.faq-item’);
const isOpen = item.classList.contains(‘open’);
document.querySelectorAll(’.faq-item.open’).forEach(el => el.classList.remove(‘open’));
if (!isOpen) item.classList.add(‘open’);
});
});
}

// ── Scroll animations ────────────────────────
function initScrollAnimations() {
const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
entry.target.classList.add(‘visible’);
}
});
}, { threshold: 0.1, rootMargin: ‘0px 0px -40px 0px’ });

document.querySelectorAll(’.fade-up’).forEach(el => observer.observe(el));
}

// ── Init ──────────────────────────────────────
document.addEventListener(‘DOMContentLoaded’, () => {
updateCartCount();
initFAQ();
initScrollAnimations();

// Modal close on backdrop click
const modal = document.getElementById(‘upsell-modal’);
if (modal) {
modal.addEventListener(‘click’, e => {
if (e.target === modal) closeModal();
});
}

// Cart page init
if (document.getElementById(‘cart-items’)) {
renderCart();
}
});
