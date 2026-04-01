/* ========================================
   LABFOOD OS v2 — caixa.js
   Módulo: Fechamento de Caixa / Relatório do Dia
   ======================================== */

const caixa = {

  buildHTML() {
    const c = STATE.caixaState;
    if (!c.aberto) {
      return this._htmlAbrirCaixa();
    }
    return this._htmlCaixaAberto();
  },

  /* ── ABERTURA ─────────────────── */
  _htmlAbrirCaixa() {
    const hist = STATE.caixaState.historico || [];

    return `
      <div class="tab-pane">
        <h2>CAIXA</h2>
        <p class="tab-sub">Abra o caixa para começar o dia</p>

        <div class="caixa-summary" style="max-width:420px">
          <h3>ABRIR CAIXA</h3>
          <div class="form-group">
            <label>Fundo de Caixa Inicial (R$)</label>
            <input class="input input-dark" id="cx-fundo" type="number" min="0" step="0.01" placeholder="0,00" value="0">
          </div>
          <div class="form-group">
            <label>Observação (opcional)</label>
            <input class="input input-dark" id="cx-obs" placeholder="ex: Caixa do dia">
          </div>
          <button class="btn btn-primary btn-lg btn-block" onclick="caixa.abrirCaixa()">🔓 Abrir Caixa</button>
        </div>

        ${hist.length > 0 ? `
          <h3 style="font-family:var(--font-display);font-size:18px;color:var(--adm-text);margin:24px 0 12px;letter-spacing:1px">HISTÓRICO</h3>
          ${hist.slice(0,5).map(h => `
            <div class="card-dark" style="margin-bottom:8px;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center">
              <div>
                <div style="font-size:12px;color:var(--adm-dim)">${new Date(h.abertura).toLocaleDateString('pt-BR')} — ${new Date(h.abertura).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} → ${h.fechamento ? new Date(h.fechamento).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : 'em aberto'}</div>
                <div style="font-size:13px;color:var(--adm-text);margin-top:2px">${h.numPedidos} pedidos · ${h.obs||''}</div>
              </div>
              <div style="text-align:right">
                <div style="color:var(--c1);font-family:var(--font-mono);font-weight:800;font-size:16px">${app.fmt(h.totalVendas)}</div>
                <div style="font-size:11px;color:var(--adm-dim)">fundo: ${app.fmt(h.fundoCaixa)}</div>
              </div>
            </div>`).join('')}
        ` : ''}
      </div>`;
  },

  /* ── CAIXA ABERTO ─────────────── */
  _htmlCaixaAberto() {
    const c        = STATE.caixaState;
    const orders   = STATE.todayOrders();
    const pagos    = orders.filter(o => o.pago || o.status === 'entregue');
    const pendentes= orders.filter(o => !o.pago && o.status !== 'entregue');
    const totalVendas   = pagos.reduce((s,o)=>s+o.total, 0);
    const totalPendente = pendentes.reduce((s,o)=>s+o.total, 0);
    const totalCaixa    = c.fundoCaixa + totalVendas;
    const abertura      = new Date(c.abertura).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
    const ticket        = pagos.length ? totalVendas / pagos.length : 0;

    return `
      <div class="tab-pane">
        <h2>CAIXA ABERTO</h2>
        <p class="tab-sub">Aberto às ${abertura} · ${orders.length} pedidos no dia</p>

        <div class="stats-grid" style="margin-bottom:20px">
          <div class="stat-card"><div class="stat-label">Vendas Fechadas</div><div class="stat-val red">${app.fmt(totalVendas)}</div></div>
          <div class="stat-card"><div class="stat-label">Pedidos</div><div class="stat-val">${pagos.length}</div></div>
          <div class="stat-card"><div class="stat-label">Ticket Médio</div><div class="stat-val green">${app.fmt(ticket)}</div></div>
          <div class="stat-card"><div class="stat-label">Em Aberto</div><div class="stat-val yellow">${app.fmt(totalPendente)}</div></div>
        </div>

        <!-- Resumo do caixa -->
        <div class="caixa-summary" style="max-width:500px;margin-bottom:20px">
          <h3>RESUMO DO DIA</h3>
          <div class="caixa-line"><span>Fundo de Caixa</span><span>${app.fmt(c.fundoCaixa)}</span></div>
          <div class="caixa-line"><span>Total de Vendas</span><span>${app.fmt(totalVendas)}</span></div>
          <div class="caixa-line"><span>Pedidos pendentes (${pendentes.length})</span><span style="color:var(--c2)">${app.fmt(totalPendente)}</span></div>
          <hr class="divider divider-dark" style="margin:8px 0">
          <div class="caixa-line total"><span>Total em Caixa</span><span>${app.fmt(totalCaixa)}</span></div>
        </div>

        <!-- Sangria -->
        <div class="card-dark" style="max-width:500px;margin-bottom:20px">
          <h4 style="font-family:var(--font-display);font-size:15px;color:var(--adm-text);letter-spacing:1px;margin-bottom:12px">SANGRIA</h4>
          <div style="display:flex;gap:8px">
            <input class="input input-dark" id="cx-sangria" type="number" min="0" step="0.01" placeholder="Valor da sangria" style="flex:1">
            <button class="btn btn-secondary" onclick="caixa.registrarSangria()">Registrar</button>
          </div>
          ${c.sangrias?.length ? `
            <div style="margin-top:10px">
              ${c.sangrias.map(s=>`
                <div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px solid var(--adm-border);color:var(--adm-dim)">
                  <span>${new Date(s.ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>
                  <span style="color:var(--c1);font-family:var(--font-mono)">- ${app.fmt(s.valor)}</span>
                </div>`).join('')}
            </div>` : ''}
        </div>

        <!-- Pedidos em aberto -->
        ${pendentes.length > 0 ? `
          <h3 style="font-family:var(--font-display);font-size:17px;color:var(--adm-text);margin-bottom:12px;letter-spacing:1px">PEDIDOS PENDENTES</h3>
          ${pendentes.map(o => `
            <div class="order-card">
              <div>
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
                  <span class="order-id-badge">${o.id}</span>
                  ${o.mesa ? `<span class="badge badge-blue">Mesa ${o.mesa}</span>` : ''}
                </div>
                <div style="font-size:12px;color:var(--adm-dim)">${o.items.map(i=>`${i.qty}× ${i.name}`).join(' · ')}</div>
                ${o.name ? `<div style="font-size:12px;color:var(--adm-text)">👤 ${o.name}</div>` : ''}
              </div>
              <div style="text-align:right;display:flex;flex-direction:column;gap:6px">
                <span style="color:var(--c1);font-family:var(--font-mono);font-weight:800">${app.fmt(o.total)}</span>
                <button class="btn btn-primary btn-sm" onclick="caixa.marcarPago('${o.id}')">✓ Pago</button>
              </div>
            </div>`).join('')}
        ` : `<p style="color:var(--adm-dim);font-size:13px;padding:8px 0">✅ Nenhum pedido pendente.</p>`}

        <!-- Fechar Caixa -->
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid var(--adm-border)">
          <button class="btn btn-danger btn-lg" onclick="caixa.confirmarFechamento()">🔒 Fechar Caixa</button>
        </div>
      </div>`;
  },

  /* ── ACTIONS ──────────────────── */
  abrirCaixa() {
    const fundo = parseFloat(document.getElementById('cx-fundo')?.value) || 0;
    const obs   = document.getElementById('cx-obs')?.value.trim() || '';
    STATE.caixaState = {
      ...STATE.caixaState,
      aberto:     true,
      abertura:   Date.now(),
      fundoCaixa: fundo,
      obs,
      sangrias:   [],
    };
    admin.setTab('caixa');
    app.toast('✅ Caixa aberto!', 'green');
  },

  registrarSangria() {
    const val = parseFloat(document.getElementById('cx-sangria')?.value);
    if (!val || val <= 0) { app.toast('Informe um valor válido','red'); return; }
    const c = STATE.caixaState;
    c.sangrias = [...(c.sangrias||[]), { valor:val, ts:Date.now() }];
    STATE.caixaState = c;
    admin.setTab('caixa');
    app.toast(`Sangria de ${app.fmt(val)} registrada`, 'yellow');
  },

  marcarPago(id) {
    STATE.orders = STATE.orders.map(o => o.id === id ? {...o, pago:true, status:'entregue'} : o);
    admin.setTab('caixa');
    app.toast(`Pedido ${id} pago ✓`, 'green');
  },

  fecharMesa(num) {
    const orders = STATE.orders.filter(o => o.mesa === num && !o.pago && o.status !== 'entregue');
    orders.forEach(o => {
      STATE.orders = STATE.orders.map(x => x.id === o.id ? {...x, pago:true, status:'entregue'} : x);
    });
    STATE.updateMesa(num, { status:'fechada' });
    admin.setTab('mesas');
    app.toast(`Mesa ${num} fechada e paga`, 'green');
  },

  confirmarFechamento() {
    if (!confirm('Fechar o caixa do dia? Esta ação registrará o relatório final.')) return;
    this._fecharCaixa();
  },

  _fecharCaixa() {
    const c        = STATE.caixaState;
    const orders   = STATE.todayOrders();
    const pagos    = orders.filter(o => o.pago || o.status === 'entregue');
    const sangrias = (c.sangrias||[]).reduce((s,x)=>s+x.valor,0);
    const totalVendas = pagos.reduce((s,o)=>s+o.total,0);

    const relatorio = {
      abertura:    c.abertura,
      fechamento:  Date.now(),
      fundoCaixa:  c.fundoCaixa,
      totalVendas,
      sangrias,
      totalFinal:  c.fundoCaixa + totalVendas - sangrias,
      numPedidos:  orders.length,
      obs:         c.obs || '',
    };

    STATE.caixaState = {
      ...c,
      aberto:    false,
      abertura:  null,
      historico: [relatorio, ...(c.historico||[])].slice(0, 30),
    };

    this._showRelatorio(relatorio);
  },

  _showRelatorio(r) {
    const dur = Math.round((r.fechamento - r.abertura) / 60000);
    const ticket = r.numPedidos ? r.totalVendas / r.numPedidos : 0;

    document.getElementById('modal-root').innerHTML = `
      <div class="modal-bg">
        <div class="modal" style="text-align:center;max-width:400px">
          <div style="font-size:40px;margin-bottom:8px">📊</div>
          <h3>RELATÓRIO DE FECHAMENTO</h3>
          <div style="text-align:left;margin:16px 0">
            <div class="caixa-line"><span>Abertura</span><span>${new Date(r.abertura).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span></div>
            <div class="caixa-line"><span>Fechamento</span><span>${new Date(r.fechamento).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span></div>
            <div class="caixa-line"><span>Duração</span><span>${dur}min</span></div>
            <div class="caixa-line"><span>Total de Pedidos</span><span>${r.numPedidos}</span></div>
            <div class="caixa-line"><span>Ticket Médio</span><span>${app.fmt(ticket)}</span></div>
            <hr class="divider divider-dark">
            <div class="caixa-line"><span>Fundo de Caixa</span><span>${app.fmt(r.fundoCaixa)}</span></div>
            <div class="caixa-line"><span>Total de Vendas</span><span>${app.fmt(r.totalVendas)}</span></div>
            <div class="caixa-line"><span>Sangrias</span><span style="color:var(--c2)">- ${app.fmt(r.sangrias)}</span></div>
            <div class="caixa-line total"><span>TOTAL FINAL</span><span>${app.fmt(r.totalFinal)}</span></div>
          </div>
          <div style="display:flex;gap:8px;justify-content:center">
            <button class="btn btn-primary" onclick="window.print()">🖨️ Imprimir</button>
            <button class="btn btn-dark" onclick="document.getElementById('modal-root').innerHTML='';admin.setTab('caixa')">Fechar</button>
          </div>
        </div>
      </div>`;
  },
};
