// Projo site: the "Toutes les versions" page. Reads every release from the
// GitHub API and shows its notes here, with its disk image when it has one.
// The notes are Markdown written by the release script; they are rendered by
// the small converter below, which only creates elements and text nodes
// (never innerHTML), so nothing in a release body can inject markup.
"use strict";

(function () {
  var P = window.Projo;
  var box = document.querySelector(".js-releases");
  if (!P || !box || !("fetch" in window)) return;

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  // ----- Markdown subset: ## headings, - and 1. lists, > quotes, paragraphs,
  // `code`, **bold**, [text](https://...) links.
  function inline(parent, text) {
    var re = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g;
    var last = 0;
    var m;
    while ((m = re.exec(text))) {
      if (m.index > last) parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      if (m[1] != null) parent.appendChild(el("code", null, m[1]));
      else if (m[2] != null) parent.appendChild(el("strong", null, m[2]));
      else {
        var a = el("a", null, m[3]);
        a.href = m[4];
        a.rel = "noopener";
        parent.appendChild(a);
      }
      last = re.lastIndex;
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
  }

  function renderMarkdown(md, skipHeading) {
    var out = document.createDocumentFragment();
    var lines = String(md || "").replace(/\r\n?/g, "\n").split("\n");
    var list = null;      // current <ul>/<ol>
    var para = null;      // current paragraph text
    var quote = null;     // current blockquote text

    function flush() {
      if (para != null) { var p = el("p"); inline(p, para); out.appendChild(p); para = null; }
      if (quote != null) { var q = el("blockquote"); var qp = el("p"); inline(qp, quote); q.appendChild(qp); out.appendChild(q); quote = null; }
      list = null;
    }

    lines.forEach(function (raw) {
      var line = raw.trim();
      var m;
      if (!line) { flush(); return; }
      if ((m = /^#{1,6}\s+(.*)$/.exec(line))) {
        flush();
        if (skipHeading && m[1].trim() === skipHeading) return;
        var h = el("h3"); inline(h, m[1]); out.appendChild(h);
        return;
      }
      if ((m = /^>\s?(.*)$/.exec(line))) {
        if (para != null || list) flush();
        quote = quote == null ? m[1] : quote + " " + m[1];
        return;
      }
      var bullet = /^[-*]\s+(.*)$/.exec(line);
      var number = /^\d+[.)]\s+(.*)$/.exec(line);
      if (bullet || number) {
        var tag = bullet ? "UL" : "OL";
        if (para != null || quote != null) flush();
        if (!list || list.tagName !== tag) { list = el(tag.toLowerCase()); out.appendChild(list); }
        var li = el("li"); inline(li, (bullet || number)[1]); list.appendChild(li);
        return;
      }
      if (list) list = null;
      if (quote != null) flush();
      para = para == null ? line : para + " " + line;
    });
    flush();
    return out;
  }

  function frenchDate(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return "";
    // Long French date, without the locale's non-breaking spaces.
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).replace(/[\u00a0\u202f]/g, " ");
  }

  function render(list) {
    box.textContent = "";
    var latest = list.filter(function (r) { return r.dmg; })[0];
    list.forEach(function (r) {
      var art = el("article", "release");
      art.id = "v" + r.version;
      var head = el("header", "release-head");
      head.appendChild(el("h2", null, "Projo " + r.version));
      if (r === latest) head.appendChild(el("span", "release-tag", "Dernière version"));
      else if (!r.dmg) head.appendChild(el("span", "release-tag is-old", "Historique"));
      var meta = frenchDate(r.date);
      if (r.build) meta = (meta ? meta + " - " : "") + "build " + r.build;
      head.appendChild(el("p", "release-date", meta));
      art.appendChild(head);

      var notes = el("div", "release-notes");
      notes.appendChild(renderMarkdown(r.body, "Projo " + r.version));
      art.appendChild(notes);

      if (r.dmg) {
        var foot = el("div", "release-foot");
        var a = el("a", "btn btn-primary");
        a.href = P.notMac ? "https://github.com/" + P.REPO + "/releases/tag/v" + r.version + (r.build ? "-" + r.build : "") : r.dmg.url;
        var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute("viewBox", "0 0 24 24");
        icon.setAttribute("class", "btn-icon");
        icon.setAttribute("aria-hidden", "true");
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14");
        icon.appendChild(path);
        a.appendChild(icon);
        a.appendChild(document.createTextNode("Télécharger la " + r.version));
        foot.appendChild(a);
        foot.appendChild(el("span", "release-size", r.dmg.name + " - " + P.megabytes(r.dmg.size) + " Mo"));
        art.appendChild(foot);
      }
      box.appendChild(art);
    });
    // The notes arrive after the first paint: honour #v0.24 links now.
    var id = location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch (e) { /* malformed anchor: use it as is */ }
    var target = id && document.getElementById(id);
    if (target) target.scrollIntoView();
    status.textContent = list.length + " versions chargées.";
  }

  function fail(error) {
    box.textContent = "";
    var p = el("p", "releases-status", "La liste des versions n'a pas pu être chargée. Elle est aussi ");
    var a = el("a", null, "sur GitHub");
    a.href = "https://github.com/" + P.REPO + "/releases";
    p.appendChild(a);
    p.appendChild(document.createTextNode("."));
    box.appendChild(p);
    status.textContent = "La liste des versions n'a pas pu être chargée.";
    if (window.console) console.info("Projo: releases not loaded.", error && error.message);
  }

  // Screen readers hear this short status, not the whole list of notes.
  var status = el("p", "visually-hidden");
  status.setAttribute("role", "status");
  box.parentNode.insertBefore(status, box);
  box.textContent = "";
  box.appendChild(el("p", "releases-status", "Chargement des versions..."));
  P.loadReleases().then(render).catch(fail);
})();
