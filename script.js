/* =============================================
   PIPELINE CANVAS — DARK THEME
   ============================================= */
(function () {
  const canvas = document.getElementById('pipelineCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, nodes, packets, animId;

  const BG       = '#0e0e0e';
  const NODE_F   = 'rgba(255,255,255,0.04)';
  const NODE_S   = 'rgba(255,255,255,0.10)';
  const EDGE_C   = 'rgba(255,255,255,0.04)';
  const LABEL_C  = 'rgba(255,255,255,0.12)';
  const PACKETS  = [
    'rgba(100,180,255,0.7)',
    'rgba(80,220,150,0.65)',
    'rgba(212,184,150,0.7)',
    'rgba(200,130,240,0.6)',
    'rgba(255,200,80,0.6)',
  ];

  const STAGES = ['Raw','Ingest','Stage','Transform','Mart','Serve'];
  const COL_W  = 140;
  const ROW_H  = 190;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildGraph();
  }

  function buildGraph() {
    nodes = [];
    const cols = Math.ceil(W / COL_W) + 2;
    const rows = Math.ceil(H / ROW_H) + 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const jx = (Math.random() - 0.5) * 28;
        const jy = (Math.random() - 0.5) * 22;
        nodes.push({
          x: c * COL_W - COL_W * 0.3 + jx,
          y: r * ROW_H - ROW_H * 0.3 + jy,
          label: STAGES[c % STAGES.length],
          r: 4 + Math.random() * 3,
          edges: [],
        });
      }
    }

    // Connect each node to 2–3 right/down neighbours
    nodes.forEach(n => {
      const near = nodes.filter(m =>
        m !== n &&
        m.x > n.x &&
        m.x - n.x < COL_W * 2.4 &&
        Math.abs(m.y - n.y) < ROW_H * 1.5
      );
      near.sort(() => Math.random() - 0.5);
      n.edges = near.slice(0, 2 + Math.floor(Math.random() * 2));
    });

    packets = [];
    for (let i = 0; i < 32; i++) spawnPacket(true);
  }

  function spawnPacket(randomProgress) {
    const starts = nodes.filter(n => n.x < COL_W);
    const src = starts[Math.floor(Math.random() * starts.length)];
    if (!src || !src.edges.length) return;
    packets.push({
      src,
      dst: src.edges[Math.floor(Math.random() * src.edges.length)],
      t: randomProgress ? Math.random() : 0,
      speed: 0.0016 + Math.random() * 0.0022,
      color: PACKETS[Math.floor(Math.random() * PACKETS.length)],
      size: 3 + Math.random() * 3.5,
      trail: [],
    });
  }

  function bezPt(ax, ay, bx, by, t) {
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const x = (1-t)*(1-t)*ax + 2*(1-t)*t*mx + t*t*bx;
    const y = (1-t)*(1-t)*ay + 2*(1-t)*t*my + t*t*by;
    return { x, y };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Edges
    nodes.forEach(n => {
      n.edges.forEach(m => {
        const mx = (n.x + m.x) / 2;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.bezierCurveTo(mx, n.y, mx, m.y, m.x, m.y);
        ctx.strokeStyle = EDGE_C;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    });

    // Nodes
    nodes.forEach(n => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = NODE_F;
      ctx.fill();
      ctx.strokeStyle = NODE_S;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = `300 8px 'DM Mono', monospace`;
      ctx.fillStyle = LABEL_C;
      ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y - n.r - 4);
    });

    // Packets + trails
    packets.forEach(p => {
      const pos = bezPt(p.src.x, p.src.y, p.dst.x, p.dst.y, p.t);
      p.trail.push({ x: pos.x, y: pos.y });
      if (p.trail.length > 16) p.trail.shift();

      for (let i = 1; i < p.trail.length; i++) {
        const a = i / p.trail.length;
        ctx.beginPath();
        ctx.moveTo(p.trail[i-1].x, p.trail[i-1].y);
        ctx.lineTo(p.trail[i].x, p.trail[i].y);
        ctx.strokeStyle = p.color.replace(/[\d.]+\)$/, `${(a * 0.65).toFixed(2)})`);
        ctx.lineWidth = p.size * a * 0.65;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Glow dot
      const grd = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, p.size * 1.8);
      grd.addColorStop(0, p.color);
      grd.addColorStop(1, p.color.replace(/[\d.]+\)$/, '0)'));
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size * 1.8, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      p.t += p.speed;
      if (p.t >= 1) {
        const arrived = p.dst;
        if (arrived.edges && arrived.edges.length) {
          p.src = arrived;
          p.dst = arrived.edges[Math.floor(Math.random() * arrived.edges.length)];
          p.t = 0; p.trail = [];
        } else {
          const starts = nodes.filter(n => n.x < COL_W);
          const src = starts[Math.floor(Math.random() * starts.length)];
          if (src && src.edges.length) {
            p.src = src;
            p.dst = src.edges[Math.floor(Math.random() * src.edges.length)];
            p.t = 0; p.trail = [];
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
chips.forEach(c => c.classList.add('visible'));

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    chips.forEach((chip, i) => {
      const match = filter === 'all' || chip.dataset.cat === filter;
      chip.classList.remove('hidden', 'visible');
      setTimeout(() => chip.classList.add(match ? 'visible' : 'hidden'), i * 15);
    });
  });
});

/* =============================================
   NAV SCROLL
   ============================================= */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 20));

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
  { threshold: 0.08, rootMargin: '0px 0px -32px 0px' }
);
document.querySelectorAll('.section, .proj-item, .exp-item, .stat').forEach((el, i) => {
  el.classList.add('fade-in');
  el.style.transitionDelay = `${i * 28}ms`;
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
