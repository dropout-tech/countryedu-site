const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (header) {
  const syncHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();
}

(() => {
  const nav = document.querySelector(".desktop-nav");
  if (!nav) return;
  const here = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (here === "" || here === "index.html") return; 
  for (const item of nav.querySelectorAll(".nav-item")) {
    const hit = [...item.querySelectorAll("a[href]")].some((a) => {
      const file = (a.getAttribute("href") || "").split("#")[0].split("/").pop().toLowerCase();
      return file && file === here;
    });
    if (hit) {
      item.classList.add("is-current");
      break; 
    }
  }
})();

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    mobileMenu.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      mobileMenu.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    });
  });

  mobileMenu.querySelectorAll("[data-m-toggle]").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const group = toggle.closest("[data-m-group]");
      if (!group) return;
      const expanded = group.classList.toggle("is-expanded");
      toggle.setAttribute("aria-expanded", String(expanded));
    });
  });
}

function activateTab(buttons, panels, key, attr) {
  buttons.forEach((button) => {
    const active = button.dataset[key] === attr;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset[`${key}Panel`] === attr);
  });
}

const actTabs = document.querySelectorAll("[data-tab]");
const actPanels = document.querySelectorAll("[data-tab-panel]");
actTabs.forEach((button) => {
  button.addEventListener("click", () => activateTab(actTabs, actPanels, "tab", button.dataset.tab));
});

const audienceTabs = document.querySelectorAll("[data-audience]");
const audiencePanels = document.querySelectorAll("[data-audience-panel]");
audienceTabs.forEach((button) => {
  button.addEventListener("click", () =>
    activateTab(audienceTabs, audiencePanels, "audience", button.dataset.audience)
  );
});

const applyTabs = document.querySelectorAll("[data-apply]");
const applyPanels = document.querySelectorAll("[data-apply-panel]");
applyTabs.forEach((button) => {
  button.addEventListener("click", () =>
    activateTab(applyTabs, applyPanels, "apply", button.dataset.apply)
  );
});

function scrollToHashTarget(behavior = "smooth") {
  const hash = window.location.hash;
  if (!hash || hash === "#top") return;
  const target = document.querySelector(hash);
  if (!target) return;
  let offset = 82;

  const subnav = document.querySelector(".exit-nav");
  if (subnav && (subnav.classList.contains("exit-nav--top") || window.matchMedia("(max-width: 960px)").matches)) {
    offset += subnav.offsetHeight;
  }
  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? "auto" : behavior });
}

window.addEventListener("hashchange", () => scrollToHashTarget());
window.addEventListener("load", () => {
  window.setTimeout(() => scrollToHashTarget("auto"), 80);
});

const exitSigns = document.querySelectorAll(".exit-sign[data-exit-target]");
if (exitSigns.length) {
  const isCompact = () => window.matchMedia("(max-width: 960px)").matches;
  const manualScrollOnly = document.body.classList.contains("company-spine-page");
  const signTargets = [...exitSigns]
    .map((sign) => document.getElementById(sign.dataset.exitTarget))
    .filter(Boolean);

  const clearZones = [...document.querySelectorAll("[data-exit-clear]")];

  const setActive = (id) => {
    exitSigns.forEach((sign) => {
      const on = sign.dataset.exitTarget === id;
      sign.classList.toggle("is-active", on);
      if (on) sign.setAttribute("aria-current", "location");
      else sign.removeAttribute("aria-current");

      if (on && isCompact()) {
        if (manualScrollOnly) {

          const rail = sign.closest(".exit-rail");
          if (rail) {
            const targetLeft = sign.offsetLeft - (rail.clientWidth - sign.offsetWidth) / 2;
            rail.scrollTo({ left: Math.max(0, targetLeft), behavior: reducedMotion ? "auto" : "smooth" });
          }
        } else if (typeof sign.scrollIntoView === "function") {
          sign.scrollIntoView({ inline: "center", block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
        }
      }
    });
  };

  let activeId = signTargets[0] ? signTargets[0].id : null;
  if (activeId) setActive(activeId);

  exitSigns.forEach((sign) => {
    sign.addEventListener("click", () => {
      activeId = sign.dataset.exitTarget;
      setActive(activeId);
    });
  });

  if (signTargets.length && "IntersectionObserver" in window) {
    const visible = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        });

        const current = signTargets.find((t) => visible.has(t));
        if (current) {
          if (current.id !== activeId) {
            activeId = current.id;
            setActive(current.id);
          }
        } else if (clearZones.some((z) => visible.has(z)) && activeId !== null) {
          activeId = null;
          setActive(null);
        }
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 }
    );
    [...signTargets, ...clearZones].forEach((t) => observer.observe(t));
  }
}

const impactStepper = document.querySelector("[data-impact-stepper]");
if (impactStepper) {
  const stepItems = [...impactStepper.querySelectorAll(".istep-item")];
  const stepFigs = [...impactStepper.querySelectorAll(".istep-fig")];
  const stepTrack = impactStepper.querySelector(".istep-track");
  const stepSticky = impactStepper.querySelector(".istep-sticky");
  let stepCurrent = -1;
  const setStep = (i) => {
    if (i === stepCurrent) return;
    stepCurrent = i;
    stepItems.forEach((el, n) => el.classList.toggle("is-on", n === i));
    stepFigs.forEach((el, n) => el.classList.toggle("is-on", n === i));
  };
  setStep(0);

  const stepPinned = () => window.matchMedia("(min-width: 861px)").matches;

  const onStepScroll = () => {
    if (!stepPinned()) return;
    const rect = stepTrack.getBoundingClientRect();
    const scrollable = stepTrack.offsetHeight - stepSticky.offsetHeight;
    if (scrollable <= 0) return;
    const p = Math.min(1, Math.max(0, (96 - rect.top) / scrollable));
    setStep(Math.min(stepItems.length - 1, Math.floor(p * stepItems.length)));
  };
  window.addEventListener("scroll", onStepScroll, { passive: true });
  onStepScroll();

  if ("IntersectionObserver" in window) {
    const stepIO = new IntersectionObserver(
      (entries) => {
        if (stepPinned()) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) setStep(stepItems.indexOf(entry.target));
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    stepItems.forEach((el) => stepIO.observe(el));
  }
}

const journeyLines = [...document.querySelectorAll(".journey-line")]
  .map((line) => ({ line, nodes: [...line.querySelectorAll(".journey-node")] }))
  .filter((entry) => entry.nodes.length > 1);
if (journeyLines.length) {

  const isStacked = (nodes) =>
    nodes.every(
      (node, i) =>
        i === 0 ||
        node.getBoundingClientRect().top - nodes[i - 1].getBoundingClientRect().top > 24
    );
  let journeyTicking = false;
  const updateJourneyDots = () => {
    journeyTicking = false;
    const vh = window.innerHeight;
    const markLine = vh * 0.45; 
    journeyLines.forEach(({ line, nodes }) => {
      line.classList.add("is-spy");
      let current;
      if (isStacked(nodes)) {

        current = nodes[0];
        nodes.forEach((node) => {
          if (node.getBoundingClientRect().top <= markLine) current = node;
        });
      } else {

        const r = line.getBoundingClientRect();
        const span = vh * 0.6 || 1;
        const prog = Math.min(1, Math.max(0, (vh * 0.75 - r.top) / span));
        current = nodes[Math.min(nodes.length - 1, Math.floor(prog * nodes.length))];
      }
      nodes.forEach((node) => node.classList.toggle("is-active", node === current));
    });
  };
  const onJourneyScroll = () => {
    if (journeyTicking) return;
    journeyTicking = true;
    window.requestAnimationFrame(updateJourneyDots);
  };
  window.addEventListener("scroll", onJourneyScroll, { passive: true });
  window.addEventListener("resize", onJourneyScroll, { passive: true });
  updateJourneyDots();
}

const mcWedges = document.querySelectorAll(".mc-wedge[data-stage]");
const mcDetails = document.querySelectorAll(".mc-detail-item[data-stage]");
if (mcWedges.length && mcDetails.length) {
  const showStage = (stage) => {
    mcWedges.forEach((w) => w.classList.toggle("is-active", w.dataset.stage === stage));
    mcDetails.forEach((d) => d.classList.toggle("is-active", d.dataset.stage === stage));
  };
  mcWedges.forEach((wedge) => {
    const stage = wedge.dataset.stage;
    wedge.addEventListener("mouseenter", () => showStage(stage));
    wedge.addEventListener("focus", () => showStage(stage));
    wedge.addEventListener("click", () => showStage(stage));
    wedge.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showStage(stage);
      }
    });
  });
}

const mcCycle = document.querySelector(".method-cycle");
const mcFoldBars = document.querySelectorAll(".mc-fold-bar[aria-controls]");
if (mcCycle && mcFoldBars.length) {

  mcCycle.classList.add("is-enhanced", "fold-init");
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => mcCycle.classList.remove("fold-init"));
  });
  mcFoldBars.forEach((bar) => {
    bar.addEventListener("click", () => {
      const body = document.getElementById(bar.getAttribute("aria-controls"));
      if (!body) return;
      const open = bar.getAttribute("aria-expanded") === "true";
      bar.setAttribute("aria-expanded", String(!open));
      body.classList.toggle("open", !open);
    });
  });
}

document.querySelectorAll(".partner-logos:not(.partner-marquee), .home .problem-section .initiative-cards").forEach((wall) => {
  const items = wall.querySelectorAll("li");
  if (!items.length) return;
  items.forEach((li, i) => li.style.setProperty("--i", i));
  wall.classList.add("reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    wall.classList.add("in");
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          wall.classList.add("in");
          io.disconnect();
        }
      });
    },
    { threshold: 0.18 }
  );
  io.observe(wall);
});

const pressFilters = document.querySelectorAll("[data-press-filter]");
if (pressFilters.length) {
  const pressCards = document.querySelectorAll("[data-press-cat]");
  const applyPressFilter = (cat) => {
    pressFilters.forEach((button) => {
      const on = button.dataset.pressFilter === cat;
      button.classList.toggle("is-active", on);
      button.setAttribute("aria-pressed", String(on));
    });
    pressCards.forEach((card) => {
      const cats = (card.dataset.pressCat || "").split(" ");
      card.hidden = cat !== "all" && !cats.includes(cat);
    });
  };
  pressFilters.forEach((button) => {
    button.addEventListener("click", () => applyPressFilter(button.dataset.pressFilter));
  });
}

const pressSortButtons = document.querySelectorAll("[data-press-sort]");
if (pressSortButtons.length) {
  const list = document.querySelector(".news-list");
  if (list) {
    const cards = [...list.querySelectorAll(".news-card")];
    const dateOf = (card) => {
      const t = card.querySelector("time");
      return (t && t.getAttribute("datetime")) || "";
    };
    const applyPressSort = (dir) => {
      pressSortButtons.forEach((button) => {
        const on = button.dataset.pressSort === dir;
        button.classList.toggle("is-active", on);
        button.setAttribute("aria-pressed", String(on));
      });
      const sorted = [...cards].sort((a, b) =>
        dir === "oldest" ? dateOf(a).localeCompare(dateOf(b)) : dateOf(b).localeCompare(dateOf(a))
      );
      sorted.forEach((card) => list.appendChild(card));
    };
    pressSortButtons.forEach((button) => {
      button.addEventListener("click", () => applyPressSort(button.dataset.pressSort));
    });
  }
}

const floatDock = document.querySelector("[data-float-dock]");
if (floatDock) {
  const dockTab = floatDock.querySelector(".float-dock__tab");
  const setDockOpen = (open) => {
    floatDock.classList.toggle("is-open", open);
    if (dockTab) {
      dockTab.setAttribute("aria-expanded", String(open));
      dockTab.setAttribute("aria-label", open ? "收起快速入口" : "開啟快速入口：捐款、學習登入、聯絡");
    }
  };
  if (dockTab) {
    dockTab.addEventListener("click", () => setDockOpen(!floatDock.classList.contains("is-open")));
  }

  floatDock.querySelectorAll(".float-dock__item").forEach((link) => {
    link.addEventListener("click", () => setDockOpen(false));
  });

  document.addEventListener("click", (event) => {
    if (floatDock.classList.contains("is-open") && !floatDock.contains(event.target)) setDockOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && floatDock.classList.contains("is-open")) setDockOpen(false);
  });
}

const collabTabs = document.querySelectorAll("[data-collab]");
if (collabTabs.length) {
  const collabPanels = document.querySelectorAll("[data-collab-panel]");
  const setCollab = (key) => {
    collabTabs.forEach((tab) => tab.setAttribute("aria-expanded", String(tab.dataset.collab === key)));
    collabPanels.forEach((panel) => {
      panel.hidden = panel.dataset.collabPanel !== key;
    });
  };
  collabTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const open = tab.getAttribute("aria-expanded") === "true";
      setCollab(open ? null : tab.dataset.collab);
    });
  });

  const collabHashMap = {
    "companies-summary-title": "company",
    "universities-summary-title": "university",
  };
  const openCollabFromHash = () => {
    const key = collabHashMap[window.location.hash.slice(1)];
    if (key) setCollab(key);
  };
  openCollabFromHash();
  window.addEventListener("hashchange", openCollabFromHash);
}

document.querySelectorAll("[data-logo-carousel]").forEach((root) => {
  const carousel = root.querySelector(".logo-carousel");
  const track = root.querySelector("[data-logo-track]");
  const prevBtn = root.querySelector("[data-logo-prev]");
  const nextBtn = root.querySelector("[data-logo-next]");
  if (!carousel || !track) return;
  const slides = [...track.children];
  if (!slides.length) return;

  root.classList.add("is-enhanced");
  let index = 0;

  const perView = () => {
    const w = window.innerWidth;
    if (w <= 560) return 1;
    if (w <= 920) return 2;
    return 3;
  };

  const render = () => {
    const per = perView();
    track.style.setProperty("--per", per);
    const maxIndex = Math.max(0, slides.length - per);
    if (index > maxIndex) index = maxIndex;
    if (index < 0) index = 0;
    carousel.classList.toggle("is-static", slides.length <= per);
    const step = slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : 0;
    track.style.transform = "translateX(" + (-index * step) + "px)";
  };

  const go = (dir) => {
    const per = perView();
    const maxIndex = Math.max(0, slides.length - per);
    index += dir;
    if (index > maxIndex) index = 0;
    if (index < 0) index = maxIndex;
    render();
  };

  if (prevBtn) prevBtn.addEventListener("click", () => go(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => go(1));

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 120);
  }, { passive: true });

  render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
  window.addEventListener("load", render);
});

document.querySelectorAll("[data-ig-carousel]").forEach((root) => {
  const track = root.querySelector("[data-ig-track]");
  const prevBtn = root.querySelector("[data-ig-prev]");
  const nextBtn = root.querySelector("[data-ig-next]");
  if (!track) return;

  const stride = () => {
    const cards = track.children;
    if (cards.length < 2) return track.clientWidth;
    return cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left;
  };

  const update = () => {
    const maxScroll = track.scrollWidth - track.clientWidth - 2;
    if (prevBtn) prevBtn.disabled = track.scrollLeft <= 2;
    if (nextBtn) nextBtn.disabled = track.scrollLeft >= maxScroll;
  };

  if (prevBtn) prevBtn.addEventListener("click", () => track.scrollBy({ left: -stride(), behavior: "smooth" }));
  if (nextBtn) nextBtn.addEventListener("click", () => track.scrollBy({ left: stride(), behavior: "smooth" }));

  let scrollTimer;
  track.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(update, 80);
  }, { passive: true });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(update, 120);
  }, { passive: true });

  update();
  window.addEventListener("load", update);
});

(function () {
  if (!document.body || !document.body.classList.contains("rspine")) return;
  var NS = "http://www.w3.org/2000/svg";

  var DARK_SHEETS = ["sheet--forest", "sheet--brand-green", "sheet--sunset", "sheet--earth", "sheet--path", "sheet--leaf-700"];
  function isDark(el) { return DARK_SHEETS.some(function (c) { return el.classList.contains(c); }); }

  function collect(main) {
    var flow = main.querySelector(".story-flow");
    var scope = flow || main;
    var out = [];
    Array.prototype.forEach.call(scope.children, function (el) {
      var t = el.tagName;
      if ((t === "SECTION" || t === "ARTICLE") && el.offsetHeight > 40) out.push(el);
    });
    return out;
  }

  function mkSvg(W, H) {
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("width", W); s.setAttribute("height", H);
    s.setAttribute("viewBox", "0 0 " + W + " " + H);
    s.style.cssText = "position:absolute;top:0;left:0;display:block";
    return s;
  }
  function path(svg, dd, w, color, op, dash) {
    var p = document.createElementNS(NS, "path");
    p.setAttribute("d", dd); p.setAttribute("fill", "none");
    p.setAttribute("stroke", color); p.setAttribute("stroke-width", w);
    p.setAttribute("stroke-linecap", "round"); p.setAttribute("stroke-linejoin", "round");
    if (op != null) p.setAttribute("opacity", op);
    if (dash) p.setAttribute("stroke-dasharray", dash);
    svg.appendChild(p); return p;
  }

  function dot(svg, cx, cy, r, color, ring, op) {
    var c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", cx); c.setAttribute("cy", cy); c.setAttribute("r", r);
    if (ring) { c.setAttribute("fill", "none"); c.setAttribute("stroke", color); c.setAttribute("stroke-width", 2); }
    else { c.setAttribute("fill", color); }
    if (op != null) c.setAttribute("opacity", op);
    svg.appendChild(c);
  }

  function draw() {
    var main = document.querySelector("main");
    if (!main) return;

    var base = document.querySelector(".rroute");
    if (!base) { base = document.createElement("div"); base.className = "rroute"; base.setAttribute("aria-hidden", "true"); main.insertBefore(base, main.firstChild); }
    var over = document.querySelector(".rroute-over");
    if (!over) { over = document.createElement("div"); over.className = "rroute-over"; over.setAttribute("aria-hidden", "true"); main.insertBefore(over, main.firstChild); }
    if (!base) return;
    var W = main.clientWidth, H = main.scrollHeight;
    if (!W || !H || W < 340) { base.innerHTML = ""; if (over) over.innerHTML = ""; return; }
    var mobile = W < 701;   

    var secs = collect(main);
    if (secs.length < 2) { base.innerHTML = ""; if (over) over.innerHTML = ""; return; }

    var mtop = main.getBoundingClientRect().top;
    var items = secs.map(function (el) {
      var r = el.getBoundingClientRect();
      return { top: Math.round(r.top - mtop), h: Math.round(r.height), sheet: el.classList.contains("sheet"), dark: isDark(el) };
    });

    var mleft = main.getBoundingClientRect().left;
    var flowEl = main.querySelector(".story-flow") || main;
    var cRight = flowEl.getBoundingClientRect().right - mleft;
    var CL, CR;
    if (mobile) {

      CR = W - 16;
      CL = W - 52;
    } else {

      var DOCK_W = 66;                    
      var rightMax = W - DOCK_W - 8;      
      CL = Math.round(cRight + 26);
      CR = CL + 78;
      if (CR > rightMax) CR = rightMax;   
      if (CL > CR) CL = CR;               
    }
    var R = 80;

    var startY = mobile ? Math.max(0, items[0].top - 8) : 0;
    var xs = [CR];              
    var penY = startY;          
    var segs = [];
    for (var j = 0; j < items.length - 1; j++) {
      var curX = xs[j];
      var wantX = curX === CR ? CL : CR;
      var yb = items[j + 1].top;
      var r = Math.min(R, Math.floor(Math.abs(wantX - curX) / 2) - 4, Math.floor((yb - penY) / 2) - 2);
      if (r >= 14) {
        var sg = wantX > curX ? 1 : -1;
        segs.push(
          "V" + (yb - r),
          "Q" + curX + " " + yb + " " + (curX + sg * r) + " " + yb,
          "H" + (wantX - sg * r),
          "Q" + wantX + " " + yb + " " + wantX + " " + (yb + r)
        );
        xs.push(wantX);
        penY = yb + r;
      } else {
        xs.push(curX);          
      }
    }
    var d = "M" + xs[0] + " " + startY + (segs.length ? " " + segs.join(" ") : "") + " V" + (H - 20);

    var cs = getComputedStyle(document.documentElement);
    var GREEN = (cs.getPropertyValue("--deep") || "#3d5527").trim();
    var ORANGE = (cs.getPropertyValue("--path") || "#f28c0a").trim();
    var GOLD = (cs.getPropertyValue("--amber") || "#f8cd5f").trim();

    var SPINE = (getComputedStyle(document.body).getPropertyValue("--spine-c") || "").trim() || ORANGE;

    var svg = mkSvg(W, H);

    path(svg, d, 2.2, SPINE, mobile ? "0.85" : "0.85");

    var NODES = items.map(function (it, k) {
      return { x: xs[k], y: it.top + Math.min(140, Math.round(it.h * 0.34)) };
    });

    if (!mobile) NODES.forEach(function (nd, k) {
      if (nd.x !== CR) return;   
      var xe = CL - 4;
      if (Math.abs(nd.x - xe) > 36) path(svg, "M" + nd.x + " " + nd.y + " H" + xe, 1.8, GREEN, "0.9");
    });

    if (!mobile) {
      var bi = -1;
      for (var s = 0; s < items.length; s++) { if (items[s].sheet) { bi = s; break; } }
      if (bi < 0) bi = Math.min(2, items.length - 1);
      var bit = items[bi], bx = Math.max(CL + 4, xs[bi] - 30);
      var byA = bit.top + Math.round(bit.h * 0.30), byB = bit.top + Math.round(bit.h * 0.70);
      if (byB - byA > 80) {
        path(svg,
          "M" + (bx + 26) + " " + byA + " H" + (bx + 8) + " Q" + bx + " " + byA + " " + bx + " " + (byA + 18) +
          " V" + (byB - 18) + " Q" + bx + " " + byB + " " + (bx + 8) + " " + byB + " H" + (bx + 26),
          1.6, "rgba(245,182,45,.82)", "0.9", "7 8");
      }
    }

    var PAL = [
      { c: GREEN, r: 4, ring: false },
      { c: ORANGE, r: 5.5, ring: false },
      { c: GOLD, r: 5, ring: true }
    ];
    if (!mobile) NODES.forEach(function (nd, k) {
      var st = PAL[k % PAL.length];
      dot(svg, nd.x, nd.y, st.r, st.c, st.ring, null);
    });

    base.innerHTML = ""; base.appendChild(svg);

    if (!main.querySelector(".rspine-vlabel")) {
      var vl = document.createElement("div");
      vl.className = "rspine-vlabel"; vl.setAttribute("aria-hidden", "true");
      vl.textContent = "COUNTRYEDU CHARITY FOUNDATION";
      main.appendChild(vl);
    }

    var deco = main.querySelector(".rroute-deco");
    if (!deco) {
      deco = document.createElement("div");
      deco.className = "rroute-deco"; deco.setAttribute("aria-hidden", "true");
      main.appendChild(deco);
    }
    deco.innerHTML = "";
    var MARKS = ["rspine-mark--bar", "rspine-mark--square", "rspine-mark--block"];
    var mi = 0;
    if (!mobile) items.forEach(function (it, k) {   
      if (it.sheet) return;              
      if (k === 0 || k === 1) return;    
      if (it.h < 300) return;            
      var mk = document.createElement("span");
      mk.className = "rspine-mark " + MARKS[mi % MARKS.length];
      mk.style.left = Math.round(cRight + 12) + "px";           
      mk.style.top = Math.round(it.top + it.h - 100) + "px";    
      deco.appendChild(mk);
      mi++;
    });

    if (over) {
      over.innerHTML = "";
      var darkS = items.filter(function (it) { return it.sheet && it.dark; });
      var lightS = mobile ? items.filter(function (it) { return it.sheet && !it.dark; }) : [];
      if (darkS.length || lightS.length) {
        var osvg = mkSvg(W, H);
        var defs = document.createElementNS(NS, "defs");
        function clipRects(id, list) {
          var cp = document.createElementNS(NS, "clipPath"); cp.setAttribute("id", id);
          list.forEach(function (it) {
            var rc = document.createElementNS(NS, "rect");
            rc.setAttribute("x", 0); rc.setAttribute("y", it.top);
            rc.setAttribute("width", W); rc.setAttribute("height", it.h);
            cp.appendChild(rc);
          });
          defs.appendChild(cp);
        }
        if (darkS.length) clipRects("rov-dark", darkS);
        if (lightS.length) clipRects("rov-light", lightS);
        osvg.appendChild(defs);
        if (darkS.length) path(osvg, d, 2.2, "#ffffff", "0.92").setAttribute("clip-path", "url(#rov-dark)");
        if (lightS.length) path(osvg, d, 2.2, SPINE, "0.9").setAttribute("clip-path", "url(#rov-light)");
        over.appendChild(osvg);
      }
    }
  }

  var t;
  function queue() { clearTimeout(t); t = setTimeout(draw, 120); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", draw);
  else draw();
  window.addEventListener("load", draw);
  window.addEventListener("resize", queue);
  if (window.ResizeObserver) { var m = document.querySelector("main"); if (m) new ResizeObserver(queue).observe(m); }
})();
