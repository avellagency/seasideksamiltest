// Seaside Ksamil – shared site runtime: libs, preloader, page curtain, Lenis, nav, cursor, i18n, scroll animations.
(function () {
  if (window.SS) return;
  const CDN = 'https://cdn.jsdelivr.net/npm/';
  const LIBS = [CDN + 'gsap@3.12.5/dist/gsap.min.js', CDN + 'gsap@3.12.5/dist/ScrollTrigger.min.js', CDN + 'gsap@3.12.5/dist/Flip.min.js', CDN + 'lenis@1.1.14/dist/lenis.min.js'];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lang = localStorage.getItem('ss-lang') || 'sq';
  const NAMES = { index: ['Kreu', 'Home'], apartment: ['Studioja', 'The Studio'], location: ['Vendndodhja', 'Location'], gallery: ['Galeria', 'Gallery'], book: ['Rezervo', 'Book'] };
  const pageOf = (p) => { const m = (p || location.pathname).match(/([\w-]+)\.html/); return m && NAMES[m[1]] ? m[1] : 'index'; };
  const label = (p) => NAMES[p][lang === 'en' ? 1 : 0];
  const first = !sessionStorage.getItem('ss-seen');
  sessionStorage.setItem('ss-seen', '1');
  document.documentElement.lang = lang;
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const VEIL = 'position:fixed;inset:0;z-index:1000;background:#0C1820;color:#F4F1EA;display:flex;align-items:flex-end;justify-content:space-between;gap:24px;padding:clamp(24px,4vw,56px);font-family:"Instrument Serif",serif;';
  let resolveReady; const ready = new Promise((r) => (resolveReady = r));
  const SS = (window.SS = { ready, lang, reduce, go, lenis: null });

  // i18n: text nodes carry Albanian, data-en carries English. Observer covers nodes mounted later (sc-if).
  function tr(root) {
    const els = root.matches && root.matches('[data-en],[data-en-ph],[data-lang]') ? [root] : [];
    els.push(...$$('[data-en],[data-en-ph],[data-lang]', root));
    els.forEach((el) => {
      if (el.dataset.lang) el.style.opacity = el.dataset.lang === lang ? 1 : 0.45;
      if (lang !== 'en' || el.dataset.done) return;
      el.dataset.done = 1;
      if (el.dataset.en != null) el.textContent = el.dataset.en;
      if (el.dataset.enPh) el.placeholder = el.dataset.enPh;
    });
  }
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && tr(n)))).observe(document.documentElement, { childList: true, subtree: true });

  // Veil: preloader on first visit, page-name curtain afterwards
  const veil = document.createElement('div');
  veil.style.cssText = VEIL;
  veil.innerHTML = first
    ? `<div style="font:400 12px 'Inter Tight',sans-serif;letter-spacing:.22em;text-transform:uppercase;opacity:.7;padding-bottom:1.2em">Seaside Ksamil · ${lang === 'en' ? 'Albanian Riviera' : 'Riviera Shqiptare'}</div><div data-n style="font-size:clamp(120px,24vw,360px);line-height:.78;font-variant-numeric:tabular-nums">0</div>`
    : `<div style="font-size:clamp(56px,10vw,160px);line-height:.9;font-style:italic">${label(pageOf())}</div>`;
  (document.body || document.documentElement).appendChild(veil);
  let target = first ? 86 : 100, v = 0, counted;
  const counterDone = new Promise((r) => (counted = r));
  if (first && !reduce) {
    const n = veil.querySelector('[data-n]');
    (function tick() { v = Math.min(target, v + Math.max(0.35, (target - v) * 0.045)); n.textContent = Math.floor(v); v >= 100 ? counted() : requestAnimationFrame(tick); })();
  } else counted();

  const load = (s) => new Promise((r) => { const e = document.createElement('script'); e.src = s; e.onload = e.onerror = r; document.head.appendChild(e); });
  const waitDom = () => new Promise((r) => { const t0 = Date.now(); (function f() { document.querySelector('[data-ss-footer]') || Date.now() - t0 > 8000 ? r() : setTimeout(f, 60); })(); });
  (async () => { for (const s of LIBS) await load(s); })()
    .then(() => Promise.all([waitDom(), document.fonts ? document.fonts.ready : 0]))
    .then(() => new Promise((r) => setTimeout(r, 120)))
    .then(init);
  addEventListener('pageshow', (e) => e.persisted && location.reload());

  function go(href) {
    if (SS.going) return; SS.going = true;
    const c = document.createElement('div');
    c.style.cssText = VEIL;
    c.innerHTML = `<div style="font-size:clamp(56px,10vw,160px);line-height:.9;font-style:italic">${label(pageOf(new URL(href, location.href).pathname))}</div>`;
    document.body.appendChild(c);
    if (!window.gsap || reduce) return (location.href = href);
    gsap.fromTo(c, { yPercent: 100 }, { yPercent: 0, duration: 0.9, ease: 'expo.inOut', onComplete: () => (location.href = href) });
    gsap.fromTo(c.firstChild, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, delay: 0.3, ease: 'expo.out' });
  }

  document.addEventListener('click', (e) => {
    const l = e.target.closest && e.target.closest('[data-lang]');
    if (l) { e.preventDefault(); if (l.dataset.lang !== lang) { localStorage.setItem('ss-lang', l.dataset.lang); go(location.pathname + location.search); } return; }
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const h = a.getAttribute('href');
    if (!/\.html/.test(h) || /^[a-z]+:/i.test(h)) return;
    e.preventDefault(); go(h);
  });
  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (!f.matches('[data-ss-form]')) return;
    e.preventDefault();
    const q = new URLSearchParams([...new FormData(f)].filter(([, val]) => val));
    go(f.getAttribute('action') + (q.toString() ? '?' + q : ''));
  });

  function words(el, chars) {
    const out = [];
    (function walk(n) {
      [...n.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          (chars ? [...c.textContent] : c.textContent.split(/(\s+)/)).forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) return frag.appendChild(document.createTextNode(p));
            const s = document.createElement('span');
            s.textContent = p; s.style.display = 'inline-block';
            frag.appendChild(s); out.push(s);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
      });
    })(el);
    return out;
  }

  function init() {
    tr(document);
    const g = window.gsap;
    if (!g || !window.ScrollTrigger) { veil.remove(); resolveReady(); return; }
    g.registerPlugin(ScrollTrigger, window.Flip);
    ScrollTrigger.config({ ignoreMobileResize: true });
    g.defaults({ ease: 'power3.out', duration: 1.1 });
    if (!reduce && window.Lenis) {
      const lenis = (SS.lenis = new Lenis({ lerp: 0.09 }));
      lenis.on('scroll', ScrollTrigger.update);
      g.ticker.add((t) => lenis.raf(t * 1000));
      g.ticker.lagSmoothing(0);
    }
    // Nav hide on scroll down, show on scroll up
    const nav = document.querySelector('[data-ss-nav]');
    let last = 0, hidden = false;
    const onScroll = () => {
      const y = scrollY, h = y > last && y > 140;
      if (nav && h !== hidden) { hidden = h; g.to(nav, { yPercent: h ? -170 : 0, duration: 0.8, ease: 'power3.out' }); }
      last = y;
    };
    addEventListener('scroll', onScroll, { passive: true });

    if (fine && !reduce) cursor(g);
    magnetic(g);
    const hero = g.timeline({ paused: true });
    if (reduce) $$('[data-expand-media]').forEach((m) => (m.style.clipPath = 'none'));
    else try { animations(g, hero); } catch (err) { console.error(err); } // never leave the veil stuck
    resolveReady();
    addEventListener('load', () => ScrollTrigger.refresh());
    setTimeout(() => ScrollTrigger.refresh(), 600);

    target = 100;
    counterDone.then(() => {
      g.to(veil, { yPercent: -100, duration: first ? 1.3 : 1, delay: first ? 0.25 : 0.1, ease: 'expo.inOut', onComplete: () => veil.remove() });
      g.delayedCall(first ? 0.75 : 0.45, () => hero.play());
    });
  }

  function animations(g, hero) {
    const heroImg = document.querySelector('[data-hero-img]');
    if (heroImg) hero.fromTo(heroImg, { scale: 1.15 }, { scale: 1, duration: 2.6, ease: 'expo.out' }, 0);
    $$('[data-split]').forEach((el) => {
      const w = words(el);
      const from = { opacity: 0, y: '0.3em', filter: 'blur(14px)' };
      const to = { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.3, stagger: 0.07, ease: 'power3.out' };
      if (el.closest('[data-hero]')) hero.fromTo(w, from, to, 0.2);
      else g.fromTo(w, from, { ...to, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    const hf = $$('[data-hero] [data-hero-fade]');
    if (hf.length) hero.fromTo(hf, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1 }, 0.7);
    $$('[data-reveal]').forEach((el) => g.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, scrollTrigger: { trigger: el, start: 'top 90%' } }));
    $$('[data-fill]').forEach((el) => g.fromTo(words(el), { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } }));
    $$('[data-count]').forEach((el) => {
      const o = { v: 0 }, end = +el.dataset.count; el.textContent = '0';
      g.to(o, { v: end, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' }, onUpdate: () => (el.textContent = Math.round(o.v)) });
    });
    $$('[data-clip]').forEach((el) => {
      const st = { trigger: el, start: 'top 90%' };
      g.fromTo(el, { clipPath: 'inset(100% 0% 0% 0% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', duration: 1.4, ease: 'expo.out', scrollTrigger: st });
      const img = el.querySelector('img:not([data-parallax])');
      if (img) g.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.4, ease: 'expo.out', scrollTrigger: st });
    });
    $$('[data-parallax]').forEach((img) => g.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    $$('[data-draw]').forEach((el) => g.fromTo(el, { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left center', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } }));
    $$('[data-chars]').forEach((el) => g.fromTo(words(el, true), { yPercent: 110 }, { yPercent: 0, stagger: 0.07, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 96%' } }));
    $$('[data-pulse]').forEach((el) => g.fromTo(el, { scaleY: 0, transformOrigin: 'top' }, { scaleY: 1, duration: 1.4, repeat: -1, ease: 'power3.inOut', yoyo: true }));
    $$('[data-marquee]').forEach((t) => {
      const orig = [...t.children];
      while (t.scrollWidth < innerWidth * 1.2) orig.forEach((c) => t.append(c.cloneNode(true)));
      [...t.children].forEach((c) => t.append(c.cloneNode(true)));
      const right = t.dataset.marquee === 'right';
      g.fromTo(t, { xPercent: right ? -50 : 0 }, { xPercent: right ? 0 : -50, duration: 60, ease: 'none', repeat: -1 });
    });
    $$('[data-expand]').forEach((sec) => {
      const m = sec.querySelector('[data-expand-media]');
      const tl = g.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: '+=130%', pin: true, scrub: 1 } });
      tl.fromTo(m, { clipPath: 'inset(24% 30% 24% 30% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none' })
        .fromTo(m.querySelector('img'), { scale: 1.3 }, { scale: 1, ease: 'none' }, 0)
        .fromTo($$('[data-expand-text]', sec), { opacity: 0, y: 50 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.4 }, '-=0.35');
    });
    // Horizontal cards: sticky section inside a tall wrapper; progress read from live layout every scroll, so nothing goes stale.
    $$('[data-hscroll]').forEach((sec) => {
      const t = sec.querySelector('[data-hscroll-track]');
      const wrap = document.createElement('div');
      sec.parentNode.insertBefore(wrap, sec); wrap.appendChild(sec);
      sec.style.position = 'sticky'; sec.style.top = '0'; sec.style.height = '100svh'; sec.style.minHeight = '0';
      t.style.overflowX = 'hidden';
      const k = () => (innerWidth < 900 ? 2.5 : 1);
      const max = () => t.scrollWidth - t.clientWidth;
      const size = () => { wrap.style.height = sec.offsetHeight + max() * k() + 'px'; ScrollTrigger.refresh(); };
      const upd = () => { const r = wrap.getBoundingClientRect(), len = r.height - sec.offsetHeight; t.scrollLeft = len > 0 ? Math.min(1, Math.max(0, -r.top / len)) * max() : 0; };
      size(); upd();
      addEventListener('scroll', upd, { passive: true });
      addEventListener('resize', () => { size(); upd(); });
      $$('img', t).forEach((im) => im.complete || im.addEventListener('load', () => { size(); upd(); }, { once: true }));
      let lx = null;
      t.addEventListener('touchstart', (e) => (lx = e.touches[0].clientX), { passive: true });
      t.addEventListener('touchmove', (e) => { const x = e.touches[0].clientX; if (lx != null) window.scrollBy(0, (lx - x) * k()); lx = x; }, { passive: true });
      t.addEventListener('touchend', () => (lx = null), { passive: true });
    });
  }

  function cursor(g) {
    const c = document.createElement('div');
    c.style.cssText = 'position:fixed;left:0;top:0;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#F4F1EA;mix-blend-mode:difference;z-index:999;pointer-events:none;display:grid;place-items:center;color:#0E1A24;font:500 11px "Inter Tight",sans-serif;letter-spacing:.12em;text-transform:uppercase;overflow:hidden';
    const t = document.createElement('span');
    t.textContent = lang === 'en' ? 'View' : 'Shiko'; t.style.opacity = 0;
    c.appendChild(t); document.body.appendChild(c);
    const x = g.quickTo(c, 'x', { duration: 0.45, ease: 'power3' }), y = g.quickTo(c, 'y', { duration: 0.45, ease: 'power3' });
    addEventListener('mousemove', (e) => { x(e.clientX); y(e.clientY); });
    let mode = null;
    document.addEventListener('mouseover', (e) => {
      const el = e.target;
      const m = el.closest('[data-cursor="view"]') ? 'view' : el.closest('a,button,input,select,textarea,label') ? 'link' : '';
      if (m === mode) return; mode = m;
      const s = m === 'view' ? 88 : m === 'link' ? 6 : 12;
      c.style.mixBlendMode = m === 'view' ? 'normal' : 'difference';
      g.to(c, { width: s, height: s, margin: -s / 2 + 'px 0 0 ' + -s / 2 + 'px', backgroundColor: m === 'view' ? '#C2A273' : '#F4F1EA', duration: 0.5 });
      g.to(t, { opacity: m === 'view' ? 1 : 0, duration: 0.3 });
    });
  }

  function magnetic(g) {
    let cur = null;
    document.addEventListener('mousemove', (e) => {
      const el = e.target.closest && e.target.closest('[data-magnetic]');
      if (cur && cur !== el) g.to(cur, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,0.4)' });
      if (el && el !== cur && !reduce) {
        const s = el.querySelector('[data-shine]'), a = el.querySelector('[data-arrow] span');
        if (s) g.fromTo(s, { left: '-70%' }, { left: '120%', duration: 1, ease: 'power3.out' });
        if (a) g.fromTo(a, { x: -22, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'expo.out' });
      }
      if (el && !reduce) {
        const r = el.getBoundingClientRect();
        g.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.32, duration: 0.6 });
      }
      cur = el;
    });
  }
})();
