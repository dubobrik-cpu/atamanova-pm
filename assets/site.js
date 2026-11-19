(function(){
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // дни заживления
  document.querySelectorAll('[data-days]').forEach(function(box){
    var imgs = box.querySelectorAll('.day-frame img');
    var tabs = box.querySelectorAll('.day-tabs button');
    var cap = box.querySelector('.day-cap');
    var range = box.querySelector('.day-range');
    function show(i){
      imgs.forEach(function(im,k){ im.classList.toggle('on', k===i); });
      tabs.forEach(function(t,k){ t.setAttribute('aria-pressed', k===i ? 'true' : 'false'); });
      cap.innerHTML = '<b>' + tabs[i].textContent + '</b>' + tabs[i].getAttribute('data-cap');
      if (range && +range.value !== i) range.value = i;
      var t = tabs[i]; if (t.scrollIntoView && box.dataset.touched) t.scrollIntoView({block:'nearest', inline:'center', behavior: reduce ? 'auto' : 'smooth'});
    }
    tabs.forEach(function(t,k){ t.addEventListener('click', function(){ box.dataset.touched = 1; show(k); }); });
    if (range) range.addEventListener('input', function(){ box.dataset.touched = 1; show(+range.value); });
    show(+(box.getAttribute('data-start') || 0));
  });

  // до / после
  document.querySelectorAll('.ba').forEach(function(ba){
    var after = ba.querySelector('.after'), line = ba.querySelector('.line'), knob = ba.querySelector('.knob'), inp = ba.querySelector('input');
    function set(p){ after.style.clipPath = 'inset(0 0 0 ' + p + '%)'; line.style.left = p + '%'; knob.style.left = p + '%'; }
    inp.addEventListener('input', function(){ set(inp.value); });
    set(inp.value);
  });

  // видео: крутятся, только когда видны
  var vids = document.querySelectorAll('video[data-auto]');
  if ('IntersectionObserver' in window && !reduce){
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ var v = e.target; if (e.isIntersecting){ var p = v.play(); if (p && p.catch) p.catch(function(){}); } else v.pause(); });
    }, {threshold: .35});
    vids.forEach(function(v){ io.observe(v); });
  } else vids.forEach(function(v){ v.setAttribute('controls',''); });

  // появление блоков
  var rv = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce){
    var io2 = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('in'); io2.unobserve(e.target); } }); }, {rootMargin:'0px 0px -8% 0px'});
    rv.forEach(function(el){ io2.observe(el); });
  } else rv.forEach(function(el){ el.classList.add('in'); });

  // липкая кнопка после первого экрана
  var st = document.querySelector('.sticky'), hero = document.querySelector('.hero, .svc-hero');
  if (st && hero){
    var on = function(){ st.classList.toggle('on', hero.getBoundingClientRect().bottom < 0); };
    addEventListener('scroll', on, {passive:true}); on();
  }

  // плашка сертификата прячется, пока на экране сам блок сертификата или нижняя строка подвала («Разработано»)
  var gift = document.querySelector('.gift');
  var skryvat = [document.getElementById('sertifikat'), document.querySelector('.foot-niz')].filter(Boolean);
  if (gift && skryvat.length && 'IntersectionObserver' in window){
    var vidno = new Set();
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){ e.isIntersecting ? vidno.add(e.target) : vidno.delete(e.target); });
      gift.classList.toggle('skryt', vidno.size > 0);
    });
    skryvat.forEach(function(el){ io.observe(el); });
  }

  // меню закрывается по клику на пункт
  document.querySelectorAll('.menu-list a').forEach(function(a){ a.addEventListener('click', function(){ a.closest('details').removeAttribute('open'); }); });
})();

// 3D-знак NA (12.11): грузится после показа страницы поверх плоского знака.
// Поворот в одну сторону; когда знак встаёт ребром, он подменяется лицевой стороной,
// поэтому NA никогда не читается зеркально. Лицом к зрителю медленнее, через ребро быстрее.
// Слабое устройство, экономия трафика или «меньше движения» = остаётся плоский знак
(function(){
  var me = document.currentScript, GLB = new URL('na3d.glb', me ? me.src : location.href).href;
  function load3d(){
    var imgs = document.querySelectorAll('img[data-3d]');
    if (!imgs.length) return;
    var c = navigator.connection || {}, mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
    if (c.saveData || mem < 3 || cores < 4 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var s = document.createElement('script');
    s.type = 'module'; s.src = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
    s.onload = function(){
      var items = [];
      imgs.forEach(function(img, i){
        var box = document.createElement('span'); box.className = 'na3d';
        img.parentNode.insertBefore(box, img); box.appendChild(img);
        var mv = document.createElement('model-viewer');
        var A = { src: GLB, 'camera-orbit': '0deg 90deg 7.33m', 'camera-target': '0m 0m 0m',
          'field-of-view': '10deg', 'min-field-of-view': '5deg', 'min-camera-orbit': 'auto auto 1m', 'max-camera-orbit': 'auto auto 20m',
          'tone-mapping': 'neutral', exposure: '1.15', 'shadow-intensity': '0', 'interaction-prompt': 'none',
          loading: 'eager', reveal: 'auto', 'aria-hidden': 'true', orientation: '0deg 0deg 0deg' };
        for (var k in A) mv.setAttribute(k, A[k]);
        mv.tabIndex = -1;
        var pb = document.createElement('div'); pb.setAttribute('slot', 'progress-bar'); mv.appendChild(pb); // без серой полоски загрузки
        var it = { mv: mv, p: 0.5 + i * 0.37, fast: false, on: true };
        mv.addEventListener('load', function(){ box.classList.add('is-3d'); });
        box.addEventListener('pointerenter', function(){ it.fast = true; });
        box.addEventListener('pointerleave', function(){ it.fast = false; });
        if ('IntersectionObserver' in window) new IntersectionObserver(function(e){ it.on = e[0].isIntersecting; }).observe(box);
        box.appendChild(mv); items.push(it);
      });
      var T = 7, last = 0;
      function tick(t){
        var dt = last ? Math.min((t - last) / 1000, 0.1) : 0; last = t;
        items.forEach(function(it){
          if (!it.on) return;
          it.p = (it.p + dt / T * (it.fast ? 2.5 : 1)) % 1;
          var u = 2 * it.p - 1, th = 90 * (0.45 * u + 0.55 * u * u * u);
          it.mv.setAttribute('orientation', '0deg 0deg ' + th.toFixed(2) + 'deg');
        });
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };
    document.head.appendChild(s);
  }
  if (document.readyState === 'complete') setTimeout(load3d, 300);
  else addEventListener('load', function(){ setTimeout(load3d, 300); });
})();

// 19.11: фото и видео открываются крупно по нажатию (в любом браузере); долгое нажатие, правая кнопка и перетаскивание фото/видео выключены
(function(){
  var SKIP = '.ba, header, footer, .logo, .menu, .brand, a, button, .no-lb';
  function ok(m){ return !m.closest(SKIP) && m.closest('main, section, .wrap'); }
  function src(m){
    if (m.tagName === 'IMG') return m.currentSrc || m.src;
    var s = m.querySelector('source'); return (s && s.src) || m.currentSrc || m.src;
  }
  var GROUP = '.klient, .gallery, .duo, .strip, .vids, .ryady, .ryad, .tk, .pair, .trio, .kvadro';
  var box, stage, list = [], cur = 0, sx = null;
  function build(){
    box = document.createElement('div'); box.className = 'lb'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Просмотр');
    box.innerHTML = '<div class="lb-st"></div><button class="lb-x" aria-label="Закрыть">×</button><button class="lb-p" aria-label="Назад">‹</button><button class="lb-n" aria-label="Дальше">›</button>';
    document.body.appendChild(box); stage = box.querySelector('.lb-st');
    box.addEventListener('click', function(e){
      if (e.target.closest('.lb-p')) return go(-1);
      if (e.target.closest('.lb-n')) return go(1);
      if (e.target.closest('.lb-x') || e.target === box || e.target === stage) close();
    });
    box.addEventListener('touchstart', function(e){ sx = e.touches[0].clientX; }, {passive: true});
    box.addEventListener('touchend', function(e){ if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); });
    box.addEventListener('contextmenu', function(e){ e.preventDefault(); });
  }
  function show(){
    var m = list[cur], el;
    if (m.tagName === 'IMG'){ el = new Image(); el.src = src(m); el.alt = m.alt || ''; }
    else { el = document.createElement('video'); el.src = src(m); el.muted = true; el.loop = true; el.autoplay = true; el.playsInline = true;
      el.setAttribute('playsinline', ''); el.setAttribute('disablepictureinpicture', ''); el.setAttribute('controlslist', 'nodownload noplaybackrate');
      if (m.poster) el.poster = m.poster; }
    el.draggable = false;
    stage.innerHTML = ''; stage.appendChild(el);
    if (el.play){ var p = el.play(); if (p && p.catch) p.catch(function(){}); }
    box.classList.toggle('one', list.length < 2);
  }
  function go(d){ cur = (cur + d + list.length) % list.length; show(); }
  function open(m){
    if (!box) build();
    var g = m.closest(GROUP);
    list = g ? [].slice.call(g.querySelectorAll('img, video')).filter(ok) : [m];
    cur = Math.max(0, list.indexOf(m));
    show(); box.classList.add('on'); document.documentElement.classList.add('lb-open');
  }
  function close(){ box.classList.remove('on'); stage.innerHTML = ''; document.documentElement.classList.remove('lb-open'); }
  document.addEventListener('keydown', function(e){
    if (!box || !box.classList.contains('on')) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1);
  });
  document.addEventListener('click', function(e){
    var m = e.target.closest('img, video');
    if (!m || (box && box.contains(m)) || !ok(m)) return;
    e.preventDefault(); open(m);
  });
  // защита от скачивания: без меню «Сохранить», без перетаскивания
  document.addEventListener('contextmenu', function(e){ if (e.target.closest('img, video')) e.preventDefault(); });
  document.addEventListener('dragstart', function(e){ if (e.target.closest('img, video')) e.preventDefault(); });
  document.querySelectorAll('img, video').forEach(function(m){ m.draggable = false; if (ok(m)) m.classList.add('lb-can'); });
})();
