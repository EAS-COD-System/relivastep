/* ============================================================
RELIVASTEP — script.js
Cart, upsell modal, FAQ, scroll animations, toast
============================================================ */

‘use strict’;

/* ── Products catalogue ─────────────────── */
const PRODUCTS = {
foot: {
id: ‘foot’,
name: ‘ReviveMate Foot Massager’,
desc: ‘EMS foot therapy • 6 modes’,
price: 3499,
img: ‘https://cdn.shopify.com/s/files/1/0825/6864/2859/files/IMG_7617.jpg?v=1778708181’,
},
body: {
id: ‘body’,
name: ‘ReliefKit Body Massager’,
desc: ‘5-in-1 full body EMS’,
price: 2999,
img: ‘https://cdn.shopify.com/s/files/1/0825/6864/2859/files/IMG_7611.jpg?v=1778708181’,
}
};

/* Upsell offers when product X is in cart */
const UPSELL = {
foot: { id: ‘body’, price: 1999, saving: 1000 },
body: { id: ‘foot’, price: 2499, saving: 1000 },
};

/* ── Cart helpers ───────────────────────── */
function getCart() {
try { return JSON.parse(localStorage.getItem(‘rs_cart’) || ‘[]’); }
catch { return []; }
}

function saveCart(cart) {
localStorage.setItem(‘rs_cart’, JSON.stringify(cart));
refreshBadge();
}

function addToCart(productId, customPrice) {
const cart = getCart();
const p = PRODUCTS[productId];
if (!p) return;
const existing = cart.find(i => i.id === productId);
if (existing) {
existing.qty += 1;
} else {
cart.push({
id: productId,
name: p.name,
desc: p.desc,
price: customPrice != null ? customPrice : p.price,
originalPrice: p.price,
img: p.img,
qty: 1,
});
}
saveCart(cart);
refreshBadge();
}

function removeFromCart(productId) {
saveCart(getCart().filter(i => i.id !== productId));
if (typeof renderCart === ‘function’) renderCart();
}

function updateQty(productId, delta) {
const cart = getCart();
const item = cart.find(i => i.id === productId);
if (!item) return;
item.qty = Math.max(1, item.qty + delta);
saveCart(cart);
if (typeof renderCart === ‘function’) renderCart();
}

function refreshBadge() {
const total = getCart().reduce((s, i) => s + i.qty, 0);
document.querySelectorAll(’.cart-badge’).forEach(el => {
el.textContent = total;
el.style.display = total > 0 ? ‘flex’ : ‘none’;
});
}

function cartSubtotal() {
return getCart().reduce((s, i) => s + i.price * i.qty, 0);
}
function cartOrigTotal() {
return getCart().reduce((s, i) => s + i.originalPrice * i.qty, 0);
}

/* ── Toast ──────────────────────────────── */
let toastTimer;
function showToast(msg) {
let el = document.getElementById(‘rs-toast’);
if (!el) {
el = document.createElement(‘div’);
el.id = ‘rs-toast’;
el.className = ‘toast’;
document.body.appendChild(el);
}
el.textContent = msg;
el.classList.add(‘show’);
clearTimeout(toastTimer);
toastTimer = setTimeout(() => el.classList.remove(‘show’), 3200);
}

/* ── Upsell modal ───────────────────────── */
let modalDismissed = false;

function openModal(triggerProductId) {
if (modalDismissed) return;
const offer = UPSELL[triggerProductId];
if (!offer) return;
const modal = document.getElementById(‘upsell-modal’);
if (!modal) return;
const p = PRODUCTS[offer.id];

document.getElementById(‘modal-img’).src           = p.img;
document.getElementById(‘modal-name’).textContent  = p.name;
document.getElementById(‘modal-sale’).textContent  = ’KES ’ + offer.price.toLocaleString();
document.getElementById(‘modal-orig’).textContent  = ’KES ’ + p.price.toLocaleString();
document.getElementById(‘modal-save’).textContent  = ’Save KES ’ + offer.saving.toLocaleString();

document.getElementById(‘modal-accept’).onclick = () => {
addToCart(offer.id, offer.price);
closeModal();
showToast(’🎉 ’ + p.name + ’ added at KES ’ + offer.price.toLocaleString() + ‘!’);
};

modal.classList.add(‘active’);
}

function closeModal() {
const modal = document.getElementById(‘upsell-modal’);
if (modal) modal.classList.remove(‘active’);
modalDismissed = true;
}

/* ── Main add-to-cart handler ───────────── */
function handleAdd(productId) {
addToCart(productId);
showToast(‘✓ Added to cart!’);
setTimeout(() => openModal(productId), 700);
}

/* ── Cart page renderer ─────────────────── */
function renderCart() {
const cart = getCart();
const wrap = document.getElementById(‘cart-items’);
const emptyEl = document.getElementById(‘cart-empty’);
const contentEl = document.getElementById(‘cart-content’);
if (!wrap) return;

if (cart.length === 0) {
if (emptyEl)   emptyEl.style.display = ‘block’;
if (contentEl) contentEl.style.display = ‘none’;
return;
}
if (emptyEl)   emptyEl.style.display = ‘none’;
if (contentEl) contentEl.style.display = ‘grid’;

/* Items */
wrap.innerHTML = ‘’;
cart.forEach(item => {
const saved = (item.originalPrice - item.price) * item.qty;
const div = document.createElement(‘div’);
div.className = ‘cart-item’;
div.innerHTML = `<img src="${item.img}" alt="${item.name}" class="cart-item-img" onerror="this.style.background='var(--teal-pale)'"> <div class="cart-item-details"> <div class="cart-item-name">${item.name}</div> <div class="cart-item-desc">${item.desc}</div> <div class="qty-row"> <div class="qty-ctrl"> <button class="qty-btn" onclick="updateQty('${item.id}',-1)">−</button> <span class="qty-num">${item.qty}</span> <button class="qty-btn" onclick="updateQty('${item.id}',1)">+</button> </div> <button class="remove-btn" onclick="removeFromCart('${item.id}')">🗑 Remove</button> </div> </div> <div class="cart-item-price"> <div class="item-price">KES ${(item.price * item.qty).toLocaleString()}</div> ${saved > 0 ?`<div class="item-was">KES ${(item.originalPrice * item.qty).toLocaleString()}</div>
<div class="item-saved">−KES ${saved.toLocaleString()}</div>`: ''} </div>`;
wrap.appendChild(div);
});

renderBump(cart);
renderSummary(cart);
}

function renderBump(cart) {
const el = document.getElementById(‘cart-bump’);
if (!el) return;
const ids = cart.map(i => i.id);
const hasFoot = ids.includes(‘foot’);
const hasBody = ids.includes(‘body’);

if (hasFoot && hasBody) { el.innerHTML = ‘’; return; }

let offerId, offerPrice, saving;
if (hasFoot && !hasBody) { offerId = ‘body’; offerPrice = 1999; saving = 1000; }
else if (hasBody && !hasFoot) { offerId = ‘foot’; offerPrice = 2499; saving = 1000; }
else { el.innerHTML = ‘’; return; }

const p = PRODUCTS[offerId];
el.innerHTML = `<div class="cart-bump"> <div class="cart-bump-tag">🔥 One-Time Bundle Upgrade</div> <div class="cart-bump-row"> <img src="${p.img}" alt="${p.name}" class="cart-bump-img" onerror="this.style.background='var(--teal-pale)'"> <div class="cart-bump-details"> <div class="cart-bump-name">${p.name}</div> <div class="cart-bump-desc">${p.desc}</div> <div class="cart-bump-pr"> <span class="bump-price">KES ${offerPrice.toLocaleString()}</span> <span class="bump-orig">KES ${p.price.toLocaleString()}</span> <span class="bump-save">Save KES ${saving.toLocaleString()}</span> </div> <button class="btn btn--gold btn--sm" onclick="addBump('${offerId}',${offerPrice})"> + Add to Order </button> </div> </div> </div>`;
}

function addBump(productId, price) {
addToCart(productId, price);
renderCart();
showToast(‘🎉 Added to your order!’);
}

function renderSummary(cart) {
const el = document.getElementById(‘cart-summary-lines’);
if (!el) return;
const sub = cartSubtotal();
const orig = cartOrigTotal();
const savings = orig - sub;
const ship = sub >= 2000 ? 0 : 200;
el.innerHTML = `<div class="summary-row"><span>Subtotal</span><span>KES ${sub.toLocaleString()}</span></div> ${savings > 0 ?`<div class="summary-row"><span>Savings</span><span class="saved">−KES ${savings.toLocaleString()}</span></div>`: ''} <div class="summary-row"><span>Delivery</span><span>${ship === 0 ? '<span style="color:var(--green);font-weight:700">FREE</span>' : 'KES ' + ship}</span></div> <div class="summary-row total"><span>Total</span><span>KES ${(sub + ship).toLocaleString()}</span></div>`;
}

/* ── Demo checkout ──────────────────────── */
function handleCheckout() {
const nameEl  = document.getElementById(‘f-name’);
const phoneEl = document.getElementById(‘f-phone’);
const townEl  = document.getElementById(‘f-town’);
const name  = nameEl  ? nameEl.value.trim()  : ‘’;
const phone = phoneEl ? phoneEl.value.trim() : ‘’;
const town  = townEl  ? townEl.value.trim()  : ‘Nairobi’;
const cart  = getCart();

if (!name)  { showToast(‘⚠️ Please enter your full name’); nameEl && nameEl.focus(); return; }
if (!/^(07|01)\d{8}$/.test(phone)) {
showToast(‘⚠️ Enter a valid number (07XXXXXXXX)’);
phoneEl && phoneEl.focus(); return;
}
if (cart.length === 0) { showToast(‘Your cart is empty!’); return; }

const sub  = cartSubtotal();
const ship = sub >= 2000 ? 0 : 200;
const lines = cart.map(i =>
`• ${i.name} × ${i.qty}  →  KES ${(i.price*i.qty).toLocaleString()}`
).join(’\n’);

alert(`✅ ORDER CONFIRMED!
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${name}
📱 ${phone}
📍 ${town || ‘Nairobi’}
━━━━━━━━━━━━━━━━━━━━━━━━━━
${lines}
━━━━━━━━━━━━━━━━━━━━━━━━━━
🚚 Delivery: ${ship === 0 ? ‘FREE’ : ’KES ’ + ship}
💰 TOTAL: KES ${(sub + ship).toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Delivery: 1–3 business days
💚 Pay via M-PESA on delivery

Our team will call you within
2 hours to confirm. Asante! 🇰🇪`);

localStorage.removeItem(‘rs_cart’);
refreshBadge();
window.location.href = ‘index.html’;
}

/* ── FAQ accordion ──────────────────────── */
function initFAQ() {
document.querySelectorAll(’.faq-q’).forEach(btn => {
btn.addEventListener(‘click’, () => {
const item = btn.closest(’.faq-item’);
const isOpen = item.classList.contains(‘open’);
document.querySelectorAll(’.faq-item.open’).forEach(el => el.classList.remove(‘open’));
if (!isOpen) item.classList.add(‘open’);
});
});
}

/* ── Scroll reveal ──────────────────────── */
function initReveal() {
if (!(‘IntersectionObserver’ in window)) {
document.querySelectorAll(’.reveal’).forEach(el => el.classList.add(‘visible’));
return;
}
const obs = new IntersectionObserver(entries => {
entries.forEach(e => { if (e.isIntersecting) e.target.classList.add(‘visible’); });
}, { threshold: 0.1, rootMargin: ‘0px 0px -40px 0px’ });
document.querySelectorAll(’.reveal’).forEach(el => obs.observe(el));
}

/* ── Init ────────────────────────────────── */
document.addEventListener(‘DOMContentLoaded’, () => {
refreshBadge();
initFAQ();
initReveal();

/* Modal backdrop close */
const modal = document.getElementById(‘upsell-modal’);
if (modal) modal.addEventListener(‘click’, e => { if (e.target === modal) closeModal(); });

/* Cart page */
if (document.getElementById(‘cart-items’)) renderCart();
});
