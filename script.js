/* =============================================
   PIPELINE CANVAS ANIMATION
   ============================================= */
(function () {
  const canvas = document.getElementById('pipelineCanvas');
  const ctx = canvas.getContext('2d');

  let W, H, nodes, packets, animId;

  const COLORS = {
    node: 'rgba(0,0,0,0.07)',
    nodeStroke: 'rgba(0,0,0,0.12)',
    edge: 'rgba(0,0,0,0.05)',
    packetColors: [
      'rgba(100,160,240,0.55)',
      'rgba(80,200,140,0.5)',
      'rgba(220,170,90,0.5)',
      'rgba(180,120,220,0.45)',
    ],
    label: 'rgba(0,0,0,0.18)',
  };

  const STAGES = ['Raw', 'Ingest', 'Stage', 'Transform', 'Mart', 'Serve'];
  const STAGE_W = 130;
  const STAGE_H = 40;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildGraph();
  }

  function buildGraph() {
    nodes = [];
    const rows = Math.ceil(H / 200) + 2;
    const cols = Math.ceil(W / STAGE_W) + 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const jitterX = (Math.random() - 0.5) * 30;
        const jitterY = (Math.random() - 0.5) * 20;
        nodes.push({
          x: c * STAGE_W - STAGE_W / 2 + jitterX,
          y: r * 200 - 60 + jitterY,
          label: STAGES[c % STAGES.length],
          r: 5 + Math.random() * 3,
        });
      }
    }

    // Build edges: each node connects to 2-3 rightward neighbours
    nodes.forEach((n, i) => {
      n.edges = [];
      const candidates = nodes.filter(
        (m, j) => j !== i && m.x > n.x && m.x - n.x < STAGE_W * 2.2 && Math.abs(m.y - n.y) < 220
      );
      candidates.sort(() => Math.random() - 0.5);
      n.edges = candidates.slice(0, 2 + Math.floor(Math.random() * 2));
    });

    packets = [];
    for (let i = 0; i < 28; i++) spawnPacket();
  }

  function spawnPacket() {
    // Start from a random left-side node
    const starts = nodes.filter(n => n.x < STAGE_W);
    const src = starts[Math.floor(Math.random() * starts.length)];
    if (!src || !src.edges.length) return;
    packets.push({
      src,
      dst: src.edges[Math.floor(Math.random() * src.edges.length)],
      t: Math.random(),        // 0-1 progress along edge
      speed: 0.0018 + Math.random() * 0.0025,
      color: COLORS.packetColors[Math.floor(Math.random() * COLORS.packetColors.length)],
      size: 3.5 + Math.random() * 3,
      trail: [],
    });
  }

  function drawEdge(a, b) {
    // Smooth bezier pipe
    const mx = (a.x + b.x) / 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.bezierCurveTo(mx, a.y, mx, b.y, b.x, b.y);
    ctx.strokeStyle = COLORS.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function bezierPoint(ax, ay, bx, by, t) {
    const mx = (ax + bx) / 2;
    const x =
      (1 - t) * (1 - t) * ax +
      2 * (1 - t) * t * mx +
      t * t * bx;
    // Split control: first half from ax to mx at ay, second mx to bx at by
    const cy1 = ay, cy2 = by;
    const y =
      (1 - t) * (1 - t) * ay +
      2 * (1 - t) * t * ((ay + by) / 2) +
      t * t * by;
    return { x, y };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw edges
    nodes.forEach(n => {
      n.edges.forEach(m => drawEdge(n, m));
    });

    // Draw nodes
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.node;
      ctx.fill();
      ctx.strokeStyle = COLORS.nodeStroke;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Stage label
      ctx.font = `300 9px 'DM Mono', monospace`;
      ctx.fillStyle = COLORS.label;
      ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y - n.r - 4);
    });

    // Draw packets with trails
    packets.forEach(p => {
      const pos = bezierPoint(p.src.x, p.src.y, p.dst.x, p.dst.y, p.t);

      // Draw trail
      p.trail.push({ x: pos.x, y: pos.y });
      if (p.trail.length > 14) p.trail.shift();

      for (let i = 1; i < p.trail.length; i++) {
        const alpha = i / p.trail.length;
        ctx.beginPath();
        ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
        ctx.lineTo(p.trail[i].x, p.trail[i].y);
        ctx.strokeStyle = p.color.replace(/[\d.]+\)$/, `${alpha * 0.6})`);
        ctx.lineWidth = p.size * alpha * 0.7;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Draw packet dot
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      // Advance
      p.t += p.speed;
      if (p.t >= 1) {
        // Hop to next node
        const arrived = p.dst;
        if (arrived.edges && arrived.edges.length) {
          p.src = arrived;
          p.dst = arrived.edges[Math.floor(Math.random() * arrived.edges.length)];
          p.t = 0;
          p.trail = [];
        } else {
          // respawn
          Object.assign(p, { t: 0, trail: [] });
          const starts = nodes.filter(n => n.x < STAGE_W);
          const src = starts[Math.floor(Math.random() * starts.length)];
          if (src && src.edges.length) {
            p.src = src;
            p.dst = src.edges[Math.floor(Math.random() * src.edges.length)];
          }
        }
      }
    });

    animId = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { cancelAnimationFrame(animId); resize(); draw(); });
  resize();
  draw();
})();

/* =============================================
   SKILLS FILTER
   ============================================= */
const filterBtns = document.querySelectorAll('.filter-btn');
const chips = document.querySelectorAll('.chip');

// Init all as visible
chips.forEach(c => c.classList.add('visible'));

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;

    chips.forEach((chip, i) => {
      const match = filter === 'all' || chip.dataset.cat === filter;
      chip.classList.remove('hidden', 'visible');
      setTimeout(() => {
        chip.classList.add(match ? 'visible' : 'hidden');
      }, i * 18);
    });
  });
});

/* =============================================
   NAV SCROLL
   ============================================= */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

/* =============================================
   HAMBURGER
   ============================================= */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

/* =============================================
   FADE IN ON SCROLL
   ============================================= */
const observer = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
  }),
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('.section, .proj-item, .exp-item, .stat').forEach((el, i) => {
  el.classList.add('fade-in');
  el.style.transitionDelay = `${i * 30}ms`;
  observer.observe(el);
});

/* =============================================
   SMOOTH SCROLL
   ============================================= */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 68, behavior: 'smooth' });
  });
});
