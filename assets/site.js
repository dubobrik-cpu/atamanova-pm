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
