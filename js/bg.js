/* ============================================================
 * 背景：奥行きのあるサイバー空間 × ダイナミックな水流 × 墨煙
 *  - WSPEED : 全体の動きの速さ（0.5〜0.75推奨。現在0.6）
 *  - 水しぶき（岩に当たって上がるスプレー）付き
 * ============================================================ */
(function () {
  const WSPEED = 0.6; // ★ 動きの速さ（0.5=ゆったり 〜 0.75=やや速め）

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = document.getElementById('bg-canvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  let W, H, DPR;
  let mouseX = 0, mouseY = 0, targetMX = 0, targetMY = 0;
  let scrollY = 0;

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  addEventListener('resize', resize);
  addEventListener('mousemove', e => {
    targetMX = (e.clientX / W - .5);
    targetMY = (e.clientY / H - .5);
  }, { passive: true });
  addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  /* ---------- 浮遊粒子（3層の奥行き） ---------- */
  const GLYPHS = ['忍', '影', '風', '刃', '印', '水', '流', '滝'];
  const parts = [];
  const N = Math.min(90, Math.floor(W * H / 16000));
  for (let i = 0; i < N; i++) {
    const depth = Math.random();
    parts.push({
      x: Math.random(), y: Math.random(),
      depth,
      r: .6 + depth * 2.2,
      vy: (.04 + depth * .12) * (Math.random() > .5 ? 1 : -1) * .3,
      vx: (Math.random() - .5) * .02,
      glyph: Math.random() < .08 ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : null,
      hue: Math.random() < .82 ? 'cyan' : 'shu',
      tw: Math.random() * Math.PI * 2,
    });
  }

  /* ---------- 墨煙 ---------- */
  const clouds = [];
  const CLOUD_N = 5;
  function spawnCloud(init) {
    const blobs = [];
    const nb = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < nb; i++) {
      blobs.push({
        ang: Math.random() * Math.PI * 2,
        dist: 20 + Math.random() * 70,
        r: 45 + Math.random() * 85,
        spin: (Math.random() - .5) * .14,
        wob: Math.random() * Math.PI * 2,
      });
    }
    return {
      x: Math.random(), y: .08 + Math.random() * .78,
      life: init ? Math.random() * .7 : 0,
      speed: (.0007 + Math.random() * .0011) * WSPEED,
      scale: .7 + Math.random() * 1.0,
      drift: (Math.random() - .5) * .00016 * WSPEED,
      blobs,
    };
  }
  for (let i = 0; i < CLOUD_N; i++) clouds.push(spawnCloud(true));

  /* ---------- 水流：流れの筋・波紋・煌めき・岩・水しぶき ---------- */
  const streaks = [];
  for (let i = 0; i < 36; i++) {
    streaks.push({
      p: Math.random(),
      off: (Math.random() - .5) * 1.6,
      speed: (.0018 + Math.random() * .003),
    });
  }
  const glints = [];
  for (let i = 0; i < 40; i++) {
    glints.push({ p: .15 + Math.random() * .85, off: (Math.random() - .5) * 1.6, tw: Math.random() * Math.PI * 2 });
  }
  const ripples = [];

  // 岩（水しぶきの発生源）：p=奥行き(0..1)、off=川幅内の位置(-1..1)
  const ROCKS = [
    { p: .48, off: -.38, seed: 1.3 },
    { p: .66, off: .42, seed: 4.1 },
    { p: .85, off: -.08, seed: 2.6 },
  ];
  const drops = []; // 水しぶきの粒
  const MAX_DROPS = 150;

  let t = 0;
  function draw() {
    t += .016;
    const wt = t * WSPEED; // 水の時間（減速済み）
    mouseX += (targetMX - mouseX) * .04;
    mouseY += (targetMY - mouseY) * .04;
    ctx.clearRect(0, 0, W, H);

    /* 深い空 */
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0a1020');
    sky.addColorStop(.55, '#070b14');
    sky.addColorStop(1, '#05070d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    /* パースの効いた床グリッド */
    const horizonY = H * .62 + mouseY * 30 - Math.min(scrollY * .03, 40);
    const vpX = W / 2 + mouseX * 60;
    ctx.save();
    ctx.strokeStyle = 'rgba(62,230,218,.10)';
    ctx.lineWidth = 1;
    for (let i = -14; i <= 14; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX + i * 26, horizonY);
      ctx.lineTo(vpX + i * (W / 9), H + 40);
      ctx.stroke();
    }
    const gridFlow = reduce ? 0 : (wt * .35) % 1;
    for (let j = 0; j < 12; j++) {
      const p = (j + gridFlow) / 12;
      const y = horizonY + Math.pow(p, 2.4) * (H - horizonY + 40);
      const alpha = .02 + Math.pow(p, 2) * .16;
      ctx.strokeStyle = `rgba(62,230,218,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(W, y);
      ctx.stroke();
    }
    const glow = ctx.createLinearGradient(0, horizonY - 60, 0, horizonY + 60);
    glow.addColorStop(0, 'rgba(62,230,218,0)');
    glow.addColorStop(.5, 'rgba(62,230,218,.10)');
    glow.addColorStop(1, 'rgba(62,230,218,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, horizonY - 60, W, 120);
    ctx.restore();

    /* 遠景の山 */
    ctx.save();
    ctx.fillStyle = 'rgba(10,16,30,.9)';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    const mShift = mouseX * 20;
    for (let x = 0; x <= W; x += 8) {
      const y = horizonY
        - 36 * Math.abs(Math.sin(x * .004 + 1.7))
        - 20 * Math.abs(Math.sin(x * .011 + .4));
      ctx.lineTo(x + mShift * 0.3, y);
    }
    ctx.lineTo(W, horizonY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    /* ============ 水流：地平線から手前へ流れる大きな川 ============ */
    function riverX(p, side) {
      const cx = vpX + Math.sin(p * 2.8 + wt * .16) * W * .06 * p; // 蛇行を強めに
      const half = 9 + Math.pow(p, 1.5) * (W * .37);               // 川幅も広く
      return cx + side * half;
    }
    function riverY(p) { return horizonY + Math.pow(p, 1.9) * (H - horizonY + 30); }
    function riverPt(p, off) {
      const l = riverX(p, -1), r = riverX(p, 1);
      return { x: l + (off * .5 + .5) * (r - l), y: riverY(p) };
    }

    ctx.save();
    const STEPS = 28;
    ctx.beginPath();
    ctx.moveTo(riverX(0, -1), riverY(0));
    for (let i = 1; i <= STEPS; i++) ctx.lineTo(riverX(i / STEPS, -1), riverY(i / STEPS));
    for (let i = STEPS; i >= 0; i--) ctx.lineTo(riverX(i / STEPS, 1), riverY(i / STEPS));
    ctx.closePath();

    // 川面（前回より明るく、存在感のある水色）
    const wg = ctx.createLinearGradient(0, horizonY, 0, H);
    wg.addColorStop(0, 'rgba(90,235,225,.26)');
    wg.addColorStop(.35, 'rgba(60,175,220,.16)');
    wg.addColorStop(1, 'rgba(45,135,200,.22)');
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.clip();

    // 手前へ流れる横波（大きくうねる）
    const flow = reduce ? 0 : (wt * .55) % 1;
    for (let j = 0; j < 12; j++) {
      const p = ((j + flow) % 12) / 12;
      if (p < .02) continue;
      const y0 = riverY(p);
      const alpha = .06 + Math.pow(p, 1.5) * .4;
      ctx.strokeStyle = `rgba(150,242,235,${alpha})`;
      ctx.lineWidth = .9 + p * 2.4;
      ctx.beginPath();
      const l = riverX(p, -1), r = riverX(p, 1);
      for (let x = l; x <= r; x += 9) {
        const k = (x - l) / Math.max(r - l, 1);
        const y = y0 + Math.sin(k * Math.PI * 4 + wt * 2.4 + j) * (2 + p * 8);
        x === l ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 川岸の白いさざ波（両岸ライン）
    for (const side of [-1, 1]) {
      ctx.strokeStyle = 'rgba(200,250,245,.16)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 2; i <= STEPS; i++) {
        const p = i / STEPS;
        const x = riverX(p, side) - side * Math.abs(Math.sin(p * 9 + wt * 1.6)) * 5 * p;
        const y = riverY(p);
        i === 2 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 流れの筋（水面を滑る光）
    for (const s of streaks) {
      if (!reduce) {
        s.p += s.speed * WSPEED * (0.4 + s.p * 1.8);
        if (s.p > 1.02) { s.p = 0; s.off = (Math.random() - .5) * 1.6; }
      }
      const a1 = riverPt(s.p, s.off);
      const a2 = riverPt(Math.min(s.p + .045, 1.02), s.off * .96);
      const alpha = .1 + s.p * .5;
      ctx.strokeStyle = `rgba(180,248,240,${alpha})`;
      ctx.lineWidth = .9 + s.p * 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a1.x, a1.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.stroke();
    }

    // 波紋
    if (!reduce && Math.random() < .07 * WSPEED * 2 && ripples.length < 10) {
      ripples.push({ p: .25 + Math.random() * .72, off: (Math.random() - .5) * 1.4, r: 0, life: 0 });
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.life += .014 * WSPEED; rp.r += (.7 + rp.p * 2.8) * WSPEED;
      if (rp.life >= 1) { ripples.splice(i, 1); continue; }
      const pos = riverPt(rp.p, rp.off);
      const alpha = (1 - rp.life) * (.16 + rp.p * .32);
      ctx.strokeStyle = `rgba(190,248,240,${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, rp.r, rp.r * (.25 + rp.p * .2), 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 煌めき
    for (const g of glints) {
      const pos = riverPt(g.p, g.off);
      const tw = .5 + .5 * Math.sin(wt * 2.2 + g.tw);
      const alpha = tw * (.14 + g.p * .5);
      const size = .8 + g.p * 2.6;
      ctx.fillStyle = `rgba(225,255,250,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - size * 2);
      ctx.lineTo(pos.x + size, pos.y);
      ctx.lineTo(pos.x, pos.y + size * 2);
      ctx.lineTo(pos.x - size, pos.y);
      ctx.closePath();
      ctx.fill();
    }

    /* 岩と白波（水しぶきの発生源） */
    for (const rk of ROCKS) {
      const pos = riverPt(rk.p, rk.off);
      const s = 8 + rk.p * 26; // 手前ほど大きい
      // 岩本体
      const rg = ctx.createRadialGradient(pos.x - s * .3, pos.y - s * .4, s * .1, pos.x, pos.y, s);
      rg.addColorStop(0, '#2a3648');
      rg.addColorStop(.6, '#131c2a');
      rg.addColorStop(1, '#080d16');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y - s * .18, s, s * .55, 0, 0, Math.PI * 2);
      ctx.fill();
      // 岩にぶつかる白波（上流側で泡立つ）
      const foam = .5 + .5 * Math.sin(wt * 3 + rk.seed);
      ctx.strokeStyle = `rgba(230,252,250,${.22 + foam * .25})`;
      ctx.lineWidth = 2 + rk.p * 2.4;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y - s * .05, s * 1.2, s * .4, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(230,252,250,${.1 + foam * .14})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y + s * .12, s * 1.55, s * .5, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      // 水しぶきを発生
      if (!reduce && drops.length < MAX_DROPS && Math.random() < .5) {
        const n = 1 + Math.floor(Math.random() * 2);
        for (let k = 0; k < n; k++) {
          drops.push({
            x: pos.x + (Math.random() - .5) * s * 1.4,
            y: pos.y - s * .3,
            vx: (Math.random() - .5) * (1.4 + rk.p * 2.4),
            vy: -(1.6 + Math.random() * 2.8) * (.45 + rk.p),
            g: .085 * (.5 + rk.p),
            life: 0,
            size: .7 + Math.random() * (1 + rk.p * 2),
          });
        }
      }
    }

    /* 水しぶきの粒（放物線を描いて上がる） */
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      if (!reduce) {
        d.x += d.vx * WSPEED;
        d.vy += d.g * WSPEED;
        d.y += d.vy * WSPEED;
        d.life += .022 * WSPEED;
      }
      if (d.life >= 1) { drops.splice(i, 1); continue; }
      const alpha = (1 - d.life) * .8;
      ctx.fillStyle = `rgba(228,252,250,${alpha})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size * (1 - d.life * .4), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // 川のクリップ解除

    // 川の源（地平線の光）
    const src = ctx.createRadialGradient(vpX, horizonY, 0, vpX, horizonY, 110);
    src.addColorStop(0, 'rgba(150,242,232,.26)');
    src.addColorStop(1, 'rgba(150,242,232,0)');
    ctx.fillStyle = src;
    ctx.fillRect(vpX - 110, horizonY - 60, 220, 120);

    /* ============ 墨煙 ============ */
    for (let ci = 0; ci < clouds.length; ci++) {
      const c = clouds[ci];
      if (!reduce) { c.life += c.speed; c.x += c.drift; }
      if (c.life >= 1) { clouds[ci] = spawnCloud(false); continue; }
      const grow = .35 + c.life * 1.15;
      const fade = c.life < .25 ? c.life / .25 : (1 - c.life) / .75;
      const cx = c.x * W + mouseX * 20;
      const cy = c.y * H + mouseY * 14 - scrollY * .04;
      for (const b of c.blobs) {
        if (!reduce) b.ang += b.spin * .016 * WSPEED;
        const bx = cx + Math.cos(b.ang + b.wob) * b.dist * grow * c.scale;
        const by = cy + Math.sin(b.ang) * b.dist * grow * c.scale * .7 - c.life * 46;
        const br = b.r * grow * c.scale;
        const g = ctx.createRadialGradient(bx, by, br * .08, bx, by, br);
        g.addColorStop(0, `rgba(1,3,8,${.62 * fade})`);
        g.addColorStop(.55, `rgba(3,6,12,${.34 * fade})`);
        g.addColorStop(1, 'rgba(3,6,12,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* ============ 浮遊粒子 ============ */
    for (const p of parts) {
      if (!reduce) {
        p.y += p.vy * .003 * WSPEED;
        p.x += p.vx * .003 * WSPEED + Math.sin(wt * .5 + p.tw) * .0002;
        if (p.y > 1.05) p.y = -.05; if (p.y < -.05) p.y = 1.05;
        if (p.x > 1.05) p.x = -.05; if (p.x < -.05) p.x = 1.05;
      }
      const px = p.x * W + mouseX * (p.depth * 46);
      const py = p.y * H + mouseY * (p.depth * 34) - scrollY * p.depth * .08;
      const wrapY = ((py % (H + 80)) + (H + 80)) % (H + 80) - 40;
      const twinkle = .5 + .5 * Math.sin(wt * 1.4 + p.tw);
      const a = (.12 + p.depth * .5) * (.55 + .45 * twinkle);
      if (p.glyph) {
        ctx.save();
        ctx.font = `${10 + p.depth * 16}px 'Kaisei Tokumin',serif`;
        ctx.fillStyle = p.hue === 'shu'
          ? `rgba(228,90,60,${a * .8})`
          : `rgba(120,235,225,${a * .7})`;
        ctx.shadowColor = p.hue === 'shu' ? 'rgba(228,71,46,.8)' : 'rgba(62,230,218,.8)';
        ctx.shadowBlur = 12;
        ctx.fillText(p.glyph, px, wrapY);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(px, wrapY, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.hue === 'shu'
          ? `rgba(230,110,80,${a})`
          : `rgba(140,240,230,${a})`;
        ctx.shadowColor = p.hue === 'shu' ? 'rgba(228,71,46,.9)' : 'rgba(62,230,218,.9)';
        ctx.shadowBlur = 8 * p.depth;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    if (!reduce) requestAnimationFrame(draw);
  }
  draw();
})();
