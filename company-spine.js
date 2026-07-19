
(function () {
  "use strict";

  var body = document.body;
  var main = document.querySelector("main.rf");
  if (!body || !main || !body.classList.contains("company-spine-page")) return;

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
  var stripes = make("pattern", {
    id: "company-spine-stripes",
    width: "11",
    height: "11",
    patternUnits: "userSpaceOnUse"
  }, defs);
  make("rect", { class: "company-spine-pattern-bg", x: "0", y: "0", width: "11", height: "11" }, stripes);
  make("rect", { class: "company-spine-pattern-line", x: "0", y: "0", width: "2", height: "11", rx: "1" }, stripes);

  var glow = make("linearGradient", {
    id: "company-spine-tail-gradient",
    gradientUnits: "userSpaceOnUse"
  }, defs);
  make("stop", { class: "company-spine-tail-stop", offset: "0%", "stop-opacity": "0" }, glow);
  make("stop", { class: "company-spine-tail-stop", offset: "54%", "stop-opacity": ".5" }, glow);
  make("stop", { class: "company-spine-tail-stop", offset: "100%", "stop-opacity": "1" }, glow);

  var accentOrange = make("linearGradient", {
    id: "company-spine-accent-orange",
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "100%"
  }, defs);
  make("stop", { class: "company-spine-accent-path-start", offset: "0%" }, accentOrange);
  make("stop", { class: "company-spine-accent-sunset-end", offset: "100%" }, accentOrange);

  var accentPeach = make("linearGradient", {
    id: "company-spine-accent-peach",
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "100%"
  }, defs);
  make("stop", { class: "company-spine-accent-peach-start", offset: "0%" }, accentPeach);
  make("stop", { class: "company-spine-accent-path-end", offset: "100%" }, accentPeach);

  var accentSoft = make("linearGradient", {
    id: "company-spine-accent-soft",
    x1: "0%",
    y1: "0%",
    x2: "100%",
    y2: "100%"
  }, defs);
  make("stop", { class: "company-spine-accent-apricot-start", offset: "0%" }, accentSoft);
  make("stop", { class: "company-spine-accent-honey-end", offset: "100%" }, accentSoft);

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
  var labelText = make("text", {
    class: "company-spine-label-text"
  });
  var labelTextPath = make("textPath", {
    href: "#company-spine-label-guide",
    startOffset: "50%",
    "text-anchor": "middle"
  }, labelText);
  labelTextPath.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#company-spine-label-guide");
  labelTextPath.textContent = "FOR COMPANIES";
  var dot = make("circle", { class: "company-spine-dot", r: "6.5" });

  layer.appendChild(svg);
  main.insertBefore(layer, main.firstChild);

  var state = {
    width: 0,
    height: 0,
    total: 1,
    current: 0,
    target: 0,
    mobile: false,
    frame: 0,
    xLeft: 0,
    xRight: 0,
    pathStartY: 0,
    guideKeys: []
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

  function pathPoint(distance) {
    return basePath.getPointAtLength(clamp(distance, 0, state.total));
  }

  function distanceAtY(y) {
    y = clamp(y, 0, state.height - 4);
    var low = 0;
    var high = state.total;
    for (var i = 0; i < 26; i++) {
      var mid = (low + high) / 2;
      if (pathPoint(mid).y < y) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  }

  function lastDistanceAtY(y) {
    y = clamp(y, 0, state.height - 4);
    var low = 0;
    var high = state.total;
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
      if (delta < bestDelta) {
        best = p;
        bestDelta = delta;
      }
    }
    return best;
  }

  function drawBridges(metrics) {
    bridges.innerHTML = "";
    var targets = [
      main.querySelector('[aria-labelledby="company-data-title"] .rf-stats'),
      main.querySelector('[aria-labelledby="company-onsite-title"] figure'),
      main.querySelector('[aria-labelledby="company-cases-title"] .rf-cases')
    ].filter(Boolean);

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

      var bridge = make("path", {
        class: "company-spine-bridge",
        d: "M" + spine.x.toFixed(1) + " " + y.toFixed(1) + " H" + edge.toFixed(1)
      }, bridges);
      bridge.setAttribute("aria-hidden", "true");

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

  function drawDecor() {
    decor.replaceChildren();

    var mobileDecor = state.width <= 700;
    if (!mobileDecor && state.width < 1220) return;

    var metrics = mainMetrics();
    var decorScale = mobileDecor ? 1 : clamp((state.width - 1120) / 320, 0.55, 1);

    function sectionBox(selector) {
      var el = main.querySelector(selector);
      if (!el) return null;
      var r = el.getBoundingClientRect();
      return {
        top: r.top - metrics.rectTop,
        height: r.height,
        bottom: r.bottom - metrics.rectTop
      };
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
        x: x.toFixed(1),
        y: y.toFixed(1),
        width: (visibleWidth + bleed).toFixed(1),
        height: height.toFixed(1),
        rx: radius.toFixed(1),
        ry: radius.toFixed(1)
      }, decor);
      if (opacity != null) shape.setAttribute("opacity", opacity);
      return shape;
    }

    function accent(options) {
      var renderedWidth = options.width * decorScale;
      var scale = renderedWidth / options.viewWidth;
      var bleed = (options.bleed || 12) * decorScale;
      var y = options.y;
      var transform;
      if (options.side === "left") {
        transform = "translate(" + (renderedWidth - bleed).toFixed(2) + " " + y.toFixed(2) + ") scale(" + (-scale).toFixed(5) + " " + scale.toFixed(5) + ")";
      } else {
        transform = "translate(" + (state.width - renderedWidth + bleed).toFixed(2) + " " + y.toFixed(2) + ") scale(" + scale.toFixed(5) + ")";
      }

      var group = make("g", {
        class: "company-spine-accent company-spine-accent-" + options.id.toLowerCase(),
        "data-company-decor": options.id,
        "data-company-side": options.side,
        transform: transform
      }, decor);
      if (options.opacity != null) group.setAttribute("opacity", options.opacity);
      make("path", {
        class: "company-spine-accent-path " + options.className,
        d: options.path
      }, group);
      make("circle", {
        class: "company-spine-accent-dot",
        cx: options.dotX,
        cy: options.dotY,
        r: options.dotR || 8
      }, group);
      return group;
    }

    var hero = sectionBox(":scope > .rf-hero");
    var why = sectionBox('[aria-labelledby="company-why-title"]');
    var data = sectionBox('[aria-labelledby="company-data-title"]');
    var demand = sectionBox('[aria-labelledby="company-demand-title"]');
    var model = sectionBox('[aria-labelledby="company-model-title"]');
    var onsite = sectionBox('[aria-labelledby="company-onsite-title"]');
    var cases = sectionBox('[aria-labelledby="company-cases-title"]');
    var cta = sectionBox(":scope > .rf-cta");
    var ctaPanel = sectionBox(":scope > .rf-cta .rf-panel-cta");

    if (mobileDecor) {

      var mobileShapeBoost = 1.8;
      var mobileEdgeBoost = 1.6;
      if (hero) {

        accent({
          id: "B-hero", side: "left", y: hero.top + 26,
          width: 126 * mobileEdgeBoost, viewWidth: 260, viewHeight: 210, bleed: 10, opacity: 0.72,
          className: "company-spine-fill-peach",
          path: "M260 0H200C173 0 161 14 156 39C151 62 136 75 111 75H74C55 75 40 90 40 109V116C40 135 55 150 74 150H260Z",
          dotX: 18, dotY: 24
        });
        edgeRect("left", hero.top + 118, 58 * mobileEdgeBoost, 30 * mobileEdgeBoost, 15 * mobileEdgeBoost, "company-spine-fill-soft", 0.7);
        edgeRect("right", hero.top + 110, 72 * mobileEdgeBoost, 38 * mobileEdgeBoost, 19 * mobileEdgeBoost, "company-spine-fill-orange", 0.76);

        accent({
          id: "A", side: "right", y: hero.bottom - 12,
          width: 88 * mobileShapeBoost, viewWidth: 260, viewHeight: 210, bleed: 10, opacity: 0.9,
          className: "company-spine-fill-orange",
          path: "M260 0H74C54 0 40 15 40 34V40C40 60 55 73 74 73H109C137 73 151 87 156 111C161 136 176 150 200 150H260Z",
          dotX: 18, dotY: 180
        });
      }
      if (why) {
        accent({
          id: "B", side: "left", y: why.bottom - 12,
          width: 88 * mobileShapeBoost, viewWidth: 260, viewHeight: 210, bleed: 10, opacity: 0.82,
          className: "company-spine-fill-peach",
          path: "M260 0H200C173 0 161 14 156 39C151 62 136 75 111 75H74C55 75 40 90 40 109V116C40 135 55 150 74 150H260Z",
          dotX: 18, dotY: 24
        });
      }
      if (data) {
        accent({

          id: "D", side: "right", y: data.bottom - 46,
          width: 88 * mobileShapeBoost, viewWidth: 280, viewHeight: 230, bleed: 10, opacity: 0.88,
          className: "company-spine-fill-orange",
          path: "M280 0H124C106 0 94 13 94 31V47C94 65 83 78 65 78H58C48 78 40 86 40 96V113C40 132 55 145 74 145H128C153 145 166 158 171 180C175 194 186 200 203 200H280Z",
          dotX: 18, dotY: 205
        });
      }
      if (model) {
        accent({
          id: "E", side: "left", y: model.bottom - 12,
          width: 96 * mobileShapeBoost, viewWidth: 270, viewHeight: 200, bleed: 10, opacity: 0.78,
          className: "company-spine-fill-peach",
          path: "M270 0H78C57 0 40 17 40 38V40C40 60 56 72 78 72H182C210 72 214 87 214 108V112C214 135 227 147 250 147H270Z",
          dotX: 18, dotY: 176
        });
      }
      if (onsite) {
        accent({
          id: "F", side: "right", y: onsite.bottom - 12,
          width: 82 * mobileShapeBoost, viewWidth: 250, viewHeight: 230, bleed: 12, opacity: 0.9,
          className: "company-spine-fill-orange",
          path: "M250 0H164C144 0 130 15 130 34V48C130 67 117 79 98 79H81C62 79 47 94 47 113V168C47 186 61 200 79 200H250Z",
          dotX: 18, dotY: 205
        });
      }

      if (cta) {

        edgeRect("right", cta.top - 28, 72 * mobileEdgeBoost, 32 * mobileEdgeBoost, 16 * mobileEdgeBoost, "company-spine-fill-orange", 0.76);
        edgeRect("left", cta.top - 16, 106 * mobileEdgeBoost, 34 * mobileEdgeBoost, 17 * mobileEdgeBoost, "company-spine-fill-soft", 0.72);
        if (ctaPanel) {
          edgeRect("left", ctaPanel.bottom + 2, 88 * mobileEdgeBoost, 32 * mobileEdgeBoost, 16 * mobileEdgeBoost, "company-spine-fill-peach", 0.68);
        }
      }
      return;
    }

    if (hero) {
      edgeRect("left", hero.top + hero.height * 0.42, 132, 300, 44, "company-spine-fill-orange");
      edgeRect("right", hero.top + 8, 170, 360, 44, "company-spine-fill-orange");
      edgeRect("right", hero.bottom - 126, 255, 128, 42, "company-spine-fill-soft", 0.78);
    }

    if (why) {

      accent({
        id: "A", side: "right", y: why.top - 40 * decorScale,
        width: 220, viewWidth: 260, viewHeight: 210,
        className: "company-spine-fill-orange",
        path: "M260 0H74C54 0 40 15 40 34V40C40 60 55 73 74 73H109C137 73 151 87 156 111C161 136 176 150 200 150H260Z",
        dotX: 18, dotY: 180
      });
      edgeRect("left", why.bottom - 110 * decorScale, 78, 104, 34, "company-spine-fill-soft", 0.72);
    }

    if (data) {
      edgeRect("left", data.top + 82 * decorScale, 82, 282, 40, "company-spine-fill-peach", 0.62);
      edgeRect("left", data.bottom - 132 * decorScale, 136, 92, 34, "company-spine-fill-orange");
      edgeRect("right", data.top + 156 * decorScale, 76, 164, 36, "company-spine-fill-soft", 0.68);
    }

    if (demand) {
      edgeRect("left", demand.top + 70 * decorScale, 162, 104, 38, "company-spine-fill-orange");

      accent({
        id: "B", side: "left", y: demand.top + 188 * decorScale,
        width: 234, viewWidth: 260, viewHeight: 210,
        className: "company-spine-fill-peach",
        path: "M260 0H200C173 0 161 14 156 39C151 62 136 75 111 75H74C55 75 40 90 40 109V116C40 135 55 150 74 150H260Z",
        dotX: 18, dotY: 24
      });
      edgeRect("right", demand.bottom - 178 * decorScale, 156, 104, 38, "company-spine-fill-sunset", 0.82);
    }

    if (model) {
      edgeRect("left", model.top + 70 * decorScale, 126, 98, 36, "company-spine-fill-sunset", 0.82);
      edgeRect("left", model.bottom - 208 * decorScale, 72, 208, 34, "company-spine-fill-soft", 0.7);

      accent({
        id: "D", side: "right", y: model.top + 16 * decorScale,
        width: 220, viewWidth: 280, viewHeight: 230,
        className: "company-spine-fill-orange",
        path: "M280 0H124C106 0 94 13 94 31V47C94 65 83 78 65 78H58C48 78 40 86 40 96V113C40 132 55 145 74 145H128C153 145 166 158 171 180C175 194 186 200 203 200H280Z",
        dotX: 18, dotY: 205
      });
    }

    if (onsite) {
      edgeRect("right", onsite.top + 50 * decorScale, 130, 86, 34, "company-spine-fill-orange");
      edgeRect("left", onsite.bottom - 116 * decorScale, 64, 108, 34, "company-spine-fill-soft", 0.7);

      accent({
        id: "E", side: "right", y: onsite.bottom + 10 * decorScale,
        width: 258, viewWidth: 270, viewHeight: 200,
        className: "company-spine-fill-peach",
        path: "M270 0H78C57 0 40 17 40 38V40C40 60 56 72 78 72H182C210 72 214 87 214 108V112C214 135 227 147 250 147H270Z",
        dotX: 18, dotY: 176
      });
    }

    if (cases) {

      accent({
        id: "F", side: "left", y: cases.top + 20 * decorScale,
        width: 200, viewWidth: 250, viewHeight: 230, bleed: 30,
        className: "company-spine-fill-orange",
        path: "M250 0H164C144 0 130 15 130 34V48C130 67 117 79 98 79H81C62 79 47 94 47 113V168C47 186 61 200 79 200H250Z",
        dotX: 18, dotY: 205
      });
      edgeRect("left", cases.bottom - 202 * decorScale, 138, 100, 36, "company-spine-fill-peach", 0.66);
      edgeRect("right", cases.top + 150 * decorScale, 64, 282, 34, "company-spine-fill-soft", 0.64);
    }

    if (cta) {
      edgeRect("left", cta.top + 132 * decorScale, 116, 92, 34, "company-spine-fill-soft", 0.68);
      edgeRect("right", cta.top + 236 * decorScale, 72, 154, 34, "company-spine-fill-peach", 0.58);
    }
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
    var hero = main.querySelector(":scope > .rf-hero");
    var topNav = main.querySelector(":scope > .exit-nav--top");
    var heroTop = hero ? hero.getBoundingClientRect().top - metrics.rectTop : 0;

    var stickyOffset = topNav ? parseFloat(window.getComputedStyle(topNav).top) || 0 : 0;
    state.pathStartY = Math.max(0, Math.round(heroTop + stickyOffset));
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);

    if (state.mobile) {

      state.xRight = width - 10;
      state.xLeft = width - 14;
      dot.setAttribute("r", "5.7");
    } else {
      var contentGutter = Math.max(34, (width - 1240) / 2 - 14);
      state.xLeft = Math.round(contentGutter);
      state.xRight = Math.round(Math.min(width - 82, width - contentGutter));
      dot.setAttribute("r", "6.5");
    }

    var sep = separators();
    var penX = state.xRight;
    var penY = state.pathStartY;
    var d = "M" + penX + " " + state.pathStartY;
    var turns = [];

    sep.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var y = Math.round(r.top - metrics.rectTop + r.height / 2);
      var nextX = penX === state.xRight ? state.xLeft : state.xRight;
      var dx = nextX - penX;
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
    buildGuideKeys(turns);
    drawBridges(metrics);
    drawDecor(turns);
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
