/* ========================================
   LABFOOD OS v2 — qr.js
   Utilitários de QR Code e sessões por cliente
   ======================================== */

const qr = {

  /* Gera QR inline em qualquer elemento */
  generate(elementId, url, size = 180) {
    const el = document.getElementById(elementId);
    if (!el || typeof QRCode === 'undefined') {
      console.warn('[qr] QRCode.js não carregado ou elemento não encontrado');
      return;
    }
    el.innerHTML = '';
    new QRCode(el, {
      text:        url,
      width:       size,
      height:      size,
      colorDark:   '#1A1A1A',
      colorLight:  '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.M,
    });
  },

  /* Retorna URL do totem para uma mesa */
  urlMesa(num) {
    const base = STATE.setup.totemUrl || window.location.href.split('?')[0];
    return `${base}?mesa=${num}`;
  },

  /* Retorna URL do totem puro (sem mesa) */
  urlTotem() {
    return STATE.setup.totemUrl || window.location.href.split('?')[0];
  },

  /* Retorna URL com sessão temporária */
  urlSession(mesa, validMinutes = 120) {
    const sess = STATE.newSession(mesa, validMinutes);
    const base = STATE.setup.totemUrl || window.location.href.split('?')[0];
    return { url: `${base}?mesa=${mesa}&sess=${sess.id}`, sess };
  },

  /* Valida sessão via URL params */
  validateFromURL() {
    const params = new URLSearchParams(window.location.search);
    const sessId = params.get('sess');
    if (!sessId) return true; // sem sessão = livre
    const sess = STATE.getActiveSession(sessId);
    return !!sess;
  },

  /* Resumo de sessões ativas */
  activeSessions() {
    return STATE.sessions.filter(s => s.status === 'ativa' && Date.now() < s.expires);
  },
};
