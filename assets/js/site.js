// Projo site, shared by index.html and versions.html. Plain JavaScript, no
// dependency, no build step. Without JavaScript the pages still work:
// download links point to the latest GitHub release page, every FAQ answer is
// shown and the feedback links open the GitHub issue forms.
"use strict";

(function () {
  var root = document.documentElement;
  root.classList.add("js");

  var REPO = "FELTRINCyril/projo-releases";
  var TRUSTED = /^https:\/\/github\.com\/FELTRINCyril\/projo-releases\//;

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
  var API = "https://api.github.com/repos/" + REPO + "/releases/latest";
  var CACHE_KEY = "projo-latest-v2";
  var CACHE_MS = 10 * 60 * 1000;
  var DMG = /^Projo-(.+)-(\d+)\.dmg$/;

  function isRelease(r) {
    return !!r && typeof r.version === "string" && /^[0-9][0-9A-Za-z.]*$/.test(r.version) &&
      typeof r.url === "string" && typeof r.size === "number" && r.size > 0 && isFinite(r.size);
  }

  function readCache() {
    try {
      var data = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "null");
      return data && Date.now() - data.at < CACHE_MS && isRelease(data.release) ? data.release : null;
    } catch (e) {
      return null;
    }
  }

  function writeCache(release) {
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), release: release }));
    } catch (e) {
      /* private mode or storage disabled: no cache, nothing else changes */
    }
  }

  // GET a GitHub API URL as JSON, with a timeout. Shared with versions.js.
  function githubJSON(url) {
    var controller = "AbortController" in window ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 8000) : null;
    return fetch(url, {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller ? controller.signal : undefined,
      credentials: "omit",
      referrerPolicy: "no-referrer"
    })
      .then(function (response) {
        if (!response.ok) throw new Error("GitHub API: HTTP " + response.status);
        return response.json();
      })
      .finally(function () { if (timer) clearTimeout(timer); });
  }

  function fetchLatest() {
    var cached = readCache();
    if (cached) return Promise.resolve(cached);
    return githubJSON(API).then(function (json) {
      var asset = (json.assets || []).filter(function (a) { return DMG.test(a.name); })[0];
      if (!asset) throw new Error("GitHub API: no Projo DMG in the latest release");
      var match = DMG.exec(asset.name);
      var release = { version: match[1], build: match[2], size: asset.size, url: asset.browser_download_url };
      if (!isRelease(release)) throw new Error("GitHub API: unexpected release data");
      writeCache(release);
      return release;
    });
  }

  function megabytes(bytes) {
    // Binary megabytes: 156 680 061 bytes are shown as 149 Mo. Plain digits,
    // no locale grouping (it would insert a non-breaking space).
    return String(Math.round(bytes / 1048576));
  }

  function applyRelease(release) {
    if (!TRUSTED.test(release.url)) return;
    // Not on a Mac: keep the release page link rather than starting a 150 Mo
    // download that cannot be used on this device.
    if (!notMac) {
      document.querySelectorAll(".js-download").forEach(function (link) { link.href = release.url; });
    }
    document.querySelectorAll(".js-download-meta").forEach(function (meta) {
      meta.textContent = "Version " + release.version + " - " + megabytes(release.size) + " Mo";
    });
    document.querySelectorAll(".js-notes").forEach(function (link) {
      link.href = "versions.html#v" + release.version;
      link.textContent = "Notes de la version " + release.version;
    });
  }

  if ("fetch" in window && "Promise" in window && document.querySelector(".js-download, .js-notes")) {
    fetchLatest().then(applyRelease).catch(function (error) {
      // Fallback already in place in the HTML; keep a trace for debugging.
      if (window.console) console.info("Projo: fallback to the releases page.", error && error.message);
    });
  }

  // For versions.js (same origin, loaded after this file).
  window.Projo = { githubJSON: githubJSON, megabytes: megabytes, DMG: DMG, TRUSTED: TRUSTED, notMac: notMac, REPO: REPO };

  // ===== FAQ accordion: one answer open at a time =========================
  var questions = [];
  document.querySelectorAll(".qa button[aria-controls]").forEach(function (button) {
    var panel = document.getElementById(button.getAttribute("aria-controls"));
    if (!panel) return;
    questions.push({ button: button, panel: panel });
  });
  function setOpen(item, open) {
    item.button.setAttribute("aria-expanded", String(open));
    item.panel.hidden = !open;
  }
  questions.forEach(function (item) {
    setOpen(item, false);
    item.button.addEventListener("click", function () {
      var willOpen = item.button.getAttribute("aria-expanded") !== "true";
      questions.forEach(function (other) { if (other !== item) setOpen(other, false); });
      setOpen(item, willOpen);
    });
  });

  // ===== Feedback form (dialog) ===========================================
  // The site cannot create a GitHub issue by itself: that needs a signed-in
  // GitHub account (a static page cannot hold a secret token). The visitor
  // fills the form here, then GitHub opens the matching issue form with every
  // field already filled in (query parameters named after the field ids of
  // .github/ISSUE_TEMPLATE/*.yml), and the visitor only has to submit it.
  var FORMS = {
    probleme: {
      title: "Signaler un problème",
      intro: "Décrivez ce qui ne fonctionne pas. Plus c'est précis, plus c'est rapide à corriger.",
      prefix: "[Problème] ",
      fields: [
        { id: "title", label: "En une phrase", required: true, placeholder: "La lecture s'arrête après quelques secondes" },
        { id: "version-projo", label: "Version de Projo", hint: "Dans Projo, Réglages > À propos.", required: true, placeholder: "0.24 (370)", latest: true },
        { id: "version-macos", label: "Version de macOS", hint: "Menu Pomme > À propos de ce Mac.", required: true, placeholder: "macOS 26.1" },
        { id: "modele-mac", label: "Modèle de Mac (facultatif)", placeholder: "MacBook Air M2, 2022" },
        { id: "ce-qui-sest-passe", label: "Ce qui s'est passé", hint: "Et le message d'erreur exact s'il y en a un.", required: true, area: true },
        { id: "attendu", label: "Ce qui était attendu", required: true, area: true },
        { id: "etapes", label: "Étapes pour reproduire (facultatif)", area: true, placeholder: "1. Ouvrir une fiche de série\n2. Choisir la saison 2\n3. ..." }
      ],
      after: "Vous pourrez ajouter des captures d'écran sur GitHub, avant d'envoyer."
    },
    idee: {
      title: "Proposer une idée",
      intro: "Une fonction qui manque, quelque chose à rendre plus simple ?",
      prefix: "[Idée] ",
      fields: [
        { id: "title", label: "En une phrase", required: true, placeholder: "Pouvoir trier Ma liste par date d'ajout" },
        { id: "idee", label: "Votre idée", hint: "Ce que vous aimeriez pouvoir faire dans Projo.", required: true, area: true },
        { id: "pourquoi", label: "Pourquoi (facultatif)", hint: "Dans quelle situation cela vous servirait.", area: true },
        { id: "version-projo", label: "Version de Projo (facultatif)", placeholder: "0.24 (370)", latest: true }
      ]
    },
    question: {
      title: "Poser une question",
      intro: "La réponse est peut-être déjà dans les questions fréquentes du site.",
      prefix: "[Question] ",
      fields: [
        { id: "title", label: "En une phrase", required: true, placeholder: "Comment changer de serveur ?" },
        { id: "question", label: "Votre question", required: true, area: true },
        { id: "version-projo", label: "Version de Projo (facultatif)", placeholder: "0.24 (370)", latest: true },
        { id: "version-macos", label: "Version de macOS (facultatif)", placeholder: "macOS 26.1" }
      ]
    }
  };
  // Measured on 20/11/2026: a signed-out visitor goes through the login page,
  // which re-encodes the URL in return_to. Up to 4500 characters it is kept;
  // from about 5000 GitHub fails (500), then drops return_to and the message
  // is lost without any error. Signed in, the limit is about 7000.
  var MAX_URL = 4500;

  // What must never reach a public issue. Kept narrow on purpose: mentioning
  // "M3U" in an idea is fine, pasting a playlist link or an address is not.
  var SENSITIVE = [
    { re: /\b(username|password|user|pass|pwd)=/i, why: "un identifiant ou un mot de passe" },
    { re: /\bget\.php\b|\bplayer_api\.php\b|\bxmltv\.php\b/i, why: "une adresse de serveur" },
    { re: /\bhttps?:\/\/[^\s\/]+:\d{2,5}\b/i, why: "une adresse de serveur" },
    { re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/, why: "une adresse IP" },
    { re: /\S+\.m3u8?\b/i, why: "un lien M3U" }
  ];

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text != null) node.textContent = text;
    return node;
  }

  var dialog = null;
  var opener = null;

  function buildDialog(kind) {
    var conf = FORMS[kind];
    var d = el("dialog", { class: "fb", "aria-labelledby": "fb-heading" });
    var form = el("form", { class: "fb-form", novalidate: "" });
    var head = el("div", { class: "fb-head" });
    head.appendChild(el("h2", { id: "fb-heading" }, conf.title));
    var close = el("button", { type: "button", class: "fb-close", "aria-label": "Fermer" });
    close.appendChild(el("span", { "aria-hidden": "true" }));
    close.addEventListener("click", function () { d.close(); });
    head.appendChild(close);
    form.appendChild(head);
    form.appendChild(el("p", { class: "fb-intro" }, conf.intro));

    var warn = el("div", { class: "fb-warn", role: "note" });
    warn.appendChild(el("strong", null, "Ce message sera public. "));
    warn.appendChild(document.createTextNode("Tout le monde peut lire les issues de Projo sur GitHub. N'y mettez jamais d'identifiant, de mot de passe, d'adresse de serveur ni de lien M3U."));
    form.appendChild(warn);

    conf.fields.forEach(function (f) {
      var wrap = el("div", { class: "fb-field" });
      var inputId = "fb-" + f.id;
      wrap.appendChild(el("label", { for: inputId }, f.label));
      if (f.hint) wrap.appendChild(el("p", { class: "fb-hint", id: inputId + "-hint" }, f.hint));
      var input = el(f.area ? "textarea" : "input", { id: inputId, name: f.id, maxlength: f.area ? "2000" : "140" });
      if (!f.area) { input.type = "text"; input.setAttribute("autocomplete", "off"); }
      else input.rows = 4;
      if (f.placeholder) input.placeholder = f.placeholder;
      if (f.required) input.required = true;
      if (f.hint) input.setAttribute("aria-describedby", inputId + "-hint");
      if (f.latest) input.setAttribute("data-latest", "");
      wrap.appendChild(input);
      form.appendChild(wrap);
    });

    var consent = el("div", { class: "fb-consent" });
    var box = el("input", { type: "checkbox", id: "fb-consent", required: "" });
    consent.appendChild(box);
    consent.appendChild(el("label", { for: "fb-consent" }, "Je n'ai mis aucun identifiant ni adresse de serveur dans ce message."));
    form.appendChild(consent);

    var error = el("p", { class: "fb-error", role: "alert", id: "fb-error" });
    error.hidden = true;
    form.appendChild(error);

    var foot = el("div", { class: "fb-foot" });
    foot.appendChild(el("p", { class: "fb-note" }, "GitHub ouvre ensuite votre message, déjà rempli : relisez-le, cochez à nouveau la case de confidentialité, puis envoyez. Un compte GitHub gratuit est nécessaire." + (conf.after ? " " + conf.after : "")));
    foot.appendChild(el("button", { type: "submit", class: "btn btn-primary fb-submit" }, "Continuer sur GitHub"));
    form.appendChild(foot);

    // Any edit clears the previous error: it described the old content.
    form.addEventListener("input", function () { error.hidden = true; });
    form.addEventListener("change", function () { error.hidden = true; });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var problem = validate(form, conf);
      if (problem) {
        error.textContent = problem.message;
        error.hidden = false;
        if (problem.field) problem.field.focus();
        return;
      }
      error.hidden = true;
      var url = issueURL(kind, form, conf);
      if (url.length > MAX_URL) {
        // Share of the text to remove: the URL grows in proportion to the text
        // (each field is sent twice, accents take 6 characters once encoded).
        var excess = Math.min(95, Math.max(5, Math.ceil((url.length - MAX_URL) / url.length * 100 / 5) * 5));
        error.textContent = "Le message est trop long pour être transmis à GitHub : raccourcissez-le d'environ " + excess + " %.";
        error.hidden = false;
        return;
      }
      window.open(url, "_blank", "noopener");
      d.close();
    });

    d.appendChild(form);
    d.addEventListener("close", function () {
      if (opener && document.contains(opener)) opener.focus();
    });
    // Click on the backdrop closes the dialog.
    d.addEventListener("click", function (event) { if (event.target === d) d.close(); });
    return d;
  }

  function validate(form, conf) {
    for (var i = 0; i < conf.fields.length; i++) {
      var f = conf.fields[i];
      var input = form.elements[f.id];
      var value = input.value.trim();
      if (f.required && !value) {
        return { field: input, message: "Le champ \"" + f.label + "\" est obligatoire." };
      }
      for (var j = 0; j < SENSITIVE.length; j++) {
        if (SENSITIVE[j].re.test(value)) {
          return { field: input, message: "Le champ \"" + f.label + "\" semble contenir " + SENSITIVE[j].why + ". Retirez-le : ce message sera public." };
        }
      }
    }
    var consent = form.querySelector("#fb-consent");
    if (!consent.checked) return { field: consent, message: "Cochez la case de confidentialité pour continuer." };
    return null;
  }

  // Two ways to carry the message, both in the same URL:
  // - one query parameter per field id: GitHub fills its issue form with
  //   them (only once .github/ISSUE_TEMPLATE/ is on the default branch);
  // - "body": the whole message as Markdown, in the layout GitHub gives to an
  //   issue form answer. GitHub uses it when it shows the plain issue editor
  //   (template not on the default branch yet), so nothing is ever lost.
  function issueURL(kind, form, conf) {
    var params = ["template=" + encodeURIComponent(kind + ".yml")];
    var body = [];
    conf.fields.forEach(function (f) {
      var value = form.elements[f.id].value.trim();
      if (!value) return;
      if (f.id === "title") value = conf.prefix + value;
      else body.push("### " + f.label.replace(/ \(facultatif\)$/, "") + "\n\n" + value);
      params.push(encodeURIComponent(f.id) + "=" + encodeURIComponent(value));
    });
    body.push("### Confidentialité\n\n- [x] Je n'ai mis aucun identifiant ni adresse de serveur dans ce message.");
    params.push("body=" + encodeURIComponent(body.join("\n\n")));
    return "https://github.com/" + REPO + "/issues/new?" + params.join("&");
  }

  function openForm(kind, from) {
    if (!FORMS[kind] || typeof HTMLDialogElement === "undefined") return false;
    if (dialog) dialog.remove();
    dialog = buildDialog(kind);
    document.body.appendChild(dialog);
    var latest = readCache();
    if (latest) {
      dialog.querySelectorAll("[data-latest]").forEach(function (input) {
        input.placeholder = latest.version + " (" + latest.build + ")";
      });
    }
    opener = from || null;
    dialog.showModal();
    var first = dialog.querySelector("input, textarea");
    if (first) first.focus();
    return true;
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("[data-issue]");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (openForm(link.getAttribute("data-issue"), link)) event.preventDefault();
  });

  // ===== Motion ===========================================================
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Reveal: small details inside the feature visuals play once in view.
  var revealed = document.querySelectorAll("[data-reveal]");
  if (reduce.matches || !("IntersectionObserver" in window)) {
    revealed.forEach(function (node) { node.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });
    revealed.forEach(function (node) { io.observe(node); });
  }

  // Tilt of the app window, both ways: it looks up while it enters from the
  // bottom of the screen, stands straight around the middle, and looks down
  // while it leaves at the top. CSS scroll-driven animation where supported;
  // elsewhere (Firefox, older Safari) this sets --tilt from 1 to -1.
  var supportsTimeline = window.CSS && CSS.supports && CSS.supports("animation-timeline: view()");
  var win = document.querySelector(".js-tilt");
  if (win && !supportsTimeline && !reduce.matches) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var rect = win.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      // 0 when the window starts to enter, 1 when it has left (same range as
      // the CSS "cover" range), with a flat plateau between 40 % and 60 %.
      var p = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
      var tilt = p < 0.4 ? 1 - p / 0.4 : p > 0.6 ? -(p - 0.6) / 0.4 : 0;
      win.style.setProperty("--tilt", tilt.toFixed(3));
      win.style.setProperty("--tilt-abs", Math.abs(tilt).toFixed(3));
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }
})();
