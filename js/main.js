/* ===================================================================
 * Río Amoyá — Page JS
 * ------------------------------------------------------------------- */

(function () {
  "use strict";

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  function ssStartAtTop() {
    function toTop() {
      var hash = location.hash;
      if (hash && hash !== "#top") {
        history.replaceState(null, "", location.pathname + location.search);
      }
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    toTop();
    window.addEventListener("pageshow", toTop);
    window.addEventListener("load", toTop);
  }

  var counted = false;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function formatNumber(value, decimals) {
    if (decimals) {
      return value.toFixed(decimals).replace(".", ",");
    }
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function animateCounters() {
    if (counted) return;
    var nodes = document.querySelectorAll("#resultados .js-count");
    if (!nodes.length) return;
    counted = true;

    nodes.forEach(function (node) {
      var target = parseFloat(node.getAttribute("data-target"), 10);
      var decimals = parseInt(node.getAttribute("data-decimals"), 10) || 0;
      var start = performance.now();
      var duration = 1400;

      function tick(now) {
        var t = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        node.textContent = formatNumber(target * eased, decimals);
        if (t < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  }

  function ssHeroVideo() {
    var video = document.getElementById("hero-player");
    if (!video) return;

    video.controls = false;
    video.removeAttribute("controls");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    if (prefersReducedMotion()) {
      video.removeAttribute("autoplay");
      video.pause();
      return;
    }

    function playSilent() {
      video.muted = true;
      video.controls = false;
      var play = video.play();
      if (play && play.catch) play.catch(function () {});
    }

    video.addEventListener("loadeddata", playSilent);
    video.addEventListener("canplay", playSilent);
    playSilent();
  }

  function ssScrollReveal() {
    var nodes = [].slice.call(document.querySelectorAll(".reveal"));
    if (!nodes.length) return;

    nodes.forEach(function (el) {
      var parent = el.parentElement;
      var sibs = parent
        ? [].filter.call(parent.children, function (child) {
            return child.classList.contains("reveal");
          })
        : [el];
      el.style.setProperty("--reveal-delay", Math.max(0, sibs.indexOf(el)) * 80 + "ms");
    });

    function check() {
      var vh = window.innerHeight || 800;
      nodes.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var visible = rect.top < vh * 0.88 && rect.bottom > 72;
        var away = rect.bottom < 0 || rect.top > vh;
        if (visible) el.classList.add("is-in");
        else if (away) el.classList.remove("is-in");
      });
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        check();
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("pageshow", function () {
      nodes.forEach(function (el) {
        el.classList.remove("is-in");
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(check);
      });
    });
    window.addEventListener("amoya-ready", check);

    requestAnimationFrame(function () {
      requestAnimationFrame(check);
    });
    window.setTimeout(check, 200);
    window.setTimeout(check, 850);
  }

  function ssPreloader() {
    var el = document.getElementById("preloader");
    if (!el) return;
    var hidden = false;

    function hide() {
      if (hidden) return;
      hidden = true;
      el.classList.add("is-done");
      window.dispatchEvent(new Event("amoya-ready"));
      window.setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
        window.dispatchEvent(new Event("amoya-ready"));
      }, 600);
    }

    window.setTimeout(hide, 700);
    window.addEventListener("load", hide);
  }

  function ssMobileMenu() {
    var toggle = document.querySelector(".header-menu-toggle");
    var nav = document.getElementById("header-nav-wrap");
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove("is-open");
      toggle.classList.remove("is-clicked");
      document.body.classList.remove("is-menu-open");
    }

    toggle.addEventListener("click", function (event) {
      event.preventDefault();
      var open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      toggle.classList.toggle("is-clicked", open);
      document.body.classList.toggle("is-menu-open", open);
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= 1080) close();
      });
    });
  }

  function animateScrollTo(endY, duration) {
    var startY = window.pageYOffset;
    var distance = endY - startY;
    if (Math.abs(distance) < 2) return;

    var start = performance.now();

    function tick(now) {
      var t = Math.min((now - start) / duration, 1);
      var eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      window.scrollTo(0, startY + distance * eased);
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function ssSmoothScroll() {
    document.querySelectorAll(".smoothscroll").forEach(function (link) {
      link.addEventListener("click", function (event) {
        var hash = this.hash;
        var target = hash && document.querySelector(hash);
        if (!target) return;

        event.preventDefault();
        event.stopPropagation();

        var top = hash === "#top" ? 0 : target.getBoundingClientRect().top + window.pageYOffset;
        var distance = Math.abs(window.pageYOffset - top);
        var duration = hash === "#top"
          ? Math.min(1800, Math.max(1200, distance * 0.55))
          : Math.min(1100, Math.max(700, distance * 0.45));

        animateScrollTo(top, duration);
      });
    });
  }

  function ssNavCurrent() {
    var links = document.querySelectorAll(".header-main-nav a");
    var sections = [].slice.call(document.querySelectorAll("main section[id]"));
    if (!links.length || !sections.length) return;

    function update() {
      var line = window.scrollY + window.innerHeight * 0.28;
      var current = sections[0];
      sections.forEach(function (section) {
        if (section.offsetTop <= line) current = section;
      });

      links.forEach(function (link) {
        var on = link.getAttribute("href") === "#" + current.id;
        if (link.parentElement) {
          link.parentElement.classList.toggle("current", on);
        }
      });

      if (current.id === "resultados") animateCounters();
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function ssProgress() {
    var bar = document.querySelector(".read-progress span");
    if (!bar) return;

    function update() {
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = docHeight > 0 ? window.scrollY / docHeight : 0;
      bar.style.width = Math.min(ratio * 100, 100) + "%";
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function ssBackToTop() {
    var goTop = document.getElementById("go-top");
    if (!goTop) return;

    window.addEventListener("scroll", function () {
      goTop.classList.toggle("is-visible", window.scrollY >= 500);
    }, { passive: true });
  }

  function ssFlow() {
    var steps = document.querySelectorAll(".flow-step");
    var panels = document.querySelectorAll(".flow-panel");
    steps.forEach(function (step) {
      step.addEventListener("click", function () {
        var id = step.getAttribute("data-step");
        steps.forEach(function (s) {
          s.classList.toggle("is-active", s === step);
          s.setAttribute("aria-selected", s === step ? "true" : "false");
        });
        panels.forEach(function (panel) {
          var on = panel.getAttribute("data-step-panel") === id;
          panel.classList.toggle("is-active", on);
          if (on) panel.classList.add("reveal", "is-in");
        });
      });
    });
  }

  function ssMethod() {
    var toggle = document.querySelector(".method-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      var open = toggle.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function ssCountWhenVisible() {
    var target = document.getElementById("resultados");
    if (!target || !("IntersectionObserver" in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) animateCounters();
      });
    }, { threshold: 0.35 });
    observer.observe(target);
  }

  ssStartAtTop();
  ssHeroVideo();
  ssScrollReveal();
  ssPreloader();
  ssMobileMenu();
  ssSmoothScroll();
  ssNavCurrent();
  ssProgress();
  ssBackToTop();
  ssFlow();
  ssMethod();
  ssCountWhenVisible();
})();
