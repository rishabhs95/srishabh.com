/* ============================================================
   srishabh.com — guitar-string particle hero (three.js),
   custom cursor, magnetic buttons, scramble hovers,
   scroll choreography (GSAP / ScrollTrigger)
   ============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.matchMedia("(max-width: 768px)").matches;
  var isTouch = window.matchMedia("(hover: none)").matches;

  /* ----------------------------------------------------------
     THREE.js — vibrating strings (a nod to the guitar)
     ---------------------------------------------------------- */
  function initStrings() {
    var canvas = document.getElementById("hero-canvas");
    if (!canvas || !window.THREE || prefersReduced) return;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas, alpha: true, antialias: false, powerPreference: "low-power"
      });
    } catch (e) { return; }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 0, 20);

    var STRINGS = 7;
    var PTS = isMobile ? 90 : 200;
    var WIDTH = 56;
    var GAP = 2.6;
    var count = STRINGS * PTS;

    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var cream = new THREE.Color(0xf4eee3);
    var orange = new THREE.Color(0xff5a2d);

    var i = 0;
    for (var s = 0; s < STRINGS; s++) {
      var y = (s - (STRINGS - 1) / 2) * GAP - 0.5;
      var col = (s === 1 || s === 4) ? orange : cream;
      var dim = (s === 1 || s === 4) ? 1.0 : 0.62 + 0.05 * s;
      for (var p = 0; p < PTS; p++) {
        positions[i * 3] = (p / (PTS - 1) - 0.5) * WIDTH;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = -s * 0.45;
        colors[i * 3] = col.r * dim;
        colors[i * 3 + 1] = col.g * dim;
        colors[i * 3 + 2] = col.b * dim;
        i++;
      }
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    var mat = new THREE.PointsMaterial({
      size: isMobile ? 0.12 : 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    var points = new THREE.Points(geo, mat);
    points.rotation.z = -0.1;
    scene.add(points);

    /* per-string pluck energy (scroll strum + mouse) */
    var pluck = new Float32Array(STRINGS);

    /* scroll strum: the "pick" crosses one string after another */
    var lastStrum = 0;
    function strum() {
      var heroH = canvas.parentElement.clientHeight || 1;
      var p = Math.max(0, Math.min(1, window.scrollY / (heroH * 0.72)));
      var idx = Math.round(p * (STRINGS - 1));
      if (idx !== lastStrum) {
        var from = Math.min(lastStrum, idx) + (idx > lastStrum ? 1 : 0);
        var to = Math.max(lastStrum, idx) - (idx > lastStrum ? 0 : 1);
        for (var k = from; k <= to; k++) pluck[k] = 1.6;
        lastStrum = idx;
      }
    }
    window.addEventListener("scroll", strum, { passive: true });

    /* mouse "pluck": amplitude swells near the pointer */
    var mouse = { x: -999, y: -999 };
    var energy = 0; // decaying pluck energy
    function toWorld(e) {
      var r = canvas.getBoundingClientRect();
      var nx = (e.clientX - r.left) / r.width * 2 - 1;
      var ny = -((e.clientY - r.top) / r.height * 2 - 1);
      // approximate world coords at z=0 plane
      var h = 2 * Math.tan(camera.fov * Math.PI / 360) * camera.position.z;
      mouse.x = nx * h * camera.aspect / 2;
      mouse.y = ny * h / 2;
    }
    if (!isTouch) {
      window.addEventListener("mousemove", function (e) {
        toWorld(e);
        energy = Math.min(energy + 0.06, 1.6);
      }, { passive: true });
    }

    function resize() {
      var w = canvas.parentElement.clientWidth;
      var h = canvas.parentElement.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    var pos = geo.attributes.position.array;
    var baseY = new Float32Array(count);
    for (var j = 0; j < count; j++) baseY[j] = pos[j * 3 + 1];

    var clock = new THREE.Clock();
    var running = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        running = en[0].isIntersecting;
        if (running) animate();
      }, { threshold: 0 }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && running) animate();
    });

    var rafId = null;
    function animate() {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      loop();
    }
    function loop() {
      if (!running || document.hidden) { rafId = null; return; }
      rafId = requestAnimationFrame(loop);
      var t = clock.getElapsedTime();
      energy *= 0.96;
      for (var k = 0; k < STRINGS; k++) pluck[k] *= 0.955;
      for (var j = 0; j < count; j++) {
        var x = pos[j * 3];
        var by = baseY[j];
        var row = (j / PTS) | 0;
        // idle hum (kept low so plucks stand out)
        var amp = 0.18 + 0.06 * Math.sin(t * 0.5 + by);
        // pluck swell near pointer
        var dx = x - mouse.x, dy = by - mouse.y;
        var d2 = dx * dx + dy * dy;
        amp += energy * 1.5 * Math.exp(-d2 / 18);
        // strummed string: whole string twangs, loudest mid-string like a real pluck
        var pk = pluck[row];
        var twang = 0;
        if (pk > 0.02) {
          var mid = 1 - Math.abs(x) / (WIDTH * 0.5);
          amp += pk * 0.9 * mid;
          twang = pk * 0.3 * mid * Math.sin(x * 1.7 + t * 11);
        }
        pos[j * 3 + 1] = by + Math.sin(x * 0.55 + t * 2.2 + by * 1.7) * amp + twang;
      }
      geo.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    }
    loop();
  }

  /* ----------------------------------------------------------
     custom cursor
     ---------------------------------------------------------- */
  function initCursor() {
    if (isTouch || isMobile || prefersReduced) return;
    var dot = document.createElement("div");
    var ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var x = -100, y = -100, rx = -100, ry = -100;
    window.addEventListener("mousemove", function (e) {
      x = e.clientX; y = e.clientY;
      dot.style.transform = "translate(" + (x - 3.5) + "px," + (y - 3.5) + "px)";
    }, { passive: true });

    (function follow() {
      rx += (x - rx) * 0.14;
      ry += (y - ry) * 0.14;
      ring.style.transform = "translate(" + (rx - 18) + "px," + (ry - 18) + "px)";
      requestAnimationFrame(follow);
    })();

    document.addEventListener("mouseover", function (e) {
      if (e.target.closest("a, button, .btn")) ring.classList.add("is-active");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest("a, button, .btn")) ring.classList.remove("is-active");
    });
  }

  /* ----------------------------------------------------------
     magnetic buttons
     ---------------------------------------------------------- */
  function initMagnetic() {
    if (isTouch || prefersReduced || !window.gsap) return;
    document.querySelectorAll(".btn").forEach(function (btn) {
      var strength = 22;
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        gsap.to(btn, {
          x: (e.clientX - r.left - r.width / 2) / r.width * strength,
          y: (e.clientY - r.top - r.height / 2) / r.height * strength,
          duration: 0.4, ease: "power3.out"
        });
      });
      btn.addEventListener("mouseleave", function () {
        gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* ----------------------------------------------------------
     scramble hover on nav links + logo
     ---------------------------------------------------------- */
  function initScramble() {
    if (isTouch || prefersReduced) return;
    var CHARS = "!<>-_\\/[]{}—=+*^?#";
    document.querySelectorAll(".nav__links a").forEach(function (el) {
      var original = el.textContent;
      var timer = null;
      el.addEventListener("mouseenter", function () {
        var frame = 0;
        clearInterval(timer);
        timer = setInterval(function () {
          el.textContent = original.split("").map(function (ch, idx) {
            if (ch === " ") return " ";
            if (idx < frame / 2) return original[idx];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          }).join("");
          frame++;
          if (frame / 2 >= original.length) {
            clearInterval(timer);
            el.textContent = original;
          }
        }, 28);
      });
      el.addEventListener("mouseleave", function () {
        clearInterval(timer);
        el.textContent = original;
      });
    });
  }

  /* ----------------------------------------------------------
     GSAP — entrance + scroll storytelling
     ---------------------------------------------------------- */
  function initMotion() {
    var reveals = document.querySelectorAll(".reveal");

    if (!window.gsap) {
      reveals.forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    if (prefersReduced) {
      gsap.set(".reveal, .hero__title .line__inner, .hero__eyebrow, .hero__sub, .hero__cta, .statement__text .w", { clearProps: "all", opacity: 1 });
      document.querySelectorAll(".counter").forEach(function (el) {
        el.textContent = el.getAttribute("data-target");
      });
      var lineEl = document.querySelector(".timeline__line");
      if (lineEl) lineEl.style.transform = "scaleY(1)";
      return;
    }

    /* hero entrance */
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .from(".nav", { y: -24, opacity: 0, duration: 0.7 })
      .from(".hero__eyebrow", { y: 18, opacity: 0, duration: 0.6 }, "-=0.35")
      .from(".hero__title .line__inner", { yPercent: 115, duration: 0.9, stagger: 0.12 }, "-=0.3")
      .from(".hero__sub", { y: 24, opacity: 0, duration: 0.7 }, "-=0.45")
      .from(".hero__cta", { y: 24, opacity: 0, duration: 0.7 }, "-=0.5")
      .from(".marquee", { opacity: 0, duration: 0.8 }, "-=0.4")
      .from(".hero__scroll", { opacity: 0, duration: 0.8 }, "-=0.6");

    /* generic reveals */
    reveals.forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.85, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 86%" }
      });
    });

    /* statement: word-by-word scrub */
    var stmt = document.querySelector(".statement__text");
    if (stmt) {
      var words = stmt.textContent.trim().split(/\s+/);
      stmt.innerHTML = words.map(function (w) {
        return '<span class="w">' + w + "</span>";
      }).join(" ");
      gsap.to(stmt.querySelectorAll(".w"), {
        opacity: 1, stagger: 0.06, ease: "none",
        scrollTrigger: { trigger: stmt, start: "top 78%", end: "bottom 45%", scrub: 0.4 }
      });
    }

    /* counters */
    document.querySelectorAll(".counter").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-target"), 10) || 0;
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.6, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
        onUpdate: function () { el.textContent = Math.round(obj.v); }
      });
    });

    /* stacking cards: earlier cards recede as the next arrives */
    if (!isMobile) {
      var cards = gsap.utils.toArray(".principle");
      cards.forEach(function (card, idx) {
        if (idx === cards.length - 1) return;
        gsap.fromTo(card,
          { scale: 1, filter: "brightness(1)" },
          {
            scale: 0.965,
            filter: "brightness(0.78)",
            transformOrigin: "center top",
            ease: "none",
            scrollTrigger: {
              trigger: cards[idx + 1],
              start: "top 70%",
              end: "top 15%",
              scrub: 0.3
            }
          });
      });
    }

    /* timeline line draw */
    var line = document.querySelector(".timeline__line");
    if (line) {
      gsap.to(line, {
        scaleY: 1, ease: "none",
        scrollTrigger: { trigger: ".timeline", start: "top 75%", end: "bottom 60%", scrub: 0.5 }
      });
    }

    /* card glow follows pointer */
    document.querySelectorAll(".principle").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - rect.left) + "px");
        card.style.setProperty("--my", (e.clientY - rect.top) + "px");
      });
    });
  }

  /* ----------------------------------------------------------
     nav scroll state
     ---------------------------------------------------------- */
  function initNav() {
    var nav = document.getElementById("nav");
    if (!nav) return;
    var update = function () {
      nav.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function boot() {
    initNav();
    initStrings();
    initCursor();
    initMagnetic();
    initScramble();
    initMotion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
