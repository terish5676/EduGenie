/**
 * EduGenie — Landing Page JavaScript
 * Animations, parallax, FAQ, stats counters, navbar scroll
 */
import { initTheme, initScrollReveal } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollReveal();
  initNavbar();
  initFAQ();
  animateStats();
  initParallax();
  initMobileNav();
});

// ─── Sticky Navbar ────────────────────────────────────────
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
}

// ─── Mobile Nav ───────────────────────────────────────────
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.navbar-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    const spans = toggle.querySelectorAll('span');
    const open = links.classList.contains('open');
    spans[0].style.transform = open ? 'rotate(45deg) translateY(7px)' : '';
    spans[1].style.opacity = open ? '0' : '1';
    spans[2].style.transform = open ? 'rotate(-45deg) translateY(-7px)' : '';
  });
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !links.contains(e.target)) {
      links.classList.remove('open');
    }
  });
}

// ─── FAQ Accordion ────────────────────────────────────────
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-question');
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      // Toggle clicked
      if (!isOpen) item.classList.add('open');
    });
  });
}

// ─── Stats Counter Animation ──────────────────────────────
function animateStats() {
  const counters = document.querySelectorAll('[data-count]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        let start = 0;
        const duration = 1500;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { start = target; clearInterval(timer); }
          el.textContent = Math.round(start).toLocaleString() + suffix;
        }, 16);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => observer.observe(el));
}

// ─── Mouse Parallax ───────────────────────────────────────
function initParallax() {
  const hero = document.querySelector('.hero');
  const genie = document.querySelector('.hero-genie-img');
  const floatIcons = document.querySelectorAll('.float-icon');
  if (!hero || !genie) return;

  document.addEventListener('mousemove', (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 2;
    const y = (clientY / innerHeight - 0.5) * 2;

    genie.style.transform = `translateY(${Math.sin(Date.now() / 2000) * 12}px) rotateY(${x * 5}deg)`;

    floatIcons.forEach((icon, i) => {
      const factor = (i + 1) * 8;
      icon.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
    });
  });
}

// ─── Smooth Scroll for Nav Links ─────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// ─── Active Nav Link on Scroll ────────────────────────────
window.addEventListener('scroll', () => {
  const sections = ['features', 'how-it-works', 'testimonials', 'faq'];
  sections.forEach(id => {
    const section = document.getElementById(id);
    const link = document.querySelector(`.navbar-links a[href="#${id}"]`);
    if (!section || !link) return;
    const rect = section.getBoundingClientRect();
    if (rect.top <= 80 && rect.bottom >= 80) {
      document.querySelectorAll('.navbar-links a').forEach(a => a.classList.remove('active'));
      link.classList.add('active');
    }
  });
});

// ─── Ripple Effect on Buttons ─────────────────────────────
document.querySelectorAll('.btn-primary, .btn-cta').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    ripple.style.cssText = `
      position:absolute; width:4px; height:4px; background:rgba(255,255,255,0.5);
      border-radius:50%; left:${e.clientX - rect.left}px; top:${e.clientY - rect.top}px;
      transform:scale(0); animation:ripple 0.6s linear; pointer-events:none;
    `;
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

// Add ripple keyframe
const style = document.createElement('style');
style.textContent = `@keyframes ripple { to { transform: scale(60); opacity: 0; } }`;
document.head.appendChild(style);
