// Homepage hero motion
const heroContent = document.querySelector('.hero-content');
const hero = document.querySelector('.hero');

addEventListener('scroll', () => {
  const y = scrollY;
  const heroH = hero.offsetHeight;
  const progress = Math.max(0, Math.min(y / (heroH * 0.75), 1));

  // Logo scales toward the viewer and fades as the site content moves over it.
  heroContent.style.transform = `scale(${1 + progress * 0.18})`;
  heroContent.style.opacity = Math.max(0, 1 - progress * 1.6);
}, { passive: true });

// Scroll reveal
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

// Canvas particles — full hero coverage
const cvs = document.getElementById('cvs');
const cx = cvs.getContext('2d');
let W, H, pts;

function init() {
  W = cvs.width  = hero.offsetWidth;
  H = cvs.height = hero.offsetHeight;
  pts = Array.from({ length: 260 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 2.2 + 0.5,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.18,
    col: Math.random() > 0.5 ? 0 : 1,
    a: Math.random() * 0.55 + 0.2
  }));
}

function tick() {
  cx.clearRect(0, 0, W, H);
  for (const p of pts) {
    p.x = (p.x + p.vx + W) % W;
    p.y = (p.y + p.vy + H) % H;
    cx.beginPath();
    cx.arc(p.x, p.y, p.r, 0, 6.283);
    cx.fillStyle = p.col
      ? `rgba(253,142,55,${p.a})`
      : `rgba(106,163,232,${p.a})`;
    cx.fill();
  }
  requestAnimationFrame(tick);
}

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  addEventListener('resize', init, { passive: true });
  init();
  tick();
}
