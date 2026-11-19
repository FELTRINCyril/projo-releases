// Projo site. Plain JavaScript, no dependency, no build step.
// Without JavaScript the page still works: download links point to the
// latest GitHub release page and every FAQ answer is shown.
"use strict";

(function () {
  var root = document.documentElement;
  root.classList.add("js");

  // ===== Visitors who are not on a Mac ====================================
  var notMac = (function platformNote() {
    var ua = navigator.userAgent || "";
    var touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1; // iPadOS
    var text = null;
    if (/iPhone|iPod/.test(ua)) {
      text = "Projo est une app pour Mac. La version iPhone arrive bientôt.";
    } else if (/iPad/.test(ua) || touchMac) {
      text = "Projo est une app pour Mac. Ouvrez cette page sur votre Mac pour l'installer.";
    } else if (/Android/.test(ua)) {
      text = "Projo est une app pour Mac, il n'existe pas de version Android.";
    } else if (/Windows|CrOS|Linux/.test(ua)) {
      text = "Projo est une app pour Mac, il n'existe pas de version pour cet ordinateur.";
    }
    if (!text) return false;
    document.querySelectorAll(".js-platform-note").forEach(function (note) {
      note.textContent = text;
      note.hidden = false;
    });
    return true;
  })();

  // ===== Download button: always the latest DMG ===========================
  // The DMG name changes with every version (Projo-<version>-<build>.dmg), so
  // it is read from the GitHub API. If the API fails (offline, rate limit of
  // 60 requests per hour and per address), the links keep their fallback:
  // the latest release page on GitHub. No version is ever written in the page.
  var API = "https://api.github.com/repos/FELTRINCyril/projo-releases/releases/latest";
  var CACHE_KEY = "projo-latest-v2";
  var CACHE_MS = 10 * 60 * 1000;
  var DMG = /^Projo-(.+)-(\d+)\.dmg$/;

  function readCache() {
    try {
      var raw = window.localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return Date.now() - data.at < CACHE_MS && isRelease(data.release) ? data.release : null;
    } catch (e) {
      return null;
    }
  }

  // Shape check for anything read from the API or from the cache.
  function isRelease(r) {
    return !!r && typeof r.version === "string" && /^[0-9][0-9A-Za-z.]*$/.test(r.version) &&
      typeof r.url === "string" && typeof r.size === "number" && r.size > 0 && isFinite(r.size);
  }

  function writeCache(release) {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), release: release }));
    } catch (e) {
      /* private mode or storage disabled: no cache, nothing else changes */
    }
  }

  function fetchLatest() {
    var cached = readCache();
    if (cached) return Promise.resolve(cached);
    var controller = "AbortController" in window ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 8000) : null;
    return fetch(API, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller ? controller.signal : undefined,
      credentials: "omit",
      referrerPolicy: "no-referrer"
    })
      .then(function (response) {
        if (!response.ok) throw new Error("GitHub API: HTTP " + response.status);
        return response.json();
      })
      .then(function (json) {
        var asset = (json.assets || []).filter(function (a) { return DMG.test(a.name); })[0];
        if (!asset) throw new Error("GitHub API: no Projo DMG in the latest release");
        var match = DMG.exec(asset.name);
        var release = {
          version: match[1],
          build: match[2],
          size: asset.size,
          url: asset.browser_download_url,
          page: json.html_url
        };
        if (!isRelease(release)) throw new Error("GitHub API: unexpected release data");
        writeCache(release);
        return release;
      })
      .finally(function () { if (timer) clearTimeout(timer); });
  }

  function megabytes(bytes) {
    // Binary megabytes: 156 680 061 bytes are shown as 149 Mo. Plain digits,
    // no locale grouping (it would insert a non-breaking space).
    return String(Math.round(bytes / 1048576));
  }

  function applyRelease(release) {
    var trusted = /^https:\/\/github\.com\/FELTRINCyril\/projo-releases\//;
    if (!trusted.test(release.url)) return;
    // Not on a Mac: keep the release page link rather than starting a 150 Mo
    // download that cannot be used on this device.
    if (!notMac) {
      document.querySelectorAll(".js-download").forEach(function (link) {
        link.href = release.url;
      });
    }
    document.querySelectorAll(".js-download-meta").forEach(function (meta) {
      meta.textContent = "Version " + release.version + " - " + megabytes(release.size) + " Mo";
    });
    if (release.page && trusted.test(release.page)) {
      document.querySelectorAll(".js-notes").forEach(function (link) {
        link.href = release.page;
        link.textContent = "Notes de la version " + release.version;
      });
    }
  }

  if ("fetch" in window && "Promise" in window) {
    fetchLatest().then(applyRelease).catch(function (error) {
      // Fallback already in place in the HTML; keep a trace for debugging.
      if (window.console) console.info("Projo: fallback to the releases page.", error && error.message);
    });
  }

  // ===== FAQ accordion ====================================================
  document.querySelectorAll(".qa button[aria-controls]").forEach(function (button) {
    var panel = document.getElementById(button.getAttribute("aria-controls"));
    if (!panel) return;
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", function () {
      var open = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!open));
      panel.hidden = open;
    });
  });

  // ===== Motion ===========================================================
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Reveal: small details inside the feature visuals play once in view.
  var revealed = document.querySelectorAll("[data-reveal]");
  if (reduce.matches || !("IntersectionObserver" in window)) {
    revealed.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
    revealed.forEach(function (el) { io.observe(el); });
  }

  // Tilt of the app window: CSS scroll-driven animation where supported.
  // Elsewhere (Firefox, older Safari) this sets --tilt from 1 (tilted) to 0.
  var supportsTimeline = window.CSS && CSS.supports && CSS.supports("animation-timeline: view()");
  var win = document.querySelector(".js-tilt");
  if (win && !supportsTimeline && !reduce.matches) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var rect = win.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      // 1 when the top of the window is at the bottom of the screen, 0 when it
      // reaches 35 % of the screen height.
      var progress = (rect.top - vh * 0.35) / (vh * 0.65);
      var tilt = Math.max(0, Math.min(1, progress));
      win.style.setProperty("--tilt", tilt.toFixed(3));
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }
})();
