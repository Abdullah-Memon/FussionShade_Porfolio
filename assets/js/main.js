/* ================================================================
   FUSSION SHADE — MAIN JAVASCRIPT
   Theme Toggle | Scroll Animations | Counters | Slider | Nav
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   THEME MANAGEMENT
   ---------------------------------------------------------------- */
const ThemeManager = (() => {
  const KEY = 'fsShadetheme';
  const root = document.documentElement;

  function getPreference() {
    const saved = localStorage.getItem(KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
  }

  function toggle() {
    const current = root.getAttribute('data-theme') || 'light';
    apply(current === 'dark' ? 'light' : 'dark');
  }

  function init() {
    apply(getPreference());
    // Bind all theme-toggle buttons (desktop nav + mobile sidebar)
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', toggle);
    });
  }

  return { init, toggle };
})();


/* ----------------------------------------------------------------
   NAVIGATION
   ---------------------------------------------------------------- */
const Nav = (() => {
  function init() {
    const nav = document.querySelector('.nav');
    const toggle = document.querySelector('.nav-toggle');
    const mobileMenu = document.querySelector('.nav-mobile');

    const overlay = document.querySelector('.nav-overlay');

    // Scroll effect — add .scrolled for background on scroll
    function onScroll() {
      if (!nav) return;
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile sidebar open / close
    function openMenu() {
      if (!toggle || !mobileMenu) return;
      toggle.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      mobileMenu.classList.add('open');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      if (!toggle || !mobileMenu) return;
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      mobileMenu.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (toggle && mobileMenu) {
      toggle.addEventListener('click', () => {
        toggle.classList.contains('open') ? closeMenu() : openMenu();
      });

      // Close button inside sidebar
      const closeBtn = mobileMenu.querySelector('.nav-sidebar-close');
      if (closeBtn) closeBtn.addEventListener('click', closeMenu);

      // Clicking the overlay backdrop closes menu
      if (overlay) overlay.addEventListener('click', closeMenu);

      // Close when a nav link inside the sidebar is clicked
      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
      });

      // Close on Escape key
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && toggle.classList.contains('open')) closeMenu();
      });
    }

    // Active nav link — works with clean URLs (/about, /services, etc.)
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = (link.getAttribute('href') || '').replace(/\/$/, '') || '/';
      if (href === currentPath) {
        link.classList.add('active');
      }
    });
  }

  return { init };
})();


/* ----------------------------------------------------------------
   SCROLL REVEAL ANIMATIONS
   ---------------------------------------------------------------- */
const ScrollReveal = (() => {
  function init() {
    const items = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if (!items.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    items.forEach(el => observer.observe(el));
  }

  return { init };
})();


/* ----------------------------------------------------------------
   ANIMATED COUNTERS
   ---------------------------------------------------------------- */
const Counters = (() => {
  function animate(el) {
    const target = parseFloat(el.dataset.target || el.textContent);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const startTime = performance.now();

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      const current = Math.round(eased * target * 10) / 10;
      el.textContent = (Number.isInteger(target) ? Math.round(current) : current.toFixed(1)) + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target + suffix;
      }
    }

    requestAnimationFrame(update);
  }

  function init() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => {
      const val = el.textContent.replace(/[^0-9.]/g, '');
      el.dataset.target = val;
      observer.observe(el);
    });
  }

  return { init };
})();


/* ----------------------------------------------------------------
   TESTIMONIALS SLIDER
   ---------------------------------------------------------------- */
const Testimonials = (() => {
  function init() {
    const slider   = document.querySelector('.testimonials-slider');
    const dotsWrap = document.querySelector('.testimonials-dots');
    const prevBtn  = document.querySelector('.testimonial-prev');
    const nextBtn  = document.querySelector('.testimonial-next');
    if (!slider) return;

    const cards   = Array.from(slider.querySelectorAll('.testimonial-card'));
    let current   = 0;
    let perView   = getPerView();
    let maxIndex  = Math.max(0, cards.length - perView);
    let autoInterval;

    function getPerView() {
      if (window.innerWidth <= 768) return 1;
      if (window.innerWidth <= 1024) return 2;
      return 3;
    }

    function getCardWidth() {
      if (!cards.length) return 0;
      return cards[0].getBoundingClientRect().width;
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      const total = maxIndex + 1;
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
        dot.className = 'testimonial-dot' + (i === current ? ' active' : '');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
      }
    }

    function updateDots() {
      if (!dotsWrap) return;
      dotsWrap.querySelectorAll('.testimonial-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === current);
      });
    }

    function goTo(index) {
      current = Math.max(0, Math.min(index, maxIndex));
      const gap = 24; // var(--s6) = 1.5rem
      const cardW = getCardWidth();
      slider.style.transform = `translateX(-${current * (cardW + gap)}px)`;
      updateDots();
    }

    function next() { goTo(current < maxIndex ? current + 1 : 0); }
    function prev() { goTo(current > 0 ? current - 1 : maxIndex); }

    function startAuto() {
      stopAuto();
      autoInterval = setInterval(next, 5000);
    }

    function stopAuto() {
      if (autoInterval) clearInterval(autoInterval);
    }

    if (nextBtn) nextBtn.addEventListener('click', () => { next(); startAuto(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prev(); startAuto(); });

    slider.addEventListener('mouseenter', stopAuto);
    slider.addEventListener('mouseleave', startAuto);

    // Touch / swipe support
    let touchStartX = 0;
    slider.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
      stopAuto();
    }, { passive: true });
    slider.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
      startAuto();
    }, { passive: true });

    function onResize() {
      perView = getPerView();
      maxIndex = Math.max(0, cards.length - perView);
      current = Math.min(current, maxIndex);
      buildDots();
      goTo(current);
    }

    buildDots();
    goTo(0);
    startAuto();
    window.addEventListener('resize', onResize, { passive: true });
  }

  return { init };
})();


/* ----------------------------------------------------------------
   FAQ ACCORDION
   ---------------------------------------------------------------- */
const FAQ = (() => {
  function init() {
    document.querySelectorAll('.faq-item').forEach(item => {
      const btn    = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      if (!btn || !answer) return;

      btn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all
        document.querySelectorAll('.faq-item.open').forEach(open => {
          open.classList.remove('open');
          const a = open.querySelector('.faq-answer');
          if (a) a.style.maxHeight = '0';
        });

        // Open clicked if it was closed
        if (!isOpen) {
          item.classList.add('open');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    });
  }

  return { init };
})();


/* ----------------------------------------------------------------
   PROJECT FILTERS
   ---------------------------------------------------------------- */
const ProjectFilter = (() => {
  function init() {
    const btns     = document.querySelectorAll('.filter-btn');
    const cards    = document.querySelectorAll('.project-card-wrap');
    if (!btns.length || !cards.length) return;

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        cards.forEach(card => {
          const match = filter === 'all' || card.dataset.category === filter;
          card.style.display = match ? 'block' : 'none';
          if (match) {
            card.style.animation = 'none';
            requestAnimationFrame(() => {
              card.style.animation = '';
              card.style.opacity = '0';
              card.style.transform = 'translateY(16px)';
              requestAnimationFrame(() => {
                card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
              });
            });
          }
        });
      });
    });
  }

  return { init };
})();


/* ----------------------------------------------------------------
   CONTACT FORM
   ---------------------------------------------------------------- */
const ContactForm = (() => {
  function init() {
    const form = document.querySelector('#contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate reCAPTCHA if present on this page
      const recaptchaEl = document.getElementById('recaptcha-container');
      if (recaptchaEl && typeof grecaptcha !== 'undefined') {
        const token = grecaptcha.getResponse();
        if (!token) {
          const err = document.getElementById('recaptcha-error');
          if (err) err.style.display = 'block';
          return;
        }
        const err = document.getElementById('recaptcha-error');
        if (err) err.style.display = 'none';
      }

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;

      // Loading state
      btn.disabled = true;
      btn.innerHTML = `
        <svg style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;animation:spin 1s linear infinite" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
        </svg>
        Sending…`;

      // Simulate async send (replace with actual fetch/API call)
      await new Promise(r => setTimeout(r, 1500));

      form.style.display = 'none';
      const success = form.nextElementSibling;
      if (success && success.classList.contains('form-success')) {
        success.classList.add('show');
      }

      // Reset after 5s for demo
      setTimeout(() => {
        form.style.display = 'block';
        if (success) success.classList.remove('show');
        form.reset();
        btn.disabled = false;
        btn.innerHTML = originalText;
      }, 5000);
    });
  }

  return { init };
})();


/* ----------------------------------------------------------------
   SMOOTH SCROLL for anchor links
   ---------------------------------------------------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;
        const top = target.getBoundingClientRect().top + window.scrollY - navH - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}


/* ----------------------------------------------------------------
   FLOATING CTA visibility
   ---------------------------------------------------------------- */
function initFloatingCta() {
  const cta = document.querySelector('.floating-cta');
  if (!cta) return;

  function onScroll() {
    if (window.scrollY > 400) {
      cta.style.opacity = '1';
      cta.style.pointerEvents = 'auto';
    } else {
      cta.style.opacity = '0';
      cta.style.pointerEvents = 'none';
    }
  }

  cta.style.opacity = '0';
  cta.style.transition = 'opacity 0.3s ease';
  window.addEventListener('scroll', onScroll, { passive: true });
}


/* ----------------------------------------------------------------
   INIT ALL
   ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Nav.init();
  ScrollReveal.init();
  Counters.init();
  Testimonials.init();
  FAQ.init();
  ProjectFilter.init();
  ContactForm.init();
  initSmoothScroll();
  initFloatingCta();
});
