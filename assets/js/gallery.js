(() => {
  const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));
  const $  = (sel, scope = document) => scope.querySelector(sel);

  function getCandidates(btn) {
    let src =
      btn.getAttribute('data-src') ||
      (btn.querySelector('img') && btn.querySelector('img').getAttribute('src')) ||
      '';

    if (!src) return [];

    const out = [src];
    const dot = src.lastIndexOf('.');

    if (dot > 0) {
      const base = src.slice(0, dot);
      const ext  = src.slice(dot + 1).toLowerCase();
      if (ext === 'jpg' || ext === 'jpeg') {
        out.push(`${base}.png`);
      } else if (ext === 'png') {
        out.push(`${base}.jpg`, `${base}.jpeg`);
      }
    }

    return Array.from(new Set(out));
  }

  function loadWithFallback(candidates, onOk) {
    if (!candidates || !candidates.length) return;
    const [first, ...rest] = candidates;
    const img = new Image();
    img.onload  = () => onOk(first);
    img.onerror = () => rest.length ? loadWithFallback(rest, onOk) : null;
    img.src = first;
  }

  function setupStrip(strip) {
    const group = strip.getAttribute('data-group') || 'default';
    const card  = strip.closest('.card');
    const stage = card ? card.querySelector(`img[data-stage="${group}"]`) : null;
    if (!stage) return;

    const thumbs = $$('.thumb', strip);

    function setStage(btn) {
      const candidates = getCandidates(btn);
      if (!candidates.length) return;

      thumbs.forEach(t => t.classList.remove('is-active'));
      btn.classList.add('is-active');

      stage.style.opacity = 0;
      loadWithFallback(candidates, (okSrc) => {
        stage.src = okSrc;
        const label = btn.getAttribute('aria-label');
        if (label) stage.alt = label;
        requestAnimationFrame(() => stage.style.opacity = 1);
      });
    }

    const initial = strip.querySelector('.thumb.is-active') || thumbs[0];
    if (initial) setStage(initial);

    strip.addEventListener('click', (e) => {
      const btn = e.target.closest('.thumb');
      if (!btn) return;
      e.preventDefault();
      setStage(btn);
    });

    strip.addEventListener('keydown', (e) => {
      if (!['ArrowLeft','ArrowRight','Enter',' '].includes(e.key)) return;
      e.preventDefault();
      const idx = Math.max(0, thumbs.findIndex(t => t.classList.contains('is-active')));
      const nextIdx = e.key === 'ArrowRight'
        ? (idx + 1) % thumbs.length
        : e.key === 'ArrowLeft'
          ? (idx - 1 + thumbs.length) % thumbs.length
          : idx;
      const target = (e.key === 'Enter' || e.key === ' ') ? (thumbs[idx] || thumbs[0]) : thumbs[nextIdx];
      setStage(target);
      target.focus();
    });

    thumbs.forEach(t => {
      if (!t.hasAttribute('type')) t.setAttribute('type','button');

      t.addEventListener('mouseenter', () => {
        const cands = getCandidates(t);
        cands.forEach(src => { const img = new Image(); img.src = src; });
      });
    });

    let sx = null;
    stage.addEventListener('touchstart', (e) => sx = e.touches[0].clientX, {passive:true});
    stage.addEventListener('touchend',   (e) => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) < 40) return;
      const idx = Math.max(0, thumbs.findIndex(t => t.classList.contains('is-active')));
      const nextIdx = dx < 0 ? (idx + 1) % thumbs.length : (idx - 1 + thumbs.length) % thumbs.length;
      setStage(thumbs[nextIdx]);
      sx = null;
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    $$('.thumbs').forEach(setupStrip);
  });
})();
