/* =============================================
   FOUND ROOM — Global JavaScript
   Edit this file to change JS behaviour site-wide.
   ============================================= */

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
