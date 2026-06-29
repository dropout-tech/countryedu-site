const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (header) {
  const syncHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();
}

// ===== 全站導覽：依目前網址標記所在頁面的母項（暖陽黃底框）；只動 header，不碰子頁導覽 =====
(() => {
  const nav = document.querySelector(".desktop-nav");
  if (!nav) return;
  const here = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  if (here === "" || here === "index.html") return; // 首頁不標記任何母項
  for (const item of nav.querySelectorAll(".nav-item")) {
    const hit = [...item.querySelectorAll("a[href]")].some((a) => {
      const file = (a.getAttribute("href") || "").split("#")[0].split("/").pop().toLowerCase();
      return file && file === here;
    });
    if (hit) {
      item.classList.add("is-current");
      break; // 只標記第一個命中的母項，避免重複頁面（如 for-companies）雙重高亮
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

// 報名分頁（programs.html「如何報名」：常見問題 FAQ／開課學校選修／線上課程即將推出）
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
  // 行動版的出口牌導覽是頂部 sticky 列，落點需再扣掉它的高度
  const subnav = document.querySelector(".exit-nav");
  if (subnav && window.matchMedia("(max-width: 960px)").matches) {
    offset += subnav.offsetHeight;
  }
  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? "auto" : behavior });
}

window.addEventListener("hashchange", () => scrollToHashTarget());
window.addEventListener("load", () => {
  window.setTimeout(() => scrollToHashTarget("auto"), 80);
});

// ===== 出口牌章節導覽 scroll-spy（story.html）：捲到哪一章節，左側對應出口牌高亮 =====
const exitSigns = document.querySelectorAll(".exit-sign[data-exit-target]");
if (exitSigns.length) {
  const isCompact = () => window.matchMedia("(max-width: 960px)").matches;
  const signTargets = [...exitSigns]
    .map((sign) => document.getElementById(sign.dataset.exitTarget))
    .filter(Boolean);
  // 無對應出口牌的收尾區段（如 CTA）：捲進去時清空高亮，避免謊報位置
  const clearZones = [...document.querySelectorAll("[data-exit-clear]")];

  const setActive = (id) => {
    exitSigns.forEach((sign) => {
      const on = sign.dataset.exitTarget === id;
      sign.classList.toggle("is-active", on);
      if (on) sign.setAttribute("aria-current", "location");
      else sign.removeAttribute("aria-current");
      // 手機橫向列：把高亮的牌捲進視線
      if (on && isCompact() && typeof sign.scrollIntoView === "function") {
        sign.scrollIntoView({ inline: "center", block: "nearest", behavior: reducedMotion ? "auto" : "smooth" });
      }
    });
  };

  let activeId = signTargets[0] ? signTargets[0].id : null;
  if (activeId) setActive(activeId);

  // 點擊出口牌：立即高亮並同步 activeId（避免平滑捲動途中閃爍）
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
        // 帶內若有出口牌章節 → 高亮它；否則若已進入收尾區段 → 清空
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

// ===== 旅程時間軸：橘色圓點隨捲動移動到目前節點（與 about「認識鄉育」一致）=====
// 套用到全站每一條 .journey-line。所有時間軸都隨捲動動態點亮目前節點（並隨滑鼠 hover 變色，
// 見 styles.css）：
//   直式（about 里程碑、story 的 .is-vertical、窄螢幕單欄）＝節點由上到下，取最後一個頂端越過
//     視窗 45% 判定線的節點。
//   橫式（桌機 programs／for-*／合作頁的三欄水平線）＝節點同在一條水平線、無法逐點越線，改用整條
//     時間軸通過視窗的捲動進度，由左到右依序點亮（捲到區段上緣＝第一點、下緣＝最後一點）。
// 方向用實際幾何判斷（isStacked），resize 自動切換。
const journeyLines = [...document.querySelectorAll(".journey-line")]
  .map((line) => ({ line, nodes: [...line.querySelectorAll(".journey-node")] }))
  .filter((entry) => entry.nodes.length > 1);
if (journeyLines.length) {
  // 直式＝每個節點都明顯低於前一個（自成一列）。這樣才能排除桌機的橫向三欄，
  // 也能排除「四欄時間軸折成兩列」這種仍非單欄直列的情況（同列節點 top 幾乎相等）。
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
    const markLine = vh * 0.45; // 直式：視窗 45% 高度為判定線
    journeyLines.forEach(({ line, nodes }) => {
      line.classList.add("is-spy");
      let current;
      if (isStacked(nodes)) {
        // 直式：取最後一個頂端已越過判定線的節點
        current = nodes[0];
        nodes.forEach((node) => {
          if (node.getBoundingClientRect().top <= markLine) current = node;
        });
      } else {
        // 橫式：整條時間軸通過視窗的捲動進度 → 由左到右依序點亮
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


// ===== 全站 CTA 手繪圖示：同一組 icon（路燈＋腳印），每次載入位置/角度/大小隨機，呼應首頁 hero =====
// 全站每一條深綠 .cta-band 都用相同兩枚圖示（白色線稿路燈＋腳印），位置不再固定。版位寫成
// --lamp-* / --steps-* 自訂屬性（::before/::after 讀取；無 JS 時退回固定版位）。
// 鐵則：圖示「絕不壓到文字」——量出文字＋按鈕的實際範圍當「禁區」，圖示只放在禁區四周的空白
// 帶（左/右留白、標題上方、按鈕下方），且把旋轉後的外接框也算進碰撞；放不下就縮小，再放不下就
// 整枚隱藏。每枚落在哪個空白帶、確切位置與角度都隨機，所以每頁、每次看起來都略有不同。
const ctaBands = document.querySelectorAll(".cta-band");
if (ctaBands.length) {
  const rand = (a, b) => a + Math.random() * (b - a);
  const ICONS = {
    lamp: { ar: 168 / 150 }, // 高/寬
    steps: { ar: 150 / 184 },
  };
  // 兩個矩形是否相交（k 多留 m 的安全間隙）
  const hit = (box, k, m) => !(box.r + m < k.l || box.l > k.r + m || box.b + m < k.t || box.t > k.b + m);
  // 收集 band 內每個「實際文字／按鈕」元素的框（各自獨立，不取聯集）——這樣窄按鈕、短標題
  // 兩側的大片空白才不會被聯集框吃掉，圖示就能落在角落而非被迫隱藏。座標相對 band padding box。
  const keepoutsOf = (band, br) => {
    const ox = br.left + band.clientLeft, oy = br.top + band.clientTop;
    const list = [];
    band.querySelectorAll("h1,h2,h3,h4,p,a,button").forEach((el) => {
      const c = el.getBoundingClientRect();
      if (!c.width || !c.height) return;
      list.push({ l: c.left - ox, t: c.top - oy, r: c.right - ox, b: c.bottom - oy });
    });
    return list;
  };
  const CORNERS = ["tl", "tr", "bl", "br"];
  const placeOne = (band, name, compact, BW, BH, keeps, P, placed) => {
    const s = band.style;
    const { ar } = ICONS[name];
    const wMax = compact ? (name === "lamp" ? 100 : 120) : name === "lamp" ? 150 : 178;
    const wMin = compact ? 40 : 54;
    const M = 5; // 距 band 邊緣最小留白
    // 每枚固定一個旋轉角，再去四個角落各算「貼齊角落時塞得下的最大尺寸」。
    // 角度範圍收斂，讓旋轉後外接框較小、緊湊版位也能穩定塞下（不會時有時無）。
    const rot = name === "lamp" ? rand(-7, 3) : rand(-6, 10);
    const a = Math.abs((rot * Math.PI) / 180), cosA = Math.cos(a), sinA = Math.sin(a);
    const fits = (box) => !keeps.some((k) => hit(box, k, P)) && !placed.some((q) => hit(box, q, 8));
    const boxFor = (corner, rw, rh) => {
      const x = corner[1] === "l" ? M : BW - M - rw;
      const y = corner[0] === "t" ? M : BH - M - rh;
      return { l: x, t: y, r: x + rw, b: y + rh };
    };
    const maxAt = (corner) => {
      for (let iw = wMax; iw >= wMin; iw *= 0.9) {
        const ih = iw * ar, rw = iw * cosA + ih * sinA, rh = iw * sinA + ih * cosA;
        if (rw > BW - 2 * M || rh > BH - 2 * M) continue;
        if (fits(boxFor(corner, rw, rh))) return { iw, ih, rw, rh };
      }
      return null;
    };
    const cand = CORNERS.map((c) => ({ c, fit: maxAt(c) })).filter((o) => o.fit);
    if (cand.length) {
      // 在「夠大的角落」中隨機挑一個（兼顧視覺份量與每次載入的變化）
      const bestIw = Math.max(...cand.map((o) => o.fit.iw));
      const pool = cand.filter((o) => o.fit.iw >= Math.max(wMin, 0.72 * bestIw));
      const { c, fit } = pool[Math.floor(Math.random() * pool.length)];
      const box = boxFor(c, fit.rw, fit.rh);
      placed.push(box);
      const cx = box.l + fit.rw / 2, cy = box.t + fit.rh / 2;
      s.setProperty(`--${name}-w`, Math.round(fit.iw) + "px");
      s.setProperty(`--${name}-op`, compact ? "0.85" : "0.9");
      s.setProperty(`--${name}-left`, Math.round(cx - fit.iw / 2) + "px");
      s.setProperty(`--${name}-top`, Math.round(cy - fit.ih / 2) + "px");
      s.setProperty(`--${name}-right`, "auto");
      s.setProperty(`--${name}-bottom`, "auto");
      s.setProperty(`--${name}-rot`, rot.toFixed(1) + "deg");
      return;
    }
    // 真的放不下（band 太小／文字太滿）→ 隱藏這枚，寧可不顯示也不壓字
    s.setProperty(`--${name}-w`, "0px");
    s.setProperty(`--${name}-op`, "0");
  };
  let lastW = 0;
  const placeCtaDecor = () => {
    const compact = window.innerWidth <= 760;
    lastW = window.innerWidth;
    ctaBands.forEach((band) => {
      const br = band.getBoundingClientRect();
      const BW = band.clientWidth, BH = band.clientHeight;
      const keeps = keepoutsOf(band, br);
      if (!keeps.length) return;
      const P = compact ? 9 : 12; // 文字框四周再加一圈安全間隙
      const placed = [];
      // 兩枚順序隨機，避免總是同一枚先搶到位置
      const order = Math.random() < 0.5 ? ["lamp", "steps"] : ["steps", "lamp"];
      order.forEach((name) => placeOne(band, name, compact, BW, BH, keeps, P, placed));
    });
  };
  // 等字體載入後量測才準（中文字體會改變換行與文字框大小）
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeCtaDecor);
  else placeCtaDecor();
  // 視窗「寬度」變化才重排（重新避開重排後的文字）；高度變化（行動版網址列）不重排，避免捲動亂跳
  let decorTimer;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastW) return;
    clearTimeout(decorTimer);
    decorTimer = setTimeout(placeCtaDecor, 180);
  });
}


// ===== 首頁 四階段圓盤：滑鼠移入／鍵盤聚焦／點擊扇形 → 顯示該階段賦能重點（index.html #method）=====
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


// ===== 首頁 四階段三層圖：上層能力／下層成果＝獨立手風琴折疊（方向 A，index.html #method）=====
const mcCycle = document.querySelector(".method-cycle");
const mcFoldBars = document.querySelectorAll(".mc-fold-bar[aria-controls]");
if (mcCycle && mcFoldBars.length) {
  // 啟用折疊（無 JS 時 .mc-fold-bar 隱藏、兩層維持全展）；fold-init 抑制首載瞬間的收合動畫
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

// ===== 首頁 合作夥伴牆＋初衷痛點卡：捲入時依序淡入（index.html #partners／.initiative-cards）=====
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

// ===== 媒體報導頁「精選頭條牆」：分類 chip 篩選（press.html）=====
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

// ===== 媒體報導頁：依日期排序（最新／最舊；只重排網格卡，精選頭條不動）=====
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

// ===== 全站快速入口 float-dock：手機點書籤展開／收合（桌機常駐直 dock，不需 JS）=====
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
  // 點任一入口即收合（連結照常跳頁）
  floatDock.querySelectorAll(".float-dock__item").forEach((link) => {
    link.addEventListener("click", () => setDockOpen(false));
  });
  // 點 dock 以外的空白處收合
  document.addEventListener("click", (event) => {
    if (floatDock.classList.contains("is-open") && !floatDock.contains(event.target)) setDockOpen(false);
  });
  // Esc 收合
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && floatDock.classList.contains("is-open")) setDockOpen(false);
  });
}

// ===== 大學專案頁 合作摘要：企業／大學 橫式展開鈕（方案 2，預設全收合、單開；programs.html）=====
// 兩顆橫排鈕預設都收合；點一顆＝展開該面板並收起另一顆；再點同一顆＝收合（key 傳 null）。
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
  // 深連結：從其他頁／導覽選單帶 #companies-summary-title 或 #universities-summary-title 進來時，自動展開對應面板
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


// ===== 合作夥伴 Logo 輪播：JS 啟用後變單行等寬卡片、左右箭頭循環（university-partnership.html）=====
// 無 JS 時 track 換行全展(箭頭隱藏)；JS 加 .is-enhanced→單行、量測單格步距位移、到頭/到尾循環。
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
