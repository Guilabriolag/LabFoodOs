/* ========================================
   LABFOOD OS v2 — totem.js
   Cardápio público: branding dinâmico, mesa via URL
   ======================================== */

const totem = {
  activeCat: 'Todos',
  cartOpen: false,

  buildHTML() {
    const s     = STATE.setup;
    const prods = STATE.prods.filter(p => p.active);
    const cats  = ['Todos', ...new Set(prods.map(p => p.cat))];
    const mesa  = app.mesaAtiva;

    if (!s.storeOpen) {
      return `<div class="totem-wrap"><div class="totem-closed">🔒 Estamos fechados por agora</div></div>`;
    }

    // Background hero
    const heroBg = s.coverUrl
      ? `<div class="totem-hero-bg" style="background-image:url('${s.coverUrl}')"></div>`
      : `<div class="totem-hero-bg" style="background:linear-gradient(135deg,var(--c1) 0%,var(--c1-dark) 100%)"></div>`;

    return `
      <div class="totem-wrap">
        <div class="totem-hero">
          ${heroBg}
          <div class="totem-hero-overlay"></div>
          <div class="totem-hero-content">
            <h2>${s.storeName || 'LabFood OS'}</h2>
            <p>${mesa ? `🪑 Mesa ${mesa} — Bem-vindo!` : 'Cardápio digital — Escolha e peça'}</p>
          </div>
        </div>

        <div class="cat-tabs" id="cat-tabs">
          ${cats.map(c => `
            <button class="cat-tab ${c === this.activeCat ? 'active' : ''}"
              onclick="totem.setCategory('${c}')">${c}</button>
          `).join('')}
        </div>

        <div class="prod-grid" id="prod-grid">
          ${this._renderProds(prods)}
        </div>
      </div>

      <div id="cart-overlay" style="display:none"></div>`;
  },

  _renderProds(all) {
    const prods = this.activeCat === 'Todos' ? all : all.filter(p => p.cat === this.activeCat);
    if (!prods.length) return `<p style="color:var(--muted);padding:32px 0;font-size:14px">Nenhum item nesta categoria.</p>`;

    return prods.map(p => {
      const imgContent = p.img
        ? `<img src="${p.img}" alt="${p.name}" onerror="this.style.display='none'">`
        : `<span>${p.emoji || '🍽️'}</span>`;

      return `
        <div class="prod-card" onclick="totem.addToCart('${p.id}')">
          <div class="prod-card-img">${imgContent}</div>
          <div class="prod-card-body">
            <div class="prod-card-name">${p.name}</div>
            <div class="prod-card-desc">${p.desc || ''}</div>
            <div class="prod-card-footer">
              <span class="prod-price">${app.fmt(p.price)}</span>
              <button class="prod-add" onclick="event.stopPropagation();totem.addToCart('${p.id}')">+</button>
            </div>
          </div>
        </div>`;
    }).join('');
  },

  _cartHTML() {
    const items = STATE.cart;
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);

    const itemsHTML = items.length === 0
      ? `<div class="cart-empty">🛒<br><br>Seu carrinho está vazio<br><small>Adicione itens do cardápio</small></div>`
      : items.map(i => `
          <div class="cart-item">
            <span class="cart-item-emoji">${i.emoji || '🍽️'}</span>
            <span class="cart-item-name">${i.name}</span>
            <div class="cart-item-qty">
              <button class="qty-btn" onclick="totem.changeQty('${i.id}',-1)">−</button>
              <span style="min-width:16px;text-align:center;font-weight:700">${i.qty}</span>
              <button class="qty-btn" onclick="totem.changeQty('${i.id}',1)">+</button>
            </div>
            <span class="cart-item-price">${app.fmt(i.price * i.qty)}</span>
          </div>`).join('');

    const mesa = app.mesaAtiva;

    return `
      <div class="cart-overlay" onclick="if(event.target===this) totem.toggleCart()">
        <div class="cart-panel">
          <div class="cart-header">
            <h3>${mesa ? `🪑 Mesa ${mesa}` : '🛒 Carrinho'}</h3>
            <button class="cart-close" onclick="totem.toggleCart()">✕</button>
          </div>

          <div class="cart-items">${itemsHTML}</div>

          ${items.length > 0 ? `
            <div class="cart-footer">
              <div class="cart-total">
                <span>Total</span>
                <span>${app.fmt(total)}</span>
              </div>
            </div>
            <div class="checkout-section">
              <h4>📋 Dados do Pedido</h4>
              ${mesa
                ? `<input class="input" id="co-name" value="Mesa ${mesa}" readonly style="background:var(--surface);cursor:default">`
                : `<div class="form-group"><label>Nome / Identificação</label><input class="input" id="co-name" placeholder="ex: João / Mesa 5"></div>`
              }
              <div class="form-group" style="margin-top:10px">
                <label>Observação (opcional)</label>
                <input class="input" id="co-note" placeholder="ex: sem cebola, bem passado...">
              </div>
              <button class="btn btn-primary btn-block btn-lg" style="margin-top:4px" onclick="totem.checkout()">
                ✓ Confirmar Pedido
              </button>
            </div>
          ` : ''}
        </div>
      </div>`;
  },

  /* ── INIT ───────────────────── */
  init() { this._updateFab(); },

  /* ── ACTIONS ────────────────── */
  setCategory(cat) {
    this.activeCat = cat;
    document.querySelectorAll('.cat-tab').forEach(el => el.classList.toggle('active', el.textContent === cat));
    const grid = document.getElementById('prod-grid');
    if (grid) grid.innerHTML = this._renderProds(STATE.prods.filter(p => p.active));
  },

  addToCart(prodId) {
    const prod = STATE.prods.find(p => p.id === prodId);
    if (!prod) return;
    const ex = STATE.cart.find(i => i.id === prodId);
    ex ? ex.qty++ : STATE.cart.push({...prod, qty: 1});
    this._updateFab();
    app.toast(`+ ${prod.name}`);
  },

  changeQty(prodId, delta) {
    const idx = STATE.cart.findIndex(i => i.id === prodId);
    if (idx === -1) return;
    STATE.cart[idx].qty += delta;
    if (STATE.cart[idx].qty <= 0) STATE.cart.splice(idx, 1);
    this._updateCart();
    this._updateFab();
  },

  toggleCart() {
    this.cartOpen = !this.cartOpen;
    const overlay = document.getElementById('cart-overlay');
    if (!overlay) return;
    if (this.cartOpen) {
      overlay.innerHTML = this._cartHTML();
      overlay.style.display = 'flex';
    } else {
      overlay.style.display = 'none';
    }
  },

  _updateCart() {
    const overlay = document.getElementById('cart-overlay');
    if (overlay && this.cartOpen) {
      overlay.innerHTML = this._cartHTML();
      overlay.style.display = 'flex';
    }
  },

  _updateFab() {
    const total = STATE.cart.reduce((s, i) => s + i.qty, 0);
    const cnt = document.getElementById('cartCount');
    if (cnt) cnt.textContent = total;
  },

  checkout() {
    if (!STATE.cart.length) { app.toast('Carrinho vazio', 'red'); return; }
    const name  = document.getElementById('co-name')?.value.trim() || 'Balcão';
    const note  = document.getElementById('co-note')?.value.trim() || '';
    const total = STATE.cart.reduce((s, i) => s + i.price * i.qty, 0);
    const mesa  = app.mesaAtiva || null;

    const order = STATE.newOrder(STATE.cart, total, name, note, mesa);

    // Atualiza status da mesa se necessário
    if (mesa) {
      STATE.updateMesa(mesa, { status: 'ocupada' });
    }

    STATE.cart = [];
    this.toggleCart();
    this._updateFab();
    app.toast(`✅ Pedido ${order.id} enviado!`, 'green');
  },
};
