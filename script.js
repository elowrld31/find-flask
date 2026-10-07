/* ==========================================================
   Find Flask — script principal
   - Animations d'apparition de la page
   - Gourde 3D modélisée en code avec Three.js (vendor/three-bundle.js)
   - Boutons de détails, repères, galerie générée depuis la 3D
   ========================================================== */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Page : en-tête et apparitions ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); revealObs.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { revealObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Contenu des détails produit ---------- */
  var FEATURES = {
    locate: {
      num: '01',
      title: 'Toujours à portée de main.',
      text: 'Oubliée au bureau, à la salle ou dans le train ? Votre téléphone vous montre où elle est restée.'
    },
    speaker: {
      num: '02',
      title: 'Elle vous répond.',
      text: 'Un haut-parleur intégré au bouchon la fait sonner. Vous la retrouvez à l\'oreille, même sous un tas de vestes.'
    },
    battery: {
      num: '03',
      title: 'Un an, sans y penser.',
      text: 'Une batterie qui tient un an. Pas de recharge chaque semaine, pas de câble de plus dans le sac.'
    },
    origin: {
      num: '04',
      title: 'Fabriquée en France.',
      text: 'En aluminium recyclé : une matière qui a déjà eu une première vie, façonnée en France.'
    }
  };

  var THREE = window.THREE;
  var stage = document.getElementById('stage');
  var canvas = document.getElementById('flask-canvas');
  if (!THREE || !stage) { showFallback(); return; }

  function showFallback() {
    var fb = document.getElementById('fallback');
    if (fb) fb.hidden = false;
  }

  /* ---------- Rendu ---------- */
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  } catch (err) {
    showFallback();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping || THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;

  var keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
  keyLight.position.set(4, 7, 6);
  scene.add(keyLight);
  var rimLight = new THREE.DirectionalLight(0xdfe6ff, 0.6);
  rimLight.position.set(-5, 3, -4);
  scene.add(rimLight);

  var camera = new THREE.PerspectiveCamera(28, 1, 0.05, 100);

  var controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.rotateSpeed = 0.8;
  controls.autoRotate = !reduceMotion;
  controls.autoRotateSpeed = 0.9;

  /* ---------- Matériaux ---------- */
  var enamel = new THREE.MeshPhysicalMaterial({
    color: 0xfafafa, roughness: 0.3, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.06
  });
  var capMat = new THREE.MeshPhysicalMaterial({
    color: 0x17181c, roughness: 0.42, metalness: 0.0, clearcoat: 0.35, clearcoatRoughness: 0.3
  });
  var metal = new THREE.MeshStandardMaterial({ color: 0xd8dbe1, metalness: 1.0, roughness: 0.22 });

  var flask = new THREE.Group();
  scene.add(flask);

  /* ---------- Corps : profil tourné ---------- */
  var BODY_R = 1.0;
  function bodyProfile() {
    var pts = [];
    var i, t;
    pts.push(new THREE.Vector2(0.0001, 0));
    pts.push(new THREE.Vector2(0.84, 0));
    // arrondi du pied
    for (i = 1; i <= 8; i++) {
      t = (i / 8) * Math.PI / 2;
      pts.push(new THREE.Vector2(0.84 + 0.16 * Math.sin(t), 0.16 - 0.16 * Math.cos(t)));
    }
    pts.push(new THREE.Vector2(BODY_R, 3.05));
    // épaule (courbe de Bézier)
    var p0 = [1.0, 3.05], c1 = [1.0, 3.42], c2 = [0.56, 3.55], p3 = [0.56, 3.85];
    for (i = 1; i <= 24; i++) {
      t = i / 24;
      var u = 1 - t;
      pts.push(new THREE.Vector2(
        u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p3[1]
      ));
    }
    pts.push(new THREE.Vector2(0.56, 3.95));
    pts.push(new THREE.Vector2(0.0001, 3.95));
    return pts;
  }
  var body = new THREE.Mesh(new THREE.LatheGeometry(bodyProfile(), 128), enamel);
  flask.add(body);

  /* ---------- Bouchon ---------- */
  var CAP_R = 0.62, CAP_Y0 = 3.84, CAP_Y1 = 4.18, CAP_TOP = 4.3;
  var capPts = [new THREE.Vector2(0.0001, CAP_Y0), new THREE.Vector2(CAP_R - 0.02, CAP_Y0),
    new THREE.Vector2(CAP_R, CAP_Y0 + 0.02), new THREE.Vector2(CAP_R, CAP_Y1)];
  for (var k = 1; k <= 10; k++) {
    var a = (k / 10) * Math.PI / 2;
    capPts.push(new THREE.Vector2(CAP_R - 0.1 + 0.1 * Math.cos(a) - (k / 10) * 0.02, CAP_Y1 + (CAP_TOP - CAP_Y1) * Math.sin(a)));
  }
  capPts.push(new THREE.Vector2(0.0001, CAP_TOP));
  var cap = new THREE.Mesh(new THREE.LatheGeometry(capPts, 96), capMat);
  flask.add(cap);

  // fines nervures en bas du bouchon
  for (var g = 0; g < 2; g++) {
    var groove = new THREE.Mesh(new THREE.TorusGeometry(CAP_R + 0.001, 0.008, 6, 96), new THREE.MeshStandardMaterial({ color: 0x0b0c0f, roughness: 0.6 }));
    groove.rotation.x = Math.PI / 2;
    groove.position.y = CAP_Y0 + 0.06 + g * 0.04;
    flask.add(groove);
  }

  // anse du bouchon
  var LOOP_R = 0.26, LOOP_Y = 4.5;
  var loop = new THREE.Mesh(new THREE.TorusGeometry(LOOP_R, 0.085, 24, 64), capMat);
  loop.position.y = LOOP_Y;
  flask.add(loop);

  // anneau brisé, accroché en bas à droite de l'anse
  var ringAngle = -Math.PI / 6;
  var ringP = new THREE.Vector3(LOOP_R * Math.cos(ringAngle), LOOP_Y + LOOP_R * Math.sin(ringAngle), 0);
  var ringTangent = new THREE.Vector3(-Math.sin(ringAngle), Math.cos(ringAngle), 0).normalize();
  var ringNormal = new THREE.Vector3(Math.cos(ringAngle), Math.sin(ringAngle), 0);
  var SPLIT_R = 0.16;
  var splitRing = new THREE.Mesh(new THREE.TorusGeometry(SPLIT_R, 0.022, 12, 48), metal);
  splitRing.position.copy(ringP).addScaledVector(ringNormal, SPLIT_R - 0.02);
  splitRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ringTangent);
  flask.add(splitRing);

  // mousqueton (forme en D)
  var carPts = [
    [0, 0.02], [-0.02, -0.3], [-0.02, -0.7], [0.02, -1.0], [0.17, -1.12], [0.36, -1.02],
    [0.43, -0.75], [0.4, -0.35], [0.3, -0.08], [0.14, 0.06]
  ].map(function (p) { return new THREE.Vector3(p[0], p[1], 0); });
  var carCurve = new THREE.CatmullRomCurve3(carPts, true, 'centripetal');
  var carabiner = new THREE.Mesh(new THREE.TubeGeometry(carCurve, 160, 0.034, 12, true), metal);
  var carGroup = new THREE.Group();
  carGroup.add(carabiner);
  var hangTop = splitRing.position.clone().addScaledVector(ringNormal, SPLIT_R);
  carGroup.position.copy(hangTop);
  carGroup.rotation.z = THREE.MathUtils.degToRad(28);
  flask.add(carGroup);

  /* ---------- Décors appliqués sur une portion de cylindre ---------- */
  function wrapDecal(texture, radius, height, arc, centerY, centerTheta) {
    var geo = new THREE.CylinderGeometry(radius, radius, height, 48, 1, true, centerTheta - arc / 2, arc);
    var mat = new THREE.MeshStandardMaterial({
      map: texture, transparent: true, roughness: 0.35, metalness: 0.0,
      polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false
    });
    var m = new THREE.Mesh(geo, mat);
    m.position.y = centerY;
    return m;
  }

  function canvasTexture(w, h, draw) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }

  // grille du haut-parleur sur l'avant du bouchon
  var grilleTex = canvasTexture(256, 128, function (ctx, w, h) {
    ctx.fillStyle = '#9097a3';
    var cols = 9, rows = 4, r = 5.5;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols - (y % 2); x++) {
        var cx = w / 2 + (x - (cols - 1 - (y % 2)) / 2) * 24;
        var cy = h / 2 + (y - (rows - 1) / 2) * 22;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      }
    }
  });
  flask.add(wrapDecal(grilleTex, CAP_R + 0.002, 0.2, 0.75, (CAP_Y0 + CAP_Y1) / 2 + 0.02, 0));

  // témoin de batterie (petite LED corail en bas de l'avant)
  var ledMat = new THREE.MeshStandardMaterial({ color: 0xee425d, emissive: 0xee425d, emissiveIntensity: 0.6, roughness: 0.3 });
  var led = new THREE.Mesh(new THREE.SphereGeometry(0.028, 20, 12), ledMat);
  led.scale.z = 0.4;
  led.position.set(0, 0.42, BODY_R + 0.002);
  flask.add(led);

  // monogramme ff imprimé sur la face avant
  var logoImg = new Image();
  var logoReady = new Promise(function (resolve) {
    logoImg.onload = resolve;
    logoImg.onerror = resolve;
  });
  logoImg.src = window.FF_LOGO_DATA || 'assets/logo-ff.png';
  var logoTex = new THREE.Texture(logoImg);
  logoTex.colorSpace = THREE.SRGBColorSpace;
  logoTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  logoReady.then(function () { logoTex.needsUpdate = true; requestRender(); });
  var LOGO_H = 0.95, LOGO_ASPECT = 296 / 316;
  flask.add(wrapDecal(logoTex, BODY_R + 0.003, LOGO_H, (LOGO_H * LOGO_ASPECT) / BODY_R, 1.95, 0));

  // gravure sous la gourde (aluminium brossé)
  var baseCanvas = document.createElement('canvas');
  baseCanvas.width = baseCanvas.height = 1024;
  var baseTex = new THREE.CanvasTexture(baseCanvas);
  baseTex.colorSpace = THREE.SRGBColorSpace;
  function drawBase() {
    var ctx = baseCanvas.getContext('2d');
    var s = 1024, c = s / 2;
    var grad = ctx.createRadialGradient(c, c, 0, c, c, c);
    grad.addColorStop(0, '#d9dce2'); grad.addColorStop(1, '#b9bec8');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, s, s);
    // brossage circulaire
    ctx.globalAlpha = 0.07;
    for (var r = 8; r < c; r += 3) {
      ctx.strokeStyle = (r % 2) ? '#ffffff' : '#7d8390';
      ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // texte circulaire
    var txt = 'FABRIQUÉE EN FRANCE  •  ALUMINIUM RECYCLÉ  •  FIND FLASK  •  ';
    ctx.fillStyle = '#4a5061';
    ctx.font = '600 38px system-ui, -apple-system, "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var radius = 400, step = (Math.PI * 2) / txt.length;
    for (var i = 0; i < txt.length; i++) {
      var ang = i * step - Math.PI / 2;
      ctx.save();
      ctx.translate(c + radius * Math.cos(ang), c + radius * Math.sin(ang));
      ctx.rotate(ang + Math.PI / 2);
      ctx.fillText(txt[i], 0, 0);
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(74,80,97,.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(c, c, 340, 0, Math.PI * 2); ctx.stroke();
    if (logoImg.complete && logoImg.naturalWidth) {
      ctx.globalAlpha = 0.85;
      var lw = 260, lh = lw * logoImg.naturalHeight / logoImg.naturalWidth;
      ctx.drawImage(logoImg, c - lw / 2, c - lh / 2, lw, lh);
      ctx.globalAlpha = 1;
    }
    baseTex.needsUpdate = true;
  }
  drawBase();
  logoReady.then(function () { drawBase(); requestRender(); });
  var baseDisc = new THREE.Mesh(new THREE.CircleGeometry(0.86, 96),
    new THREE.MeshStandardMaterial({ map: baseTex, metalness: 0.6, roughness: 0.35, polygonOffset: true, polygonOffsetFactor: -2 }));
  baseDisc.rotation.x = Math.PI / 2;
  baseDisc.position.y = -0.001;
  flask.add(baseDisc);

  // ombre de contact
  var shadowTex = canvasTexture(256, 256, function (ctx, w) {
    var gr = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    gr.addColorStop(0, 'rgba(25,41,90,0.35)');
    gr.addColorStop(0.45, 'rgba(25,41,90,0.12)');
    gr.addColorStop(1, 'rgba(25,41,90,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, w);
  });
  var shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false });
  var shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.02;
  scene.add(shadow);

  /* ---------- Ondes (localisation / son) ---------- */
  var waves = [];
  var waveGroup = new THREE.Group();
  for (var wv = 0; wv < 3; wv++) {
    var wm = new THREE.Mesh(new THREE.TorusGeometry(1, 0.01, 8, 128),
      new THREE.MeshBasicMaterial({ color: 0xee425d, transparent: true, opacity: 0, depthWrite: false }));
    wm.rotation.x = Math.PI / 2;
    waveGroup.add(wm);
    waves.push(wm);
  }
  scene.add(waveGroup);
  var waveCfg = null; // {y, r0, r1}

  /* ---------- Repères (positions sur la gourde) ---------- */
  var ANCHORS = {
    speaker: { pos: new THREE.Vector3(0, (CAP_Y0 + CAP_Y1) / 2 + 0.02, CAP_R), normal: new THREE.Vector3(0, 0, 1) },
    locate: { pos: new THREE.Vector3(-Math.sin(0.68) * BODY_R, 1.95, Math.cos(0.68) * BODY_R), normal: new THREE.Vector3(-Math.sin(0.68), 0, Math.cos(0.68)) },
    battery: { pos: new THREE.Vector3(0, 0.42, BODY_R), normal: new THREE.Vector3(0, 0, 1) },
    origin: { pos: new THREE.Vector3(0.42, 0, 0.42), normal: new THREE.Vector3(0, -1, 0) }
  };
  var markersEl = document.getElementById('markers');
  var markerEls = {};
  Object.keys(ANCHORS).forEach(function (key) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'marker';
    b.textContent = String(Number(FEATURES[key].num));
    b.tabIndex = -1;
    b.addEventListener('click', function () { selectFeature(key); });
    markersEl.appendChild(b);
    markerEls[key] = b;
  });

  /* ---------- Vues de caméra ----------
     frame = hauteur et largeur (en unités de la scène) à faire tenir dans le cadre.
     lift  = décalage de la cible vers le bas, pour laisser la place au panneau de texte. */
  var VIEWS = {
    overview: { target: [0, 2.35, 0], dir: [0.4, 0.14, 1], frame: [5.4, 2.9], lift: 0 },
    locate: { target: [0, 1.95, 0], dir: [0, 0.08, 1], frame: [3.4, 3.4], lift: 0.16 },
    speaker: { target: [0.1, 4.08, 0], dir: [0.35, 0.3, 1], frame: [1.7, 2.1], lift: 0.16 },
    battery: { target: [0, 0.5, 0], dir: [0.22, 0.3, 1], frame: [2.2, 2.6], lift: 0.16 },
    origin: { target: [0, 0.1, 0], dir: [0.12, -1, 0.42], frame: [2.5, 2.5], lift: 0.14 },
    threeQuarter: { target: [0, 2.35, 0], dir: [1, 0.3, 0.7], frame: [5.4, 2.9], lift: 0 },
    carabiner: { target: [0.35, 3.85, 0], dir: [1, 0.25, 0.35], frame: [2.4, 2.4], lift: 0 }
  };
  function distanceFor(v, fovDeg, aspect) {
    var t = Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2);
    return Math.max((v.frame[0] / 2) / t, (v.frame[1] / 2) / (t * aspect)) * 1.06;
  }
  function fitDistance() { return distanceFor(VIEWS.overview, camera.fov, camera.aspect); }
  function poseFor(name, fovDeg, aspect, withLift) {
    var v = VIEWS[name];
    var target = new THREE.Vector3().fromArray(v.target);
    if (withLift) target.y -= v.frame[0] * v.lift;
    var dir = new THREE.Vector3().fromArray(v.dir).normalize();
    var pos = target.clone().addScaledVector(dir, distanceFor(v, fovDeg, aspect));
    return { pos: pos, target: target };
  }
  function viewPose(name) { return poseFor(name, camera.fov, camera.aspect, true); }

  var tween = null;
  function flyTo(name, instant) {
    var pose = viewPose(name);
    if (instant || reduceMotion) {
      camera.position.copy(pose.pos);
      controls.target.copy(pose.target);
      tween = null;
      requestRender();
      return;
    }
    tween = {
      fromPos: camera.position.clone(), fromTarget: controls.target.clone(),
      toPos: pose.pos, toTarget: pose.target, start: performance.now(), dur: 1100
    };
    requestRender();
  }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ---------- Sélection d'un détail ---------- */
  var active = null;
  var panel = document.getElementById('panel');
  var featureBtns = document.querySelectorAll('.feature');
  var hint = document.getElementById('hint');

  function selectFeature(key) {
    if (active === key) { clearFeature(); return; }
    active = key;
    controls.autoRotate = false;
    hint.classList.add('is-hidden');
    featureBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.feature === key)); });
    Object.keys(markerEls).forEach(function (k) { markerEls[k].classList.toggle('is-active', k === key); });
    var f = FEATURES[key];
    document.getElementById('panel-num').textContent = f.num;
    document.getElementById('panel-title').textContent = f.title;
    document.getElementById('panel-text').textContent = f.text;
    panel.classList.add('is-open');
    waveCfg = key === 'locate' ? { y: 1.95, r0: 1.04, r1: 2.1 }
      : key === 'speaker' ? { y: (CAP_Y0 + CAP_Y1) / 2, r0: 0.66, r1: 1.35 } : null;
    flyTo(key);
  }

  function clearFeature() {
    active = null;
    waveCfg = null;
    featureBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    Object.keys(markerEls).forEach(function (k) { markerEls[k].classList.remove('is-active'); });
    panel.classList.remove('is-open');
    controls.autoRotate = !reduceMotion;
    flyTo('overview');
  }

  featureBtns.forEach(function (b) {
    b.addEventListener('click', function () { selectFeature(b.dataset.feature); });
  });
  document.getElementById('reset-view').addEventListener('click', clearFeature);

  controls.addEventListener('start', function () {
    tween = null;
    controls.autoRotate = false;
    hint.classList.add('is-hidden');
  });
  controls.addEventListener('change', requestRender);

  /* ---------- Taille ---------- */
  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    controls.minDistance = fitDistance() * 0.28;
    controls.maxDistance = fitDistance() * 1.6;
    requestRender();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize);
  resize();
  flyTo('overview', true);
  controls.update();

  /* ---------- Boucle d'animation ---------- */
  var visible = true;
  var running = false;
  var tmpV = new THREE.Vector3(), tmpN = new THREE.Vector3(), camDir = new THREE.Vector3();

  function updateMarkers() {
    var w = stage.clientWidth, h = stage.clientHeight;
    Object.keys(ANCHORS).forEach(function (key) {
      var an = ANCHORS[key];
      tmpV.copy(an.pos);
      flask.localToWorld(tmpV);
      camDir.copy(camera.position).sub(tmpV).normalize();
      tmpN.copy(an.normal);
      var facing = tmpN.dot(camDir) > 0.15;
      tmpV.project(camera);
      var x = (tmpV.x * 0.5 + 0.5) * w, y = (-tmpV.y * 0.5 + 0.5) * h;
      var inView = tmpV.z < 1 && x > 16 && x < w - 16 && y > 16 && y < h - 16;
      var el = markerEls[key];
      el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      el.classList.toggle('is-visible', facing && inView && (!active || active === key));
    });
  }

  function frame() {
    if (!visible) { running = false; return; }
    var now = performance.now();
    var time = now / 1000;

    if (tween) {
      var tt = Math.min(1, (now - tween.start) / tween.dur);
      var e = ease(tt);
      camera.position.lerpVectors(tween.fromPos, tween.toPos, e);
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, e);
      if (tt >= 1) tween = null;
    }
    controls.update();

    // ombre masquée quand on regarde par-dessous
    var below = THREE.MathUtils.clamp((camera.position.y + 0.2) / 1.2, 0, 1);
    shadowMat.opacity = below;
    shadow.visible = below > 0.01;

    // ondes
    waves.forEach(function (w, i) {
      if (!waveCfg || reduceMotion) { w.material.opacity = 0; return; }
      var p = ((time * 0.5) + i / waves.length) % 1;
      var r = THREE.MathUtils.lerp(waveCfg.r0, waveCfg.r1, p);
      w.position.y = waveCfg.y;
      w.scale.setScalar(r);
      w.material.opacity = (1 - p) * 0.75;
    });

    // LED
    ledMat.emissiveIntensity = active === 'battery'
      ? 1.2 + Math.sin(time * 4) * 0.8
      : 0.6;

    renderer.render(scene, camera);
    updateMarkers();
    requestAnimationFrame(frame);
  }

  function requestRender() {
    if (!running && visible) {
      running = true;
      requestAnimationFrame(frame);
    }
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting && !document.hidden;
      if (visible) requestRender();
    }, { threshold: 0 }).observe(stage);
  }
  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden;
    if (visible) requestRender();
  });
  requestRender();

  /* ---------- Galerie générée depuis le modèle 3D ---------- */
  var SHOTS = [
    { view: 'overview', label: 'Vue d\'ensemble', bg: ['#ffffff', '#e9ecf2'] },
    { view: 'threeQuarter', label: 'Trois quarts', bg: ['#fdf1f3', '#f6d9de'] },
    { view: 'carabiner', label: 'Bouchon et mousqueton', bg: ['#eef1f8', '#d9dfee'] },
    { view: 'origin', label: 'Gravure du fond', bg: ['#f4f5f8', '#dfe2e9'] }
  ];
  var galleryGrid = document.getElementById('gallery-grid');

  function renderShot(viewName, w, h) {
    var shotCam = new THREE.PerspectiveCamera(camera.fov, w / h, 0.05, 100);
    var pose = poseFor(viewName, shotCam.fov, shotCam.aspect, false);
    shotCam.position.copy(pose.pos);
    var target = pose.target;
    shotCam.lookAt(target);
    shadowMat.opacity = THREE.MathUtils.clamp((shotCam.position.y + 0.2) / 1.2, 0, 1);
    shadow.visible = shadowMat.opacity > 0.01;
    waves.forEach(function (wm) { wm.material.opacity = 0; });

    var prevPR = renderer.getPixelRatio();
    var size = renderer.getSize(new THREE.Vector2());
    renderer.setPixelRatio(1);
    renderer.setSize(w, h, false);
    renderer.render(scene, shotCam);
    var url = renderer.domElement.toDataURL('image/png');
    renderer.setPixelRatio(prevPR);
    renderer.setSize(size.x, size.y, false);
    requestRender();
    return url;
  }

  logoReady.then(function () {
    // laisse le temps aux textures d'être envoyées au GPU
    requestAnimationFrame(function () {
      SHOTS.forEach(function (s) {
        var fig = document.createElement('figure');
        fig.className = 'shot reveal';
        fig.setAttribute('role', 'button');
        fig.tabIndex = 0;
        fig.setAttribute('aria-label', s.label + ' : voir dans le modèle 3D');
        fig.style.background = 'linear-gradient(160deg,' + s.bg[0] + ',' + s.bg[1] + ')';
        var img = document.createElement('img');
        img.alt = 'Gourde Find Flask, ' + s.label.toLowerCase();
        img.width = 600; img.height = 800;
        img.src = renderShot(s.view, 600, 800);
        var cap = document.createElement('figcaption');
        cap.textContent = s.label;
        fig.appendChild(img);
        fig.appendChild(cap);
        function go() {
          clearActiveOnly();
          stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
          setTimeout(function () { flyTo(s.view); }, reduceMotion ? 0 : 450);
        }
        fig.addEventListener('click', go);
        fig.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); }
        });
        galleryGrid.appendChild(fig);
        if (reduceMotion || !('IntersectionObserver' in window)) fig.classList.add('is-in');
        else revealObs.observe(fig);
      });
    });
  });

  function clearActiveOnly() {
    active = null;
    waveCfg = null;
    featureBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    Object.keys(markerEls).forEach(function (k) { markerEls[k].classList.remove('is-active'); });
    panel.classList.remove('is-open');
    controls.autoRotate = false;
    hint.classList.add('is-hidden');
  }
})();
