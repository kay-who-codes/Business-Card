(function(){

  // ---------- Flip + tilt ----------
  var scene = document.getElementById('scene');
  var tilt = document.getElementById('tilt');
  var card = document.getElementById('card');

  function toggleFlip(){
    var flipped = scene.classList.toggle('flipped');
    scene.setAttribute('aria-pressed', flipped ? 'true' : 'false');
  }

  scene.addEventListener('click', function(e){
    // Don't flip when interacting with buttons/links on the card
    if (e.target.closest('button, a')) return;
    toggleFlip();
  });

  scene.addEventListener('keydown', function(e){
    if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button, a')){
      e.preventDefault();
      toggleFlip();
    }
  });

  var hasFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (hasFinePointer && !reduceMotion){
    var maxTilt = 9;   // degrees
    var lift = 18;     // px translateZ on hover

    scene.addEventListener('mousemove', function(e){
      var rect = scene.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width;   // 0..1
      var py = (e.clientY - rect.top) / rect.height;    // 0..1
      var rotY = (px - 0.5) * 2 * maxTilt;
      var rotX = (0.5 - py) * 2 * maxTilt;
      tilt.style.transition = 'transform 0.08s linear';
      tilt.style.transform = 'rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg) translateZ(' + lift + 'px)';
    });

    scene.addEventListener('mouseleave', function(){
      tilt.style.transition = 'transform 0.5s cubic-bezier(.22,.85,.32,1)';
      tilt.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0px)';
    });
  }

  // ---------- Toast ----------
  var toast = document.getElementById('toast');
  var toastTimer;
  function showToast(msg){
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 1800);
  }

  // ---------- Copy to clipboard ----------
  document.querySelectorAll('.copy-btn').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var value = btn.getAttribute('data-copy');
      var done = function(){
        btn.classList.add('copied');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        showToast('Copied "' + value + '"');
        setTimeout(function(){
          btn.classList.remove('copied');
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(value).then(done).catch(function(){
          fallbackCopy(value); done();
        });
      } else {
        fallbackCopy(value); done();
      }
    });
  });

  function fallbackCopy(text){
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch(err) {}
    document.body.removeChild(ta);
  }

  // ---------- vCard download ----------
  var CONTACT = {
    firstName: 'Kay',
    lastName: '',
    fullName: '',
    title: 'Producer',
    email: 'kaywhocreates@gmail.com',
    phone: '07123 456 789',
    url: 'https://linktr.ee/kaywhocreates',
    city: 'Hamilton, Glasgow',
    country: 'United Kingdom'
  };

  function buildVCard(c){
    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:' + c.lastName + ';' + c.firstName + ';;;',
      'FN:' + c.fullName,
      'TITLE:' + c.title,
      'TEL;TYPE=CELL:' + c.phone,
      'EMAIL:' + c.email,
      'URL:' + c.url,
      'ADR;TYPE=WORK:;;;' + c.city + ';;;' + c.country,
      'END:VCARD',
      ''
    ].join('\r\n');
  }

  var saveBtn = document.getElementById('saveContact');
  saveBtn.addEventListener('click', function(e){
    e.stopPropagation();
    var vcf = buildVCard(CONTACT);
    var blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = CONTACT.fullName.toLowerCase().replace(/\s+/g, '-') + '.vcf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);

    saveBtn.classList.add('saved');
    var original = saveBtn.innerHTML;
    saveBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Saved';
    showToast('Contact card downloaded');
    setTimeout(function(){
      saveBtn.classList.remove('saved');
      saveBtn.innerHTML = original;
    }, 1800);
  });

  // ---------- QR code (client-side, no external image/service) ----------
  (function renderQR(){
    var wrap = document.getElementById('qrWrap');
    if (typeof qrcode !== 'function' || !wrap) return;
    try{
      var qr = qrcode(0, 'M'); // typeNumber 0 = auto-detect smallest size
      qr.addData(CONTACT.url);
      qr.make();
      var svg = qr.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
      // Recolor to match the card's palette (white module bg, ink-dark modules)
      svg = svg.replace('fill="white"', 'fill="#ffffff"').replace('fill="black"', 'fill="#131313"');
      wrap.innerHTML = svg;
    } catch(err){
      wrap.style.display = 'none';
    }
  })();

})();
