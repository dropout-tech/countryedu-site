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
// 套用到全站每一條 .journey-line（about／programs／story／for-companies／for-students／
// for-universities）。互動只在「直式排列」時啟用——此時節點由上到下串連，橘點隨捲動移到
// 目前節點。包含：about 的里程碑、story 的 .is-vertical、以及所有頁面在窄螢幕(≤960px)回到
// 單欄時。桌機上 programs／for-* 的時間軸是橫向三欄、節點同一條水平線，捲動高亮無意義，
// 故維持原本的靜態 featured 高亮（移除 .is-spy／.is-active）。方向用實際幾何判斷，resize 自動切換。
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
    const markLine = window.innerHeight * 0.45; // 視窗 45% 高度為判定線
    journeyLines.forEach(({ line, nodes }) => {
      if (!isStacked(nodes)) {
        line.classList.remove("is-spy");
        nodes.forEach((node) => node.classList.remove("is-active"));
        return;
      }
      line.classList.add("is-spy");
      let current = nodes[0];
      nodes.forEach((node) => {
        if (node.getBoundingClientRect().top <= markLine) current = node;
      });
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
  // 量出 band 內所有內容（文字 div＋按鈕 div…）的聯集框，座標相對 band 的 padding box
  const contentBox = (band, br) => {
    const ox = br.left + band.clientLeft;
    const oy = br.top + band.clientTop;
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    for (const el of band.children) {
      const c = el.getBoundingClientRect();
      if (c.width === 0 || c.height === 0) continue;
      l = Math.min(l, c.left - ox); t = Math.min(t, c.top - oy);
      r = Math.max(r, c.right - ox); b = Math.max(b, c.bottom - oy);
    }
    return Number.isFinite(l) ? { l, t, r, b } : null;
  };
  const placeOne = (band, name, compact, BW, BH, keep, placed) => {
    const s = band.style;
    const { ar } = ICONS[name];
    const wMax = compact ? (name === "lamp" ? 104 : 128) : name === "lamp" ? 158 : 196;
    const wMin = compact ? 56 : 78;
    const M = 4;   // 距 band 邊緣最小留白
    const G = 10;  // 距文字禁區的安全間隙
    for (let iw = wMax; iw >= wMin; iw *= 0.85) {
      const ih = iw * ar;
      const rot = rand(-8, 8);
      const a = Math.abs((rot * Math.PI) / 180);
      const rw = iw * Math.cos(a) + ih * Math.sin(a); // 旋轉後外接框（碰撞用）
      const rh = iw * Math.sin(a) + ih * Math.cos(a);
      // 四條空白帶內，圖示「中心點」可落的範圍（已保證外接框不進禁區、不出 band）
      const regions = [
        { x0: M + rw / 2, x1: keep.l - G - rw / 2, y0: M + rh / 2, y1: BH - M - rh / 2 }, // 左留白
        { x0: keep.r + G + rw / 2, x1: BW - M - rw / 2, y0: M + rh / 2, y1: BH - M - rh / 2 }, // 右留白
        { x0: M + rw / 2, x1: BW - M - rw / 2, y0: M + rh / 2, y1: keep.t - G - rh / 2 }, // 標題上方
        { x0: M + rw / 2, x1: BW - M - rw / 2, y0: keep.b + G + rh / 2, y1: BH - M - rh / 2 }, // 按鈕下方
      ].filter((g) => g.x1 >= g.x0 && g.y1 >= g.y0);
      if (!regions.length) continue;
      for (let tries = 0; tries < 28; tries++) {
        const g = regions[Math.floor(Math.random() * regions.length)];
        const cx = rand(g.x0, g.x1);
        const cy = rand(g.y0, g.y1);
        const box = { l: cx - rw / 2, t: cy - rh / 2, r: cx + rw / 2, b: cy + rh / 2 };
        // 與另一枚圖示也不重疊
        const clash = placed.some((q) => !(box.r + 8 < q.l || box.l > q.r + 8 || box.b + 8 < q.t || box.t > q.b + 8));
        if (clash) continue;
        placed.push(box);
        s.setProperty(`--${name}-w`, Math.round(iw) + "px");
        s.setProperty(`--${name}-op`, compact ? "0.85" : "0.9");
        s.setProperty(`--${name}-left`, Math.round(cx - iw / 2) + "px");
        s.setProperty(`--${name}-top`, Math.round(cy - ih / 2) + "px");
        s.setProperty(`--${name}-right`, "auto");
        s.setProperty(`--${name}-bottom`, "auto");
        s.setProperty(`--${name}-rot`, rot.toFixed(1) + "deg");
        return;
      }
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
      const cb = contentBox(band, br);
      if (!cb) return;
      const P = compact ? 10 : 16; // 文字四周再加一圈保護
      const keep = { l: cb.l - P, t: cb.t - P, r: cb.r + P, b: cb.b + P };
      const placed = [];
      // 兩枚順序隨機，避免總是同一枚先搶到位置
      const order = Math.random() < 0.5 ? ["lamp", "steps"] : ["steps", "lamp"];
      order.forEach((name) => placeOne(band, name, compact, BW, BH, keep, placed));
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

// ===== 首頁 合作夥伴牆：捲入時依序淡入＋常駐微浮動（index.html #partners）=====
document.querySelectorAll(".partner-logos").forEach((wall) => {
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
}
