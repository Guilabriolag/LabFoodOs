/* ========================================
   LABFOOD OS v2 — admin.js
   Painel: Dashboard | Pedidos | Produtos | Mesas | Keys | Config
   ======================================== */

const admin = {
  tab: 'dash',

  buildHTML() {
    const role = STATE.user?.role;
    const tabs = [
      { id:'dash',   icon:'📊', label:'Dashboard',  roles:['A','C'] },
      { id:'orders', icon:'📋', label:'Pedidos',     roles:['A','C'] },
      { id:'prods',  icon:'🍔', label:'Produtos',    roles:['A'] },
      { id:'mesas',  icon:'🪑', label:'Mesas & QR',  roles:['A','C'] },
      { id:'caixa',  icon:'💰', label:'Fechamento',  roles:['A','C'] },
      { id:'keys',   icon:'🔑', label:'Acessos',     roles:['A'] },
      { id:'conf',   icon:'⚙️', label:'Config',      roles:['A'] },
    ].filter(t => t.roles.includes(role));

    return `
      <div class="admin-layout">
        <nav class="sidebar">
          <div class="sidebar-section">Menu</div>
          ${tabs.map(t => `
            <button class="nav-btn ${t.id === this.tab ? 'active' : ''}" onclick="admin.setTab('${t.id}')">
              <span class="nav-icon">${t.icon}</span>
              <span>${t.label}</span>
            </button>`).join('')}
          <div class="sidebar-foot">
            <button class="nav-btn" onclick="app.render('totem')">
              <span class="nav-icon">👁️</span><span>Ver Totem</span>
            </button>
          </div>
        </nav>
        <div class="admin-content" id="admin-content"></div>
      </div>`;
  },

  init() { this.setTab(this.tab); },

  setTab(id) {
    this.tab = id;
    document.querySelectorAll('.nav-btn').forEach(b =>
      b.classList.toggle('active', b.getAttribute('onclick')?.includes(`'${id}'`)));
    const c = document.getElementById('admin-content');
    if (!c) return;
    const map = { dash: '_tabDash', orders: '_tabOrders', prods: '_tabProds', mesas: '_tabMesas', caixa: '_tabCaixa', keys: '_tabKeys', conf: '_tabConf' };
    c.innerHTML = this[map[id] ? map[id] : '_tabDash']();
  },

  /* ════════════════════════════════
     DASHBOARD
     ════════════════════════════════ */
  _tabDash() {
    const orders  = STATE.todayOrders();
    const rev     = STATE.todayRevenue();
    const novos   = orders.filter(o => o.status === 'novo').length;
    const ticket  = orders.length ? (rev / orders.length) : 0;

    return `
      <div class="tab-pane">
        <h2>DASHBOARD</h2>
        <p class="tab-sub">Resumo do dia</p>

        <div class="stats-grid">
          <div class="stat-card"><div class="stat-label">Receita Hoje</div><div class="stat-val red">${app.fmt(rev)}</div></div>
          <div class="stat-card"><div class="stat-label">Pedidos</div><div class="stat-val">${orders.length}</div></div>
          <div class="stat-card"><div class="stat-label">Aguardando</div><div class="stat-val yellow">${novos}</div></div>
          <div class="stat-card"><div class="stat-label">Ticket Médio</div><div class="stat-val green">${app.fmt(ticket)}</div></div>
        </div>

        <h3 style="font-family:var(--font-display);font-size:18px;color:var(--adm-text);margin-bottom:12px;letter-spacing:1px">ÚLTIMOS PEDIDOS</h3>
        ${STATE.orders.slice(0,10).length === 0
          ? `<p style="color:var(--adm-dim);font-size:13px;padding:20px 0">Nenhum pedido ainda.</p>`
          : STATE.orders.slice(0,10).map(o => this._orderRow(o)).join('')}
      </div>`;
  },

  _orderRow(o) {
    const colors = { novo:'blue', preparo:'yellow', pronto:'green', entregue:'dim' };
    return `
      <div class="order-card">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span class="order-id-badge">${o.id}</span>
            <span class="badge badge-${colors[o.status]||'dim'}">${o.status}</span>
            ${o.mesa ? `<span class="badge badge-blue">Mesa ${o.mesa}</span>` : ''}
            <span style="color:var(--adm-dim);font-size:11px;margin-left:auto">${app.fmtDate(o.ts)}</span>
          </div>
          <div style="font-size:12px;color:var(--adm-dim)">${o.items.map(i=>`${i.qty}× ${i.name}`).join(' · ')}</div>
          ${o.name ? `<div style="font-size:12px;color:var(--adm-text);margin-top:2px">👤 ${o.name}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div style="color:var(--c1);font-family:var(--font-mono);font-weight:800;font-size:15px">${app.fmt(o.total)}</div>
        </div>
      </div>`;
  },

  /* ════════════════════════════════
     PEDIDOS
     ════════════════════════════════ */
  _tabOrders() {
    return `
      <div class="tab-pane">
        <h2>PEDIDOS</h2>
        <p class="tab-sub">Gerencie e avance o status</p>

        <div class="cat-tabs" style="position:static;border:none;padding:0;margin-bottom:16px">
          ${['Todos','novo','preparo','pronto','entregue'].map((f,i) => `
            <button class="cat-tab ${i===0?'active':''}" onclick="admin.filterOrders('${f}',this)">${f}</button>`).join('')}
        </div>

        <div id="orders-list">
          ${this._renderOrders(STATE.orders.slice(0,60))}
        </div>
      </div>`;
  },

  _renderOrders(orders) {
    if (!orders.length) return `<p style="color:var(--adm-dim);font-size:13px;padding:20px 0">Nenhum pedido.</p>`;
    return orders.map(o => this._orderCard(o)).join('');
  },

  _orderCard(o) {
    const next      = { novo:'preparo', preparo:'pronto', pronto:'entregue' };
    const nextLabel = { novo:'→ Preparo', preparo:'→ Pronto', pronto:'→ Entregue' };
    const colors    = { novo:'blue', preparo:'yellow', pronto:'green', entregue:'dim' };

    return `
      <div class="order-card" id="ord-${o.id}">
        <div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">
            <span class="order-id-badge">${o.id}</span>
            <span class="badge badge-${colors[o.status]||'dim'}">${o.status}</span>
            ${o.mesa ? `<span class="badge badge-blue">Mesa ${o.mesa}</span>` : ''}
            <span style="color:var(--adm-dim);font-size:11px">${app.fmtDate(o.ts)}</span>
          </div>
          <div style="font-size:13px;color:var(--adm-dim);margin-bottom:4px">${o.items.map(i=>`${i.qty}× ${i.name}`).join(' · ')}</div>
          ${o.name ? `<div style="font-size:12px;color:var(--adm-text)">👤 ${o.name}</div>` : ''}
          ${o.note ? `<div style="font-size:12px;color:var(--c2);margin-top:2px">📝 ${o.note}</div>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
          <span style="color:var(--c1);font-family:var(--font-mono);font-weight:800">${app.fmt(o.total)}</span>
          ${next[o.status] ? `<button class="btn btn-primary btn-sm" onclick="admin.advanceOrder('${o.id}','${next[o.status]}')">${nextLabel[o.status]}</button>` : ''}
          <button class="btn btn-danger btn-sm btn-icon" onclick="admin.deleteOrder('${o.id}')">🗑</button>
        </div>
      </div>`;
  },

  filterOrders(status, btn) {
    document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const orders = status === 'Todos' ? STATE.orders.slice(0,60) : STATE.orders.filter(o=>o.status===status);
    document.getElementById('orders-list').innerHTML = this._renderOrders(orders);
  },

  advanceOrder(id, status) {
    STATE.updateOrderStatus(id, status);
    this.setTab('orders');
    app.toast(`Pedido ${id} → ${status}`, 'green');
  },

  deleteOrder(id) {
    if (!confirm(`Remover pedido ${id}?`)) return;
    STATE.orders = STATE.orders.filter(o => o.id !== id);
    this.setTab('orders');
  },

  /* ════════════════════════════════
     PRODUTOS
     ════════════════════════════════ */
  _tabProds() {
    return `
      <div class="tab-pane">
        <h2>PRODUTOS</h2>
        <p class="tab-sub">Gerencie o cardápio</p>
        <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
          <button class="btn btn-primary" onclick="admin.openProdModal()">+ Novo Produto</button>
        </div>
        <div>
          <div class="tbl-header" style="grid-template-columns:40px 1fr 100px 80px 70px 80px">
            <span></span><span>Nome</span><span>Categoria</span><span>Preço</span><span>Ativo</span><span>Ações</span>
          </div>
          ${STATE.prods.map(p => `
            <div class="tbl-row" style="grid-template-columns:40px 1fr 100px 80px 70px 80px">
              <span style="font-size:22px;text-align:center">${p.emoji||'🍽️'}</span>
              <span>
                <div style="font-weight:700">${p.name}</div>
                <div style="font-size:11px;color:var(--adm-dim)">${p.desc||''}</div>
              </span>
              <span style="color:var(--adm-dim)">${p.cat}</span>
              <span style="color:var(--c1);font-family:var(--font-mono);font-weight:700">${app.fmt(p.price)}</span>
              <span><button class="toggle ${p.active?'on':''}" onclick="admin.toggleProd('${p.id}')"></button></span>
              <span style="display:flex;gap:4px">
                <button class="btn btn-dark btn-sm btn-icon" onclick="admin.openProdModal('${p.id}')">✏️</button>
                <button class="btn btn-danger btn-sm btn-icon" onclick="admin.deleteProd('${p.id}')">🗑</button>
              </span>
            </div>`).join('')}
        </div>
      </div>
      <div id="prod-modal"></div>`;
  },

  openProdModal(id) {
    const p = id ? STATE.prods.find(x => x.id === id) : null;
    document.getElementById('prod-modal').innerHTML = `
      <div class="modal-bg" onclick="if(event.target===this)admin.closeProdModal()">
        <div class="modal">
          <h3>${p ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'}</h3>
          <div style="display:grid;grid-template-columns:80px 1fr;gap:12px">
            <div class="form-group">
              <label>Emoji</label>
              <input class="input" id="pm-emoji" value="${p?.emoji||''}" placeholder="🍔">
            </div>
            <div class="form-group">
              <label>Nome</label>
              <input class="input" id="pm-name" value="${p?.name||''}" placeholder="Nome do produto">
            </div>
          </div>
          <div class="form-group">
            <label>Descrição</label>
            <input class="input" id="pm-desc" value="${p?.desc||''}" placeholder="Descrição breve">
          </div>
          <div class="form-group">
            <label>URL da Imagem (opcional)</label>
            <input class="input" id="pm-img" value="${p?.img||''}" placeholder="https://...jpg">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group">
              <label>Categoria</label>
              <input class="input" id="pm-cat" value="${p?.cat||''}" placeholder="ex: Lanches">
            </div>
            <div class="form-group">
              <label>Preço (R$)</label>
              <input class="input" id="pm-price" type="number" value="${p?.price||''}" placeholder="0.00" step="0.01">
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-dark" onclick="admin.closeProdModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="admin.saveProd('${id||''}')">Salvar</button>
          </div>
        </div>
      </div>`;
  },

  closeProdModal() { const el = document.getElementById('prod-modal'); if(el) el.innerHTML=''; },

  saveProd(id) {
    const emoji = document.getElementById('pm-emoji')?.value.trim();
    const name  = document.getElementById('pm-name')?.value.trim();
    const desc  = document.getElementById('pm-desc')?.value.trim();
    const img   = document.getElementById('pm-img')?.value.trim();
    const cat   = document.getElementById('pm-cat')?.value.trim();
    const price = parseFloat(document.getElementById('pm-price')?.value);
    if (!name || !cat || isNaN(price)) { app.toast('Preencha nome, categoria e preço','red'); return; }
    let prods = STATE.prods;
    if (id) {
      prods = prods.map(p => p.id === id ? {...p,emoji,name,desc,img,cat,price} : p);
    } else {
      prods.push({ id:'p'+app.uid(), emoji, name, desc, img, cat, price, active:true });
    }
    STATE.prods = prods;
    this.closeProdModal();
    this.setTab('prods');
    app.toast(id ? 'Produto atualizado' : 'Produto criado', 'green');
  },

  toggleProd(id) { STATE.prods = STATE.prods.map(p => p.id===id ? {...p,active:!p.active} : p); this.setTab('prods'); },
  deleteProd(id) { if(!confirm('Remover?')) return; STATE.prods = STATE.prods.filter(p=>p.id!==id); this.setTab('prods'); app.toast('Removido','red'); },

  /* ════════════════════════════════
     MESAS & QR
     ════════════════════════════════ */
  _tabMesas() {
    STATE.initMesas();
    const mesas   = STATE.mesas;
    const baseUrl = STATE.setup.totemUrl || window.location.href.split('?')[0];

    return `
      <div class="tab-pane">
        <h2>MESAS & QR</h2>
        <p class="tab-sub">Gerencie mesas e gere QR Codes para clientes</p>

        <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="admin.showQRTotem()">📱 QR do Totem</button>
          <button class="btn btn-secondary" onclick="admin.printAllQRs()">🖨️ Imprimir todos QRs</button>
          <button class="btn btn-dark" onclick="admin.clearAllMesas()">🗑 Limpar mesas</button>
        </div>

        <div class="mesa-grid" id="mesa-grid">
          ${mesas.map(m => `
            <div class="mesa-card ${m.status !== 'livre' ? m.status : ''}" onclick="admin.openMesa(${m.num})">
              <div class="mesa-num">${String(m.num).padStart(2,'0')}</div>
              <div class="mesa-status">${m.status === 'livre' ? '● Livre' : m.status === 'ocupada' ? '● Ocupada' : '✓ Pago'}</div>
            </div>`).join('')}
        </div>

        <div id="mesa-detail"></div>
        <div id="qr-modal"></div>
      </div>`;
  },

  openMesa(num) {
    const mesa    = STATE.getMesa(num);
    const orders  = STATE.orders.filter(o => o.mesa === num && o.status !== 'entregue');
    const total   = orders.reduce((s,o)=>s+o.total,0);
    const baseUrl = STATE.setup.totemUrl || window.location.href.split('?')[0];

    document.getElementById('mesa-detail').innerHTML = `
      <div class="card-dark" style="margin-top:16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <h3 style="font-family:var(--font-display);font-size:20px;color:var(--adm-text);letter-spacing:1px">MESA ${String(num).padStart(2,'0')}</h3>
          <span class="badge ${mesa.status==='livre'?'badge-green':mesa.status==='ocupada'?'badge-yellow':'badge-blue'}">${mesa.status}</span>
        </div>

        ${orders.length > 0 ? `
          <div style="margin-bottom:14px">
            ${orders.map(o=>`
              <div style="font-size:12px;color:var(--adm-dim);padding:4px 0;border-bottom:1px solid var(--adm-border)">
                <span class="order-id-badge" style="font-size:11px">${o.id}</span>
                — ${o.items.map(i=>`${i.qty}×${i.name}`).join(', ')}
                <span style="color:var(--c1);float:right;font-family:var(--font-mono)">${app.fmt(o.total)}</span>
              </div>`).join('')}
            <div style="text-align:right;margin-top:8px;font-weight:800;color:var(--c1);font-family:var(--font-mono)">Total: ${app.fmt(total)}</div>
          </div>
        ` : `<p style="color:var(--adm-dim);font-size:13px;margin-bottom:14px">Nenhum pedido em aberto.</p>`}

        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm" onclick="admin.showQRMesa(${num})">📱 Gerar QR</button>
          <button class="btn btn-secondary btn-sm" onclick="admin.showQRSession(${num})">🎫 QR com Validade</button>
          ${orders.length > 0 ? `<button class="btn btn-dark btn-sm" onclick="caixa.fecharMesa(${num})">💳 Fechar Mesa</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="admin.liberarMesa(${num})">✓ Liberar</button>
        </div>
      </div>`;
  },

  showQRTotem() {
    const url = STATE.setup.totemUrl || window.location.href.split('?')[0];
    this._showQRModal('QR DO TOTEM', url, 'Qualquer cliente pode usar este link');
  },

  showQRMesa(num) {
    const base = STATE.setup.totemUrl || window.location.href.split('?')[0];
    const url  = `${base}?mesa=${num}`;
    this._showQRModal(`QR MESA ${String(num).padStart(2,'0')}`, url, `Link direto para a Mesa ${num}`);
  },

  showQRSession(num) {
    const sess    = STATE.newSession(num, 120); // 2h de validade
    const base    = STATE.setup.totemUrl || window.location.href.split('?')[0];
    const url     = `${base}?mesa=${num}&sess=${sess.id}`;
    const expires = new Date(sess.expires).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
    this._showQRModal(`QR CLIENTE — MESA ${num}`, url, `⏰ Validade: ${expires} · ID: ${sess.id}`);
    STATE.updateMesa(num, { status:'ocupada', sessionId: sess.id });
  },

  _showQRModal(title, url, subtitle) {
    document.getElementById('qr-modal').innerHTML = `
      <div class="modal-bg" onclick="if(event.target===this){document.getElementById('qr-modal').innerHTML=''}">
        <div class="modal" style="text-align:center">
          <h3>${title}</h3>
          <p style="color:var(--adm-dim);font-size:12px;margin-bottom:16px">${subtitle}</p>
          <div class="qr-box" style="margin:0 auto 16px">
            <div id="qr-render"></div>
            <span class="qr-label">${url.length > 50 ? url.slice(0,50)+'...' : url}</span>
          </div>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:8px">
            <button class="btn btn-primary" onclick="window.open('${url}','_blank')">Abrir Link</button>
            <button class="btn btn-dark" onclick="navigator.clipboard.writeText('${url}');app.toast('Link copiado!','green')">Copiar Link</button>
            <button class="btn btn-dark" onclick="window.print()">Imprimir</button>
          </div>
        </div>
      </div>`;

    // Gera QR
    setTimeout(() => {
      const el = document.getElementById('qr-render');
      if (el && typeof QRCode !== 'undefined') {
        new QRCode(el, { text: url, width: 200, height: 200, colorDark: '#1A1A1A', colorLight: '#FFFFFF' });
      }
    }, 50);
  },

  printAllQRs() {
    const mesas   = STATE.mesas;
    const base    = STATE.setup.totemUrl || window.location.href.split('?')[0];
    const win     = window.open('', '_blank');
    win.document.write(`
      <html><head><title>QRs Mesas</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
      <style>body{font-family:sans-serif;display:flex;flex-wrap:wrap;gap:20px;padding:20px} .mesa{width:180px;text-align:center;border:2px solid #eee;border-radius:8px;padding:14px;page-break-inside:avoid} h4{margin:8px 0 4px;font-size:14px} p{font-size:11px;color:#888}</style>
      </head><body>
      ${mesas.map(m=>`<div class="mesa"><div id="qr-m${m.num}"></div><h4>Mesa ${String(m.num).padStart(2,'0')}</h4><p>${base}?mesa=${m.num}</p></div>`).join('')}
      <script>
        ${mesas.map(m=>`new QRCode(document.getElementById('qr-m${m.num}'),{text:'${base}?mesa=${m.num}',width:150,height:150})`).join(';')}
        setTimeout(()=>window.print(), 800)
      <\/script>
      </body></html>`);
  },

  liberarMesa(num) {
    STATE.updateMesa(num, { status:'livre', sessionId: null });
    document.getElementById('mesa-detail').innerHTML = '';
    this.setTab('mesas');
    app.toast(`Mesa ${num} liberada`, 'green');
  },

  clearAllMesas() {
    if (!confirm('Liberar todas as mesas?')) return;
    STATE.mesas = STATE.mesas.map(m => ({...m, status:'livre', sessionId:null}));
    this.setTab('mesas');
  },

  /* ════════════════════════════════
     CAIXA (delegado ao caixa.js)
     ════════════════════════════════ */
  _tabCaixa() { return caixa.buildHTML(); },

  /* ════════════════════════════════
     KEYS / ACESSOS
     ════════════════════════════════ */
  _tabKeys() {
    const roleLabel = { A:'Admin', C:'Caixa' };
    return `
      <div class="tab-pane">
        <h2>ACESSOS</h2>
        <p class="tab-sub">Chaves de acesso ao painel</p>
        <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
          <button class="btn btn-primary" onclick="admin.openKeyModal()">+ Nova Chave</button>
        </div>
        <div>
          <div class="tbl-header" style="grid-template-columns:120px 1fr 80px 100px">
            <span>Chave</span><span>Nome</span><span>Perfil</span><span>Ações</span>
          </div>
          ${STATE.keys.map((k,i) => `
            <div class="tbl-row" style="grid-template-columns:120px 1fr 80px 100px">
              <span style="font-family:var(--font-mono);color:var(--c2);font-weight:700">${k.key}</span>
              <span>${k.name}</span>
              <span><span class="badge ${k.role==='A'?'badge-red':'badge-blue'}">${roleLabel[k.role]||k.role}</span></span>
              <span><button class="btn btn-danger btn-sm" onclick="admin.deleteKey(${i})">Remover</button></span>
            </div>`).join('')}
        </div>
      </div>
      <div id="key-modal"></div>`;
  },

  openKeyModal() {
    document.getElementById('key-modal').innerHTML = `
      <div class="modal-bg" onclick="if(event.target===this)admin.closeKeyModal()">
        <div class="modal">
          <h3>NOVA CHAVE</h3>
          <div class="form-group"><label>Chave (login)</label><input class="input" id="km-key" placeholder="ex: GARCOM1" style="text-transform:uppercase"></div>
          <div class="form-group"><label>Nome do operador</label><input class="input" id="km-name" placeholder="ex: João Silva"></div>
          <div class="form-group"><label>Senha</label><input class="input" id="km-pass" type="password" placeholder="Mín. 4 caracteres"></div>
          <div class="form-group"><label>Perfil</label><select class="input" id="km-role"><option value="C">Caixa</option><option value="A">Admin</option></select></div>
          <div class="modal-actions">
            <button class="btn btn-dark" onclick="admin.closeKeyModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="admin.saveKey()">Criar</button>
          </div>
        </div>
      </div>`;
  },

  closeKeyModal() { const el = document.getElementById('key-modal'); if(el) el.innerHTML=''; },

  saveKey() {
    const key  = document.getElementById('km-key')?.value.trim().toUpperCase();
    const name = document.getElementById('km-name')?.value.trim();
    const pass = document.getElementById('km-pass')?.value;
    const role = document.getElementById('km-role')?.value;
    if (!key || !name || pass.length < 4) { app.toast('Preencha tudo (senha mín. 4)','red'); return; }
    if (STATE.keys.find(k=>k.key===key)) { app.toast('Chave já existe','red'); return; }
    STATE.keys = [...STATE.keys, {key,name,pass,role}];
    this.closeKeyModal(); this.setTab('keys');
    app.toast(`Chave ${key} criada`,'green');
  },

  deleteKey(i) {
    const keys = STATE.keys;
    if (keys.length <= 1) { app.toast('Mínimo 1 chave','red'); return; }
    if (!confirm(`Remover chave ${keys[i].key}?`)) return;
    keys.splice(i,1); STATE.keys = [...keys];
    this.setTab('keys');
  },

  /* ════════════════════════════════
     CONFIG — BRANDING + CORES
     ════════════════════════════════ */
  _tabConf() {
    const s = STATE.setup;
    return `
      <div class="tab-pane">
        <h2>CONFIGURAÇÕES</h2>
        <p class="tab-sub">Branding, cores e operação</p>

        <!-- Estabelecimento -->
        <div class="conf-section">
          <h4>Estabelecimento</h4>
          <div class="form-group"><label>Nome do Estabelecimento</label><input class="input input-dark" id="cf-name" value="${s.storeName||''}"></div>
          <div class="form-group"><label>WhatsApp (DDD + número)</label><input class="input input-dark" id="cf-wa" value="${s.whatsapp||''}" placeholder="11999999999"></div>
          <div class="form-group"><label>URL do Totem (para gerar QR)</label><input class="input input-dark" id="cf-url" value="${s.totemUrl||window.location.href.split('?')[0]}"></div>
        </div>

        <!-- Branding / Imagens -->
        <div class="conf-section">
          <h4>Branding & Imagens</h4>
          <div class="form-group"><label>URL do Logo</label><input class="input input-dark" id="cf-logo" value="${s.logoUrl||''}" placeholder="https://...png"></div>
          <div class="form-group"><label>URL da Capa/Banner (hero do totem)</label><input class="input input-dark" id="cf-cover" value="${s.coverUrl||''}" placeholder="https://...jpg"></div>
          <div class="form-group">
            <label>Fundo do Totem</label>
            <div style="display:flex;gap:12px;margin-top:8px">
              <label style="display:flex;align-items:center;gap:6px;text-transform:none;font-size:13px;color:var(--adm-text);cursor:pointer">
                <input type="radio" name="bg-type" value="color" ${s.bgType!=='image'?'checked':''} onchange="admin.onBgTypeChange('color')"> Cor sólida
              </label>
              <label style="display:flex;align-items:center;gap:6px;text-transform:none;font-size:13px;color:var(--adm-text);cursor:pointer">
                <input type="radio" name="bg-type" value="image" ${s.bgType==='image'?'checked':''} onchange="admin.onBgTypeChange('image')"> Imagem de fundo
              </label>
            </div>
          </div>
          <div class="form-group" id="cf-bg-wrap">
            ${s.bgType === 'image'
              ? `<label>URL da imagem de fundo</label><input class="input input-dark" id="cf-bg-val" value="${s.bgValue||''}" placeholder="https://...jpg">`
              : `<label>Cor de fundo</label><input type="color" id="cf-bg-val" value="${s.bgValue||'#FFFFFF'}" style="height:40px;width:100%;border-radius:8px;border:1px solid var(--adm-border);cursor:pointer;background:transparent">`
            }
          </div>
        </div>

        <!-- Cores -->
        <div class="conf-section">
          <h4>Paleta de Cores</h4>
          <div class="color-row">
            <span class="color-label">🔴 Cor Primária (botões, destaque)</span>
            <div class="color-swatch"><input type="color" id="cf-c1" value="${s.c1||'#E8001A'}" oninput="admin.previewColor('c1',this.value)"></div>
            <input class="input input-dark" id="cf-c1-hex" value="${s.c1||'#E8001A'}" style="width:100px;font-family:var(--font-mono);font-size:12px" onchange="admin.syncColor('c1',this.value)">
          </div>
          <div class="color-row">
            <span class="color-label">🟡 Cor Secundária (preços, destaques)</span>
            <div class="color-swatch"><input type="color" id="cf-c2" value="${s.c2||'#FFB800'}" oninput="admin.previewColor('c2',this.value)"></div>
            <input class="input input-dark" id="cf-c2-hex" value="${s.c2||'#FFB800'}" style="width:100px;font-family:var(--font-mono);font-size:12px" onchange="admin.syncColor('c2',this.value)">
          </div>

          <div style="margin-top:14px">
            <p style="font-size:12px;color:var(--adm-dim);margin-bottom:8px">Temas prontos:</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${[
                {name:'🔴 Food',  c1:'#E8001A', c2:'#FFB800'},
                {name:'🟠 Burger',c1:'#D44000', c2:'#FFC300'},
                {name:'🟢 Verde', c1:'#1A7A3A', c2:'#E8C000'},
                {name:'⚫ Dark',  c1:'#222222', c2:'#F0C040'},
                {name:'🔵 Mar',   c1:'#0066CC', c2:'#00CCAA'},
                {name:'🟣 Gourmet',c1:'#6A0572',c2:'#E8B800'},
              ].map(t=>`
                <button class="btn btn-dark btn-sm" style="font-size:11px" onclick="admin.applyThemePreset('${t.c1}','${t.c2}')">${t.name}</button>`).join('')}
            </div>
          </div>
        </div>

        <!-- Operação -->
        <div class="conf-section">
          <h4>Operação</h4>
          <div class="toggle-row">
            <span>Estabelecimento Aberto</span>
            <button class="toggle ${s.storeOpen?'on':''}" id="tgl-open" onclick="admin.toggleConf('storeOpen')"></button>
          </div>
          <div class="toggle-row">
            <span>Modo Mesa (QR por mesa)</span>
            <button class="toggle ${s.tableMode?'on':''}" id="tgl-table" onclick="admin.toggleConf('tableMode')"></button>
          </div>
          <div class="form-group" style="margin-top:12px">
            <label>Número de Mesas</label>
            <input class="input input-dark" id="cf-mesas" type="number" min="1" max="100" value="${s.numMesas||10}" style="width:100px">
          </div>
        </div>

        <button class="btn btn-primary btn-lg" onclick="admin.saveConf()">💾 Salvar Configurações</button>
      </div>`;
  },

  onBgTypeChange(type) {
    const s    = STATE.setup;
    const wrap = document.getElementById('cf-bg-wrap');
    if (!wrap) return;
    if (type === 'image') {
      wrap.innerHTML = `<label>URL da imagem de fundo</label><input class="input input-dark" id="cf-bg-val" value="${s.bgValue||''}" placeholder="https://...jpg">`;
    } else {
      wrap.innerHTML = `<label>Cor de fundo</label><input type="color" id="cf-bg-val" value="${s.bgValue||'#FFFFFF'}" style="height:40px;width:100%;border-radius:8px;border:1px solid var(--adm-border);cursor:pointer;background:transparent">`;
    }
  },

  previewColor(key, val) {
    document.documentElement.style.setProperty(`--${key}`, val);
    const hexEl = document.getElementById(`cf-${key}-hex`);
    if (hexEl) hexEl.value = val;
  },

  syncColor(key, val) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(val)) return;
    document.documentElement.style.setProperty(`--${key}`, val);
    const picker = document.getElementById(`cf-${key}`);
    if (picker) picker.value = val;
  },

  applyThemePreset(c1, c2) {
    document.documentElement.style.setProperty('--c1', c1);
    document.documentElement.style.setProperty('--c2', c2);
    const p1 = document.getElementById('cf-c1'); if(p1) p1.value = c1;
    const p2 = document.getElementById('cf-c2'); if(p2) p2.value = c2;
    const h1 = document.getElementById('cf-c1-hex'); if(h1) h1.value = c1;
    const h2 = document.getElementById('cf-c2-hex'); if(h2) h2.value = c2;
    app.toast('Tema aplicado — salve para confirmar', 'yellow');
  },

  toggleConf(key) {
    const s = STATE.setup; s[key] = !s[key]; STATE.setup = s;
    const ids = { storeOpen:'tgl-open', tableMode:'tgl-table' };
    const btn = document.getElementById(ids[key]);
    if (btn) btn.classList.toggle('on', s[key]);
  },

  saveConf() {
    const bgType = document.querySelector('input[name="bg-type"]:checked')?.value || 'color';
    const s = {
      ...STATE.setup,
      storeName: document.getElementById('cf-name')?.value.trim()  || STATE.setup.storeName,
      whatsapp:  document.getElementById('cf-wa')?.value.trim()    || STATE.setup.whatsapp,
      totemUrl:  document.getElementById('cf-url')?.value.trim()   || STATE.setup.totemUrl,
      logoUrl:   document.getElementById('cf-logo')?.value.trim()  || '',
      coverUrl:  document.getElementById('cf-cover')?.value.trim() || '',
      bgType,
      bgValue:   document.getElementById('cf-bg-val')?.value       || STATE.setup.bgValue,
      c1:        document.getElementById('cf-c1')?.value            || STATE.setup.c1,
      c2:        document.getElementById('cf-c2')?.value            || STATE.setup.c2,
      numMesas:  parseInt(document.getElementById('cf-mesas')?.value)|| 10,
    };
    STATE.setup = s;
    STATE.applyTheme();
    STATE.initMesas();
    app.toast('✅ Configurações salvas!', 'green');
  },
};
