/* ========================================
   LABFOOD OS v2 — state.js
   Estado global com branding, mesas e sessões
   ======================================== */

const STATE = (() => {
  const K = {
    PRODS:   'lab_prods',
    ORDERS:  'lab_orders',
    SETUP:   'lab_setup',
    KEYS:    'lab_keys',
    CAIXA:   'lab_caixa',
    MESAS:   'lab_mesas',
    SESSIONS:'lab_sessions',
  };

  const _listeners = {};
  function _load(k, def) { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : def; } catch { return def; } }
  function _save(k, v)   { localStorage.setItem(k, JSON.stringify(v)); _emit(k); }
  function _emit(k)       { (_listeners[k] || []).forEach(fn => fn()); (_listeners['*'] || []).forEach(fn => fn(k)); }
  function on(k, fn)      { if (!_listeners[k]) _listeners[k] = []; _listeners[k].push(fn); }

  /* ── DEFAULTS ─────────────────────── */
  const D = {
    prods: [
      { id:'p1', name:'X-Burguer Clássico', cat:'Lanches',    price:28.90, emoji:'🍔', img:'', desc:'Pão brioche, blend artesanal, queijo prato, alface', active:true },
      { id:'p2', name:'Pizza Margherita',   cat:'Pizzas',     price:42.00, emoji:'🍕', img:'', desc:'Mussarela fior di latte, manjericão fresco', active:true },
      { id:'p3', name:'Frango Grelhado',    cat:'Pratos',     price:35.00, emoji:'🍗', img:'', desc:'Filé grelhado, arroz, feijão, salada', active:true },
      { id:'p4', name:'Suco Natural',       cat:'Bebidas',    price: 9.90, emoji:'🥤', img:'', desc:'Laranja, limão ou maracujá 400ml', active:true },
      { id:'p5', name:'Coca-Cola 350ml',    cat:'Bebidas',    price: 6.00, emoji:'🥫', img:'', desc:'Gelada, lata', active:true },
      { id:'p6', name:'Brownie Especial',   cat:'Sobremesas', price:12.00, emoji:'🍫', img:'', desc:'Chocolate meio amargo com nozes', active:true },
    ],
    orders: [],
    setup: {
      storeName:   'LabFood OS',
      whatsapp:    '',
      storeOpen:   true,
      tableMode:   false,
      numMesas:    10,
      totemUrl:    window.location.origin + window.location.pathname,
      // Branding
      logoUrl:     '',
      coverUrl:    '',
      bgType:      'color',   // 'color' | 'image'
      bgValue:     '#FFFFFF', // cor ou URL
      c1:          '#E8001A',
      c2:          '#FFB800',
    },
    keys: [
      { key:'ADMIN', pass:'1234', role:'A', name:'Administrador' },
      { key:'CAIXA', pass:'0000', role:'C', name:'Caixa' },
    ],
    caixa: {
      aberto:     false,
      abertura:   null,
      fundoCaixa: 0,
      historico:  [],
    },
    mesas: [], // [{ num, status:'livre'|'ocupada'|'fechada', sessionId }]
    sessions: [], // [{ id, mesa, ts, expires, items, total, status }]
  };

  return {
    K,
    // --- Getters/Setters com persistência ---
    get prods()    { return _load(K.PRODS,    D.prods);    }, set prods(v)    { _save(K.PRODS, v);    },
    get orders()   { return _load(K.ORDERS,   D.orders);   }, set orders(v)   { _save(K.ORDERS, v);   },
    get setup()    { return _load(K.SETUP,    D.setup);    }, set setup(v)    { _save(K.SETUP, v);    },
    get keys()     { return _load(K.KEYS,     D.keys);     }, set keys(v)     { _save(K.KEYS, v);     },
    get caixaState(){ return _load(K.CAIXA,   D.caixa);   }, set caixaState(v){ _save(K.CAIXA, v);   },
    get mesas()    { return _load(K.MESAS,    D.mesas);    }, set mesas(v)    { _save(K.MESAS, v);    },
    get sessions() { return _load(K.SESSIONS, D.sessions); }, set sessions(v) { _save(K.SESSIONS, v); },

    // --- Auth (não persiste) ---
    user: null,
    cart: [],

    // --- Helpers orders ---
    newOrder(items, total, name, note, mesa) {
      const o = {
        id:     'OS-' + Date.now().toString(36).toUpperCase(),
        ts:     Date.now(),
        items:  [...items],
        total,
        name:   name  || 'Balcão',
        note:   note  || '',
        mesa:   mesa  || null,
        status: 'novo',
        pago:   false,
      };
      const arr = this.orders; arr.unshift(o); this.orders = arr;
      return o;
    },

    updateOrderStatus(id, status) {
      this.orders = this.orders.map(o => o.id === id ? {...o, status} : o);
    },

    todayOrders() {
      const s = new Date(); s.setHours(0,0,0,0);
      return this.orders.filter(o => o.ts >= s.getTime());
    },

    todayRevenue() {
      return this.todayOrders().reduce((s,o) => s + o.total, 0);
    },

    // --- Mesas ---
    initMesas() {
      const n = this.setup.numMesas || 10;
      const existing = this.mesas;
      const mesas = Array.from({length: n}, (_, i) => {
        const num = i + 1;
        return existing.find(m => m.num === num) || { num, status:'livre', sessionId:null };
      });
      this.mesas = mesas;
    },

    getMesa(num) { return this.mesas.find(m => m.num === num); },

    updateMesa(num, data) {
      this.mesas = this.mesas.map(m => m.num === num ? {...m, ...data} : m);
    },

    // --- Sessões QR por cliente ---
    newSession(mesa, validMinutes = 120) {
      const sess = {
        id:      'SES-' + Date.now().toString(36).toUpperCase(),
        mesa,
        ts:      Date.now(),
        expires: Date.now() + validMinutes * 60 * 1000,
        status:  'ativa',
      };
      const arr = this.sessions; arr.unshift(sess); this.sessions = arr;
      return sess;
    },

    getActiveSession(id) {
      const s = this.sessions.find(s => s.id === id);
      if (!s) return null;
      if (Date.now() > s.expires) return null; // expirada
      return s;
    },

    // --- Branding: aplica CSS vars ---
    applyTheme() {
      const s = this.setup;
      document.documentElement.style.setProperty('--c1', s.c1 || '#E8001A');
      document.documentElement.style.setProperty('--c2', s.c2 || '#FFB800');
      if (s.bgType === 'color') {
        document.documentElement.style.setProperty('--bg', s.bgValue || '#FFFFFF');
      }
      // logo
      const img = document.getElementById('logo-img');
      const emoji = document.getElementById('logo-emoji');
      if (img && s.logoUrl) {
        img.src = s.logoUrl; img.style.display = 'block';
        if (emoji) emoji.style.display = 'none';
      }
      // nome
      const nameEl = document.getElementById('logo-name');
      if (nameEl && s.storeName) nameEl.textContent = s.storeName;
    },

    on,
  };
})();
