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
   SPLASH SCREEN
   Shown once per browser session via sessionStorage.
   ---------------------------------------------------------------- */
const SplashScreen = (() => {
  const SESSION_KEY = 'fs-splash-v1';

  function build() {
    // Resolve logo path from the page's own <link rel="icon"> so
    // every sub-page (about/, services/, …) gets the right relative path.
    const logoSrc =
      document.querySelector('link[rel="icon"]')?.getAttribute('href') ||
      '../assets/img/logo.png';

    const el = document.createElement('div');
    el.id = 'fs-splash';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', 'Loading Fussion Shade');
    el.innerHTML = `
      <div class="fs-splash-content">
        <div class="fs-splash-logo-wrap">
          <div class="fs-splash-ring"></div>
          <div class="fs-splash-ring"></div>
          <div class="fs-splash-ring"></div>
          <img src="${logoSrc}" alt="" class="fs-splash-logo" width="72" height="72">
        </div>
        <div class="fs-splash-name">Fussion<span>Shade</span></div>
        <div class="fs-splash-sub">Custom Software House &amp; Digital Agency</div>
        <div class="fs-splash-dots"><span></span><span></span><span></span></div>
      </div>`;
    document.body.prepend(el);
    return el;
  }

  function dismiss(el) {
    el.classList.add('fs-splash-out');
    setTimeout(() => el.remove(), 700);
  }

  function init() {
    if (sessionStorage.getItem(SESSION_KEY)) return; // Already shown this session
    sessionStorage.setItem(SESSION_KEY, '1');
    const el = build();
    // Hold for 2 s then fade out over 0.65 s
    setTimeout(() => dismiss(el), 2000);
  }

  return { init };
})();


/* ----------------------------------------------------------------
   PAGE TRANSITIONS
   Intercepts internal link clicks → animates body out →
   navigates. On the next page the CSS body animation fades it in.
   Also drives a top progress bar for visual feedback.
   ---------------------------------------------------------------- */
const PageTransitions = (() => {
  let overlayEl  = null;
  let barFillEl  = null;
  let progressEl = null; // thin top bar

  /* ── Build the branded overlay once ── */
  function buildOverlay() {
    const logoSrc =
      document.querySelector('link[rel="icon"]')?.getAttribute('href') ||
      '../assets/img/logo.png';

    const el = document.createElement('div');
    el.id = 'fs-transit-overlay';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `
      <img src="${logoSrc}" alt="" class="fs-transit-logo" width="64" height="64">
      <div class="fs-transit-brand">Fussion<span>Shade</span></div>
      <div class="fs-transit-tagline">Custom Software House &amp; Digital Agency</div>
      <div class="fs-transit-bar-track">
        <div class="fs-transit-bar-fill"></div>
      </div>`;
    document.body.appendChild(el);
    overlayEl = el;
    barFillEl = el.querySelector('.fs-transit-bar-fill');
  }

  /* ── Thin top bar ── */
  function topBar() {
    if (!progressEl) {
      progressEl = document.createElement('div');
      progressEl.id = 'fs-progress';
      document.body.appendChild(progressEl);
    }
    return progressEl;
  }

  /* ── Show overlay + kick off progress bar ── */
  function showOverlay() {
    if (!overlayEl) buildOverlay();

    // Show overlay
    overlayEl.classList.add('fs-transit-show');

    // Animate fill: reset → 80 %
    if (barFillEl) {
      barFillEl.style.transition = 'none';
      barFillEl.style.width = '0%';
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          barFillEl.style.transition = '';
          barFillEl.style.width = '80%';
        })
      );
    }

    // Top bar
    const b = topBar();
    b.className = '';
    b.style.cssText = 'width:0%;opacity:1;transition:none';
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        b.style.cssText = '';
        b.classList.add('fs-running');
      })
    );
  }

  /* ── Hide overlay after new page loads ── */
  function hideOverlay() {
    if (barFillEl) barFillEl.style.width = '100%';

    const b = topBar();
    b.className = 'fs-done';
    setTimeout(() => { b.className = ''; b.style.width = '0%'; }, 650);

    if (overlayEl) overlayEl.classList.remove('fs-transit-show');
  }

  /* ── Helpers ── */
  function isInternal(href) {
    if (!href) return false;
    if (
      href.startsWith('#') ||
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('javascript:')
    ) return false;
    return true;
  }

  function init() {
    // Dismiss overlay when new page fully loads
    window.addEventListener('load', hideOverlay);

    // bfcache (back/forward button)
    window.addEventListener('pageshow', e => {
      if (e.persisted) hideOverlay();
    });

    // Intercept internal link clicks
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      if (link.hasAttribute('target') || link.hasAttribute('download')) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      const href = link.getAttribute('href');
      if (!isInternal(href)) return;

      const [path] = href.split('#');
      if (path === '' || path === window.location.pathname) return;

      e.preventDefault();
      document.body.classList.add('page-exiting'); // blocks pointer events only
      showOverlay();

      setTimeout(() => {
        window.location.href = href;
      }, 340);
    });
  }

  return { init };
})();


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
  SplashScreen.init();
  PageTransitions.init();
});
