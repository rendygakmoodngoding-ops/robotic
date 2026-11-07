/* ============================================================
   BENTUK — Robotic Brand & 3D Studio
   Main interaction + Three.js scene
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  var body = document.body;
  var W = innerWidth, H = innerHeight;
  var glReady = false;

  /* ---------- Loader ---------- */
  var loader = $('#loader'), ldn = $('#ldn'), curtain = $('#curtain'), revealed = false;

  function reveal() {
    if (revealed) return;
    revealed = true;
    loader.classList.add('out');
    setTimeout(function () {
      curtain.classList.add('go');
      body.classList.add('ready');
      glReady = true;
    }, reduce ? 0 : 380);
    setTimeout(function () {
      loader.remove();
      curtain.remove();
    }, 2200);
  }

  if (reduce) {
    ldn.textContent = '100';
    reveal();
  } else {
    var t0 = performance.now(), dur = 2200, fontsOK = false;
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
      fontsOK = true;
    });
    (function tick(now) {
      var p = clamp((now - t0) / dur, 0, 1);
      var e = 1 - Math.pow(1 - p, 2.2);
      var v = Math.round(e * 100);
      if (!fontsOK && v > 96) v = 96;
      ldn.textContent = v;
      if (v >= 100) reveal();
      else requestAnimationFrame(tick);
    })(t0);
    setTimeout(reveal, 7000);
  }

  /* ---------- Marquee clones ---------- */
  $$('.mq-track').forEach(function (t) {
    t.innerHTML += t.innerHTML;
  });

  /* ---------- Manifesto words ---------- */
  var mani = $('#manifesto'), mt = $('#maniText');
  mt.innerHTML = mt.textContent.trim().split(/\s+/).map(function (w) {
    return '<span class="w">' + w + '</span>';
  }).join(' ');
  var words = $$('.w', mt), lit = -1;

  /* ---------- Cases pin ---------- */
  var cases = $('#work'), track = $('#track'), countEl = $('#count'), caseCards = $$('.case');
  var maxShift = 0, lastCase = -1;

  function sizeCases() {
    var cs = getComputedStyle(track);
    var pr = parseFloat(cs.paddingRight) || 0;
    maxShift = Math.max(0, track.scrollWidth - W);
    cases.style.height = (H + maxShift * 1.15 + pr * 0) + 'px';
  }

  /* ---------- Process ---------- */
  var proc = $('#studio'), stepEls = $$('#steps li'), stageName = $('#stageName');
  var step = -1, names = ['Kenalan', 'Rakit', 'Kompetisi'];

  /* ---------- Services hover ---------- */
  var cardEls = $$('.card'), hoverCard = -1;
  cardEls.forEach(function (c, i) {
    c.addEventListener('pointerenter', function () { hoverCard = i; });
    c.addEventListener('pointerleave', function () { hoverCard = -1; });
    c.addEventListener('focus', function () { hoverCard = i; });
    c.addEventListener('blur', function () { hoverCard = -1; });
  });

  /* ---------- Counters ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target, to = +el.dataset.to, s = performance.now();
        (function f(n) {
          var p = clamp((n - s) / 1400, 0, 1);
          el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * to);
          if (p < 1) requestAnimationFrame(f);
        })(s);
      });
    }, { threshold: 0.5 });
    $$('.stats b').forEach(function (b) { io.observe(b); });
  } else {
    $$('.stats b').forEach(function (b) { b.textContent = b.dataset.to; });
  }

  /* ---------- Form (demo only) ---------- */
  $('#brief').addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = /.+@.+\..+/.test($('#f-mail').value.trim());
    $('#note').textContent = ok
      ? 'This is a demo form — nothing was sent. Connect it to your inbox before launch.'
      : 'Add a valid email so we know where to reply.';
  });

  /* ---------- Pointer / cursor ---------- */
  var cur = $('#cur'), curL = $('b', cur);
  var ptr = { x: -200, y: -200, nx: 0, ny: 0, seen: false };
  var cx = -200, cy = -200, domLabel = '', objLabel = '', inStage = false;
  var pdown = null, yawUser = 0, yawV = 0;

  function isUI(t) {
    return t && t.closest && t.closest('a,button,input,textarea,label,select,.card,.case');
  }

  addEventListener('pointermove', function (e) {
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    ptr.nx = (e.clientX / W) * 2 - 1;
    ptr.ny = -((e.clientY / H) * 2 - 1);
    ptr.seen = true;
    ptr.dirty = true;
    if (e.pointerType === 'mouse') {
      cur.classList.add('on');
      var d = e.target.closest && e.target.closest('[data-cursor]');
      domLabel = d ? d.dataset.cursor : '';
    }
    if (pdown) {
      var dx = e.clientX - pdown.lx;
      pdown.lx = e.clientX;
      if (Math.hypot(e.clientX - pdown.x0, e.clientY - pdown.y0) > 6) pdown.moved = true;
      if (pdown.drag && pdown.moved) {
        yawUser += dx * 0.012;
        yawV = dx * 0.012;
      }
    }
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', function () {
    cur.classList.remove('on');
  });

  addEventListener('pointerdown', function (e) {
    if (isUI(e.target)) return;
    pdown = {
      x0: e.clientX,
      y0: e.clientY,
      lx: e.clientX,
      moved: false,
      drag: e.pointerType === 'mouse' && inStage
    };
  });

  addEventListener('pointerup', function (e) {
    var p = pdown;
    pdown = null;
    if (p && !p.moved && GL.on) GL.poke(e.clientX, e.clientY);
  });

  addEventListener('pointercancel', function () { pdown = null; });

  $('#hint').textContent = fine ? 'Poke the units' : 'Tap the units';
  $('#hint2').textContent = fine ? 'Drag the units' : 'Tap the units';

  /* ---------- 3D ---------- */
  var GL = { on: false, state: 'hero', poke: function () {} };
  var CAM_Z = 10, FOV = 35, TILT = 0.34;
  var halfH = Math.tan(FOV * Math.PI / 360) * CAM_Z;
  var halfW = halfH * W / H;
  var R, scene, camera, light, raycaster, objs = [], byId = {}, meshes = [], ndc;

  var LOCAL = {
    pedestal: { p: [0, 0, 0], r: [0, 0, 0], s: 1 },
    arch: { p: [0, 0, -0.1], r: [0, 0, 0], s: 1 },
    stairs: { p: [0.75, 0, 0.95], r: [0, -0.5, 0], s: 1 },
    halfdisc: { p: [1.1, 0.15, -1], r: [0, -0.35, -0.28], s: 1 },
    torus: { p: [1.8, 0.55, 0.6], r: [1.25, 0.2, 0.5], s: 1 },
    bigSphere: { p: [0, 2.78, -0.1], r: [0, 0, 0], s: 1 },
    quarter: { p: [-1.55, 0, 0.85], r: [0, 0.45, 0], s: 1 },
    cone: { p: [0.05, 0, 1.7], r: [0, 0, 0], s: 1 },
    spCoral: { p: [-2.25, 1.6, 0.3], r: [0, 0, 0], s: 1 },
    spNavy: { p: [1.2, 0.3, 1.95], r: [0, 0, 0], s: 1 },
    spNavy2: { p: [2.45, 2.5, -0.8], r: [0, 0, 0], s: 1 },
    spWhite: { p: [2.65, 1.05, -0.1], r: [0, 0, 0], s: 1 },
    pyramid: { p: [-2.25, 2.7, -0.2], r: [0.3, 0.5, 0.4], s: 1 },
    ell: { p: [0, 0, 0], r: [0, 0, 0], s: 1, hide: true }
  };

  /* free layout per state: [fx, fy, z, scale, rx, ry, rz] */
  var FREE = {
    manifesto: {
      arch: [0.82, 0.58, 0, 0.5, 0.4, -0.6, 0.5],
      stairs: [0.86, -0.55, 0.4, 0.42, 0.3, 0.5, 0.2],
      halfdisc: [-0.86, -0.28, 0, 0.46, 0, 0.5, 0.8],
      torus: [-0.66, 0.74, 0.5, 0.5, 1, 0.3, 0.2],
      bigSphere: [0.2, 0.82, 0.8, 0.6, 0, 0, 0],
      quarter: [0.52, -0.8, 0.5, 0.55, 0.4, 0.2, 0.1],
      cone: [-0.4, -0.82, 0.4, 0.6, 0.2, 0, 0.5],
      spCoral: [-0.92, 0.38, 0.5, 1.5, 0, 0, 0],
      spNavy: [0.62, 0.1, -0.6, 1.6, 0, 0, 0],
      spNavy2: [-0.1, -0.66, 0.2, 1.4, 0, 0, 0],
      spWhite: [0.94, -0.1, 0.4, 1.8, 0, 0, 0],
      pyramid: [-0.5, 0.52, 0.6, 0.9, 0.3, 0.4, 0.2],
      ell: [0.46, 0.78, 0.2, 0.42, 0.3, 0.5, 0.2]
    }
  };

  var ANCHOR = { arch: 0, bigSphere: 1, torus: 2, ell: 3 };
  var PIVOT = { arch: 1.07, ell: 0.9 };
  var SIZE = { arch: 2.6, bigSphere: 1.3, torus: 1.7, ell: 2 };
  var STAGE_STATES = { hero: 'heroStage', process: 'procStage', contact: 'contactStage' };

  function col(hex) {
    return new THREE.Color(hex).convertSRGBToLinear();
  }

  function ground(g) {
    g.center();
    g.computeBoundingBox();
    g.translate(0, -g.boundingBox.min.y, 0);
    return g;
  }

  function ext(shape, depth, bev) {
    var g = new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: bev,
      bevelSize: bev,
      bevelSegments: 5,
      curveSegments: 56
    });
    return ground(g);
  }

  function buildGeos() {
    var G = {}, s, i, a, pts;
    /* pedestal */
    pts = [];
    pts.push(new THREE.Vector2(0, 0));
    for (i = 0; i <= 6; i++) {
      a = i / 6 * Math.PI / 2;
      pts.push(new THREE.Vector2(2.5 + Math.sin(a) * 0.1, -0.1 + Math.cos(a) * 0.1));
    }
    for (i = 0; i <= 6; i++) {
      a = i / 6 * Math.PI / 2;
      pts.push(new THREE.Vector2(2.6 - (1 - Math.cos(a)) * 0.1, -0.4 - Math.sin(a) * 0.1));
    }
    pts.push(new THREE.Vector2(0, -0.5));
    G.pedestal = new THREE.LatheGeometry(pts, 96);

    /* arch */
    s = new THREE.Shape();
    var RR = 1.25, r = 0.55, h = 0.9;
    s.moveTo(-RR, 0);
    s.lineTo(-RR, h);
    s.absarc(0, h, RR, Math.PI, 0, true);
    s.lineTo(RR, 0);
    s.lineTo(r, 0);
    s.lineTo(r, h);
    s.absarc(0, h, r, 0, Math.PI, false);
    s.lineTo(-r, 0);
    s.lineTo(-RR, 0);
    G.arch = ext(s, 0.9, 0.08);

    /* stairs */
    s = new THREE.Shape();
    [[0, 0], [2, 0], [2, 0.5], [1.5, 0.5], [1.5, 1], [1, 1], [1, 1.5], [0, 1.5]].forEach(function (p, i) {
      i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]);
    });
    G.stairs = ext(s, 1.1, 0.06);

    /* half disc */
    s = new THREE.Shape();
    s.moveTo(-1.3, 0);
    s.absarc(0, 0, 1.3, Math.PI, 0, true);
    s.lineTo(-1.3, 0);
    G.halfdisc = ext(s, 0.4, 0.07);

    G.torus = new THREE.TorusGeometry(0.6, 0.28, 40, 80);
    G.sphereBig = new THREE.SphereGeometry(0.62, 64, 48);

    /* quarter */
    s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(1.1, 0);
    s.absarc(0, 0, 1.1, 0, Math.PI / 2, false);
    s.lineTo(0, 0);
    G.quarter = ext(s, 0.9, 0.06);

    G.cone = ground(new THREE.ConeGeometry(0.45, 0.9, 64));
    G.pyramid = new THREE.ConeGeometry(0.34, 0.7, 3);

    /* L shape */
    s = new THREE.Shape();
    [[0, 0], [1.6, 0], [1.6, 0.5], [0.5, 0.5], [0.5, 1.8], [0, 1.8]].forEach(function (p, i) {
      i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]);
    });
    G.ell = ext(s, 0.55, 0.05);

    return G;
  }

  function initGL() {
    if (!window.THREE) return;
    try {
      R = new THREE.WebGLRenderer({
        canvas: $('#gl'),
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      R.setSize(W, H, false);
      R.outputEncoding = THREE.sRGBEncoding;
      R.shadowMap.enabled = true;
      R.shadowMap.type = THREE.PCFSoftShadowMap;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 80);
      camera.position.set(0, 0, CAM_Z);

      scene.add(new THREE.HemisphereLight(0xb0c4ff, 0x1a1a2e, 0.7));
      light = new THREE.DirectionalLight(0xffffff, 1.05);
      light.castShadow = true;
      light.shadow.mapSize.set(2048, 2048);
      var sc = light.shadow.camera;
      sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6;
      sc.near = 1; sc.far = 40;
      sc.updateProjectionMatrix();
      light.shadow.bias = -0.0006;
      light.shadow.radius = 4;
      scene.add(light);
      scene.add(light.target);

      raycaster = new THREE.Raycaster();
      ndc = new THREE.Vector2();

      var G = buildGeos();

      /* Robotic material palette:
         final colors lean metallic cyan / magenta / dark steel */
      var defs = [
        ['pedestal', G.pedestal, '#1a1e2e', '#2a3045', '#4a6cff', 0, 5.2],
        ['arch', G.arch, '#00c8e0', '#2a3045', '#4a6cff', 0, 2.6],
        ['stairs', G.stairs, '#0d1a4a', '#2a3045', '#4a6cff', 0, 2],
        ['halfdisc', G.halfdisc, '#f0e14a', '#2a3045', '#4a6cff', 0, 2.6],
        ['torus', G.torus, '#e8eaf2', '#2a3045', '#4a6cff', 0, 1.7],
        ['bigSphere', G.sphereBig, '#e8eaf2', '#2a3045', '#4a6cff', 0, 1.3],
        ['quarter', G.quarter, '#ff2d9b', '#2a3045', '#4a6cff', 0, 2.2],
        ['cone', G.cone, '#f0e14a', '#2a3045', '#4a6cff', 0, 0.9],
        ['spCoral', G.sphereBig, '#ff5c4d', '#2a3045', '#4a6cff', 1, 0.5],
        ['spNavy', G.sphereBig, '#0d1a4a', '#2a3045', '#4a6cff', 0, 0.6],
        ['spNavy2', G.sphereBig, '#0d1a4a', '#2a3045', '#4a6cff', 1, 0.45],
        ['spWhite', G.sphereBig, '#e8eaf2', '#2a3045', '#4a6cff', 1, 0.35],
        ['pyramid', G.pyramid, '#ff2d9b', '#2a3045', '#4a6cff', 1, 0.7],
        ['ell', G.ell, '#0a0c1a', '#2a3045', '#4a6cff', 0, 2]
      ];

      defs.forEach(function (d, i) {
        var id = d[0];
        var mat = new THREE.MeshStandardMaterial({
          color: col(d[2]),
          roughness: 0.42,
          metalness: 0.55
        });
        var mesh = new THREE.Mesh(d[1], mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.visible = false;

        var k0 = { spCoral: 0.26 / 0.62, spNavy: 0.3 / 0.62, spNavy2: 0.22 / 0.62, spWhite: 0.18 / 0.62 }[id] || 1;

        var o = {
          id: id,
          mesh: mesh,
          mat: mat,
          ord: i,
          float: !!d[5],
          phase: i * 1.7,
          k: k0,
          cFinal: col(d[2]),
          cClay: col(d[3]),
          cSketch: col(d[4]),
          cp: new THREE.Vector3(0, 0, 0),
          cq: new THREE.Quaternion(),
          cs: 0.001,
          od: new THREE.Vector3(),
          ov: new THREE.Vector3(),
          sd: 0,
          sv: 0,
          spin: 0,
          tp: new THREE.Vector3(),
          tq: new THREE.Quaternion(),
          ts: 0.001
        };
        mesh.userData.o = o;
        scene.add(mesh);
        objs.push(o);
        byId[id] = o;
        meshes.push(mesh);
      });

      GL.on = true;
    } catch (err) {
      console.warn('WebGL unavailable', err);
      GL.on = false;
      var c = $('#gl');
      if (c) c.style.display = 'none';
    }
  }

  initGL();

  var tmpV = new (window.THREE ? THREE.Vector3 : Object)();
  var tmpE = window.THREE ? new THREE.Euler() : null;
  var eq = window.THREE ? new THREE.Quaternion() : null;
  var stageQ = window.THREE ? new THREE.Quaternion() : null;
  var yawQ = window.THREE ? new THREE.Quaternion() : null;
  var tiltQ = window.THREE ? new THREE.Quaternion() : null;
  var axisY = window.THREE ? new THREE.Vector3(0, 1, 0) : null;
  var axisX = window.THREE ? new THREE.Vector3(1, 0, 0) : null;
  var stageO = window.THREE ? new THREE.Vector3() : null;
  var wpp = 1, stageS = 1;

  function pxToWorld(px, py, out) {
    out.set((px - W / 2) * wpp, -(py - H / 2) * wpp, 0);
    return out;
  }

  function poke(x, y) {
    if (!GL.on) return;
    ndc.set((x / W) * 2 - 1, -((y / H) * 2 - 1));
    raycaster.setFromCamera(ndc, camera);
    var vis = meshes.filter(function (m) { return m.visible && m.userData.o.cs > 0.25; });
    var hit = raycaster.intersectObjects(vis, false)[0];
    if (!hit) return;
    var o = hit.object.userData.o;
    o.sv = -3.6;
    o.ov.y += 2.3;
    tmpV.copy(o.cp).sub(hit.point);
    tmpV.z = 0;
    if (tmpV.length() > 0.001) {
      tmpV.normalize().multiplyScalar(1.5);
      o.ov.add(tmpV);
    }
  }
  GL.poke = poke;

  function hoverTest() {
    objLabel = '';
    if (!GL.on || !ptr.seen || !fine) return;
    if (pdown && pdown.moved) return;
    ndc.set(ptr.nx, ptr.ny);
    raycaster.setFromCamera(ndc, camera);
    var vis = meshes.filter(function (m) { return m.visible && m.userData.o.cs > 0.25; });
    if (vis.length && raycaster.intersectObjects(vis, false).length) objLabel = 'POKE';
  }

  var activeState = 'hero', stageEl = null;
  var heroEl = $('#heroStage'), procEl = $('#procStage'), contactEl = $('#contactStage');
  var anchors = $$('.card .anchor');
  var t = 0, last = performance.now();

  function updateGL(dt) {
    var st = activeState, i, o, k;
    var stageId = STAGE_STATES[st];
    stageEl = stageId ? $('#' + stageId) : null;
    var mode = st === 'process' ? step : 2;
    var fs = clamp(halfW / 6.5, 0.5, 1);

    if (stageEl) {
      var r = stageEl.getBoundingClientRect();
      pxToWorld(r.left + r.width / 2, r.top + r.height / 2, stageO);
      stageS = Math.max(0.05, Math.min(r.height * wpp / 4.7, r.width * wpp / 6.4));
      stageO.y -= stageS * 1.2;
      inStage = ptr.x > r.left - 20 && ptr.x < r.right + 20 && ptr.y > r.top - 20 && ptr.y < r.bottom + 20;
      yawV *= Math.pow(0.02, dt);
      if (!(pdown && pdown.moved)) {
        yawUser += yawV;
      }
      var yaw = Math.sin(t * 0.35) * (reduce ? 0 : 0.12) + ptr.nx * 0.22 + yawUser;
      yawQ.setFromAxisAngle(axisY, yaw);
      tiltQ.setFromAxisAngle(axisX, TILT + ptr.ny * 0.04);
      stageQ.copy(tiltQ).multiply(yawQ);
    } else {
      inStage = false;
    }

    for (i = 0; i < objs.length; i++) {
      o = objs[i];
      var L = LOCAL[o.id], hidden = false;

      if (!glReady) {
        hidden = true;
      } else if (stageEl) {
        if (L.hide) {
          hidden = true;
        } else {
          o.tp.set(L.p[0], L.p[1], L.p[2]).applyQuaternion(stageQ).multiplyScalar(stageS).add(stageO);
          if (o.float && !reduce) o.tp.y += Math.sin(t * 0.9 + o.phase) * 0.1 * stageS;
          tmpE.set(L.r[0], L.r[1], L.r[2]);
          eq.setFromEuler(tmpE);
          o.tq.copy(stageQ).multiply(eq);
          o.ts = stageS * L.s * o.k;
        }
      } else if (FREE[st]) {
        var f = FREE[st][o.id];
        if (!f) {
          hidden = true;
        } else {
          o.tp.set(f[0] * halfW, f[1] * halfH, f[2]);
          if (!reduce) o.tp.y += Math.sin(t * 0.8 + o.phase) * 0.16;
          tmpE.set(f[4] + (reduce ? 0 : t * 0.22 * (i % 2 ? 1 : -1)), f[5] + (reduce ? 0 : t * 0.31), f[6]);
          eq.setFromEuler(tmpE);
          o.tq.copy(eq);
          o.ts = f[3] * fs * o.k;
        }
      } else if (st === 'services' && ANCHOR[o.id] !== undefined && anchors[ANCHOR[o.id]]) {
        var ar = anchors[ANCHOR[o.id]].getBoundingClientRect();
        var ah = Math.min(ar.height, ar.width * 1.1) * wpp;
        var sc2 = (ah * 0.8) / (SIZE[o.id] || 2);
        o.ts = sc2;
        pxToWorld(ar.left + ar.width / 2, ar.top + ar.height / 2, o.tp);
        o.tp.y -= (PIVOT[o.id] || 0) * sc2;
        o.spin += dt * (hoverCard === ANCHOR[o.id] ? 5.5 : 0.7);
        tmpE.set(0.18, o.spin + 0.5, o.id === 'torus' ? 0.3 : 0);
        if (o.id === 'torus') tmpE.set(1.0, 0.2, o.spin);
        eq.setFromEuler(tmpE);
        o.tq.copy(eq);
      } else {
        hidden = true;
      }

      if (hidden) {
        o.ts = 0.001;
        if (!glReady) o.cp.copy(o.tp);
      }

      k = 1 - Math.exp(-dt * (4.4 + (o.ord % 5) * 0.55));
      if (o.cs < 0.01 && !hidden) o.cp.copy(o.tp);
      o.cp.lerp(o.tp, hidden ? 0 : k);
      if (!hidden) o.cq.slerp(o.tq, k);
      o.cs += (o.ts - o.cs) * (hidden ? 1 - Math.exp(-dt * 9) : k);

      /* springs */
      o.sv += (-130 * o.sd - 9 * o.sv) * dt;
      o.sd += o.sv * dt;
      o.ov.addScaledVector(o.od, -90 * dt).multiplyScalar(Math.max(0, 1 - 8 * dt));
      o.od.addScaledVector(o.ov, dt);

      /* colour mode */
      var tc = mode === 0 ? o.cSketch : mode === 1 ? o.cClay : o.cFinal;
      o.mat.color.lerp(tc, 1 - Math.exp(-dt * 6));
      var wire = mode === 0;
      if (o.mat.wireframe !== wire) o.mat.wireframe = wire;
      o.mesh.castShadow = !wire;

      var m = o.mesh, s = Math.max(o.cs, 0.001);
      m.position.copy(o.cp).add(o.od);
      m.quaternion.copy(o.cq);
      m.scale.set(s * (1 - o.sd * 0.5), s * (1 + o.sd), s * (1 - o.sd * 0.5));
      m.visible = o.cs > 0.02;
    }

    /* light follows pedestal */
    var pc = byId.pedestal.cp;
    light.position.set(pc.x + 4, pc.y + 9, pc.z + 7);
    light.target.position.copy(pc);
  }

  /* ---------- Scroll-linked DOM ---------- */
  var sections = $$('[data-state]'), hdr = $('#hdr'), navs = $$('[data-nav]');

  function updateDOM() {
    var i, rc, st = activeState, ink = 'light';
    for (i = 0; i < sections.length; i++) {
      rc = sections[i].getBoundingClientRect();
      if (rc.top <= H * 0.5 && rc.bottom > H * 0.5) st = sections[i].dataset.state;
      if (rc.top <= 60 && rc.bottom > 60) ink = sections[i].dataset.ink;
    }
    if (st !== activeState) {
      activeState = st;
      GL.state = st;
      navs.forEach(function (a) {
        a.classList.toggle('on', a.dataset.nav === st);
      });
    }
    hdr.classList.toggle('ink', ink === 'dark');

    /* manifesto */
    rc = mani.getBoundingClientRect();
    var p = clamp(-rc.top / (rc.height - H), 0, 1);
    var n = Math.ceil(clamp(p / 0.72, 0, 1) * words.length);
    if (n !== lit) {
      lit = n;
      words.forEach(function (w, j) {
        w.classList.toggle('on', j < n);
      });
    }

    /* cases */
    rc = cases.getBoundingClientRect();
    p = clamp(-rc.top / Math.max(1, rc.height - H), 0, 1);
    track.style.transform = 'translate3d(' + (-p * maxShift).toFixed(1) + 'px,0,0)';
    var ci = clamp(Math.round(p * (caseCards.length - 1)), 0, caseCards.length - 1);
    if (ci !== lastCase) {
      lastCase = ci;
      countEl.textContent = '0' + (ci + 1) + ' / 0' + caseCards.length;
    }

    /* process */
    rc = proc.getBoundingClientRect();
    p = clamp(-rc.top / (rc.height - H), 0, 0.999);
    var s2 = Math.min(2, Math.floor(p * 3));
    if (s2 !== step) {
      step = s2;
      stepEls.forEach(function (li, j) {
        li.classList.toggle('on', j === s2);
      });
      stageName.textContent = names[s2];
    }
  }

  /* ---------- Resize ---------- */
  function onResize() {
    W = innerWidth;
    H = innerHeight;
    halfW = halfH * W / H;
    wpp = 2 * halfH / H;
    if (GL.on) {
      R.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }
    sizeCases();
  }

  addEventListener('resize', onResize);
  onResize();
  addEventListener('load', onResize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);

  /* ---------- Main loop ---------- */
  var glFailed = false;

  function frame(now) {
    var dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000 || 0.016));
    last = now;
    t += dt;
    updateDOM();

    if (GL.on && !glFailed) {
      try {
        if (ptr.dirty || activeState !== GL.hoverState) {
          hoverTest();
          ptr.dirty = false;
          GL.hoverState = activeState;
        }
        updateGL(dt);
        R.render(scene, camera);
      } catch (err) {
        console.warn('3D disabled after error', err);
        glFailed = true;
        var c = $('#gl');
        if (c) c.style.display = 'none';
      }
    }

    /* cursor */
    if (fine) {
      cx += (ptr.x - cx) * 0.28;
      cy += (ptr.y - cy) * 0.28;
      cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      var lab = domLabel || objLabel || (inStage && activeState === 'contact' ? 'DRAG' : '');
      if (lab) curL.textContent = lab;
      cur.classList.toggle('lbl', !!lab);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
