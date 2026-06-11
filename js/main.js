/* ============================================================
   srishabh.com — hero particle field (three.js) +
   scroll choreography (GSAP / ScrollTrigger)
   ============================================================ */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.matchMedia("(max-width: 768px)").matches;

  /* ----------------------------------------------------------
     THREE.js — drifting particle wave behind the hero
     ---------------------------------------------------------- */
  function initParticles() {
    var canvas = document.getElementById("hero-canvas");
    if (!canvas || !window.THREE || prefersReduced) return;

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: false,
        powerPreference: "low-power"
      });
    } catch (e) {
      return; // no WebGL — gradient fallback stays
    }

    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(DPR);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 5.2, 16);
    camera.lookAt(0, 0, 0);

    // particle grid
    var COLS = isMobile ? 48 : 90;
    var ROWS = isMobile ? 28 : 48;
    var SPREAD_X = 46;
    var SPREAD_Z = 26;
    var count = COLS * ROWS;

    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var seeds = new Float32Array(count);

    var cA = new THREE.Color(0x7c6cff);
    var cB = new THREE.Color(0x54e0c7);
    var tmp = new THREE.Color();

    var i = 0;
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var x = (c / (COLS - 1) - 0.5) * SPREAD_X;
        var z = (r / (ROWS - 1) - 0.5) * SPREAD_Z;
        positions[i * 3] = x;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = z;
        tmp.copy(cA).lerp(cB, c / (COLS - 1));
        colors[i * 3] = tmp.r;
        colors[i * 3 + 1] = tmp.g;
        colors[i * 3 + 2] = tmp.b;
        seeds[i] = Math.random() * Math.PI * 2;
        i++;
      }
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    var mat = new THREE.PointsMaterial({
      size: isMobile ? 0.085 : 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    var points = new THREE.Points(geo, mat);
    scene.add(points);

    // mouse parallax
    var targetRX = 0, targetRY = 0, curRX = 0, curRY = 0;
    if (!isMobile) {
      window.addEventListener("mousemove", function (e) {
        targetRY = (e.clientX / window.innerWidth - 0.5) * 0.22;
        targetRX = (e.clientY / window.innerHeight - 0.5) * 0.12;
      }, { passive: true });
    }

    function resize() {
      var w = canvas.clientWidth || canvas.parentElement.clientWidth;
      var h = canvas.clientHeight || canvas.parentElement.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    var pos = geo.attributes.position.array;
    var clock = new THREE.Clock();
    var running = true;

    // pause when hero is off-screen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        running = entries[0].isIntersecting;
        if (running) tick();
      }, { threshold: 0 }).observe(canvas);
    }

    // pause in background tabs
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && running) tick();
    });

    var rafId = null;
    function tick() {
      if (rafId) cancelAnimationFrame(rafId);
      animate();
    }

    function animate() {
      if (!running || document.hidden) { rafId = null; return; }
      rafId = requestAnimationFrame(animate);
      var t = clock.getElapsedTime() * 0.6;
      for (var j = 0; j < count; j++) {
        var x = pos[j * 3];
        var z = pos[j * 3 + 2];
        pos[j * 3 + 1] =
          Math.sin(x * 0.35 + t) * 0.9 +
          Math.cos(z * 0.42 + t * 0.8) * 0.7 +
          Math.sin(seeds[j] + t * 1.4) * 0.18;
      }
      geo.attributes.position.needsUpdate = true;

      curRX += (targetRX - curRX) * 0.04;
      curRY += (targetRY - curRY) * 0.04;
      points.rotation.x = curRX;
      points.rotation.y = curRY;

      renderer.render(scene, camera);
    }
    animate();
  }

  /* ----------------------------------------------------------
     GSAP — entrance + scroll storytelling
     ---------------------------------------------------------- */
  function initMotion() {
    var reveals = document.querySelectorAll(".reveal");

    if (!window.gsap) {
      // graceful fallback: show everything
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
    var intro = gsap.timeline({ defaults: { ease: "power3.out" } });
    intro
      .from(".nav", { y: -24, opacity: 0, duration: 0.7 })
      .from(".hero__eyebrow", { y: 18, opacity: 0, duration: 0.6 }, "-=0.35")
      .from(".hero__title .line__inner", {
        yPercent: 115,
        duration: 0.9,
        stagger: 0.12
      }, "-=0.3")
      .from(".hero__sub", { y: 24, opacity: 0, duration: 0.7 }, "-=0.45")
      .from(".hero__cta", { y: 24, opacity: 0, duration: 0.7 }, "-=0.5")
      .from(".hero__scroll", { opacity: 0, duration: 0.8 }, "-=0.3");

    /* generic reveals */
    reveals.forEach(function (el) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        ease: "power3.out",
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
        opacity: 1,
        stagger: 0.06,
        ease: "none",
        scrollTrigger: {
          trigger: stmt,
          start: "top 78%",
          end: "bottom 45%",
          scrub: 0.4
        }
      });
    }

    /* counters */
    document.querySelectorAll(".counter").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-target"), 10) || 0;
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration: 1.6,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
        onUpdate: function () { el.textContent = Math.round(obj.v); }
      });
    });

    /* timeline line draw */
    var line = document.querySelector(".timeline__line");
    if (line) {
      gsap.to(line, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".timeline",
          start: "top 75%",
          end: "bottom 60%",
          scrub: 0.5
        }
      });
    }

    /* principle cards: pointer-follow glow */
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
    initParticles();
    initMotion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
