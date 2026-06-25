const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (header) {
  const syncHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
  window.addEventListener("scroll", syncHeader, { passive: true });
  syncHeader();
}

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

// ===== 認識鄉育 故事時間軸（about.html）：橘色圓點隨捲動移動到目前里程碑 =====
const storyNodes = document.querySelectorAll(".page-about .journey-line .journey-node");
if (storyNodes.length) {
  let storyTicking = false;
  const updateStoryDot = () => {
    storyTicking = false;
    const markLine = window.innerHeight * 0.45; // 視窗 45% 高度為判定線
    let current = storyNodes[0];
    storyNodes.forEach((node) => {
      if (node.getBoundingClientRect().top <= markLine) current = node;
    });
    storyNodes.forEach((node) => node.classList.toggle("is-active", node === current));
  };
  const onStoryScroll = () => {
    if (storyTicking) return;
    storyTicking = true;
    window.requestAnimationFrame(updateStoryDot);
  };
  window.addEventListener("scroll", onStoryScroll, { passive: true });
  window.addEventListener("resize", onStoryScroll, { passive: true });
  updateStoryDot();
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
