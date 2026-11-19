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
document.querySelectorAll('.section, .exp-item, .stat').forEach((el, i) => {
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
