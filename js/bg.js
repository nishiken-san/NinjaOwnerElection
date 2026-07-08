/* ============================================================
 * 背景：奥行きのあるサイバー空間 × 全画面の激流 × 墨煙
 *
 *  設計方針：
 *   - 地平線から下の「床」一面が激流（画面全体を使う）
 *   - 岩・水しぶきは画面の左右端寄りに配置し、中央のコンテンツ
 *     （文字・看板）と被らないようにする
 *   - WSPEED : 全体の動きの速さ（0.5〜0.75推奨。現在0.6）
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

  /* ---------- 激流のパーツ ---------- */
  // 流れの筋（画面幅いっぱい。off:-1..1 が画面全幅に対応）
  const streaks = [];
  for (let i = 0; i < 52; i++) {
    streaks.push({
      p: Math.random(),
      off: (Math.random() - .5) * 2,
      speed: .003 + Math.random() * .0042, // 激流なので速め
      w: .8 + Math.random() * 1.6,
    });
  }
  // 煌めき
  const glints = [];
  for (let i = 0; i < 46; i++) {
    glints.push({ p: .12 + Math.random() * .88, off: (Math.random() - .5) * 2, tw: Math.random() * Math.PI * 2 });
  }
  const ripples = [];

  // 岩：画面の左右端寄りに配置（中央のコンテンツと被らせない）
  //  off はほぼ ±.55〜.9（中央は小さい岩1つだけ、しぶき控えめ）
  const ROCKS = [
    { p: .50, off: -.80, seed: 1.3, splash: 1.0 },
    { p: .58, off: .84, seed: 4.1, splash: 1.0 },
    { p: .74, off: -.66, seed: 2.6, splash: 1.2 },
    { p: .86, off: .72, seed: 5.8, splash: 1.3 },
    { p: .95, off: -.88, seed: 3.3, splash: 1.5 },
    { p: .42, off: .10, seed: 7.2, splash: .25 }, // 中央奥：小さく・しぶき最小
  ];
  const drops = [];
  const MAX_DROPS = 240;

  // 川霧（画面下部の両端から立ちのぼる霧）
  const mists = [];
  for (let i = 0; i < 9; i++) {
    mists.push({
      side: Math.random() > .5 ? 1 : -1,
      x: Math.random(), y: Math.random(),
      r: 60 + Math.random() * 130,
      sp: .0006 + Math.random() * .001,
      ph: Math.random() * Math.PI * 2,
    });
  }

  // 風に舞う飛沫（画面全体をゆっくり横切る細い糸）
  const spray = [];
  for (let i = 0; i < 16; i++) {
    spray.push({
      x: Math.random(), y: Math.random() * .8,
      vx: .0008 + Math.random() * .0014,
      vy: .0002 + Math.random() * .0005,
      len: 20 + Math.random() * 46,
      a: .03 + Math.random() * .07,
    });
  }

  let t = 0;
  function draw() {
    t += .016;
    const wt = t * WSPEED;
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

    const horizonY = H * .62 + mouseY * 30 - Math.min(scrollY * .03, 40);
    const vpX = W / 2 + mouseX * 60;

    /* 床の座標系（p:0=地平線 → 1=画面手前、off:-1..1=画面全幅） */
    function rowY(p) { return horizonY + Math.pow(p, 1.9) * (H - horizonY + 30); }
    function floorX(p, off) { return vpX + off * (14 + Math.pow(p, 1.1) * W * .64); }
    function floorPt(p, off) { return { x: floorX(p, off), y: rowY(p) }; }

    /* パースの効いた床グリッド（水底に沈むサイバーグリッド） */
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
      const y = rowY(p);
      const alpha = .02 + Math.pow(p, 2) * .16;
      ctx.strokeStyle = `rgba(62,230,218,${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(W, y);
      ctx.stroke();
    }
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

    /* ============ 激流：地平線から下の床一面が流れる ============ */

    // 水面ベース（床全体をうっすら水色に）
    const wg = ctx.createLinearGradient(0, horizonY, 0, H);
    wg.addColorStop(0, 'rgba(90,235,225,.20)');
    wg.addColorStop(.4, 'rgba(60,175,220,.13)');
    wg.addColorStop(1, 'rgba(45,135,200,.18)');
    ctx.fillStyle = wg;
    ctx.fillRect(0, horizonY, W, H - horizonY + 2);

    // 本流の帯（うねりながら流れる明るい急流。全幅の中の勢いの芯）
    ctx.save();
    ctx.beginPath();
    const CSTEPS = 26;
    for (let i = 0; i <= CSTEPS; i++) {
      const p = i / CSTEPS;
      const c = Math.sin(p * 2.8 + wt * .18) * .22 * p;
      const x = floorX(p, c - (.24 + p * .34));
      i === 0 ? ctx.moveTo(x, rowY(p)) : ctx.lineTo(x, rowY(p));
    }
    for (let i = CSTEPS; i >= 0; i--) {
      const p = i / CSTEPS;
      const c = Math.sin(p * 2.8 + wt * .18) * .22 * p;
      ctx.lineTo(floorX(p, c + (.24 + p * .34)), rowY(p));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(120,240,230,.08)';
    ctx.fill();
    ctx.restore();

    // 手前へ押し寄せる横波（全幅・大きくうねる）＋波頭の白波
    const flow = reduce ? 0 : (wt * .6) % 1;
    for (let j = 0; j < 14; j++) {
      const p = ((j + flow) % 14) / 14;
      if (p < .02) continue;
      const y0 = rowY(p);
      const amp = 2 + p * 11;
      const alpha = .05 + Math.pow(p, 1.5) * .38;
      // 波の本体
      ctx.strokeStyle = `rgba(150,242,235,${alpha})`;
      ctx.lineWidth = .9 + p * 2.6;
      ctx.beginPath();
      let prevY = 0;
      for (let x = 0; x <= W; x += 9) {
        const k = x / W;
        const s = Math.sin(k * Math.PI * 6 + wt * 2.6 + j * 1.7)
          + .5 * Math.sin(k * Math.PI * 13 - wt * 3.4 + j);
        const y = y0 + s * amp * .55;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        prevY = y;
      }
      ctx.stroke();
      // 波頭の白波（山になっている部分だけ白く砕ける）
      ctx.strokeStyle = `rgba(235,253,250,${alpha * .9})`;
      ctx.lineWidth = 1.4 + p * 2.6;
      ctx.lineCap = 'round';
      let inCap = false;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 9) {
        const k = x / W;
        const s = Math.sin(k * Math.PI * 6 + wt * 2.6 + j * 1.7)
          + .5 * Math.sin(k * Math.PI * 13 - wt * 3.4 + j);
        const y = y0 + s * amp * .55;
        if (s < -.95) { // 波の山（上に凸）
          inCap ? ctx.lineTo(x, y) : (ctx.moveTo(x, y), inCap = true);
        } else inCap = false;
      }
      ctx.stroke();
    }

    // 流れの筋（全幅を滑る光。激流なので速く長く）
    for (const s of streaks) {
      if (!reduce) {
        s.p += s.speed * WSPEED * (0.35 + s.p * 2);
        if (s.p > 1.03) { s.p = 0; s.off = (Math.random() - .5) * 2; }
      }
      const a1 = floorPt(s.p, s.off);
      const a2 = floorPt(Math.min(s.p + .06, 1.03), s.off);
      const alpha = .09 + s.p * .48;
      ctx.strokeStyle = `rgba(180,248,240,${alpha})`;
      ctx.lineWidth = s.w * (0.5 + s.p * 1.6);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(a1.x, a1.y);
      ctx.lineTo(a2.x, a2.y);
      ctx.stroke();
    }

    // 波紋
    if (!reduce && Math.random() < .12 && ripples.length < 12) {
      ripples.push({ p: .25 + Math.random() * .72, off: (Math.random() - .5) * 1.9, r: 0, life: 0 });
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.life += .014 * WSPEED; rp.r += (.7 + rp.p * 3) * WSPEED;
      if (rp.life >= 1) { ripples.splice(i, 1); continue; }
      const pos = floorPt(rp.p, rp.off);
      const alpha = (1 - rp.life) * (.14 + rp.p * .3);
      ctx.strokeStyle = `rgba(190,248,240,${alpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y, rp.r, rp.r * (.25 + rp.p * .2), 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 煌めき
    for (const g of glints) {
      const pos = floorPt(g.p, g.off);
      const tw = .5 + .5 * Math.sin(wt * 2.4 + g.tw);
      const alpha = tw * (.12 + g.p * .48);
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

    /* 岩と砕ける白波（左右の端寄り）＋水しぶき */
    for (const rk of ROCKS) {
      const pos = floorPt(rk.p, rk.off);
      const s = (8 + rk.p * 30) * (0.6 + rk.splash * .4);
      // 岩本体
      const rg = ctx.createRadialGradient(pos.x - s * .3, pos.y - s * .4, s * .1, pos.x, pos.y, s);
      rg.addColorStop(0, '#2a3648');
      rg.addColorStop(.6, '#131c2a');
      rg.addColorStop(1, '#080d16');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y - s * .18, s, s * .55, 0, 0, Math.PI * 2);
      ctx.fill();
      // 砕ける白波
      const foam = .5 + .5 * Math.sin(wt * 3.4 + rk.seed);
      ctx.strokeStyle = `rgba(235,253,250,${(.2 + foam * .3) * Math.min(rk.splash, 1)})`;
      ctx.lineWidth = 2 + rk.p * 3;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y - s * .05, s * 1.25, s * .42, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = `rgba(235,253,250,${(.09 + foam * .13) * Math.min(rk.splash, 1)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(pos.x, pos.y + s * .14, s * 1.6, s * .52, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      // 水しぶき発生（splash係数で量を制御。中央の岩はほぼ出さない）
      if (!reduce && drops.length < MAX_DROPS && Math.random() < .55 * rk.splash) {
        const n = 1 + Math.floor(Math.random() * 3);
        for (let k = 0; k < n; k++) {
          drops.push({
            x: pos.x + (Math.random() - .5) * s * 1.5,
            y: pos.y - s * .3,
            vx: (Math.random() - .5) * (1.6 + rk.p * 3),
            vy: -(1.8 + Math.random() * 3.4) * (.45 + rk.p) * (0.7 + rk.splash * .4),
            g: .085 * (.5 + rk.p),
            life: 0,
            size: .7 + Math.random() * (1 + rk.p * 2.4),
          });
        }
      }
    }

    /* 水しぶきの粒 */
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      if (!reduce) {
        d.x += d.vx * WSPEED;
        d.vy += d.g * WSPEED;
        d.y += d.vy * WSPEED;
        d.life += .02 * WSPEED;
      }
      if (d.life >= 1) { drops.splice(i, 1); continue; }
      const alpha = (1 - d.life) * .8;
      ctx.fillStyle = `rgba(228,252,250,${alpha})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size * (1 - d.life * .4), 0, Math.PI * 2);
      ctx.fill();
    }

    /* 川霧（画面下部の両端からゆっくり立ちのぼる） */
    for (const m of mists) {
      if (!reduce) {
        m.y -= m.sp;
        if (m.y < -.2) { m.y = 1.1; m.x = Math.random(); m.side = Math.random() > .5 ? 1 : -1; }
      }
      // 両端に寄せる（0..0.3 / 0.7..1.0 のレンジ）
      const nx = m.side > 0 ? .72 + m.x * .32 : -.04 + m.x * .32;
      const px = nx * W + Math.sin(wt * .4 + m.ph) * 24;
      const py = horizonY + m.y * (H - horizonY) * 1.15;
      const g = ctx.createRadialGradient(px, py, m.r * .15, px, py, m.r);
      const a = .05 + .05 * Math.sin(wt * .6 + m.ph);
      g.addColorStop(0, `rgba(190,240,240,${Math.max(a, .03)})`);
      g.addColorStop(1, 'rgba(190,240,240,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    /* 風に舞う飛沫（画面全体を横切る細い糸） */
    for (const sp of spray) {
      if (!reduce) {
        sp.x += sp.vx * WSPEED;
        sp.y += sp.vy * WSPEED;
        if (sp.x > 1.1) { sp.x = -.1; sp.y = Math.random() * .8; }
        if (sp.y > 1.05) sp.y = 0;
      }
      const px = sp.x * W, py = sp.y * H;
      ctx.strokeStyle = `rgba(200,245,242,${sp.a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + sp.len, py + sp.len * .22);
      ctx.stroke();
    }

    // 川の源（地平線の光）
    const src = ctx.createRadialGradient(vpX, horizonY, 0, vpX, horizonY, 130);
    src.addColorStop(0, 'rgba(150,242,232,.24)');
    src.addColorStop(1, 'rgba(150,242,232,0)');
    ctx.fillStyle = src;
    ctx.fillRect(vpX - 130, horizonY - 70, 260, 140);

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
