/* ============================================================
 * 共通処理：候補者レンダリング／フェーズ切替／演出
 * ============================================================ */
(function () {
  const CFG = window.SITE_CONFIG || {};
  const CANDS = window.CANDIDATES || [];

  /* ---------- 各種URLの適用 ---------- */
  document.querySelectorAll('[data-vote-link]').forEach(a => { if (CFG.voteUrl) a.href = CFG.voteUrl; });
  document.querySelectorAll('[data-cngt-link]').forEach(a => { if (CFG.cngtFormUrl) a.href = CFG.cngtFormUrl; });
  document.querySelectorAll('[data-ninsele-link]').forEach(a => { if (CFG.ninseleUrl) a.href = CFG.ninseleUrl; });
  document.querySelectorAll('[data-entry-link]').forEach(a => { if (CFG.entryFormUrl) a.href = CFG.entryFormUrl; });

  /* 投票前は投票ボタンを無効化し「COMING SOON」タグを重ねる
   * （voteLinksOpen: true または phase: "voting" で有効化） */
  if (CFG.phase !== 'voting' && !CFG.voteLinksOpen) {
    document.querySelectorAll('[data-vote-link]').forEach(a => {
      a.removeAttribute('href');
      a.removeAttribute('target');
      a.setAttribute('aria-disabled', 'true');
      a.classList.add('btn-disabled', 'btn-soon');
      if (!a.querySelector('.soon-tag')) {
        const s = document.createElement('span');
        s.className = 'soon-tag';
        s.textContent = 'COMING SOON';
        a.appendChild(s);
      }
    });
  }

  /* ---------- 候補者カードのレンダリング ---------- */
  const KUNAI_SVG = `
    <svg class="blade" viewBox="0 0 64 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#4a5568"/>
          <stop offset=".5" stop-color="#1c2430"/>
          <stop offset="1" stop-color="#0b1018"/>
        </linearGradient>
      </defs>
      <circle cx="32" cy="23" r="17" fill="none" stroke="#212a38" stroke-width="7"/>
      <rect x="27" y="38" width="10" height="46" rx="4" fill="#2a2118"/>
      <path d="M27 44 L37 50 M27 54 L37 60 M27 64 L37 70 M27 74 L37 80" stroke="#0f0b07" stroke-width="2.5"/>
      <rect x="22" y="82" width="20" height="6" rx="2" fill="#151b26"/>
      <path d="M32 148 C24 122 15 106 15 97 C15 91 22 87 32 87 C42 87 49 91 49 97 C49 106 40 122 32 148 Z" fill="url(#steel)"/>
      <path d="M32 145 C29 124 24 108 23 98" stroke="rgba(180,220,235,.35)" stroke-width="1.6" fill="none"/>
    </svg>`;

  const BADGE = {
    ninsele: { label: 'にんセレ参陣', cls: '' },
    form: { label: 'エントリー', cls: ' discord' },
    discord: { label: 'エントリー', cls: ' discord' }, // 旧キー互換
  };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, m =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function candCard(c) {
    const b = BADGE[c.badge] || BADGE.form;
    const iconInner = c.icon
      ? `<img src="${esc(c.icon)}" alt="${esc(c.name)}のアイコン">`
      : 'icon';
    // アイコンクリックでSNSへ
    const avatar = c.sns
      ? `<a class="kunai-avatar" href="${esc(c.sns)}" target="_blank" rel="noopener" title="${esc(c.name)}さんのSNSを開く">${iconInner}</a>`
      : `<div class="kunai-avatar">${iconInner}</div>`;
    const snsLink = c.sns
      ? `<a class="cand-sns" href="${esc(c.sns)}" target="_blank" rel="noopener">${esc(c.name)}さんのXを見る →</a>`
      : '';
    return `
      <article class="cand-scroll washi-sheet reveal">
        <span class="axis l" aria-hidden="true"></span><span class="axis r" aria-hidden="true"></span>
        <span class="edge-shade" aria-hidden="true"></span>
        <div class="kunai-wrap">
          ${KUNAI_SVG}
          <div class="hang">${avatar}</div>
        </div>
        <div class="washi-content">
          <span class="cand-badge${b.cls}">${b.label}</span>
          <h3 class="cand-name">${esc(c.name)}</h3>
          <p class="cand-statement">${esc(c.statement)}</p>
          ${snsLink}
        </div>
      </article>`;
  }

  const EMPTY_CARD = `
    <article class="cand-scroll empty reveal">
      <div class="cand-empty">
        <span>募集中</span>
        <p>次の名乗りを、待つ。</p>
      </div>
    </article>`;

  document.querySelectorAll('[data-cand-grid]').forEach(grid => {
    const limit = grid.dataset.candGrid === 'top' && CFG.candidatesOnTop > 0
      ? CFG.candidatesOnTop : Infinity;
    const list = CANDS.slice(0, limit);
    // 「募集中」枠は投票フェーズに入ったら出さない
    const empty = CFG.phase === 'voting' ? '' : EMPTY_CARD;
    grid.innerHTML = list.map(candCard).join('') + empty;
    const more = document.getElementById('cand-more');
    if (more) more.style.display = (grid.dataset.candGrid === 'top' || CANDS.length > limit) ? 'block' : 'none';
  });

  /* ---------- フェーズ切替（投票期間中の並び替え） ---------- */
  if (CFG.phase === 'voting') {
    document.body.classList.add('phase-voting');
    if (document.body.dataset.page === 'index') {
      const hero = document.querySelector('.hero');
      const cand = document.getElementById('candidates');
      const vote = document.getElementById('vote');
      if (hero && cand && vote) {
        hero.after(vote);
        hero.after(cand);
      }
      const eyebrow = document.querySelector('.hero-eyebrow');
      if (eyebrow) eyebrow.textContent = '投票受付中 — CRYPTONINJA OWNER ELECTION 2026';
      const ctaVote = document.getElementById('cta-vote');
      const ctaRun = document.getElementById('cta-run');
      const ctaWrap = document.querySelector('.hero-cta');
      if (ctaVote && ctaRun && ctaWrap) {
        ctaVote.className = 'btn btn-shu';
        ctaRun.className = 'btn btn-ghost';
        ctaWrap.prepend(ctaVote);
      }
    }
  }

  /* ---------- スクロール出現 & 巻物の展開 ---------- */
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        if (e.target.id === 'makimono') e.target.classList.add('open');
        io.unobserve(e.target);
      }
    }
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- NFTカードの3D傾き ---------- */
  const card = document.getElementById('tilt-card');
  if (card && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const wrap = card.closest('.hero');
    wrap.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / r.width, dy = (e.clientY - cy) / r.height;
      card.style.transform = `rotateY(${dx * 14}deg) rotateX(${-dy * 14}deg) translateZ(10px)`;
    });
    wrap.addEventListener('mouseleave', () => { card.style.transform = ''; });
  }
})();
