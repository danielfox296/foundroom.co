/* =============================================
   FOUND ROOM — Global JavaScript
   Edit this file to change JS behaviour site-wide.
   ============================================= */

// Nav: transparent → dark glass on scroll
(function() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  function update() {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

// Hamburger menu toggle
(function() {
  const btn = document.querySelector('.nav-hamburger');
  const mobileNav = document.getElementById('mobileNav');
  if (!btn || !mobileNav) return;

  function openMenu() {
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    btn.classList.contains('open') ? closeMenu() : openMenu();
  });

  // Close when a link inside the overlay is clicked
  mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  // Close on Escape key
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
})();

// Scroll reveal
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
reveals.forEach(el => observer.observe(el));

// Email interest form (Formspree)
function handleSubmit() {
  const email = document.getElementById('emailInput').value;
  if (!email || !email.includes('@')) {
    document.getElementById('emailInput').style.outline = '2px solid var(--accent)';
    return;
  }
  const button = document.querySelector('#formRow button');
  button.textContent = 'Sending...';
  button.disabled = true;
  fetch('https://formspree.io/f/mvzbeabr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email })
  })
  .then(response => {
    if (response.ok) {
      document.getElementById('formRow').style.display = 'none';
      document.querySelector('.cta-note').style.display = 'none';
      document.getElementById('successMsg').style.display = 'block';
    } else {
      button.textContent = 'Try again';
      button.disabled = false;
    }
  })
  .catch(() => {
    button.textContent = 'Try again';
    button.disabled = false;
  });
}
