/* ========================================
   LABFOOD OS v2 — app.js
   Core: roteamento, auth, QR mesa via URL, utils
   ======================================== */

const app = {
  _clicks: 0,
  _clickTimer: null,
  _toastTimer: null,
  mesaAtiva: null, // mesa detectada via URL

  init() {
    STATE.applyTheme();
    STATE.initMesas();

    // Detecta parâmetro ?mesa=N na URL
    const params = new URLSearchParams(window.location.search);
    const mesa   = parseInt(params.get('mesa'));
    if (mesa && mesa > 0) {
      this.mesaAtiva = mesa;
      // valida sessão se vier ?sess=ID
      const sessId = params.get('sess');
      if (sessId) {
        const sess = STATE.getActiveSession(sessId);
        if (!sess) {
          this.render('sessao_expirada'); return;
        }
      }
    }
    this.render('totem');
  },

  /* ── EASTER EGG ─────────────── */
  secretLogin() {
    this._clicks++;
    document.getElementById('secret-dot')?.classList.toggle('active', this._clicks > 0);
    clearTimeout(this._clickTimer);
    this._clickTimer = setTimeout(() => {
      this._clicks = 0;
      document.getElementById('secret-dot')?.classList.remove('active');
    }, 2000);
    if (this._clicks >= 5) {
      this._clicks = 0;
      document.getElementById('secret-dot')?.classList.remove('active');
      this.render('login');
    }
  },

  /* ── ROTEADOR ────────────────── */
  render(view) {
    const vp  = document.getElementById('viewport');
    const act = document.getElementById('header-actions');
    const fab = document.getElementById('cartFab');

    fab.style.display = 'none';
    document.body.classList.remove('admin-mode');

    switch (view) {
      case 'totem':
        vp.innerHTML  = totem.buildHTML();
        act.innerHTML = '';
        fab.style.display = 'flex';
        totem.init();
        break;

      case 'login':
        vp.innerHTML = this._loginHTML();
        act.innerHTML = `<button class="btn btn-ghost btn-sm" onclick="app.render('totem')">← Voltar</button>`;
        break;

      case 'admin':
        if (!STATE.user) { this.render('login'); return; }
        document.body.classList.add('admin-mode');
        vp.innerHTML = admin.buildHTML();
        act.innerHTML = `
          <span style="color:rgba(255,255,255,0.7);font-size:12px;margin-right:4px">${STATE.user.name}</span>
          <button class="btn btn-ghost btn-sm" onclick="app.logout()">Sair</button>`;
        admin.init();
        break;

      case 'sessao_expirada':
        vp.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:center;min-height:60vh;flex-direction:column;gap:16px;text-align:center;padding:24px">
            <div style="font-size:48px">⏰</div>
            <h2 style="font-family:var(--font-display);font-size:26px;letter-spacing:1px;color:var(--c1)">SESSÃO EXPIRADA</h2>
            <p style="color:var(--muted)">Solicite um novo QR ao garçom.</p>
          </div>`;
        break;
    }
  },

  /* ── AUTH ──────────────────── */
  _loginHTML() {
    return `
      <div class="login-wrap">
        <div class="login-card">
          <h2>ACESSO RESTRITO</h2>
          <p>Painel administrativo LabFood OS</p>
          <div class="form-group">
            <label>Chave de Acesso</label>
            <input class="input input-dark" id="ln-key" type="text" placeholder="ex: ADMIN" autocomplete="off" style="text-transform:uppercase">
          </div>
          <div class="form-group">
            <label>Senha</label>
            <input class="input input-dark" id="ln-pass" type="password" placeholder="••••••"
              onkeydown="if(event.key==='Enter') app.doLogin()">
          </div>
          <button class="btn btn-primary btn-block btn-lg" onclick="app.doLogin()">ENTRAR</button>
          <button class="login-back" onclick="app.render('totem')">Cancelar</button>
        </div>
      </div>`;
  },

  doLogin() {
    const k = document.getElementById('ln-key')?.value.trim().toUpperCase();
    const p = document.getElementById('ln-pass')?.value;
    const found = STATE.keys.find(x => x.key === k && x.pass === p);
    if (!found) { app.toast('Credenciais inválidas', 'red'); return; }
    STATE.user = {...found};
    app.render('admin');
    app.toast(`Bem-vindo, ${found.name}`, 'green');
  },

  logout() {
    STATE.user = null;
    this.render('totem');
    this.toast('Sessão encerrada');
  },

  /* ── TOAST ─────────────────── */
  toast(msg, type = 'default') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.className = type !== 'default' ? `toast-${type}` : '';
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  },

  /* ── UTILS ─────────────────── */
  fmt(v) { return 'R$ ' + Number(v).toFixed(2).replace('.', ','); },
  fmtDate(ts) { return new Date(ts).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }); },
  uid() { return Math.random().toString(36).slice(2, 9).toUpperCase(); },
};

window.onload = () => app.init();
