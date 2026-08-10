
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

  var baseGrad = make("linearGradient", {
    id: "company-spine-base-gradient",
    gradientUnits: "userSpaceOnUse",
    spreadMethod: "reflect",
    x1: "0", y1: "0", x2: "0", y2: "0"
  }, defs);
  make("stop", { class: "company-spine-base-gradient-start", offset: "0%" }, baseGrad);
  make("stop", { class: "company-spine-base-gradient-end", offset: "100%" }, baseGrad);

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

  svg.insertBefore(decor, basePath);

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

  function edgeGutter() {
    var wrap = main.querySelector(".rf-wrap");
    if (!wrap) return Math.max(0, Math.round((state.width - 1160) / 2));
    var g = wrap.getBoundingClientRect().left - mainMetrics().rectLeft;
    if (!isFinite(g)) g = (state.width - 1160) / 2;
    return Math.max(0, Math.round(g));
  }

  function contentLeft() {
    var ml = mainMetrics().rectLeft;

    var els = main.querySelectorAll("h1, h2, h3, h4, h5, p, li, dd, dt, a, span, strong, em, time, figcaption, label, button, td, th");
    var min = Infinity, seen = 0;
    for (var i = 0; i < els.length && seen < 500; i++) {
      var el = els[i];
      if (el.closest && el.closest(".exit-nav")) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      seen++;
      var l = r.left - ml;
      if (l >= 0 && l < min) min = l;
    }
    return isFinite(min) ? min : edgeGutter();
  }

  function contentRight() {
    var ml = mainMetrics().rectLeft;

    var els = main.querySelectorAll("h1, h2, h3, h4, h5, p, li, dd, dt, a, span, strong, em, time, figcaption, label, button, td, th");
    var max = -Infinity, seen = 0;
    for (var i = 0; i < els.length && seen < 500; i++) {
      var el = els[i];
      if (el.closest && el.closest(".exit-nav")) continue;
      var r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      seen++;
      var rt = r.right - ml;
      if (rt > max) max = rt;
    }
    return isFinite(max) ? max : state.width - 32;
  }

  function textRows(useInk) {
    var mt = mainMetrics().rectTop;
    var rows = [];
    var i, r;
    if (useInk) {
      var list = allInkRects();
      for (i = 0; i < list.length && rows.length < 1200; i++) {
        r = list[i];
        if (r.width < 2 || r.height < 2) continue;
        rows.push({ t: r.top - mt, b: r.bottom - mt });
      }
      return rows;
    }
    var els = main.querySelectorAll("h1, h2, h3, h4, p, li, dd, dt, figcaption");
    var seen = 0;
    for (i = 0; i < els.length && seen < 800; i++) {
      r = els[i].getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      seen++;
      rows.push({ t: r.top - mt, b: r.bottom - mt });
    }
    return rows;
  }

  function bandHit(y, rows, half) {
    var hit = null;
    for (var i = 0; i < rows.length; i++) {
      if (y + half > rows[i].t && y - half < rows[i].b) {
        if (!hit) hit = { t: rows[i].t, b: rows[i].b };
        else { hit.t = Math.min(hit.t, rows[i].t); hit.b = Math.max(hit.b, rows[i].b); }
      }
    }
    return hit;
  }

  function safeTurnY(y, rows, half) {
    var LIMIT = 240;
    var cur = y;
    for (var pass = 0; pass < 6; pass++) {
      var hit = bandHit(cur, rows, half);
      if (!hit) return cur;
      var up = hit.t - half - 6;
      var down = hit.b + half + 6;
      var pick = Math.abs(up - y) <= Math.abs(down - y) ? up : down;
      if (Math.abs(pick - y) > LIMIT) {
        var other = pick === up ? down : up;
        if (Math.abs(other - y) > LIMIT) return y;   
        pick = other;
      }
      cur = pick;
    }
    return bandHit(cur, rows, half) ? y : cur;
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

  var DECOR_GROW = 1.72, GUT_REF = 218;

  var DECOR_GROW_MOBILE = 1.3;

  var DECOR_BOOST = 1.3, DECOR_MAX = 0.95;
  function boostOpacity(o) { return o == null ? o : Math.min(DECOR_MAX, +(o * DECOR_BOOST).toFixed(3)); }

  function gentleEdgeRect(side, y, visibleWidth, height, radius, className, opacity) {
    opacity = boostOpacity(opacity);

    radius = Math.min(radius, height * 0.45);
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

  var DEEP_FILL = ["company-spine-fill-orange", "company-spine-fill-extra"];
  var LITE_FILL = ["company-spine-fill-soft", "company-spine-fill-peach"];

  var SPLIT_DECOR = body.classList.contains("grp-involve");
  function splitGap(h) { return Math.max(14, h * 0.16); }

  var GENTLE_BIG_SHRINK = 0.75;
  var gentleBigH = 200;
  function bigShrink(h) { return h > gentleBigH ? GENTLE_BIG_SHRINK : 1; }

  function gentleDuo(side, y, width, height, radius, i, deepOpacity, liteOpacity) {
    var k = bigShrink(height);
    width *= k; height *= k; radius *= k;

    var offY = height * 0.62;
    if (SPLIT_DECOR) {
      var gap = splitGap(height);
      offY = height + gap;
      y -= (height * 0.38 + gap) / 2;
    }
    tagMotif(gentleEdgeRect(side, y, width, height, radius,
      DEEP_FILL[i % DEEP_FILL.length], deepOpacity || 0.88), "duo");
    tagMotif(gentleEdgeRect(side, y + offY, width * 0.72, height * 0.72, radius * 0.82,
      LITE_FILL[i % LITE_FILL.length], liteOpacity || 0.58), "duo");
  }

  function organicHeight(shape, width) { return width * shape.viewHeight / shape.viewWidth; }
  function tagMotif(el, motif) { if (el) el.setAttribute("data-motif", motif); return el; }

  function gentleOrganic(side, y, width, i, opacity) {
    var shape0 = SHAPES[i % SHAPES.length];
    width *= bigShrink(organicHeight(shape0, width));
    return tagMotif(gentleAccent(shape0, side, y, width,
      opacity == null ? 0.8 : opacity, DEEP_FILL[i % DEEP_FILL.length]), "organic");
  }

  function gentleCombo(side, y, width, radius, i) {
    var shape = SHAPES[i % SHAPES.length];
    var k = bigShrink(organicHeight(shape, width * 0.78));
    width *= k; radius *= k;
    var ow = width * 0.78;
    var oh = organicHeight(shape, ow);

    var barY = y + oh * 0.46;
    if (SPLIT_DECOR) {
      var gap = splitGap(oh);
      y -= (oh * 0.42 + gap) / 2;
      barY = y + oh + gap;
    }
    tagMotif(gentleAccent(shape, side, y, ow, 0.82, DEEP_FILL[i % DEEP_FILL.length]), "combo");
    tagMotif(gentleEdgeRect(side, barY, width, oh * 0.42, radius,
      LITE_FILL[i % LITE_FILL.length], 0.62), "combo");
  }

  function gentleSolo(side, y, width, height, radius, i) {
    var k = bigShrink(height);
    return tagMotif(gentleEdgeRect(side, y, width * k, height * k, radius * k,
      DEEP_FILL[(i + 1) % DEEP_FILL.length], 0.74), "solo");
  }

  function gentleMotif(kind, side, y, width, radius, i, gScale) {
    if (kind === "duo") gentleDuo(side, y, width, 172 * gScale, radius, i);
    else if (kind === "organic") gentleOrganic(side, y, width * 0.94, i);
    else if (kind === "combo") gentleCombo(side, y, width, radius, i);
    else gentleSolo(side, y, width * 0.86, 138 * gScale, radius, i);
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

    return group;
  }

  function gentleMobileDecor() {
    var heroEl = main.querySelector(":scope > .rf-hero") || main.querySelector(".page-header");
    var top = state.pathStartY;

    var heroH = heroEl ? Math.round(heroEl.getBoundingClientRect().height) : 200;

    var mTop = top + heroH + 36;
    var mSpan = Math.max(1, state.height - mTop);
    var mN = clamp(Math.round(mSpan / 380), 10, 18);
    var mRH = mSpan / mN;
    var mOrder = ["organic", "duo", "combo", "solo"];

    var lockSide = body.getAttribute("data-mobile-decor-side");
    for (var mi = 0; mi < mN; mi++) {

      gentleMotif(mOrder[mi % 4], lockSide || (mi % 2 ? "left" : "right"),
        mTop + (mi + 0.5) * mRH - 22, 44 * DECOR_GROW_MOBILE, 14 * DECOR_GROW_MOBILE,
        mi, 0.32 * DECOR_GROW_MOBILE);
    }
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

      var gut = edgeGutter();
      if (gut < 40) return;
      var decorMode = body.getAttribute("data-spine-decor") || "rich";
      var gScale = clamp(gut / GUT_REF, 0.55, 1) * DECOR_GROW;

      gentleBigH = 118 * gScale;
      var span = Math.max(1, state.height - state.pathStartY);
      var gi, gy, count;
      if (decorMode === "rich") {

        var RICH = ["company-spine-fill-orange", "company-spine-fill-extra", "company-spine-fill-soft",
                    "company-spine-fill-peach", "company-spine-fill-orange", "company-spine-fill-soft",
                    "company-spine-fill-extra", "company-spine-fill-peach"];
        var mar = gut;
        var bigW = Math.min(300 * gScale, mar - 6);
        var midW = Math.min(224 * gScale, mar - 6);
        var chipW = Math.max(60, Math.min(150 * gScale, mar - 26));
        var startY = state.pathStartY;
        var grp = (body.className.match(/grp-([a-z]+)/) || [])[1] || "about";

        var headerEl = main.querySelector(".page-header") || main.querySelector(":scope > .rf-hero");
        var heroH = clamp(headerEl ? Math.round(headerEl.getBoundingClientRect().height) - 8 : 210, 170, 320);

        var heroRealH = headerEl ? Math.round(headerEl.getBoundingClientRect().height) : heroH;
        var heroWideW = Math.min(330 * gScale, mar + 140);

        var HERO_BLOCKS_OFF = true;
        if (HERO_BLOCKS_OFF) {

        } else if (grp === "programs") {

          gentleEdgeRect("right", startY + 6, heroWideW, heroH * 1.35, 54 * gScale, "company-spine-fill-orange", 0.82);

          gentleDuo("left", startY + 20, midW, heroH * 0.7, 46 * gScale, 1);
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

          gentleDuo("right", startY + 8, heroWideW, heroH * 0.78, 50 * gScale, 0);
          gentleEdgeRect("left", startY + 20, midW, heroH * 0.86, 46 * gScale, "company-spine-fill-soft", 0.6);
        } else if (grp === "neutral") {

          gentleEdgeRect("right", startY + 8, heroWideW * 0.84, heroH * 0.92, 46 * gScale, "company-spine-fill-orange", 0.72);
          gentleEdgeRect("left", startY + 8, midW, heroH * 0.9, 44 * gScale, "company-spine-fill-soft", 0.6);
        } else {

          var aDrop = heroH * 0.3;
          gentleEdgeRect("right", startY + aDrop, heroWideW, heroH * 0.5, 48 * gScale, "company-spine-fill-orange", 0.82);
          gentleEdgeRect("right", startY + aDrop + heroH * 0.68, midW, heroH * 0.5, 44 * gScale, "company-spine-fill-peach", 0.6);
          gentleEdgeRect("left", startY + aDrop + heroH * 0.16, midW, heroH * 0.66, 46 * gScale, "company-spine-fill-extra", 0.56);
        }

        var bTop = startY + Math.max(heroH, heroRealH) + 44;
        var bSpan = Math.max(1, state.height - bTop);
        var i, y, rN, rH, sideA, sideB;
        var PLAN = {

          news:     { order: ["duo", "organic", "combo", "solo"], gap: 900, max: 8,  alt: "row",  chip: false, w: 1 },
          programs: { order: ["combo", "duo", "solo", "organic"], gap: 700, max: 10, alt: "pair", chip: false, w: 1 },
          impact:   { order: ["organic", "duo", "combo", "solo"], gap: 620, max: 12, alt: "pair", chip: true,  w: 0.94 },
          involve:  { order: ["combo", "solo", "duo", "organic"], gap: 680, max: 11, alt: "row",  chip: true,  w: 1 },
          neutral:  { order: ["solo", "organic", "duo", "combo"], gap: 780, max: 10, alt: "row",  chip: false, w: 0.78 },

          about:    { order: ["organic", "combo", "solo", "duo"], gap: 640, max: 12, alt: "row",  chip: true,  w: 1,
                      sizes: [1, 0.72, 0.95, 0.8], chipFlat: true }
        };
        var plan = PLAN[grp] || PLAN.about;
        var flatW = Math.min(300 * gScale, mar - 6);
        rN = clamp(Math.round(bSpan / plan.gap), 4, plan.max); rH = bSpan / rN;
        for (i = 0; i < rN; i++) {
          y = bTop + (i + 0.5) * rH;
          sideA = (plan.alt === "pair" ? Math.floor(i / 2) : i) % 2 ? "left" : "right";
          sideB = sideA === "left" ? "right" : "left";
          var sizeAt = plan.sizes ? plan.sizes[i % plan.sizes.length] : 1;
          gentleMotif(plan.order[i % 4], sideA, y - 60 * gScale, midW * plan.w * sizeAt, 44 * gScale, i, gScale * plan.w * sizeAt);

          if (plan.chip && i % 2 === 1) {
            if (plan.chipFlat) gentleSolo(sideB, y + rH * 0.42, flatW, 52 * gScale, 26 * gScale, i);
            else gentleSolo(sideB, y + rH * 0.42, chipW, 88 * gScale, 28 * gScale, i);
          }
        }

        if (SPLIT_DECOR) clearTitleOverlaps();
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
    var gutN = mobileDecor ? 0 : edgeGutter();
    if (!mobileDecor && gutN < 40) return;

    var metrics = mainMetrics();

    var AUD_DECOR_SHRINK = 0.5;
    var decorScale = mobileDecor ? DECOR_GROW_MOBILE
      : clamp(gutN / GUT_REF, 0.55, 1) * DECOR_GROW * AUD_DECOR_SHRINK;

    var innerLimit = mobileDecor ? Infinity : Math.max(28, gutN - 6);

    function box(el) {
      if (!el) return null;
      var r = el.getBoundingClientRect();
      return { top: r.top - metrics.rectTop, height: r.height, bottom: r.bottom - metrics.rectTop };
    }

    function edgeRect(side, y, visibleWidth, height, radius, className, opacity) {
      visibleWidth *= decorScale;
      height *= decorScale;
      radius *= decorScale;
      visibleWidth = Math.min(visibleWidth, innerLimit);
      radius = Math.min(radius, visibleWidth * 0.5);
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
      var bleed = (options.bleed || 12) * decorScale;

      var renderedWidth = Math.min(options.width * decorScale, innerLimit + bleed);
      var scale = renderedWidth / shape.viewWidth;
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

      return group;
    }

    var hero = box(main.querySelector(":scope > .rf-hero"));
    var scenes = Array.prototype.slice.call(main.querySelectorAll(":scope > section.rf-scene")).map(box).filter(Boolean);
    var cta = box(main.querySelector(":scope > .rf-cta"));
    var ctaPanel = box(main.querySelector(":scope > .rf-cta .rf-panel-cta"));

    if (mobileDecor) {

      var mobileShapeBoost = 1.8;
      var mobileEdgeBoost = 1.6;

      var mLock = body.getAttribute("data-mobile-decor-side");
      var mSide = function (i) { return mLock || (i % 2 ? "right" : "left"); };
      var mPlace = function (i, y) {
        var kind = ["organic", "duo", "combo", "solo"][i % 4];
        var side = mSide(i);

        var ow = 62;
        if (kind === "duo") {
          tagMotif(edgeRect(side, y, 44, 34, 13, "company-spine-fill-orange", 0.88), "duo");
          tagMotif(edgeRect(side, y + 34 * 0.62, 32, 24, 11, "company-spine-fill-soft", 0.6), "duo");
          return;
        }
        if (kind === "solo") {
          tagMotif(edgeRect(side, y, 40, 28, 12, FILL_CYCLE[i % FILL_CYCLE.length], 0.76), "solo");
          return;
        }
        var shape = SHAPES[(i + 1) % SHAPES.length];
        tagMotif(accent({
          shape: shape, side: side, y: y, width: ow, bleed: 10, opacity: 0.86,
          className: kind === "combo" ? "company-spine-fill-extra" : FILL_CYCLE[i % FILL_CYCLE.length]
        }), kind === "combo" ? "combo" : "organic");
        if (kind === "combo") {
          var oh = ow * shape.viewHeight / shape.viewWidth;
          tagMotif(edgeRect(side, y + oh * 0.58, ow * 0.62, oh * 0.66, 14,
            "company-spine-fill-peach", 0.66), "combo");
        }
      };

      var aTop = (hero ? hero.bottom : 200) + 40;

      var aSpan = Math.max(1, (cta ? cta.top - 80 : state.height) - aTop);
      var aN = clamp(Math.round(aSpan / 380), 10, 18);
      for (var ai = 0; ai < aN; ai++) mPlace(ai, aTop + (ai + 0.5) * (aSpan / aN) - 20);
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

    var heroFloorL = -Infinity, heroFloorR = -Infinity;
    if (hero && state.width > 920) {
      var hy1 = hero.top + hero.height * 0.42;
      var hy2 = hero.top + 8;
      var hy3 = hero.bottom - 126 * decorScale;
      edgeRect("left", hy1, 132, 300, 44, "company-spine-fill-orange");
      edgeRect("right", hy2, 170, 360, 44, "company-spine-fill-orange");
      edgeRect("right", hy3, 255, 128, 42, "company-spine-fill-soft", 0.78);
      heroFloorL = hy1 + 300 * decorScale;
      heroFloorR = Math.max(hy2 + 360 * decorScale, hy3 + 128 * decorScale);
    }

    scenes.forEach(function (scene, i) {
      var side = i % 2 ? "left" : "right";
      var other = side === "left" ? "right" : "left";
      var shape = SHAPES[i % SHAPES.length];
      var tall = Math.max(220, scene.height);
      var top = scene.top + Math.min(30 * decorScale, tall * 0.1);

      var floorSame = side === "left" ? heroFloorL : heroFloorR;
      var floorOther = other === "left" ? heroFloorL : heroFloorR;
      if (i === 0 && isFinite(floorSame)) top = Math.max(top, floorSame + 26);
      var kind = i % 3;
      var ow = 200 + (i % 3) * 22;
      if (kind === 1) {

        tagMotif(edgeRect(side, top, 128, 190, 44, "company-spine-fill-orange", 0.88), "duo");
        tagMotif(edgeRect(side, top + 190 * decorScale * 0.62, 92, 138, 36, "company-spine-fill-soft", 0.6), "duo");
      } else {
        tagMotif(accent({
          shape: shape, side: side, y: top, width: ow,
          className: kind === 2 ? "company-spine-fill-extra" : FILL_CYCLE[i % FILL_CYCLE.length]
        }), kind === 2 ? "combo" : "organic");
        if (kind === 2) {

          var oh = ow * shape.viewHeight / shape.viewWidth;
          tagMotif(edgeRect(side, top + oh * decorScale * 0.58, ow * 0.62, oh * 0.66, 34,
            "company-spine-fill-peach", 0.66), "combo");
        }
      }
      var otherY = scene.top + tall * 0.32;
      if (i === 0 && isFinite(floorOther)) otherY = Math.max(otherY, floorOther + 26);
      tagMotif(edgeRect(other, otherY, 96 + (i % 2) * 34, 120, 36,
        FILL_CYCLE[(i + 1) % FILL_CYCLE.length], 0.72), "solo");

      if (tall > 460 * decorScale) {
        tagMotif(edgeRect(side, scene.bottom - 150 * decorScale, 72 + (i % 3) * 26, 96, 34,
          FILL_CYCLE[(i + 2) % FILL_CYCLE.length], 0.66), "solo");
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

  function allInkRects() {
    var rects = [];
    var walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!(node.nodeValue || "").trim()) return NodeFilter.FILTER_REJECT;
        var pe = node.parentElement;
        if (!pe || layer.contains(pe)) return NodeFilter.FILTER_REJECT;
        var cs = window.getComputedStyle(pe);
        if (cs.display === "none" || cs.visibility === "hidden") return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node, list, i, r;
    while ((node = walker.nextNode())) {
      var range = document.createRange();
      try { range.selectNodeContents(node); } catch (e) { continue; }
      list = range.getClientRects();
      for (i = 0; i < list.length; i++) {
        r = list[i];
        if (r.width >= 1 && r.height >= 1) rects.push(r);
      }
    }
    return rects;
  }

  function clearTitleOverlaps(pad) {
    pad = pad == null ? 8 : pad;
    var rects = allInkRects();
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
    state.textLen = 0; 
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

      var mCarClear = 16;
      state.xRight = width - 20;
      state.xLeft = Math.min(
        width - 24,
        Math.round(Math.max(contentRight() + mCarClear, width - 100))
      );
      dot.setAttribute("r", "6.5");
    } else if (gentle) {

      var cor = edgeGutter();
      var softA = Math.round(width - clamp(cor * 0.56, 24, 78));
      var softJog = Math.round(clamp(cor * 0.34, 10, 48));

      if (width <= 920) {
        softJog = Math.max(softJog, softA - Math.round(contentRight() + 22));
      }
      var softB = Math.round(softA - Math.max(6, softJog));
      var farL = Math.round(clamp(cor * 0.6, 30, 100));
      var farR = Math.round(Math.min(width - 82, width - farL));
      var secYs = gentleTurnYs(metrics);
      var wide = cor >= 70; 

      var CAR_CLEAR = 22;
      var leftRoom = Math.min(cor, contentLeft());
      var navEl = main.querySelector(".exit-nav");
      if (navEl) {
        var navLeft = navEl.getBoundingClientRect().left - mainMetrics().rectLeft;
        if (isFinite(navLeft)) leftRoom = Math.min(leftRoom, navLeft);
      }
      var canDive = leftRoom >= 30 + CAR_CLEAR;
      if (canDive) {
        if (farL > leftRoom - CAR_CLEAR) farL = Math.round(leftRoom - CAR_CLEAR);
        farR = Math.round(Math.min(width - 82, width - farL));
      } else if (route === "mid" || route === "cross" || route === "dive" || route === "full") {
        route = "soft";
      }
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

      if (seq.length) {

        var narrowTurn = width <= 920;
        var turnHalf = narrowTurn ? 38 : 95;
        var rowsForTurn = textRows(narrowTurn);
        seq = seq.filter(function (s) {
          var ny = safeTurnY(s.y, rowsForTurn, turnHalf);
          if (bandHit(ny, rowsForTurn, turnHalf)) return !narrowTurn;
          s.y = ny;
          return true;
        });
      }
      state.xRight = startX;
      state.xLeft = softB;
      dot.setAttribute("r", "6.5");
    } else {
      var corridor = Math.round(clamp(edgeGutter() * 0.6, 30, 100));

      var lroom = Math.min(edgeGutter(), contentLeft());
      var carHalfMax = 14, safeGap = 8;
      if (corridor + carHalfMax + safeGap > lroom) {
        corridor = Math.max(12, Math.round(lroom - carHalfMax - safeGap));
      }
      state.xLeft = corridor;
      state.xRight = Math.round(Math.min(width - 82, width - corridor));
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

      if (!steps.length) {
        steps = gentleTurnYs(metrics).map(function (y) { return { y: y, x: null }; });
      }
    }

    steps.forEach(function (item) {
      var y = item.y;
      var nextX = item.x !== null && item.x !== undefined ? item.x : (penX === state.xRight ? state.xLeft : state.xRight);
      if (nextX === penX) return;
      var dx = nextX - penX;
      var wideTurn = Math.abs(dx) > 200;

      if (gentle && !state.mobile && width > 920 && !wideTurn) {
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

      var radiusCap = state.width <= 920 ? 28 : 30;
      var radius = Math.min(radiusCap, Math.abs(dx) / 2 - 2, (y - penY) / 2 - 2);

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

    var segPeriod = turns.length >= 2
      ? (turns[turns.length - 1].y - turns[0].y) / (turns.length - 1)
      : (height - state.pathStartY) / 4;
    segPeriod = clamp(segPeriod, 360, 900);
    baseGrad.setAttribute("y1", state.pathStartY);
    baseGrad.setAttribute("y2", state.pathStartY + segPeriod);
    buildGuideKeys(turns);
    drawBridges(metrics);
    drawDecor();
    updateTarget(true);
  }

  function labelLen() {
    var LABEL_PAD = 23, LABEL_MIN = 74, LABEL_MAX = 176;
    if (!state.textLen) {
      try { state.textLen = labelText.getComputedTextLength() || 0; } catch (e) { state.textLen = 0; }
    }
    if (!state.textLen) return 116;
    return clamp(Math.round(state.textLen + LABEL_PAD * 2), LABEL_MIN, LABEL_MAX);
  }

  function scrollDistance() {
    var maxLead = state.mobile ? 120 : 160;
    var manualLead = Math.min(window.scrollY * 0.15, maxLead);
    var targetY = state.pathStartY + window.scrollY + manualLead;
    var dist = labelLen() / 2 + distanceAtGuideY(targetY);

    var maxScroll = Math.max(1, (document.documentElement.scrollHeight || state.height) - window.innerHeight);
    var tail = clamp((window.scrollY / maxScroll - 0.8) / 0.2, 0, 1);
    return dist + (state.total - dist) * tail;
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

    var tailLength = 112;
    var dotGap = 11;

    var labelWidth = labelLen();
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
