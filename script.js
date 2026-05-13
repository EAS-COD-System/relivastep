// PRODUCTS
const PRODUCTS = {
  foot: { id: 'foot', name: 'ReviveMate Foot Massager', price: 3499, img: 'https://cdn.shopify.com/s/files/1/0825/6864/2859/files/IMG_7617.jpg?v=1778708181' },
  body: { id: 'body', name: 'ReliefKit Body Massager', price: 2999, img: 'https://cdn.shopify.com/s/files/1/0825/6864/2859/files/IMG_7611.jpg?v=1778708181' }
};

// Cart functions
function getCart() { return JSON.parse(localStorage.getItem('relivastep_cart') || '[]'); }
function saveCart(cart) { localStorage.setItem('relivastep_cart', JSON.stringify(cart)); refreshCartBadge(); }

function addToCart(id, customPrice) {
  const cart = getCart();
  const product = PRODUCTS[id];
  if (!product) return;
  const price = customPrice !== undefined ? customPrice : product.price;
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, name: product.name, price, qty: 1, img: product.img });
  saveCart(cart);
  showToast(`${product.name} added to cart!`);
}

function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter(i => i.id !== id);
  saveCart(cart);
  if (typeof renderCartPage === 'function') renderCartPage();
}

function updateQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) removeFromCart(id);
    else saveCart(cart);
    if (typeof renderCartPage === 'function') renderCartPage();
  }
}

function refreshCartBadge() {
  const total = getCart().reduce((s,i) => s + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(el => el.textContent = total);
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed; bottom:20px; right:20px; background:#0B1A3A; color:white; padding:12px 20px; border-radius:30px; z-index:9999; transition:0.3s; opacity:0;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => toast.style.opacity = '0', 2500);
}

function handleAdd(id) {
  addToCart(id);
  setTimeout(() => {
    const cart = getCart();
    const other = id === 'foot' ? 'body' : 'foot';
    const alreadyHasOther = cart.some(i => i.id === other);
    if (!alreadyHasOther) {
      const discountPrice = other === 'body' ? 1999 : 2499;
      if (confirm(`Add ${PRODUCTS[other].name} for only KES ${discountPrice} (save KES 1000)?`)) {
        addToCart(other, discountPrice);
      }
    }
  }, 500);
}

function renderCartPage() {
  const cart = getCart();
  const emptyDiv = document.getElementById('cart-empty');
  const contentDiv = document.getElementById('cart-content');
  if (!cart.length) {
    if (emptyDiv) emptyDiv.style.display = 'block';
    if (contentDiv) contentDiv.style.display = 'none';
    return;
  }
  if (emptyDiv) emptyDiv.style.display = 'none';
  if (contentDiv) contentDiv.style.display = 'block';

  const container = document.getElementById('cart-items');
  if (!container) return;
  let html = '';
  cart.forEach(item => {
    html += `<div class="cart-item">
      <img src="${item.img}" alt="${item.name}">
      <div style="flex:1">
        <strong>${item.name}</strong><br>
        <span>KES ${item.price}</span>
        <div style="margin-top:8px;">
          <button onclick="updateQty('${item.id}', -1)">-</button>
          <span style="margin:0 12px;">${item.qty}</span>
          <button onclick="updateQty('${item.id}', 1)">+</button>
          <button style="margin-left:12px;" onclick="removeFromCart('${item.id}')">Remove</button>
        </div>
      </div>
      <div><strong>KES ${item.price * item.qty}</strong></div>
    </div>`;
  });
  container.innerHTML = html;

  const subtotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 2000 ? 0 : 200;
  const total = subtotal + shipping;
  document.getElementById('cart-summary').innerHTML = `
    <div>Subtotal: KES ${subtotal}</div>
    <div>Delivery: ${shipping === 0 ? 'FREE' : 'KES '+shipping}</div>
    <div style="font-weight:800; margin-top:12px;">Total: KES ${total}</div>
  `;
}

function checkout() {
  const cart = getCart();
  if (!cart.length) return alert('Cart empty');
  const name = document.getElementById('fullname')?.value.trim();
  const phone = document.getElementById('phone')?.value.trim();
  const town = document.getElementById('town')?.value.trim();
  if (!name || !phone) return alert('Please enter your name and phone number');
  if (!/^(07|01)\d{8}$/.test(phone)) return alert('Enter a valid Kenyan phone number (07XXXXXXXX)');

  const subtotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 2000 ? 0 : 200;
  const total = subtotal + shipping;
  const items = cart.map(i => `${i.name} x${i.qty}`).join(', ');
  alert(`✅ Order received!\n\nCustomer: ${name}\nPhone: ${phone}\nArea: ${town||'Nairobi'}\nItems: ${items}\nTotal: KES ${total}\n\nYou will pay on delivery. Our team will call you within 2 hours to confirm.\n\nAsante sana! 🇰🇪`);
  localStorage.removeItem('relivastep_cart');
  renderCartPage();
  refreshCartBadge();
  window.location.href = '/';
}

// FAQ accordion (simple)
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      item.classList.toggle('active');
      const sign = q.querySelector('span');
      if (sign) sign.textContent = item.classList.contains('active') ? '−' : '+';
    });
  });
});
