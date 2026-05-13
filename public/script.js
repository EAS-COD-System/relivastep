// Cart functions
function getCart() {
    const cart = localStorage.getItem('relivastep_cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('relivastep_cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(product, customPrice = null) {
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);
    const price = customPrice !== null ? customPrice : product.price;
    if (existing) {
        existing.quantity += 1;
        existing.price = price; // update price if discounted
    } else {
        cart.push({ ...product, quantity: 1, price: price });
    }
    saveCart(cart);
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartSpans = document.querySelectorAll('#cartCount');
    cartSpans.forEach(span => { if(span) span.innerText = totalItems; });
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    if (window.location.pathname.includes('cart.html')) location.reload();
}

function updateQuantity(productId, delta) {
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) removeFromCart(productId);
        else saveCart(cart);
        if (window.location.pathname.includes('cart.html')) location.reload();
    }
}

// Export for cart.html (used on that page)
if (typeof module !== 'undefined') module.exports = { getCart, saveCart, addToCart, updateCartCount, removeFromCart, updateQuantity };
