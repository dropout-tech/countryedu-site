
(function () {
  "use strict";

  var lit = document.querySelectorAll(".rf-joint, .rf-ribbon");
  if ("IntersectionObserver" in window && lit.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add("lit"); });
    }, { threshold: 0.9 });
    lit.forEach(function (el) { io.observe(el); });
  }

  var cards = document.querySelectorAll(".rf-card");
  cards.forEach(function (card) {
    if (card.querySelector("svg.rf-edge")) return;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "rf-edge");
    svg.setAttribute("aria-hidden", "true");
    ["base", "runner"].forEach(function (cls) {
      var r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      r.setAttribute("class", cls);
      r.setAttribute("pathLength", "100");
      svg.appendChild(r);
    });
    card.insertBefore(svg, card.firstChild);
    var dot = document.createElement("span");
    dot.className = "rf-dot";
    dot.setAttribute("aria-hidden", "true");
    card.appendChild(dot);
  });

  function fitEdges() {
    cards.forEach(function (card) {
      var w = card.offsetWidth, h = card.offsetHeight;
      var svg = card.querySelector("svg.rf-edge");
      if (!svg || !w) return;
      svg.setAttribute("viewBox", "0 0 " + w + " " + h);
      svg.querySelectorAll("rect").forEach(function (r) {
        r.setAttribute("x", 0.75); r.setAttribute("y", 0.75);
        r.setAttribute("width", w - 1.5); r.setAttribute("height", h - 1.5);
        r.setAttribute("rx", 19);
      });
    });
  }
  fitEdges();
  window.addEventListener("resize", fitEdges);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitEdges);

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced && window.matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var run = e.target.querySelector("svg.rf-edge .runner");
        if (run) {
          run.style.opacity = 1;
          run.style.strokeDashoffset = -88;
          setTimeout(function () { run.style.opacity = 0; }, 1700);
        }
        io2.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    cards.forEach(function (c) { io2.observe(c); });
  }

  document.querySelectorAll("[data-story]").forEach(function (story) {
    var track = story.querySelector(".rf-story-track");
    var dots = Array.prototype.slice.call(story.querySelectorAll(".rf-story-dot"));
    if (!track || dots.length < 2) return;
    var vert = story.getAttribute("data-axis") === "y";
    var cur = 0;
    function slideSize() {
      var s = story.querySelector(".rf-story-slide");
      if (!s) return 0;
      var r = s.getBoundingClientRect();
      return vert ? r.height : r.width;
    }
    function go(i) {
      cur = Math.max(0, Math.min(dots.length - 1, i));
      var off = -cur * slideSize();
      track.style.transform = (vert ? "translateY(" : "translateX(") + off + "px)";
      if (arrows) arrows.forEach(function (a) { var dir = +a.getAttribute("data-nav"); a.disabled = (dir < 0 && cur === 0) || (dir > 0 && cur === dots.length - 1); });
      dots.forEach(function (d, k) {
        var on = k === cur;
        d.classList.toggle("is-active", on);
        d.setAttribute("aria-selected", on ? "true" : "false");
      });
    }
    dots.forEach(function (d, i) { d.addEventListener("click", function () { go(i); }); });
    var arrows = Array.prototype.slice.call(story.querySelectorAll(".rf-nav-arrow"));
    arrows.forEach(function (a) { a.addEventListener("click", function () { go(cur + (+a.getAttribute("data-nav"))); }); });
    go(0);
    window.addEventListener("resize", function () { go(cur); });
    var p0 = null;
    story.addEventListener("touchstart", function (e) { var t = e.touches[0]; p0 = vert ? t.clientY : t.clientX; }, { passive: true });
    story.addEventListener("touchend", function (e) {
      if (p0 === null) return;
      var t = e.changedTouches[0];
      var dp = (vert ? t.clientY : t.clientX) - p0;
      if (Math.abs(dp) > 40) go(cur + (dp < 0 ? 1 : -1));
      p0 = null;
    }, { passive: true });
  });
})();
