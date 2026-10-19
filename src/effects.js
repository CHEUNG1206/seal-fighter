// Jutsu special effects, drawn on a canvas laid over the battle area.
// play(kind) starts an effect; the canvas only animates while one is running.
//
// Each effect is a mix of particles (sparks, droplets, leaves…) and shapes
// drawn by a function of time (a fireball's path, a lightning bolt, rock
// spikes…). Coordinates are in canvas pixels; the enemy stands in the middle
// and the player is below the bottom edge.

const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = list => list[Math.floor(Math.random() * list.length)];

export function createEffects(canvas) {
  const ctx = canvas.getContext('2d');
  const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const amount = n => Math.round(reduced ? n / 4 : n);
  let particles = [];
  let shapes = []; // {start, duration, draw(ctx, progress, w, h)}
  let running = false;
  let last = 0;

  // Layout size, not getBoundingClientRect(): the arena can be skewed by the
  // genjutsu wobble, and the canvas must keep its real size.
  const size = () => ({ w: canvas.offsetWidth, h: canvas.offsetHeight });

  function resize() {
    const { w, h } = size();
    const scale = globalThis.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  function clear() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  resize();
  globalThis.addEventListener?.('resize', resize);

  function burst(x, y, { count, colours, speed = [60, 260], life = [0.4, 0.9], size: s = [2, 5],
    gravity = 0, shape = 'dot', spin = 0, angle = [0, TAU] }) {
    for (let i = 0; i < amount(count); i++) {
      const a = rand(angle[0], angle[1]);
      const v = rand(speed[0], speed[1]);
      const max = rand(life[0], life[1]);
      particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: max, max,
        size: rand(s[0], s[1]), colour: pick(colours), gravity, shape,
        rot: rand(0, TAU), spin: rand(-spin, spin),
      });
    }
    run();
  }

  function shape(duration, draw, delay = 0) {
    shapes.push({ start: performance.now() / 1000 + delay, duration, draw });
    run();
  }

  function drawParticle(p) {
    const fade = Math.max(0, p.life / p.max);
    ctx.globalAlpha = fade;
    ctx.fillStyle = p.colour;
    if (p.shape === 'leaf') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.8, p.size * 0.8, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    } else if (p.shape === 'plus') {
      const s = p.size;
      ctx.fillRect(p.x - s, p.y - s / 3, s * 2, (s * 2) / 3);
      ctx.fillRect(p.x - s / 3, p.y - s, (s * 2) / 3, s * 2);
    } else if (p.shape === 'shard') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillRect(-p.size, -p.size / 4, p.size * 2, p.size / 2);
      ctx.restore();
    } else if (p.shape === 'smoke') {
      ctx.globalAlpha = fade * 0.18;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (2 - fade), 0, TAU);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.4 + fade * 0.6), 0, TAU);
      ctx.fill();
    }
  }

  function frame(now) {
    const t = now / 1000;
    const dt = Math.min(0.05, t - last);
    last = t;
    const { w, h } = size();
    clear();
    ctx.globalCompositeOperation = 'lighter';

    shapes = shapes.filter(s => t < s.start + s.duration);
    for (const s of shapes) {
      if (t < s.start) continue;
      ctx.globalAlpha = 1;
      ctx.save();
      s.draw(ctx, (t - s.start) / s.duration, w, h);
      ctx.restore();
    }

    for (const p of particles) {
      p.life -= dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      drawParticle(p);
    }
    particles = particles.filter(p => p.life > 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    if (particles.length || shapes.length) {
      requestAnimationFrame(frame);
    } else {
      running = false;
      clear();
    }
  }

  function run() {
    if (running) return;
    running = true;
    last = performance.now() / 1000;
    requestAnimationFrame(frame);
  }

  // ---------- the effects ----------

  function fire(w, h) {
    const [sx, sy, ex, ey] = [w / 2, h + 20, w / 2, h / 2];
    const travel = 0.45;
    shape(travel, (c, k) => {
      const x = sx + (ex - sx) * k;
      const y = sy + (ey - sy) * k;
      const r = 18 + 40 * k;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, '#fff6c0');
      g.addColorStop(0.4, '#ffb020');
      g.addColorStop(1, 'rgba(255,60,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fill();
      burst(x, y, { count: 3, colours: ['#ff7a1a', '#ffc040', '#ff4010'], speed: [10, 60], life: [0.2, 0.5] });
    });
    setTimeout(() => {
      burst(ex, ey, { count: 90, colours: ['#fff2a0', '#ffb020', '#ff5a1f', '#ff3000'], speed: [80, 340], size: [3, 7], gravity: -40 });
      shape(0.5, (c, k) => {
        c.strokeStyle = `rgba(255,170,60,${1 - k})`;
        c.lineWidth = 10 * (1 - k);
        c.beginPath();
        c.arc(ex, ey, 30 + 140 * k, 0, TAU);
        c.stroke();
      });
    }, travel * 1000);
  }

  function water(w, h) {
    const [ex, ey] = [w / 2, h / 2];
    for (let arm = 0; arm < 3; arm++) {
      shape(0.7, (c, k) => {
        c.strokeStyle = arm % 2 ? '#8fd3ff' : '#3fa9ff';
        c.lineWidth = 10 * (1 - k * 0.6);
        c.lineCap = 'round';
        c.beginPath();
        for (let i = 0; i <= 30; i++) {
          const u = Math.min(1, (i / 30) * k * 1.4);
          const r = (1 - u) * Math.max(w, h) * 0.6;
          const a = arm * (TAU / 3) + u * TAU * 1.2;
          const x = ex + Math.cos(a) * r;
          const y = ey + Math.sin(a) * r * 0.7;
          if (i === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();
      });
    }
    setTimeout(() => burst(ex, ey, { count: 80, colours: ['#e0f4ff', '#8fd3ff', '#3fa9ff'], speed: [80, 300],
      gravity: 500, angle: [Math.PI, TAU], size: [2, 5] }), 550);
  }

  function boltPath(x1, y1, x2, y2, jag) {
    const points = [[x1, y1]];
    const steps = 9;
    for (let i = 1; i < steps; i++) {
      const k = i / steps;
      points.push([x1 + (x2 - x1) * k + rand(-jag, jag), y1 + (y2 - y1) * k + rand(-jag / 2, jag / 2)]);
    }
    points.push([x2, y2]);
    return points;
  }

  function lightning(w, h) {
    const [ex, ey] = [w / 2, h / 2];
    const starts = [[w / 2, h + 10], [w * 0.15, -10], [w * 0.85, -10]];
    shape(0.5, (c, k) => {
      if (k > 0.85) return;
      for (const [sx, sy] of starts) {
        const path = boltPath(sx, sy, ex + rand(-10, 10), ey + rand(-10, 10), 34);
        for (const [width, colour] of [[9, 'rgba(255,225,74,0.35)'], [3, '#fffbe0']]) {
          c.strokeStyle = colour;
          c.lineWidth = width;
          c.beginPath();
          path.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
          c.stroke();
        }
      }
      c.fillStyle = `rgba(255,250,210,${0.25 * (1 - k)})`;
      c.fillRect(0, 0, w, h);
    });
    burst(ex, ey, { count: 60, colours: ['#fffbe0', '#ffe14a', '#a8e0ff'], speed: [120, 420], life: [0.2, 0.5], size: [1.5, 3.5] });
  }

  function wind(w, h) {
    const [ex, ey] = [w / 2, h / 2];
    for (let i = 0; i < 4; i++) {
      const tilt = rand(-0.5, 0.5);
      shape(0.35, (c, k) => {
        const x = -w * 0.3 + (w * 1.6) * k;
        c.strokeStyle = `rgba(200,255,230,${1 - k * 0.5})`;
        c.lineWidth = 6;
        c.lineCap = 'round';
        c.beginPath();
        c.ellipse(x, ey + (i - 1.5) * 28, 70, 18, tilt, Math.PI * 1.1, Math.PI * 1.9);
        c.stroke();
      }, i * 0.08);
    }
    setTimeout(() => burst(ex, ey, { count: 40, colours: ['#7fe0b0', '#c8ffe6', '#4fb889'], shape: 'leaf',
      speed: [120, 380], angle: [-0.6, 0.6], size: [3, 6], spin: 8, life: [0.6, 1.1] }), 150);
  }

  function earth(w, h) {
    const [ex, ey] = [w / 2, h / 2];
    const spikes = Array.from({ length: 7 }, (_, i) => ({ x: ex + (i - 3) * 34 + rand(-8, 8), tall: rand(70, 150), wide: rand(18, 30) }));
    shape(0.8, (c, k) => {
      const rise = Math.min(1, k * 3);
      const fade = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      c.globalCompositeOperation = 'source-over';
      for (const s of spikes) {
        const top = h - s.tall * rise - (h - ey - 40) * rise * 0.6;
        c.fillStyle = `rgba(150,100,55,${fade})`;
        c.beginPath();
        c.moveTo(s.x - s.wide, h);
        c.lineTo(s.x, top);
        c.lineTo(s.x + s.wide, h);
        c.closePath();
        c.fill();
        c.fillStyle = `rgba(210,160,100,${fade})`;
        c.beginPath();
        c.moveTo(s.x, top);
        c.lineTo(s.x + s.wide, h);
        c.lineTo(s.x + s.wide * 0.3, h);
        c.closePath();
        c.fill();
      }
    });
    setTimeout(() => burst(ex, ey + 30, { count: 50, colours: ['#c08a4a', '#8a5a2a', '#e0b070'], shape: 'shard',
      speed: [80, 260], gravity: 600, size: [3, 7], spin: 10 }), 280);
  }

  function heal(w, h) {
    shape(1.1, (c, k) => {
      const g = c.createRadialGradient(w / 2, h, 0, w / 2, h, h * 0.9);
      g.addColorStop(0, `rgba(120,255,170,${0.45 * (1 - k)})`);
      g.addColorStop(1, 'rgba(120,255,170,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
    });
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        for (let j = 0; j < amount(14); j++) {
          burst(rand(w * 0.2, w * 0.8), h + 5, { count: 1, colours: ['#7dffb0', '#c8ffe0', '#3fdc84'],
            speed: [60, 140], angle: [-Math.PI * 0.6, -Math.PI * 0.4], shape: j % 3 ? 'dot' : 'plus', size: [3, 6], life: [0.8, 1.4] });
        }
      }, i * 180);
    }
  }

  function genjutsu(w, h) {
    // A circle of leaves spins around the target, as in 奈落見.
    const [ex, ey] = [w / 2, h / 2];
    const leaves = Array.from({ length: amount(26) }, (_, i) => ({ a: (i / 26) * TAU, r: rand(70, 110), s: rand(4, 7) }));
    shape(1.4, (c, k) => {
      c.globalCompositeOperation = 'source-over';
      for (const leaf of leaves) {
        const a = leaf.a + k * TAU * 1.5;
        const r = leaf.r * (1 - k * 0.5);
        c.save();
        c.translate(ex + Math.cos(a) * r, ey + Math.sin(a) * r * 0.8);
        c.rotate(a + Math.PI / 2);
        c.fillStyle = `rgba(90,170,80,${1 - k * 0.7})`;
        c.beginPath();
        c.ellipse(0, 0, leaf.s * 2, leaf.s, 0, 0, TAU);
        c.fill();
        c.restore();
      }
      c.strokeStyle = `rgba(170,90,255,${0.6 * (1 - k)})`;
      c.lineWidth = 3;
      for (let ring = 0; ring < 3; ring++) {
        c.beginPath();
        c.arc(ex, ey, 30 + ring * 25 + 20 * Math.sin(k * TAU * 2 + ring), 0, TAU);
        c.stroke();
      }
    });
  }

  function clone(w, h) {
    for (const x of [w * 0.25, w * 0.75]) {
      burst(x, h - 30, { count: 30, colours: ['#ddd', '#bbb', '#fff'], shape: 'smoke', speed: [20, 90], size: [10, 22], life: [0.6, 1.1] });
    }
  }

  function release(w, h) {
    shape(0.6, (c, k) => {
      c.strokeStyle = `rgba(255,255,255,${1 - k})`;
      c.lineWidth = 12 * (1 - k);
      c.beginPath();
      c.arc(w / 2, h / 2, Math.max(w, h) * 0.7 * k, 0, TAU);
      c.stroke();
      c.fillStyle = `rgba(255,255,255,${0.35 * (1 - k)})`;
      c.fillRect(0, 0, w, h);
    });
    burst(w / 2, h / 2, { count: 60, colours: ['#fff', '#d8c8ff', '#b090ff'], shape: 'shard', speed: [150, 450], size: [3, 8], spin: 12 });
  }

  function enemyHit(w, h) {
    for (let i = 0; i < 3; i++) {
      shape(0.3, (c, k) => {
        c.strokeStyle = `rgba(255,60,90,${1 - k})`;
        c.lineWidth = 8 * (1 - k);
        c.lineCap = 'round';
        const x = w * (0.3 + i * 0.2);
        c.beginPath();
        c.moveTo(x - 40, h - 20 - 80 * Math.min(1, k * 3));
        c.lineTo(x + 40, h - 20);
        c.stroke();
      }, i * 0.05);
    }
  }

  function enemyGenjutsu(w, h) {
    shape(1.2, (c, k) => {
      c.globalCompositeOperation = 'source-over';
      c.strokeStyle = `rgba(170,90,255,${0.8 * (1 - k)})`;
      c.lineWidth = 4;
      c.beginPath();
      for (let i = 0; i <= 120; i++) {
        const a = i * 0.3 + k * 8;
        const r = i * 2.4 * (0.4 + k);
        const x = w / 2 + Math.cos(a) * r;
        const y = h / 2 + Math.sin(a) * r * 0.7;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    });
  }

  const EFFECTS = { fire, water, lightning, wind, earth, heal, genjutsu, clone, release, enemyHit, enemyGenjutsu };

  return {
    play(kind) {
      const effect = EFFECTS[kind];
      if (!effect) return;
      resize();
      const { w, h } = size();
      effect(w, h);
    },
  };
}

// Which effect a jutsu plays: its element for attacks, its type otherwise.
export function effectFor(jutsu) {
  return jutsu.type === 'attack' ? jutsu.element : jutsu.type;
}
