/* ============================================================
 * 背景：奥行きのあるサイバー空間 × 水流（せせらぎ） × 墨煙
 * ============================================================ */
(function () {
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

  /* ---------- 墨煙（水中に滲むインク） ---------- */
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
      speed: .0007 + Math.random() * .0011,
      scale: .7 + Math.random() * 1.0,
      drift: (Math.random() - .5) * .00016,
      blobs,
    };
  }
  for (let i = 0; i < CLOUD_N; i++) clouds.push(spawnCloud(true));

  /* ---------- 水流（川）：流れの粒・波紋・煌めき ---------- */
  const streaks = [];   // 流れの筋
  for (let i = 0; i < 26; i++) {
    streaks.push({
      p: Math.random(),                    // 0(地平線)→1(手前)
      off: (Math.random() - .5) * 1.5,     // 川幅内の位置(-0.75..0.75)
      speed: .0016 + Math.random() * .0028,
    });
  }
  const glints = [];    // せせらぎの煌めき
  for (let i = 0; i < 30; i++) {
    glints.push({ p: .15 + Math.random() * .85, off: (Math.random() - .5) * 1.5, tw: Math.random() * Math.PI * 2 });
  }
  const ripples = [];   // 波紋

  let t = 0;
  function draw() {
    t += .016;
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
    const speed = reduce ? 0 : (t * .35) % 1;
    for (let j = 0; j < 12; j++) {
      const p = (j + speed) / 12;
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

    /* 遠景の山（墨絵風シルエット） */
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

    /* ============ 水流：地平線から手前へ流れる光の川 ============ */
    // 川の形（緩く蛇行しながら手前で広がる）
    function riverX(p, side) { // p:0(地平線)→1(手前), side:-1(左岸)/1(右岸)
      const cx = vpX + Math.sin(p * 2.4 + t * .12) * W * .045 * p;
      const half = 9 + Math.pow(p, 1.6) * (W * .30);
      return cx + side * half;
    }
    function riverY(p) { return horizonY + Math.pow(p, 1.9) * (H - horizonY + 30); }
    function riverPt(p, off) { // off:-1..1（川幅内の位置）
      const l = riverX(p, -1), r = riverX(p, 1);
      return { x: l + (off * .5 + .5) * (r - l), y: riverY(p) };
    }

    ctx.save();
    // 川面（うっすら光る水のグラデーション）
    const STEPS = 26;
    ctx.beginPath();
    ctx.moveTo(riverX(0, -1), riverY(0));
    for (let i = 1; i <= STEPS; i++) ctx.lineTo(riverX(i / STEPS, -1), riverY(i / STEPS));
    for (let i = STEPS; i >= 0; i--) ctx.lineTo(riverX(i / STEPS, 1), riverY(i / STEPS));
    ctx.closePath();
    const wg = ctx.createLinearGradient(0, horizonY, 0, H);
    wg.addColorStop(0, 'rgba(62,230,218,.16)');
    wg.addColorStop(.35, 'rgba(58,168,216,.10)');
    wg.addColorStop(1, 'rgba(40,120,190,.13)');
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.clip(); // 以降の水の表現は川の中だけに描く

    // 手前へ流れる波（せせらぎの横波）
    const flow = reduce ? 0 : (t * .5) % 1;
    for (let j = 0; j < 10; j++) {
      const p = ((j + flow) % 10) / 10;
      if (p < .02) continue;
      const y0 = riverY(p);
      const alpha = .05 + Math.pow(p, 1.6) * .3;
      ctx.strokeStyle = `rgba(140,240,230,${alpha})`;
      ctx.lineWidth = .8 + p * 1.6;
      ctx.beginPath();
      const l = riverX(p, -1), r = riverX(p, 1);
      for (let x = l; x <= r; x += 10) {
        const k = (x - l) / Math.max(r - l, 1);
        const y = y0 + Math.sin(k * Math.PI * 3 + t * 2 + j) * (1.5 + p * 4);
        x === l ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 流れの筋（水面を滑る光）
    for (const s of streaks) {
      if (!reduce) { s.p += s.speed * (0.4 + s.p * 1.6); if (s.p > 1.02) { s.p = 0; s.off = (Math.random() - .5) * 1.5; } }
      const a1 = riverPt(s.p, s.off);
      const a2 = riverPt(Math.min(s.p + .035, 1.02), s.off * .97);
      const alpha = .08 + s.p * .4;
      ctx.strokeStyle = `rgba(170,245,235,${alpha})`;
      ctx.lineWidth = .8 + s.p * 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a1.x, a1.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.stroke();
    }

    // 波紋（岩に当たるせせらぎ）
    if (!reduce && Math.random() < .05 && ripples.length < 8) {
      ripples.push({ p: .25 + Math.random() * .72, off: (Math.random() - .5) * 1.3, r: 0, life: 0 });
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.life += .014; rp.r += .6 + rp.p * 2.4;
      if (rp.life >= 1) { ripples.splice(i, 1); continue; }
      const pos = riverPt(rp.p, rp.off);
      const alpha = (1 - rp.life) * (.15 + rp.p * .3);
      ctx.strokeStyle = `rgba(180,245,235,${alpha})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, rp.r, rp.r * (.25 + rp.p * .2), 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 煌めき（水面のきらきら）
    for (const g of glints) {
      const pos = riverPt(g.p, g.off);
      const tw = .5 + .5 * Math.sin(t * 2.2 + g.tw);
      const alpha = tw * (.12 + g.p * .45);
      const size = .8 + g.p * 2.4;
      ctx.fillStyle = `rgba(220,255,250,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - size * 2);
      ctx.lineTo(pos.x + size, pos.y);
      ctx.lineTo(pos.x, pos.y + size * 2);
      ctx.lineTo(pos.x - size, pos.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore(); // 川のクリップ解除

    // 川の源（地平線の光）
    const src = ctx.createRadialGradient(vpX, horizonY, 0, vpX, horizonY, 90);
    src.addColorStop(0, 'rgba(140,240,230,.22)');
    src.addColorStop(1, 'rgba(140,240,230,0)');
    ctx.fillStyle = src;
    ctx.fillRect(vpX - 90, horizonY - 50, 180, 100);

    /* ============ 墨煙：ゆっくり広がり光を飲み込む ============ */
    for (let ci = 0; ci < clouds.length; ci++) {
      const c = clouds[ci];
      if (!reduce) { c.life += c.speed; c.x += c.drift; }
      if (c.life >= 1) { clouds[ci] = spawnCloud(false); continue; }
      const grow = .35 + c.life * 1.15;
      const fade = c.life < .25 ? c.life / .25 : (1 - c.life) / .75;
      const cx = c.x * W + mouseX * 20;
      const cy = c.y * H + mouseY * 14 - scrollY * .04;
      for (const b of c.blobs) {
        if (!reduce) b.ang += b.spin * .016;
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
        p.y += p.vy * .003;
        p.x += p.vx * .003 + Math.sin(t * .5 + p.tw) * .0002;
        if (p.y > 1.05) p.y = -.05; if (p.y < -.05) p.y = 1.05;
        if (p.x > 1.05) p.x = -.05; if (p.x < -.05) p.x = 1.05;
      }
      const px = p.x * W + mouseX * (p.depth * 46);
      const py = p.y * H + mouseY * (p.depth * 34) - scrollY * p.depth * .08;
      const wrapY = ((py % (H + 80)) + (H + 80)) % (H + 80) - 40;
      const twinkle = .5 + .5 * Math.sin(t * 1.4 + p.tw);
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
