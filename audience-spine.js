
(function () {
  "use strict";

  var body = document.body;
  if (!body || !body.classList.contains("audience-spine-page")) return;

  var gentle = body.classList.contains("spine-gentle");
  var main = document.querySelector(gentle ? "main" : "main.rf");
  if (!main) return;

  var LABEL = body.getAttribute("data-spine-label") || "COUNTRYEDU";

  var NS = "http://www.w3.org/2000/svg";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var layer = document.createElement("div");
  layer.className = "company-spine-layer";
  layer.setAttribute("aria-hidden", "true");

  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("role", "presentation");

  function make(tag, attrs, parent) {
    var el = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (key) { el.setAttribute(key, attrs[key]); });
    (parent || svg).appendChild(el);
    return el;
  }

  var defs = make("defs");

  var glow = make("linearGradient", {
    id: "company-spine-tail-gradient",
    gradientUnits: "userSpaceOnUse"
  }, defs);
  make("stop", { class: "company-spine-tail-stop", offset: "0%", "stop-opacity": "0" }, glow);
  make("stop", { class: "company-spine-tail-stop", offset: "54%", "stop-opacity": ".5" }, glow);
  make("stop", { class: "company-spine-tail-stop", offset: "100%", "stop-opacity": "1" }, glow);

  var accentMain = make("linearGradient", {
    id: "company-spine-accent-orange",
    x1: "0%", y1: "0%", x2: "100%", y2: "100%"
  }, defs);
  make("stop", { class: "company-spine-accent-path-start", offset: "0%" }, accentMain);
  make("stop", { class: "company-spine-accent-sunset-end", offset: "100%" }, accentMain);

  var accentAlt = make("linearGradient", {
    id: "company-spine-accent-peach",
    x1: "0%", y1: "0%", x2: "100%", y2: "100%"
  }, defs);
  make("stop", { class: "company-spine-accent-peach-start", offset: "0%" }, accentAlt);
  make("stop", { class: "company-spine-accent-path-end", offset: "100%" }, accentAlt);

  var accentSoft = make("linearGradient", {
    id: "company-spine-accent-soft",
    x1: "0%", y1: "0%", x2: "100%", y2: "100%"
  }, defs);
  make("stop", { class: "company-spine-accent-apricot-start", offset: "0%" }, accentSoft);
  make("stop", { class: "company-spine-accent-honey-end", offset: "100%" }, accentSoft);

  var accentExtra = make("linearGradient", {
    id: "company-spine-accent-extra",
    x1: "0%", y1: "0%", x2: "100%", y2: "100%"
  }, defs);
  make("stop", { class: "company-spine-accent-extra-start", offset: "0%" }, accentExtra);
  make("stop", { class: "company-spine-accent-extra-end", offset: "100%" }, accentExtra);

  var basePath = make("path", { class: "company-spine-base" });
  var bridges = make("g", { class: "company-spine-bridges" });
  var decor = make("g", { class: "company-spine-decor" });
  var tailPath = make("path", {
    class: "company-spine-tail",
    stroke: "url(#company-spine-tail-gradient)"
  });

  var labelOutline = make("path", { class: "company-spine-label-outline" });
  var labelBand = make("path", { class: "company-spine-label-band" });
  var labelGuide = make("path", {
    id: "company-spine-label-guide",
    class: "company-spine-label-guide"
  });
  var labelText = make("text", { class: "company-spine-label-text" });
  var labelTextPath = make("textPath", {
    href: "#company-spine-label-guide",
    startOffset: "50%",
    "text-anchor": "middle"
  }, labelText);
  labelTextPath.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#company-spine-label-guide");
  labelTextPath.textContent = LABEL;
  var dot = make("circle", { class: "company-spine-dot", r: "6.5" });

  layer.appendChild(svg);
  main.insertBefore(layer, main.firstChild);

  var state = {
    width: 0, height: 0, total: 1, current: 0, target: 0,
    mobile: false, frame: 0, xLeft: 0, xRight: 0, pathStartY: 0, guideKeys: []
  };

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  function mainMetrics() {
    var r = main.getBoundingClientRect();
    return {
      top: r.top + window.scrollY,
      left: r.left + window.scrollX,
      rectTop: r.top,
      rectLeft: r.left
    };
  }

  function separators() {
    return Array.prototype.slice.call(main.children).filter(function (el) {
      return el.classList && (el.classList.contains("rf-joint") || el.classList.contains("rf-ribbon"));
    });
  }

  function gentleTurnYs(metrics) {
    var flow = main.querySelector(".story-flow");
    var list = Array.prototype.slice.call(
      flow ? flow.children : main.querySelectorAll("section")
    ).filter(function (el) { return el.tagName === "SECTION" && el.offsetHeight > 240; });
    var ys = [];
    for (var i = 1; i < list.length; i++) {
      var r = list[i].getBoundingClientRect();
      ys.push(Math.round(r.top - metrics.rectTop));
    }
    return ys;
  }

  function pathPoint(distance) {
    return basePath.getPointAtLength(clamp(distance, 0, state.total));
  }

  function distanceAtY(y) {
    y = clamp(y, 0, state.height - 4);
    var low = 0, high = state.total;
    for (var i = 0; i < 26; i++) {
      var mid = (low + high) / 2;
      if (pathPoint(mid).y < y) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  }

  function lastDistanceAtY(y) {
    y = clamp(y, 0, state.height - 4);
    var low = 0, high = state.total;
    for (var i = 0; i < 26; i++) {
      var mid = (low + high) / 2;
      if (pathPoint(mid).y <= y) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  }

  function subpath(start, end) {
    start = clamp(start, 0, state.total);
    end = clamp(end, 0, state.total);
    if (Math.abs(end - start) < 0.1) return "";
    var len = Math.abs(end - start);
    var direction = end > start ? 1 : -1;
    var steps = Math.max(8, Math.ceil(len / 7));
    var d = "";
    for (var i = 0; i <= steps; i++) {
      var p = pathPoint(start + direction * len * (i / steps));
      d += (i ? " L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1);
    }
    return d;
  }

  function buildGuideKeys(turns) {
    var keys = [{ y: state.pathStartY, distance: 0 }];
    turns.forEach(function (turn, index) {
      var previousY = index ? turns[index - 1].y : state.pathStartY;
      var nextY = index < turns.length - 1 ? turns[index + 1].y : state.height;
      var maxHalf = Math.max(32, Math.min((turn.y - previousY) / 3, (nextY - turn.y) / 3));
      var half = Math.min(state.mobile ? 42 : 150, maxHalf);
      var guideStart = turn.y - half;
      var guideEnd = turn.y + half;
      var distanceStart = distanceAtY(turn.y - turn.radius + 0.25);
      var distanceEnd = lastDistanceAtY(turn.y + turn.radius - 0.25);
      var previous = keys[keys.length - 1];
      if (guideStart > previous.y + 1 && distanceStart > previous.distance + 1) {
        keys.push({ y: guideStart, distance: distanceStart });
      }
      keys.push({ y: guideEnd, distance: distanceEnd });
    });
    keys.push({ y: state.height, distance: state.total });
    state.guideKeys = keys;
  }

  function distanceAtGuideY(y) {
    var keys = state.guideKeys;
    if (!keys.length) return distanceAtY(y);
    y = clamp(y, state.pathStartY, state.height);
    for (var i = 1; i < keys.length; i++) {
      if (y > keys[i].y) continue;
      var a = keys[i - 1];
      var b = keys[i];
      var range = Math.max(1, b.y - a.y);
      var progress = clamp((y - a.y) / range, 0, 1);
      return a.distance + (b.distance - a.distance) * progress;
    }
    return state.total;
  }

  function closestPointAtY(y) {
    var best = pathPoint(0);
    var bestDelta = Infinity;
    var step = Math.max(4, state.total / 900);
    for (var d = 0; d <= state.total; d += step) {
      var p = pathPoint(d);
      var delta = Math.abs(p.y - y);
      if (delta < bestDelta) { best = p; bestDelta = delta; }
    }
    return best;
  }

  function drawBridges(metrics) {
    bridges.innerHTML = "";
    var targets = Array.prototype.slice.call(main.querySelectorAll("[data-spine-bridge]"));

    if (state.mobile) {
      targets.forEach(function (target) {
        target.style.removeProperty("margin-left");
        target.style.removeProperty("margin-right");
        target.style.removeProperty("width");
      });
      return;
    }

    targets.forEach(function (target) {
      var r = target.getBoundingClientRect();
      var y = r.top - metrics.rectTop + r.height * 0.5;
      var spine = closestPointAtY(y);
      var left = r.left - metrics.rectLeft;
      var right = r.right - metrics.rectLeft;
      var attachLeft = Math.abs(spine.x - left) < Math.abs(spine.x - right);

      if (attachLeft) {
        var desiredLeft = spine.x + 14;
        var leftError = desiredLeft - left;
        if (Math.abs(leftError) <= 160 && Math.abs(leftError) > 1) {
          var currentLeftMargin = parseFloat(target.style.marginLeft) || 0;
          var nextLeftMargin = currentLeftMargin + leftError;
          target.style.marginLeft = nextLeftMargin.toFixed(1) + "px";
          target.style.width = "calc(100% - " + nextLeftMargin.toFixed(1) + "px)";
        }
      } else {
        var desiredRight = spine.x - 14;
        var rightError = desiredRight - right;
        if (Math.abs(rightError) <= 160 && Math.abs(rightError) > 1) {
          var currentRightMargin = parseFloat(target.style.marginRight) || 0;
          target.style.marginRight = (currentRightMargin - rightError).toFixed(1) + "px";
        }
      }

      r = target.getBoundingClientRect();
      y = r.top - metrics.rectTop + r.height * 0.5;
      spine = closestPointAtY(y);
      left = r.left - metrics.rectLeft;
      right = r.right - metrics.rectLeft;
      var edge = Math.abs(spine.x - left) < Math.abs(spine.x - right) ? left : right;
      var gap = Math.abs(spine.x - edge);
      if (gap < 4 || gap > 22) return;

      make("path", {
        class: "company-spine-bridge",
        d: "M" + spine.x.toFixed(1) + " " + y.toFixed(1) + " H" + edge.toFixed(1)
      }, bridges);
      make("rect", {
        class: "company-spine-attach-tab",
        x: (edge - (edge < spine.x ? 0 : 10)).toFixed(1),
        y: (y - 4).toFixed(1),
        width: "10",
        height: "8",
        rx: "4"
      }, bridges);
    });
  }

  var SHAPES = [
    { id: "A", viewWidth: 260, viewHeight: 210, dotX: 18, dotY: 180,
      path: "M260 0H74C54 0 40 15 40 34V40C40 60 55 73 74 73H109C137 73 151 87 156 111C161 136 176 150 200 150H260Z" },
    { id: "B", viewWidth: 260, viewHeight: 210, dotX: 18, dotY: 24,
      path: "M260 0H200C173 0 161 14 156 39C151 62 136 75 111 75H74C55 75 40 90 40 109V116C40 135 55 150 74 150H260Z" },
    { id: "D", viewWidth: 280, viewHeight: 230, dotX: 18, dotY: 205,
      path: "M280 0H124C106 0 94 13 94 31V47C94 65 83 78 65 78H58C48 78 40 86 40 96V113C40 132 55 145 74 145H128C153 145 166 158 171 180C175 194 186 200 203 200H280Z" },
    { id: "E", viewWidth: 270, viewHeight: 200, dotX: 18, dotY: 176,
      path: "M270 0H78C57 0 40 17 40 38V40C40 60 56 72 78 72H182C210 72 214 87 214 108V112C214 135 227 147 250 147H270Z" },
    { id: "F", viewWidth: 250, viewHeight: 230, dotX: 18, dotY: 205,
      path: "M250 0H164C144 0 130 15 130 34V48C130 67 117 79 98 79H81C62 79 47 94 47 113V168C47 186 61 200 79 200H250Z" }
  ];
  var FILL_CYCLE = [
    "company-spine-fill-orange",
    "company-spine-fill-peach",
    "company-spine-fill-soft",
    "company-spine-fill-orange",
    "company-spine-fill-peach"
  ];

  function gentleEdgeRect(side, y, visibleWidth, height, radius, className, opacity) {
    var bleed = Math.max(18, radius + 6);
    var x = side === "left" ? -bleed : state.width - visibleWidth;
    var shape = make("rect", {
      class: "company-spine-edge-shape company-spine-rect " + className,
      "data-company-decor": "rect-" + side,
      x: x.toFixed(1), y: y.toFixed(1),
      width: (visibleWidth + bleed).toFixed(1),
      height: height.toFixed(1),
      rx: radius.toFixed(1), ry: radius.toFixed(1)
    }, decor);
    if (opacity != null) shape.setAttribute("opacity", opacity);
    return shape;
  }
  function gentleAccent(shape, side, y, width, opacity, className) {
    var scale = width / shape.viewWidth;
    var bleed = 12;
    var transform;
    if (side === "left") {
      transform = "translate(" + (width - bleed).toFixed(2) + " " + y.toFixed(2) + ") scale(" + (-scale).toFixed(5) + " " + scale.toFixed(5) + ")";
    } else {
      transform = "translate(" + (state.width - width + bleed).toFixed(2) + " " + y.toFixed(2) + ") scale(" + scale.toFixed(5) + ")";
    }
    var group = make("g", {
      class: "company-spine-accent company-spine-accent-" + shape.id.toLowerCase(),
      "data-company-decor": shape.id,
      "data-company-side": side,
      transform: transform
    }, decor);
    if (opacity != null) group.setAttribute("opacity", opacity);
    make("path", { class: "company-spine-accent-path " + className, d: shape.path }, group);
    make("circle", { class: "company-spine-accent-dot", cx: shape.dotX, cy: shape.dotY, r: shape.dotR || 8 }, group);
    return group;
  }

  function gentleMobileDecor() {
    var grp = (body.className.match(/grp-([a-z]+)/) || [])[1] || "about";
    var heroEl = main.querySelector(":scope > .rf-hero") || main.querySelector(".page-header");
    var top = state.pathStartY;
    var heroH = clamp(heroEl ? Math.round(heroEl.getBoundingClientRect().height) : 200, 150, 320);
    var R = "company-spine-fill-orange", P = "company-spine-fill-peach",
        S = "company-spine-fill-soft", X = "company-spine-fill-extra";
    var loY = top + heroH * 0.78; 

    if (grp === "programs") {

      gentleEdgeRect("right", top + 6, 118, heroH * 0.34, 40, R, 0.78);
      gentleAccent(SHAPES[0], "right", top + heroH * 0.30, 150, 0.66, X);
      gentleAccent(SHAPES[3], "left", loY - heroH * 0.10, 128, 0.6, S);
    } else if (grp === "impact") {

      gentleEdgeRect("right", top + 4, 150, heroH * 0.5, 42, R, 0.82);
      gentleAccent(SHAPES[0], "right", top + heroH * 0.48, 118, 0.62, X);
      gentleEdgeRect("left", loY, 108, heroH * 0.48, 36, P, 0.62);
    } else if (grp === "involve") {

      gentleEdgeRect("right", top + 4, 140, heroH * 0.44, 40, R, 0.8);
      gentleEdgeRect("right", top + heroH * 0.52, 116, heroH * 0.42, 36, P, 0.72);
      gentleAccent(SHAPES[0], "right", top + heroH * 0.28, 112, 0.56, X);
      gentleEdgeRect("left", loY, 92, heroH * 0.4, 34, S, 0.6);
    } else if (grp === "news") {

      gentleEdgeRect("right", top + 4, 168, heroH * 0.92, 50, R, 0.82);
      gentleEdgeRect("left", loY - heroH * 0.18, 118, heroH * 0.56, 46, P, 0.6);
    } else if (grp === "neutral") {

      gentleEdgeRect("right", top + 8, 132, heroH * 0.86, 42, R, 0.72);
      gentleEdgeRect("left", loY, 100, heroH * 0.4, 34, S, 0.6);
    } else {

      gentleEdgeRect("right", top + 6, 152, heroH * 0.66, 44, R, 0.82);
      gentleAccent(SHAPES[0], "right", top + heroH * 0.28, 126, 0.7, X);
      gentleEdgeRect("left", loY, 100, heroH * 0.46, 36, P, 0.62);
    }

    var metrics = mainMetrics();
    var cyc = [R, P, S, X];
    Array.prototype.slice.call(main.querySelectorAll(":scope > section.rf-scene")).forEach(function (sc, i) {
      var r = sc.getBoundingClientRect();
      var y = Math.round(r.bottom - metrics.rectTop) - 66;
      gentleAccent(SHAPES[(i + 1) % SHAPES.length], i % 2 ? "left" : "right", y, 116, 0.7, cyc[i % 4]);
    });
  }

  function drawDecor() {
    decor.replaceChildren();

    var mobileDecor = state.width <= 700;
    if (gentle) {

      if (mobileDecor) {
        gentleMobileDecor();
        clearTitleOverlaps();
        return;
      }

      if (state.width < 1360) return;
      var decorMode = body.getAttribute("data-spine-decor") || "rich";
      var gScale = clamp((state.width - 1120) / 320, 0.55, 1);
      var span = Math.max(1, state.height - state.pathStartY);
      var gi, gy, count;
      if (decorMode === "rich") {

        var RICH = ["company-spine-fill-orange", "company-spine-fill-extra", "company-spine-fill-soft",
                    "company-spine-fill-peach", "company-spine-fill-orange", "company-spine-fill-soft",
                    "company-spine-fill-extra", "company-spine-fill-peach"];
        var mar = Math.max(60, (state.width - 1160) / 2);
        var bigW = Math.min(300 * gScale, mar - 6);
        var midW = Math.min(224 * gScale, mar - 6);
        var chipW = Math.max(60, Math.min(150 * gScale, mar - 26));
        var startY = state.pathStartY;
        var grp = (body.className.match(/grp-([a-z]+)/) || [])[1] || "about";

        var headerEl = main.querySelector(".page-header") || main.querySelector(":scope > .rf-hero");
        var heroH = clamp(headerEl ? Math.round(headerEl.getBoundingClientRect().height) - 8 : 210, 170, 320);
        var heroWideW = Math.min(330 * gScale, mar + 140);
        if (grp === "programs") {

          gentleEdgeRect("right", startY + 6, heroWideW, heroH * 1.35, 54 * gScale, "company-spine-fill-orange", 0.82);
          gentleEdgeRect("left", startY + 20, midW, heroH * 0.84, 46 * gScale, "company-spine-fill-peach", 0.5);
          gentleEdgeRect("left", startY + 64 * gScale, midW * 0.78, heroH * 0.58, 40 * gScale, "company-spine-fill-extra", 0.3);
        } else if (grp === "impact") {

          gentleEdgeRect("right", startY + 4, heroWideW, heroH * 0.72, 48 * gScale, "company-spine-fill-orange", 0.82);
          gentleAccent(SHAPES[0], "right", startY + heroH * 0.5, bigW, 0.6, "company-spine-fill-extra");
          gentleEdgeRect("left", startY + heroH * 0.52, midW, heroH * 0.86, 44 * gScale, "company-spine-fill-peach", 0.64);
        } else if (grp === "involve") {

          gentleEdgeRect("right", startY + 4, heroWideW, heroH * 0.56, 46 * gScale, "company-spine-fill-orange", 0.8);
          gentleEdgeRect("right", startY + heroH * 0.62, midW, heroH * 0.42, 42 * gScale, "company-spine-fill-peach", 0.72);
          gentleAccent(SHAPES[0], "right", startY + heroH * 0.34, bigW, 0.6, "company-spine-fill-extra");
          gentleEdgeRect("left", startY + 30, midW, heroH * 0.82, 44 * gScale, "company-spine-fill-soft", 0.6);
        } else if (grp === "news") {

          gentleEdgeRect("right", startY + 8, heroWideW, heroH * 0.92, 50 * gScale, "company-spine-fill-orange", 0.8);
          gentleEdgeRect("right", startY + heroH * 0.3, midW, heroH * 0.66, 44 * gScale, "company-spine-fill-extra", 0.42);
          gentleEdgeRect("right", startY + heroH * 0.56, midW * 0.8, heroH * 0.52, 40 * gScale, "company-spine-fill-peach", 0.26);
          gentleEdgeRect("left", startY + 20, midW, heroH * 0.86, 46 * gScale, "company-spine-fill-soft", 0.5);
        } else if (grp === "neutral") {

          gentleEdgeRect("right", startY + 8, heroWideW * 0.84, heroH * 0.92, 46 * gScale, "company-spine-fill-orange", 0.72);
          gentleEdgeRect("left", startY + 8, midW, heroH * 0.9, 44 * gScale, "company-spine-fill-soft", 0.6);
        } else {

          var aDrop = heroH * 0.3;
          gentleEdgeRect("right", startY + aDrop, heroWideW, heroH * 0.5, 48 * gScale, "company-spine-fill-orange", 0.82);
          gentleEdgeRect("right", startY + aDrop + heroH * 0.68, midW, heroH * 0.5, 44 * gScale, "company-spine-fill-peach", 0.6);
          gentleEdgeRect("left", startY + aDrop + heroH * 0.16, midW, heroH * 0.66, 46 * gScale, "company-spine-fill-extra", 0.56);
        }

        var bTop = startY + heroH + 44;
        var bSpan = Math.max(1, state.height - bTop);
        var i, y, rN, rH, sideA, sideB;
        if (grp === "news") {

          rN = clamp(Math.round(bSpan / 1050), 2, 6); rH = bSpan / rN;
          for (i = 0; i < rN; i++) {
            y = bTop + (i + 0.5) * rH;
            sideA = i % 2 ? "left" : "right";
            gentleEdgeRect(sideA, y - 60 * gScale, midW, 230 * gScale, 48 * gScale, RICH[i % RICH.length], 0.62);
            gentleEdgeRect(sideA, y - 10 * gScale, midW * 0.8, 170 * gScale, 42 * gScale, RICH[(i + 2) % RICH.length], 0.4);
            gentleEdgeRect(sideA, y + 34 * gScale, midW * 0.6, 120 * gScale, 34 * gScale, RICH[(i + 4) % RICH.length], 0.26);
          }
        } else if (grp === "neutral") {

          rN = clamp(Math.round(bSpan / 740), 3, 12); rH = bSpan / rN;
          for (i = 0; i < rN; i++) {
            y = bTop + (i + 0.5) * rH;
            gentleEdgeRect("left", y, chipW, 98 * gScale, 30 * gScale, RICH[i % RICH.length], 0.58);
            gentleEdgeRect("right", y + rH * 0.44, chipW, 84 * gScale, 28 * gScale, RICH[(i + 2) % RICH.length], 0.58);
          }
        } else if (grp === "programs") {

          rN = clamp(Math.round(bSpan / 760), 3, 9); rH = bSpan / rN;
          for (i = 0; i < rN; i++) {
            y = bTop + (i + 0.5) * rH;
            sideA = i % 2 ? "left" : "right";
            gentleEdgeRect(sideA, y - 50 * gScale, midW, 210 * gScale, 46 * gScale, RICH[i % RICH.length], 0.56);
            gentleEdgeRect(sideA, y + 6 * gScale, midW * 0.8, 150 * gScale, 40 * gScale, RICH[(i + 2) % RICH.length], 0.36);
            gentleEdgeRect(sideA, y + 48 * gScale, midW * 0.6, 104 * gScale, 32 * gScale, RICH[(i + 4) % RICH.length], 0.24);
          }
        } else if (grp === "impact") {

          rN = clamp(Math.round(bSpan / 520), 4, 15); rH = bSpan / rN;
          for (i = 0; i < rN; i++) {
            y = bTop + (i + 0.5) * rH;
            sideA = Math.floor(i / 2) % 2 ? "left" : "right";
            sideB = sideA === "left" ? "right" : "left";
            if (i % 2 === 0) gentleAccent(SHAPES[i % SHAPES.length], sideA, y - 52 * gScale, bigW, 0.7, RICH[i % RICH.length]);
            else gentleEdgeRect(sideA, y - 6 * gScale, midW, 142 * gScale, 40 * gScale, RICH[(i + 2) % RICH.length], 0.6);
            gentleEdgeRect(sideB, y + 26 * gScale, chipW, 86 * gScale, 30 * gScale, RICH[(i + 4) % RICH.length], 0.58);
          }
        } else if (grp === "involve") {

          rN = clamp(Math.round(bSpan / 700), 3, 11); rH = bSpan / rN;
          for (i = 0; i < rN; i++) {
            y = bTop + (i + 0.5) * rH;
            sideA = i % 2 ? "left" : "right"; sideB = sideA === "left" ? "right" : "left";
            gentleAccent(SHAPES[i % SHAPES.length], sideA, y - 72 * gScale, bigW, 0.72, RICH[i % RICH.length]);
            gentleEdgeRect(sideA, y + 58 * gScale, midW, 132 * gScale, 40 * gScale, RICH[(i + 2) % RICH.length], 0.6);
            gentleEdgeRect(sideB, y + rH * 0.5, chipW, 92 * gScale, 30 * gScale, RICH[(i + 1) % RICH.length], 0.6);
          }
        } else {

          rN = clamp(Math.round(bSpan / 640), 3, 13); rH = bSpan / rN;
          for (i = 0; i < rN; i++) {
            y = bTop + (i + 0.5) * rH;
            sideA = i % 2 ? "left" : "right"; sideB = sideA === "left" ? "right" : "left";
            gentleAccent(SHAPES[i % SHAPES.length], sideA, y - 70 * gScale, bigW, 0.72, RICH[i % RICH.length]);
            gentleEdgeRect(sideA, y + 44 * gScale, midW, 148 * gScale, 42 * gScale, RICH[(i + 2) % RICH.length], 0.6);
            gentleEdgeRect(sideB, y + rH * 0.4, midW * 0.9, 130 * gScale, 40 * gScale, RICH[(i + 1) % RICH.length], 0.62);
          }
        }
        return;
      }
      if (decorMode === "tabs") {

        count = Math.max(4, Math.min(10, Math.round(span / 850)));
        for (gi = 0; gi < count; gi++) {
          gy = state.pathStartY + (gi + 0.3) * (span / count);
          gentleEdgeRect(gi % 2 ? "left" : "right", gy, (96 + (gi % 3) * 34) * gScale, 40 * gScale, 20 * gScale, FILL_CYCLE[gi % FILL_CYCLE.length], 0.7);
        }
      } else if (decorMode === "nodes") {

        (state.turnList || []).forEach(function (t, ti) {
          gentleEdgeRect("left", t.y - 64 * gScale, (72 + (ti % 2) * 30) * gScale, 56 * gScale, 24 * gScale, FILL_CYCLE[ti % FILL_CYCLE.length], 0.72);
          gentleEdgeRect("right", t.y + 34 * gScale, (72 + ((ti + 1) % 2) * 30) * gScale, 56 * gScale, 24 * gScale, FILL_CYCLE[(ti + 2) % FILL_CYCLE.length], 0.72);
        });
        gentleAccent(SHAPES[0], "right", state.pathStartY + 40, 110 * gScale, 0.6, "company-spine-fill-orange");
      } else {

        count = Math.max(3, Math.min(8, Math.round(span / 1100)));
        for (gi = 0; gi < count; gi++) {
          gy = state.pathStartY + (gi + 0.35) * (span / count);
          gentleEdgeRect(gi % 2 ? "left" : "right", gy, (58 + (gi % 3) * 18) * gScale, 84 * gScale, 30 * gScale, FILL_CYCLE[gi % FILL_CYCLE.length], 0.6);
        }
        gentleAccent(SHAPES[1], "left", state.pathStartY + span * 0.16, 96 * gScale, 0.55, "company-spine-fill-peach");
        gentleAccent(SHAPES[0], "right", state.pathStartY + span * 0.7, 96 * gScale, 0.6, "company-spine-fill-orange");
      }
      return;
    }
    if (!mobileDecor && state.width < 1220) return;

    var metrics = mainMetrics();
    var decorScale = mobileDecor ? 1 : clamp((state.width - 1120) / 320, 0.55, 1);

    function box(el) {
      if (!el) return null;
      var r = el.getBoundingClientRect();
      return { top: r.top - metrics.rectTop, height: r.height, bottom: r.bottom - metrics.rectTop };
    }

    function edgeRect(side, y, visibleWidth, height, radius, className, opacity) {
      visibleWidth *= decorScale;
      height *= decorScale;
      radius *= decorScale;
      var bleed = Math.max(18, radius + 6);
      var x = side === "left" ? -bleed : state.width - visibleWidth;
      var shape = make("rect", {
        class: "company-spine-edge-shape company-spine-rect " + className,
        "data-company-decor": "rect-" + side,
        x: x.toFixed(1), y: y.toFixed(1),
        width: (visibleWidth + bleed).toFixed(1),
        height: height.toFixed(1),
        rx: radius.toFixed(1), ry: radius.toFixed(1)
      }, decor);
      if (opacity != null) shape.setAttribute("opacity", opacity);
      return shape;
    }

    function accent(options) {
      var shape = options.shape;
      var renderedWidth = options.width * decorScale;
      var scale = renderedWidth / shape.viewWidth;
      var bleed = (options.bleed || 12) * decorScale;
      var y = options.y;
      var transform;
      if (options.side === "left") {
        transform = "translate(" + (renderedWidth - bleed).toFixed(2) + " " + y.toFixed(2) + ") scale(" + (-scale).toFixed(5) + " " + scale.toFixed(5) + ")";
      } else {
        transform = "translate(" + (state.width - renderedWidth + bleed).toFixed(2) + " " + y.toFixed(2) + ") scale(" + scale.toFixed(5) + ")";
      }
      var group = make("g", {
        class: "company-spine-accent company-spine-accent-" + shape.id.toLowerCase(),
        "data-company-decor": shape.id,
        "data-company-side": options.side,
        transform: transform
      }, decor);
      if (options.opacity != null) group.setAttribute("opacity", options.opacity);
      make("path", {
        class: "company-spine-accent-path " + options.className,
        d: shape.path
      }, group);
      make("circle", {
        class: "company-spine-accent-dot",
        cx: shape.dotX, cy: shape.dotY, r: shape.dotR || 8
      }, group);
      return group;
    }

    var hero = box(main.querySelector(":scope > .rf-hero"));
    var scenes = Array.prototype.slice.call(main.querySelectorAll(":scope > section.rf-scene")).map(box).filter(Boolean);
    var cta = box(main.querySelector(":scope > .rf-cta"));
    var ctaPanel = box(main.querySelector(":scope > .rf-cta .rf-panel-cta"));

    if (mobileDecor) {

      var mobileShapeBoost = 1.8;
      var mobileEdgeBoost = 1.6;
      if (hero) {
        accent({
          shape: SHAPES[1], side: "left", y: hero.top + 26,
          width: 126 * mobileEdgeBoost, bleed: 10, opacity: 0.72,
          className: "company-spine-fill-peach"
        });
        edgeRect("left", hero.top + 118, 58 * mobileEdgeBoost, 30 * mobileEdgeBoost, 15 * mobileEdgeBoost, "company-spine-fill-soft", 0.7);
        edgeRect("right", hero.top + 110, 72 * mobileEdgeBoost, 38 * mobileEdgeBoost, 19 * mobileEdgeBoost, "company-spine-fill-orange", 0.76);
        accent({
          shape: SHAPES[0], side: "right", y: hero.bottom - 12,
          width: 88 * mobileShapeBoost, bleed: 10, opacity: 0.9,
          className: "company-spine-fill-orange"
        });
      }
      scenes.forEach(function (scene, i) {
        accent({
          shape: SHAPES[(i + 1) % SHAPES.length],
          side: i % 2 ? "right" : "left",
          y: scene.bottom - (i % 2 ? 46 : 12),
          width: 88 * mobileShapeBoost, bleed: 10,
          opacity: i % 2 ? 0.88 : 0.8,
          className: FILL_CYCLE[i % FILL_CYCLE.length]
        });
      });
      if (cta) {
        edgeRect("right", cta.top - 28, 72 * mobileEdgeBoost, 32 * mobileEdgeBoost, 16 * mobileEdgeBoost, "company-spine-fill-orange", 0.76);
        edgeRect("left", cta.top - 16, 106 * mobileEdgeBoost, 34 * mobileEdgeBoost, 17 * mobileEdgeBoost, "company-spine-fill-soft", 0.72);
        if (ctaPanel) {
          edgeRect("left", ctaPanel.bottom + 2, 88 * mobileEdgeBoost, 32 * mobileEdgeBoost, 16 * mobileEdgeBoost, "company-spine-fill-peach", 0.68);
        }
      }

      clearTitleOverlaps();
      return;
    }

    if (hero) {
      edgeRect("left", hero.top + hero.height * 0.42, 132, 300, 44, "company-spine-fill-orange");
      edgeRect("right", hero.top + 8, 170, 360, 44, "company-spine-fill-orange");
      edgeRect("right", hero.bottom - 126, 255, 128, 42, "company-spine-fill-soft", 0.78);
    }

    scenes.forEach(function (scene, i) {
      var side = i % 2 ? "left" : "right";
      var other = side === "left" ? "right" : "left";
      var shape = SHAPES[i % SHAPES.length];
      var tall = Math.max(220, scene.height);
      accent({
        shape: shape, side: side,
        y: scene.top + Math.min(30 * decorScale, tall * 0.1),
        width: 200 + (i % 3) * 22,
        className: FILL_CYCLE[i % FILL_CYCLE.length]
      });
      edgeRect(other, scene.top + tall * 0.32, 96 + (i % 2) * 34, 120, 36, FILL_CYCLE[(i + 1) % FILL_CYCLE.length], 0.72);
      if (tall > 460) {
        edgeRect(side, scene.bottom - 150 * decorScale, 72 + (i % 3) * 26, 96, 34, FILL_CYCLE[(i + 2) % FILL_CYCLE.length], 0.66);
      }
    });

    if (cta) {
      edgeRect("left", cta.top + 132 * decorScale, 116, 92, 34, "company-spine-fill-soft", 0.68);
      edgeRect("right", cta.top + 236 * decorScale, 72, 154, 34, "company-spine-fill-peach", 0.58);
    }
  }

  function textInkRect(el) {
    if (!el || !(el.textContent || "").trim()) return null;
    var r;
    try {
      var range = document.createRange();
      range.selectNodeContents(el);
      r = range.getBoundingClientRect();
    } catch (e) { r = el.getBoundingClientRect(); }
    return (r && r.width >= 1 && r.height >= 1) ? r : null;
  }

  function titleInkRects() {
    var rects = [];
    Array.prototype.slice.call(main.querySelectorAll("h1, h2, h3")).forEach(function (el) {
      var r = textInkRect(el);
      if (r) rects.push(r);
    });
    var hero = main.querySelector(":scope > .rf-hero");
    if (hero) {
      Array.prototype.slice.call(hero.querySelectorAll("*")).forEach(function (el) {
        if (el.children.length === 0 && (el.textContent || "").trim()) {
          var r = textInkRect(el);
          if (r) rects.push(r);
        }
      });
    }
    return rects;
  }

  function clearTitleOverlaps(pad) {
    pad = pad == null ? 8 : pad;
    var rects = titleInkRects();
    if (!rects.length) return;
    Array.prototype.slice.call(decor.children).forEach(function (el) {
      var b = el.getBoundingClientRect();
      if (b.width < 1 || b.height < 1) return;
      for (var i = 0; i < rects.length; i++) {
        var r = rects[i];
        if (b.left < r.right + pad && b.right > r.left - pad &&
            b.top < r.bottom + pad && b.bottom > r.top - pad) {
          el.style.display = "none";
          return;
        }
      }
    });
  }

  function drawPath() {
    var oldTotal = state.total || 1;
    var oldProgress = state.current / oldTotal;
    var metrics = mainMetrics();
    var width = main.clientWidth;
    var height = main.scrollHeight;
    if (!width || !height) return;

    state.width = width;
    state.height = height;
    state.mobile = width <= 700;

    state.gentleActive = gentle && !state.mobile;
    var hero = main.querySelector(gentle ? ".page-header, :scope > .rf-hero" : ":scope > .rf-hero");
    var topNav = main.querySelector(":scope > .exit-nav--top");
    var heroTop = hero ? hero.getBoundingClientRect().top - metrics.rectTop : 0;
    var stickyOffset = topNav ? parseFloat(window.getComputedStyle(topNav).top) || 0 : 0;
    state.pathStartY = Math.max(0, Math.round(heroTop + stickyOffset));
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);

    var route = gentle ? (body.getAttribute("data-spine-route") || "soft") : "";
    var seq = null;   
    var startX;

    if (state.mobile) {
      state.xRight = width - 10;
      state.xLeft = width - 14;
      dot.setAttribute("r", "5.7");
    } else if (gentle) {
      var cor = (width - 1160) / 2;
      var softA, softJog;
      if (cor >= 130) {
        softA = width - 78;
        softJog = Math.min(48, cor - 92);
      } else {
        softA = width - 14;
        softJog = 6;
      }
      softA = Math.round(softA);
      var softB = Math.round(softA - Math.max(6, softJog));
      var farL = Math.round(Math.max(34, (width - 1240) / 2 - 14));
      var farR = Math.round(Math.min(width - 82, width - Math.max(34, (width - 1240) / 2 - 14)));
      var secYs = gentleTurnYs(metrics);
      var wide = cor >= 130; 
      seq = [];
      startX = wide && (route === "mid" || route === "cross" || route === "full") ? farR : softA;
      if (route === "straight") {

        startX = softA;
      } else if (!wide || route === "soft") {
        var flip = false;
        secYs.forEach(function (y) { flip = !flip; seq.push({ y: y, x: flip ? softB : softA }); });
      } else if (route === "wave") {
        var wy = state.pathStartY + 380;
        var wf = false;
        while (wy < height - 320) { wf = !wf; seq.push({ y: Math.round(wy), x: wf ? softB : softA }); wy += 430; }
      } else if (route === "mid") {
        var mf = false;
        secYs.forEach(function (y, i) { if (i % 2 === 0) { mf = !mf; seq.push({ y: y, x: mf ? farL : farR }); } });
      } else if (route === "cross") {
        var midY = state.pathStartY + (height - state.pathStartY) * 0.48;
        var best = null;
        secYs.forEach(function (y) { if (best === null || Math.abs(y - midY) < Math.abs(best - midY)) best = y; });
        if (best !== null) seq.push({ y: best, x: farL });
      } else if (route === "dive") {

        var pen = softA;
        secYs.forEach(function (y, i) {
          var x;
          if (i % 3 === 2) x = farL;
          else if (pen === farL) x = softA;
          else x = pen === softA ? softB : softA;
          seq.push({ y: y, x: x });
          pen = x;
        });
      } else if (route === "full") {
        var ff = false;
        secYs.forEach(function (y) { ff = !ff; seq.push({ y: y, x: ff ? farL : farR }); });
      }
      state.xRight = startX;
      state.xLeft = softB;
      dot.setAttribute("r", "6.5");
    } else {
      var contentGutter = Math.max(34, (width - 1240) / 2 - 14);
      state.xLeft = Math.round(contentGutter);
      state.xRight = Math.round(Math.min(width - 82, width - contentGutter));
      dot.setAttribute("r", "6.5");
    }

    var sep = separators();
    var penX = state.gentleActive ? startX : state.xRight;
    var penY = state.pathStartY;
    var d = "M" + penX + " " + state.pathStartY;
    var turns = [];
    var steps;

    if (state.gentleActive) {
      steps = seq;
    } else {
      steps = sep.map(function (el) {
        var r = el.getBoundingClientRect();
        return { y: Math.round(r.top - metrics.rectTop + r.height / 2), x: null };
      });
    }

    steps.forEach(function (item) {
      var y = item.y;
      var nextX = item.x !== null && item.x !== undefined ? item.x : (penX === state.xRight ? state.xLeft : state.xRight);
      if (nextX === penX) return;
      var dx = nextX - penX;
      var wideTurn = Math.abs(dx) > 200;

      if (gentle && !state.mobile && !wideTurn) {
        var half = 110;
        var yS = y - half;
        var yE = Math.min(y + half, height - 8);
        if (yS > penY + 8) {
          d += " V" + yS;
          d += " C" + penX + " " + y + " " + nextX + " " + y + " " + nextX + " " + yE;
          penX = nextX;
          penY = yE;
          turns.push({ x: penX, y: y, radius: half });
          return;
        }
      }

      var radius = Math.min(state.mobile ? 15 : 30, Math.abs(dx) / 2 - 2, (y - penY) / 2 - 2);

      if (radius >= 8) {
        var sign = dx > 0 ? 1 : -1;
        d += " V" + (y - radius);
        d += " Q" + penX + " " + y + " " + (penX + sign * radius) + " " + y;
        d += " H" + (nextX - sign * radius);
        d += " Q" + nextX + " " + y + " " + nextX + " " + (y + radius);
        penX = nextX;
        penY = y + radius;
        turns.push({ x: penX, y: y, radius: radius });
      } else {
        d += " V" + y;
        penY = y;
      }
    });
    d += " V" + Math.max(penY + 1, height - 4);

    basePath.setAttribute("d", d);
    state.total = Math.max(1, basePath.getTotalLength());
    state.current = clamp(oldProgress * state.total, 0, state.total);
    state.target = state.current;
    state.turnList = turns;
    buildGuideKeys(turns);
    drawBridges(metrics);
    drawDecor();
    updateTarget(true);
  }

  function scrollDistance() {
    var maxLead = state.mobile ? 120 : 160;
    var manualLead = Math.min(window.scrollY * 0.15, maxLead);
    var targetY = state.pathStartY + window.scrollY + manualLead;
    var labelCenterOffset = state.mobile ? 46 : 58;
    return labelCenterOffset + distanceAtGuideY(targetY);
  }

  function updateTarget(immediate) {
    state.target = scrollDistance();
    if (immediate || reduced) {
      if (state.frame) cancelAnimationFrame(state.frame);
      state.frame = 0;
      state.current = state.target;
      render(state.current);
    } else if (!state.frame) {
      state.frame = requestAnimationFrame(function () {
        state.frame = 0;
        state.current = state.target;
        render(state.current);
      });
    }
  }

  function render(distance) {
    if (!state.total) return;
    var labelWidth = state.mobile ? 92 : 116;
    var tailLength = state.mobile ? 70 : 112;
    var dotGap = state.mobile ? 8 : 11;
    var maxRunnerDistance = Math.max(labelWidth / 2, state.total - labelWidth / 2 - dotGap);
    distance = clamp(distance, labelWidth / 2, maxRunnerDistance);
    var labelStart = distance - labelWidth / 2;
    var labelEnd = distance + labelWidth / 2;

    var bandD = subpath(labelStart, labelEnd);
    var bandStart = pathPoint(labelStart);
    var bandEnd = pathPoint(labelEnd);
    var runsMainlyLeft = Math.abs(bandEnd.x - bandStart.x) > Math.abs(bandEnd.y - bandStart.y) && bandEnd.x < bandStart.x;

    labelOutline.setAttribute("d", bandD);
    labelBand.setAttribute("d", bandD);
    labelGuide.setAttribute("d", runsMainlyLeft ? subpath(labelEnd, labelStart) : bandD);

    var dotPoint = pathPoint(distance + labelWidth / 2 + dotGap);
    dot.setAttribute("cx", dotPoint.x.toFixed(1));
    dot.setAttribute("cy", dotPoint.y.toFixed(1));

    var tailEnd = distance - labelWidth / 2 - 4;
    var tailStart = tailEnd - tailLength;
    tailPath.setAttribute("d", subpath(tailStart, tailEnd));
    var startPoint = pathPoint(tailStart);
    var endPoint = pathPoint(tailEnd);
    glow.setAttribute("x1", startPoint.x.toFixed(1));
    glow.setAttribute("y1", startPoint.y.toFixed(1));
    glow.setAttribute("x2", endPoint.x.toFixed(1));
    glow.setAttribute("y2", endPoint.y.toFixed(1));
  }

  var resizeTimer = 0;
  function queueDraw() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(drawPath, 90);
  }

  window.addEventListener("scroll", function () { updateTarget(false); }, { passive: true });
  window.addEventListener("resize", queueDraw);
  window.addEventListener("load", queueDraw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueDraw);
  if (window.ResizeObserver) new ResizeObserver(queueDraw).observe(main);
  drawPath();
})();
