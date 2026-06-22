document.addEventListener('DOMContentLoaded', function () {
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('aegis_cart') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem('aegis_cart', JSON.stringify(cart));
    updateCartCount();
  }

  function updateCartCount() {
    const cart = getCart();
    let count = cart.reduce((s, it) => s + (it.qty || 0), 0);
    let el = document.getElementById('cart-count');
    if (!el) {
      el = document.createElement('span');
      el.id = 'cart-count';
      el.style.marginLeft = '8px';
      el.style.fontWeight = '600';
      const nav = document.querySelector('header nav ul');
      if (nav) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#cart';
        a.textContent = 'Cart';
        a.appendChild(el);
        li.appendChild(a);
        nav.appendChild(li);
      }
    }
    el.textContent = ` (${count})`;
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.position = 'fixed';
    t.style.right = '1rem';
    t.style.bottom = '1rem';
    t.style.background = 'rgba(0,0,0,0.8)';
    t.style.color = '#fff';
    t.style.padding = '0.6rem 1rem';
    t.style.borderRadius = '6px';
    t.style.zIndex = 9999;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  // Wire up add-to-cart buttons
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', function () {
      const card = btn.closest('.product-card');
      if (!card) return;
      const img = card.querySelector('img');
      const priceEl = card.querySelector('p');
      const name = (img && img.alt) ? img.alt.trim() : (card.querySelector('h3')?.textContent?.trim() || 'Aegis product');
      const price = priceEl ? priceEl.textContent.trim() : '';

      const cart = getCart();
      const existing = cart.find(it => it.name === name && it.price === price);
      if (existing) {
        existing.qty = (existing.qty || 1) + 1;
      } else {
        cart.push({ name, price, qty: 1, image: img ? img.src : '' });
      }
      saveCart(cart);
      showToast(`${name} added to cart`);
    });
  });

  // Contact form handling — open mail client with prefilled message
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const name = (document.getElementById('name') || {}).value || '';
      const email = (document.getElementById('email') || {}).value || '';
      const msg = (document.getElementById('msg') || {}).value || '';
      if (!name || !email || !msg) {
        showToast('Please complete all fields.');
        return;
      }
      const to = contactForm.getAttribute('action') || 'mailto:info@theaegisorganisation.co.za';
      const subject = encodeURIComponent(`Website contact from ${name}`);
      const bodyLines = [`Name: ${name}`, `Email: ${email}`, '', `Message:`, msg];
      const body = encodeURIComponent(bodyLines.join('\n'));
      const mailto = `${to.replace(/mailto:/i, 'mailto:')}?subject=${subject}&body=${body}`;

      // Attempt to open user's mail client
      window.location.href = mailto;

      const success = document.getElementById('contact-success');
      if (success) {
        success.style.display = 'block';
      }
      contactForm.reset();
    });
  }

  // Initialize
  // Render cart UI inside modal
  function renderCart() {
    const cart = getCart();
    const container = document.getElementById('cart-items');
    if (!container) return;
    container.innerHTML = '';
    if (!cart.length) {
      const empty = document.createElement('div');
      empty.textContent = 'Your cart is empty.';
      empty.style.padding = '12px';
      container.appendChild(empty);
      return;
    }
    cart.forEach((it, idx) => {
      const row = document.createElement('div');
      row.className = 'cart-item';

      const img = document.createElement('img');
      img.src = it.image || 'images/logo (2).png';
      img.alt = it.name || '';

      const meta = document.createElement('div');
      meta.className = 'meta';
      const title = document.createElement('div');
      title.textContent = it.name || '';
      const price = document.createElement('div');
      price.textContent = it.price || '';
      const qty = document.createElement('div');
      qty.textContent = `Qty: ${it.qty || 1}`;
      meta.appendChild(title);
      meta.appendChild(price);
      meta.appendChild(qty);

      const remove = document.createElement('button');
      remove.className = 'remove-btn';
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => {
        const current = getCart();
        current.splice(idx, 1);
        saveCart(current);
        renderCart();
        showToast(`${it.name} removed from cart`);
      });

      row.appendChild(img);
      row.appendChild(meta);
      row.appendChild(remove);
      container.appendChild(row);
    });
  }

  function openCart() {
    const modal = document.getElementById('cart');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    renderCart();
  }

  function closeCart() {
    const modal = document.getElementById('cart');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
  }

  // Wire cart open/close controls
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href="#cart"]');
    if (a) {
      e.preventDefault();
      openCart();
    }
  });

  const closeBtn = document.querySelector('.cart-close');
  if (closeBtn) closeBtn.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

  const clearBtn = document.getElementById('clear-cart');
  if (clearBtn) clearBtn.addEventListener('click', () => { saveCart([]); renderCart(); });

  // Keep cart count in sync when storage changes (other tabs)
  window.addEventListener('storage', (e) => { if (e.key === 'aegis_cart') updateCartCount(); });

  // Shop search filtering
  const shopSearch = document.getElementById('shop-search');
  function filterProducts() {
    const q = (shopSearch && shopSearch.value || '').trim().toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
      const name = (card.querySelector('img')?.alt || card.querySelector('h3')?.textContent || '').toLowerCase();
      const price = (card.querySelector('p')?.textContent || '').toLowerCase();
      const matches = !q || name.includes(q) || price.includes(q);
      card.style.display = matches ? '' : 'none';
    });
  }
  if (shopSearch) shopSearch.addEventListener('input', filterProducts);

  updateCartCount();
});
