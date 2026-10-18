/* GovPulse site interactions: external file so CSP needs no inline script hashes for it. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  // spotlight cards
  document.addEventListener('pointermove', e => { const t = e.target.closest && e.target.closest('.spot'); if (!t) return; const r = t.getBoundingClientRect(); t.style.setProperty('--mx', (e.clientX - r.left) + 'px'); t.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
  // section reveals
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  document.querySelectorAll('.reveal,.line-mask,[data-reveal]').forEach(el => reduce || !io ? el.classList.add('in') : io.observe(el));
  // lazy background videos: poster only for reduced motion / Save-Data
  const vids = document.querySelectorAll('video[data-bg]');
  const vio = new IntersectionObserver(es => es.forEach(x => { const v = x.target;
    if (x.isIntersecting) { if (!v.dataset.loaded) { v.querySelectorAll('source[data-src]').forEach(s => { s.src = s.dataset.src; }); v.load(); v.dataset.loaded = '1'; } v.play().catch(() => {}); } else if (v.dataset.loaded) v.pause(); }), { rootMargin: '200px' });
  if (!reduce && !saveData) vids.forEach(v => vio.observe(v));
  // cursor follower
  const cur = document.querySelector('.cursor');
  if (cur && !reduce && matchMedia('(pointer: fine)').matches) {
    let x = -100, y = -100, cx = x, cy = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; cur.classList.toggle('big', !!(e.target.closest && e.target.closest('a,button,[role=tab]'))); }, { passive: true });
    const tick = () => { cx += (x - cx) * .2; cy += (y - cy) * .2; cur.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(tick); }; tick();
  } else if (cur) cur.remove();
  // hero parallax + scroll-driven zoom/fade
  if (!reduce) document.querySelectorAll('[data-parallax]').forEach(sec => {
    const media = sec.querySelector('.hero-media'), title = sec.querySelector('[data-depth]');
    let tx = 0, ty = 0, cx = 0, cy = 0;
    sec.addEventListener('pointermove', e => { const r = sec.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - .5) * -24; ty = ((e.clientY - r.top) / r.height - .5) * -16; });
    const loop = () => { cx += (tx - cx) * .06; cy += (ty - cy) * .06; const h = sec.offsetHeight || 1, p = Math.min(1, Math.max(0, scrollY / h));
      if (media) { media.style.setProperty('--px', cx + 'px'); media.style.setProperty('--py', cy + 'px'); media.style.setProperty('--sy', (scrollY * .3) + 'px'); media.style.setProperty('--sc', String(1 + p * .12)); }
      if (title) { title.style.transform = `translate3d(${cx * .4}px,${scrollY * -.15}px,0)`; title.style.opacity = String(Math.max(0, 1 - p * 1.6)); }
      requestAnimationFrame(loop); }; loop();
  });
})();
/* Country selection flow: arriving with #dash shows the hero briefly, then glides to the sticky dashboard bar. */
(() => {
  if (location.hash !== '#dash') return;
  const t = document.getElementById('dash-top') || document.getElementById('dash'); if (!t) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  history.scrollRestoration = 'manual';
  if (reduce) { t.scrollIntoView(); return; }
  scrollTo(0, 0);
  setTimeout(() => { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 650);
})();
/* GA4 with Consent Mode v2: only present when PUBLIC_GA4_ID was set at build. Defaults to denied; banner asks once. */
(() => {
  const tag = document.querySelector('script[data-ga4]'); if (!tag) return;
  const id = tag.dataset.ga4; window.dataLayer = window.dataLayer || []; function gtag() { dataLayer.push(arguments); } window.gtag = gtag;
  const saved = localStorage.getItem('gp-consent');
  gtag('consent', 'default', { analytics_storage: saved === 'granted' ? 'granted' : 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  gtag('js', new Date()); gtag('config', id, { anonymize_ip: true });
  const box = document.getElementById('consent'); if (!box || saved) return; box.hidden = false;
  box.addEventListener('click', e => { const v = e.target.closest('[data-consent]')?.dataset.consent; if (!v) return;
    localStorage.setItem('gp-consent', v); gtag('consent', 'update', { analytics_storage: v }); box.hidden = true; });
})();
