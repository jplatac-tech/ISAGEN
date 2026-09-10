/* ===================================================================
 * Río Amoyá — Page JS
 * ------------------------------------------------------------------- */

(function () {
  "use strict";

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  function ssStartAtTop() {
    function toTop() {
      var hash = location.hash;
      if (hash && hash !== "#video" && hash !== "#top") {
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
  var LOOP_START = 40;
  var LOOP_END = 120;
  var loopTimer = null;

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

  function restartLoop(player) {
    if (!player || typeof player.seekTo !== "function") return;
    try {
      player.mute();
      player.seekTo(LOOP_START, true);
      player.playVideo();
    } catch (err) {}
  }

  function watchLoop(player) {
    if (loopTimer) window.clearInterval(loopTimer);
    loopTimer = window.setInterval(function () {
      if (!player || typeof player.getCurrentTime !== "function") return;
      try {
        if (player.getCurrentTime() >= LOOP_END - 0.2) {
          restartLoop(player);
        }
      } catch (err) {}
    }, 200);
  }

  function bindHeroPlayer() {
    if (prefersReducedMotion()) return;
    if (!window.YT || !window.YT.Player) return;
    var mount = document.getElementById("hero-player");
    if (!mount || mount.dataset.bound === "1") return;
    mount.dataset.bound = "1";

    if (mount.tagName === "IFRAME") {
      var host = document.createElement("div");
      host.id = "hero-player";
      host.dataset.bound = "1";
      mount.parentNode.replaceChild(host, mount);
    }

    new window.YT.Player("hero-player", {
      width: "1920",
      height: "1080",
      videoId: "1TG_MWuMDSw",
      playerVars: {
        autoplay: 1,
        mute: 1,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        start: LOOP_START,
        loop: 1,
        playlist: "1TG_MWuMDSw",
        iv_load_policy: 3,
        disablekb: 1,
        fs: 0,
        cc_load_policy: 0,
        showinfo: 0,
        enablejsapi: 1,
        origin: window.location.origin
      },
      events: {
        onReady: function (event) {
          try {
            event.target.unloadModule("captions");
            event.target.unloadModule("cc");
          } catch (err) {}
          event.target.mute();
          event.target.setVolume(0);
          event.target.seekTo(LOOP_START, true);
          event.target.playVideo();
          watchLoop(event.target);
        },
        onStateChange: function (event) {
          if (event.data === window.YT.PlayerState.PLAYING) {
            try {
              event.target.unloadModule("captions");
              event.target.unloadModule("cc");
            } catch (err) {}
            watchLoop(event.target);
          }
          if (event.data === window.YT.PlayerState.ENDED) {
            restartLoop(event.target);
          }
        }
      }
    });
  }

  window.onYouTubeIframeAPIReady = bindHeroPlayer;

  function loadYouTubeApi() {
    if (prefersReducedMotion()) return;
    if (window.YT && window.YT.Player) {
      bindHeroPlayer();
      return;
    }
    if (document.querySelector("script[src*='iframe_api']")) return;
    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
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

  function ssVideoModal() {
    var modal = document.getElementById("video-modal");
    var frame = document.getElementById("video-modal-player");
    var closeBtn = modal && modal.querySelector(".video-modal-close");
    if (!modal || !frame) return;

    var embed = "https://www.youtube.com/embed/1TG_MWuMDSw?autoplay=1&rel=0&modestbranding=1&playsinline=1&cc_load_policy=0";
    var openedByUs = false;

    function openVideo() {
      modal.hidden = false;
      modal.classList.add("is-open");
      document.body.classList.add("is-video-open");
      frame.src = embed;
      if (!openedByUs) {
        openedByUs = true;
        history.pushState({ amoyaVideo: 1 }, "", "#video");
      }
    }

    function closeVideo(fromBack) {
      modal.classList.remove("is-open");
      document.body.classList.remove("is-video-open");
      frame.src = "";
      window.setTimeout(function () {
        modal.hidden = true;
      }, 200);
      if (!fromBack && openedByUs) {
        openedByUs = false;
        if (history.state && history.state.amoyaVideo) history.back();
      } else {
        openedByUs = false;
      }
    }

    document.querySelectorAll(".js-open-video").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (!modal.classList.contains("is-open")) openVideo();
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        closeVideo(false);
      });
    }

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeVideo(false);
    });

    window.addEventListener("popstate", function () {
      if (modal.classList.contains("is-open")) closeVideo(true);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeVideo(false);
      }
    });

    if (location.hash === "#video") {
      openedByUs = true;
      modal.hidden = false;
      modal.classList.add("is-open");
      document.body.classList.add("is-video-open");
      frame.src = embed;
    }
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
  loadYouTubeApi();
  ssScrollReveal();
  ssPreloader();
  ssMobileMenu();
  ssSmoothScroll();
  ssNavCurrent();
  ssProgress();
  ssBackToTop();
  ssFlow();
  ssMethod();
  ssVideoModal();
  ssCountWhenVisible();
})();
