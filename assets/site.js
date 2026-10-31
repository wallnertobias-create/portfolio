(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Einblenden beim Scrollen
  const items = document.querySelectorAll('[data-in], [data-land]');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('in', 'done'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        target.classList.add('in');
        io.unobserve(target);
        setTimeout(() => target.classList.add('done'), 1500);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    items.forEach(el => io.observe(el));
  }

  // Ads starten auf Klick, ohne Script bleiben die normalen Video-Controls
  const clips = [...document.querySelectorAll('.clip')];
  clips.forEach(clip => {
    const video = clip.querySelector('video');
    const play = clip.querySelector('.play');
    video.controls = false;
    play.hidden = false;
    play.addEventListener('click', () => {
      clips.forEach(other => { if (other !== clip) other.querySelector('video').pause(); });
      play.hidden = true;
      video.controls = true;
      video.play();
      video.focus({ preventScroll: true });
    });
    video.addEventListener('ended', () => {
      video.controls = false;
      video.load();
      play.hidden = false;
      play.focus({ preventScroll: true });
    });
  });

  // Der Wi-Fi-Clip läuft nur, solange er zu sehen ist
  const loop = document.querySelector('.loop');
  if (loop && !reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loop.play().catch(() => {});
      else loop.pause();
    }, { threshold: .3 }).observe(loop);
  }

  // Das Gesicht schaut dem Cursor nach und blinzelt
  const face = document.querySelector('.face');
  const eyes = face.querySelector('.eyes');
  if (reduce) return;

  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  const tick = () => {
    x += (tx - x) * .15;
    y += (ty - y) * .15;
    eyes.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > .03 ? requestAnimationFrame(tick) : 0;
  };
  const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const aim = (px, py) => {
    const r = face.getBoundingClientRect();
    const dx = px - (r.left + r.width / 2);
    const dy = py - (r.top + r.height * .6);
    const dist = Math.hypot(dx, dy) || 1;
    const pull = Math.min(1, dist / 240);
    tx = dx / dist * pull * 6;
    ty = dy / dist * pull * 4.5;
    start();
  };
  addEventListener('pointermove', e => aim(e.clientX, e.clientY), { passive: true });
  addEventListener('pointerdown', e => aim(e.clientX, e.clientY), { passive: true });

  // Am Handy schauen die Augen beim Scrollen mit
  if (matchMedia('(pointer: coarse)').matches) {
    let last = scrollY, rest = 0;
    addEventListener('scroll', () => {
      const delta = scrollY - last;
      last = scrollY;
      if (scrollY > innerHeight) return;
      ty = Math.max(-4.5, Math.min(4.5, delta * .6));
      tx = 0;
      start();
      clearTimeout(rest);
      rest = setTimeout(() => { ty = 0; start(); }, 220);
    }, { passive: true });
  }

  const flash = (name, ms) => { face.classList.add(name); setTimeout(() => face.classList.remove(name), ms); };
  const blink = () => {
    flash('blink', 130);
    setTimeout(blink, 2400 + Math.random() * 3600);
  };
  setTimeout(blink, 3200);
  face.addEventListener('pointerenter', () => flash('wink', 260));
  face.addEventListener('click', () => flash('wink', 260));

  // Fährt jemand über den Button, zieht das Gesicht die Augenbrauen hoch
  document.querySelectorAll('.btn, .mail').forEach(link => {
    link.addEventListener('pointerenter', () => face.classList.add('happy'));
    link.addEventListener('pointerleave', () => face.classList.remove('happy'));
  });
})();
