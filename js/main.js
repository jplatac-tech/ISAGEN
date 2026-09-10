/* ===================================================================
 * Río Amoyá — Page JS
 * ------------------------------------------------------------------- */

(function ($) {
  "use strict";

  var cfg = {
    scrollDuration: 800
  };
  var $WIN = $(window);
  var counted = false;

  var doc = document.documentElement;
  doc.setAttribute("data-useragent", navigator.userAgent);

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

  var ssPreloader = function () {
    $WIN.on("load", function () {
      $("#preloader").delay(400).fadeOut("slow");
    });
  };

  var ssMobileMenu = function () {
    var toggleButton = $(".header-menu-toggle");
    var nav = $("#header-nav-wrap");

    toggleButton.on("click", function (event) {
      event.preventDefault();
      toggleButton.toggleClass("is-clicked");
      $("body").toggleClass("is-menu-open");
      nav.slideToggle();
    });

    nav.find("a").on("click", function () {
      if (toggleButton.is(":visible")) {
        toggleButton.removeClass("is-clicked");
        $("body").removeClass("is-menu-open");
        nav.slideUp();
      }
    });
  };

  var ssSmoothScroll = function () {
    $(".smoothscroll").on("click", function (e) {
      var target = this.hash;
      var $target = $(target);
      if (!$target.length) return;

      e.preventDefault();
      e.stopPropagation();

      $("html, body").stop().animate({
        scrollTop: $target.offset().top
      }, cfg.scrollDuration, "swing", function () {
        window.location.hash = target;
      });
    });
  };

  var ssWaypoints = function () {
    var sections = $("section");
    var navigation_links = $(".header-main-nav li a");

    sections.waypoint({
      handler: function (direction) {
        var active_section = $("section#" + this.element.id);
        if (direction === "up") active_section = active_section.prev("section");
        if (!active_section.length || !active_section.attr("id")) return;

        var active_link = $('.header-main-nav li a[href="#' + active_section.attr("id") + '"]');
        navigation_links.parent().removeClass("current");
        active_link.parent().addClass("current");

        if (active_section.attr("id") === "resultados") {
          animateCounters();
        }
      },
      offset: "25%"
    });
  };

  var ssAOS = function () {
    AOS.init({
      offset: 140,
      duration: 700,
      easing: "ease-out-cubic",
      delay: 80,
      once: true
    });
  };

  var ssProgress = function () {
    var bar = document.querySelector(".read-progress span");
    if (!bar) return;

    function update() {
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = docHeight > 0 ? window.scrollY / docHeight : 0;
      bar.style.width = Math.min(ratio * 100, 100) + "%";
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
  };

  var ssBackToTop = function () {
    var goTopButton = $("#go-top");
    $WIN.on("scroll", function () {
      if ($WIN.scrollTop() >= 500) goTopButton.fadeIn(300);
      else goTopButton.fadeOut(300);
    });
  };

  var ssFlow = function () {
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
          panel.classList.toggle("is-active", panel.getAttribute("data-step-panel") === id);
        });
      });
    });
  };

  var ssMethod = function () {
    var toggle = document.querySelector(".method-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      var open = toggle.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  };

  var ssCountWhenVisible = function () {
    var target = document.getElementById("resultados");
    if (!target || !("IntersectionObserver" in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) animateCounters();
      });
    }, { threshold: 0.35 });
    observer.observe(target);
  };

  (function ssInit() {
    ssPreloader();
    ssMobileMenu();
    ssSmoothScroll();
    ssWaypoints();
    ssAOS();
    ssProgress();
    ssBackToTop();
    ssFlow();
    ssMethod();
    ssCountWhenVisible();
  })();

})(jQuery);
