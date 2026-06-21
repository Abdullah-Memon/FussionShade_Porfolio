/* ================================================================
   FUSSION SHADE — MAIN JAVASCRIPT
   Ethereal Glass Interactions | Scroll Choreography | Fluid Motion
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
    // Update theme-color meta for mobile browsers
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#050505' : '#F7F8FA';
  }

  function toggle() {
    const current = root.getAttribute('data-theme') || 'dark';
    apply(current === 'dark' ? 'light' : 'dark');
  }

  function init() {
    apply(getPreference());
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', toggle);
    });
  }

  return { init, toggle };
})();


/* ----------------------------------------------------------------
   NAVIGATION — Floating Pill + Scroll Effect
   ---------------------------------------------------------------- */
const Nav = (() => {
  function init() {
    const nav = document.querySelector('.nav');
    const toggle = document.querySelector('.nav-toggle');
    const mobileMenu = document.querySelector('.nav-mobile');
    const overlay = document.querySelector('.nav-overlay');

    // Scroll effect — tighten the pill on scroll
    function onScroll() {
      if (!nav) return;
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile menu
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

      const closeBtn = mobileMenu.querySelector('.nav-sidebar-close');
      if (closeBtn) closeBtn.addEventListener('click', closeMenu);
      if (overlay) overlay.addEventListener('click', closeMenu);

      mobileMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
      });

      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && toggle.classList.contains('open')) closeMenu();
      });
    }

    // Active nav link
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
   SCROLL REVEAL — IntersectionObserver with Stagger
   ---------------------------------------------------------------- */
const ScrollReveal = (() => {
  function init() {
    const items = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-blur');
    if (!items.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -60px 0px'
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
    const duration = 2200;
    const startTime = performance.now();

    function easeOutExpo(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);

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
      const gap = 24;
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

    // Touch / swipe
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

        document.querySelectorAll('.faq-item.open').forEach(open => {
          open.classList.remove('open');
          const a = open.querySelector('.faq-answer');
          if (a) a.style.maxHeight = '0';
        });

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
    const btns  = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.project-card-wrap');
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
                card.style.transition = 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)';
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

      btn.disabled = true;
      btn.innerHTML = `
        <svg style="width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:2;animation:spin 1s linear infinite" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
        </svg>
        Sending…`;

      await new Promise(r => setTimeout(r, 1500));

      form.style.display = 'none';
      const success = form.nextElementSibling;
      if (success && success.classList.contains('form-success')) {
        success.classList.add('show');
      }

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
   ---------------------------------------------------------------- */
const SplashScreen = (() => {
  const SESSION_KEY = 'fs-splash-v2';

  function build() {
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
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');
    const el = build();
    setTimeout(() => dismiss(el), 2000);
  }

  return { init };
})();


/* ----------------------------------------------------------------
   PAGE TRANSITIONS
   ---------------------------------------------------------------- */
const PageTransitions = (() => {
  let overlayEl  = null;
  let barFillEl  = null;
  let progressEl = null;

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

  function topBar() {
    if (!progressEl) {
      progressEl = document.createElement('div');
      progressEl.id = 'fs-progress';
      document.body.appendChild(progressEl);
    }
    return progressEl;
  }

  function showOverlay() {
    if (!overlayEl) buildOverlay();
    overlayEl.classList.add('fs-transit-show');

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

  function hideOverlay() {
    if (barFillEl) barFillEl.style.width = '100%';

    const b = topBar();
    b.className = 'fs-done';
    setTimeout(() => { b.className = ''; b.style.width = '0%'; }, 650);

    if (overlayEl) overlayEl.classList.remove('fs-transit-show');
  }

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
    window.addEventListener('load', hideOverlay);
    window.addEventListener('pageshow', e => {
      if (e.persisted) hideOverlay();
    });

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
      document.body.classList.add('page-exiting');
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
  cta.style.transition = 'opacity 0.4s cubic-bezier(0.16,1,0.3,1)';
  window.addEventListener('scroll', onScroll, { passive: true });
}


/* ----------------------------------------------------------------
   MAGNETIC BUTTON HOVER — Subtle pointer-follow effect
   Uses requestAnimationFrame + CSS transforms (no layout thrash)
   ---------------------------------------------------------------- */
function initMagneticButtons() {
  const buttons = document.querySelectorAll('.btn-primary, .btn-outline');
  if (!buttons.length) return;

  // Skip magnetic on touch devices
  if ('ontouchstart' in window) return;

  buttons.forEach(btn => {
    let animating = false;

    btn.addEventListener('mousemove', e => {
      if (animating) return;
      animating = true;

      requestAnimationFrame(() => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        // Subtle magnetic pull — max 3px displacement
        const maxDisplace = 3;
        const displaceX = (x / rect.width) * maxDisplace;
        const displaceY = (y / rect.height) * maxDisplace;

        btn.style.transform = `translate(${displaceX}px, ${displaceY}px)`;
        animating = false;
      });
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}


/* ----------------------------------------------------------------
   PARALLAX MICRO — Subtle float on scroll for hero elements
   ---------------------------------------------------------------- */
function initMicroParallax() {
  const floats = document.querySelectorAll('.hero-float-1, .hero-float-2');
  if (!floats.length) return;

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      floats.forEach((el, i) => {
        const speed = i === 0 ? 0.08 : 0.05;
        const y = scrollY * speed;
        el.style.transform = `translateY(${-y}px)`;
      });
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}


/* ----------------------------------------------------------------
   3D CARD TILT — Interactive mouse-follow perspective
   ---------------------------------------------------------------- */
function init3DCardTilt() {
  const cards = document.querySelectorAll('.card-3d, .bezel.service-card, .bezel.project-card, .offer-card');
  if (!cards.length) return;
  if ('ontouchstart' in window) return;

  cards.forEach(card => {
    let ticking = false;

    card.addEventListener('mousemove', e => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;

        // Move the magnetic glow
        const glow = card.querySelector('.magnetic-glow');
        if (glow) {
          glow.style.setProperty('--mx', `${x}px`);
          glow.style.setProperty('--my', `${y}px`);
        }

        ticking = false;
      });
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}


/* ----------------------------------------------------------------
   FLOATING PARTICLES — Ambient background effect
   ---------------------------------------------------------------- */
function initParticles() {
  const fields = document.querySelectorAll('.particle-field');
  if (!fields.length) return;

  fields.forEach(field => {
    const count = parseInt(field.dataset.particleCount) || 20;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (6 + Math.random() * 8) + 's';
      p.style.animationDelay = (Math.random() * 8) + 's';
      p.style.width = (1 + Math.random() * 2) + 'px';
      p.style.height = p.style.width;
      p.style.opacity = 0.2 + Math.random() * 0.5;
      field.appendChild(p);
    }
  });
}


/* ----------------------------------------------------------------
   MAGNETIC GLOW — Cursor-following glow on cards
   ---------------------------------------------------------------- */
function initMagneticGlow() {
  const cards = document.querySelectorAll('.magnetic-glow');
  if (!cards.length) return;
  if ('ontouchstart' in window) return;

  cards.forEach(card => {
    const glow = document.createElement('div');
    glow.style.cssText = `
      position: absolute;
      width: 250px;
      height: 250px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(62,212,106,0.1) 0%, transparent 70%);
      pointer-events: none;
      transform: translate(-50%, -50%);
      opacity: 0;
      transition: opacity 0.3s;
      z-index: 0;
    `;
    card.style.position = 'relative';
    card.appendChild(glow);

    let ticking = false;

    card.addEventListener('mousemove', e => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        glow.style.left = x + 'px';
        glow.style.top = y + 'px';
        glow.style.opacity = '1';
        ticking = false;
      });
    });

    card.addEventListener('mouseleave', () => {
      glow.style.opacity = '0';
    });
  });
}


/* ----------------------------------------------------------------
   PARALLAX DEPTH LAYERS — Multi-speed scroll movement
   ---------------------------------------------------------------- */
function initParallaxDepth() {
  const layers = document.querySelectorAll('[data-parallax-speed]');
  if (!layers.length) return;

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      layers.forEach(el => {
        const speed = parseFloat(el.dataset.parallaxSpeed) || 0.05;
        const offset = scrollY * speed;
        el.style.transform = `translateY(${-offset}px)`;
      });
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}


/* ----------------------------------------------------------------
   SCROLL PROGRESS INDICATOR — Glowing top bar
   ---------------------------------------------------------------- */
function initScrollProgress() {
  const indicator = document.createElement('div');
  indicator.id = 'scroll-progress';
  indicator.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-dark), var(--primary), var(--primary-light));
    z-index: 9999;
    transition: width 0.1s linear;
    box-shadow: 0 0 8px rgba(62,212,106,0.5);
    width: 0%;
  `;
  document.body.appendChild(indicator);

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      indicator.style.width = progress + '%';
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
}


/* ----------------------------------------------------------------
   SMOOTH COUNTER ANIMATION — Enhanced with suffix support
   ---------------------------------------------------------------- */
function initEnhancedCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent;
        const match = text.match(/(\d+\.?\d*)/);
        if (!match) return;

        const target = parseFloat(match[1]);
        const prefix = text.split(match[1])[0];
        const suffix = text.split(match[1])[1];
        const duration = 2000;
        const startTime = performance.now();

        function easeOutExpo(t) {
          return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        }

        function update(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = easeOutExpo(progress);
          const current = eased * target;

          if (Number.isInteger(target)) {
            el.textContent = prefix + Math.round(current) + suffix;
          } else {
            el.textContent = prefix + current.toFixed(1) + suffix;
          }

          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            el.textContent = prefix + target + suffix;
          }
        }

        requestAnimationFrame(update);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}


/* ----------------------------------------------------------------
   TEXT SCRAMBLE EFFECT — On scroll reveal
   ---------------------------------------------------------------- */
function initTextScramble() {
  const elements = document.querySelectorAll('[data-scramble]');
  if (!elements.length) return;

  const chars = '!<>-_\\/[]{}—=+*^?#________';

  function scramble(el) {
    const original = el.dataset.scramble || el.textContent;
    let iteration = 0;
    const maxIterations = original.length * 3;

    function update() {
      el.textContent = original
        .split('')
        .map((char, index) => {
          if (index < iteration / 3) return original[index];
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      if (iteration < maxIterations) {
        iteration++;
        requestAnimationFrame(update);
      } else {
        el.textContent = original;
      }
    }

    update();
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        scramble(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  elements.forEach(el => observer.observe(el));
}


/* ----------------------------------------------------------------
   OFFER SEARCH — Debounced Search + Category Filter
   ---------------------------------------------------------------- */
const OfferSearch = (() => {
  const DEBOUNCE_MS = 500;
  let debounceTimer;

  function init() {
    const searchInput = document.getElementById('offerSearch');
    const searchBtn = document.getElementById('offerSearchBtn');
    const resetBtn = document.getElementById('offerResetBtn');
    const pills = document.querySelectorAll('.cat-pill');
    const offers = document.querySelectorAll('.offer-card[data-offer-title]');
    const sections = document.querySelectorAll('.offer-category-section');
    const noResults = document.getElementById('noResults');

    if (!searchInput || !offers.length) return;

    // Debounced real-time search
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => filterOffers(), DEBOUNCE_MS);
    });

    // Manual search button
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        clearTimeout(debounceTimer);
        filterOffers();
      });
    }

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        searchInput.value = '';
        const allPill = document.querySelector('.cat-pill[data-category="all"]');
        if (allPill) {
          pills.forEach(p => p.classList.remove('active'));
          allPill.classList.add('active');
        }
        filterOffers();
      });
    }

    // Category pills
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        filterOffers();
      });
    });

    function filterOffers() {
      const query = searchInput.value.toLowerCase().trim();
      const activePill = document.querySelector('.cat-pill.active');
      const activeCategory = activePill ? activePill.dataset.category : 'all';
      let visibleCount = 0;

      // Filter individual offer cards
      offers.forEach(card => {
        const title = (card.dataset.offerTitle || '').toLowerCase();
        const keywords = (card.dataset.offerKeywords || '').toLowerCase();
        const cardCategory = card.closest('.offer-category-section')?.dataset.categorySection || '';

        const matchesSearch = !query || title.includes(query) || keywords.includes(query);
        const matchesCategory = activeCategory === 'all' || cardCategory === activeCategory;

        if (matchesSearch && matchesCategory) {
          card.style.display = '';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });

      // Show/hide category sections based on whether they have visible cards
      sections.forEach(section => {
        const sectionCategory = section.dataset.categorySection;
        const sectionOffers = section.querySelectorAll('.offer-card[data-offer-title]');
        const hasVisible = Array.from(sectionOffers).some(card => card.style.display !== 'none');

        if (activeCategory === 'all' || activeCategory === sectionCategory) {
          section.style.display = hasVisible ? '' : 'none';
        } else {
          section.style.display = 'none';
        }
      });

      // Show no results message
      if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    }
  }

  return { init };
})();


/* ----------------------------------------------------------------
   CONTACT PAGE — URL Parameter Pre-fill
   ---------------------------------------------------------------- */
function prefillContactForm() {
  const params = new URLSearchParams(window.location.search);
  const service = params.get('service');
  if (service) {
    const serviceSelect = document.getElementById('service');
    if (serviceSelect) {
      // Check if the option exists
      const options = Array.from(serviceSelect.options);
      const match = options.find(opt => opt.value === service);
      if (match) {
        serviceSelect.value = service;
        // Trigger change event for any listeners
        serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    // Also pre-fill message if offer title is present
    const messageField = document.getElementById('message');
    if (messageField && !messageField.value) {
      const offerName = service.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      messageField.value = `I'm interested in the "${offerName}" offer. I'd like to discuss how this can help my business.`;
    }
  }
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
  initMagneticButtons();
  initMicroParallax();
  init3DCardTilt();
  initParticles();
  initMagneticGlow();
  initParallaxDepth();
  initScrollProgress();
  initEnhancedCounters();
  initTextScramble();
  SplashScreen.init();
  PageTransitions.init();
  prefillContactForm();
});
