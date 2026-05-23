/**
 * glamourng.com — main.js
 * Landing page interactions: navbar, mobile menu, FAQ, calculator
 * All non-blocking. No dependencies.
 */
'use strict';

/* ── Navbar scroll effect ─────────────────────── */
const navbar = document.getElementById('navbar');
if (navbar) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ── Mobile menu ──────────────────────────────── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('mobile-open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
    hamburger.classList.toggle('is-open', isOpen);
  });

  // Close when any nav link is clicked
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('mobile-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.classList.remove('is-open');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('mobile-open') &&
        !mobileMenu.contains(e.target) &&
        !hamburger.contains(e.target)) {
      mobileMenu.classList.remove('mobile-open');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.classList.remove('is-open');
    }
  });
}

/* ── FAQ accordion ────────────────────────────── */
// Global function called from inline onclick
window.toggleFAQ = function(btn) {
  const item   = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item').forEach(i => {
    i.classList.remove('open');
    const q = i.querySelector('.faq-question');
    const icon = i.querySelector('.faq-icon');
    if (q) q.setAttribute('aria-expanded', 'false');
    if (icon) icon.textContent = '+';
  });

  // Open clicked (if it was closed)
  if (!isOpen) {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    const icon = btn.querySelector('.faq-icon');
    if (icon) icon.textContent = '−';
  }
};

/* ── Earning Calculator ───────────────────────── */
const calcHours  = document.getElementById('calcHours');
const calcDays   = document.getElementById('calcDays');
const hoursDisp  = document.getElementById('hoursDisplay');
const daysDisp   = document.getElementById('daysDisplay');
const glamResult = document.getElementById('glamGainResult');
const calcAmt    = document.getElementById('calcAmount');

function updateSliderFill(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.background =
    `linear-gradient(to right, var(--gold) ${pct}%, rgba(201,168,76,0.15) ${pct}%)`;
}

function runCalc() {
  const h = parseInt(calcHours ? calcHours.value : 4, 10);
  const d = parseInt(calcDays  ? calcDays.value  : 5, 10);

  if (hoursDisp) hoursDisp.textContent = h + (h === 1 ? ' hr' : ' hrs');
  if (daysDisp)  daysDisp.textContent  = d + (d === 1 ? ' day' : ' days');

  // Base: €12/hr × hours × days × 4 weeks
  const monthly = 12 * h * d * 4;
  const fmt = '€' + monthly.toLocaleString('en-NG');

  if (glamResult) glamResult.textContent = fmt;
  if (calcAmt)    calcAmt.textContent    = fmt;

  if (calcHours) updateSliderFill(calcHours);
  if (calcDays)  updateSliderFill(calcDays);
}

// Debounce for smooth INP
let calcTimer = null;
function debouncedCalc() {
  if (calcTimer) cancelAnimationFrame(calcTimer);
  calcTimer = requestAnimationFrame(runCalc);
}

if (calcHours) {
  calcHours.addEventListener('input', debouncedCalc);
  updateSliderFill(calcHours);
}
if (calcDays) {
  calcDays.addEventListener('input', debouncedCalc);
  updateSliderFill(calcDays);
}

// Run on load
runCalc();

/* ── Niche buttons ────────────────────────────── */
document.querySelectorAll('.calc-niche-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.calc-niche-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    debouncedCalc();
  });
});

/* ── Smooth scroll for anchor links ──────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id     = a.getAttribute('href');
    const target = id === '#' ? null : document.querySelector(id);
    if (target) {
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});