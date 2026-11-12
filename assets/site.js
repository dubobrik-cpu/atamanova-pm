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
