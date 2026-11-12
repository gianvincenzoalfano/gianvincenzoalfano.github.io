// Optional enhancements. Without this script every page is complete and static.
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  doc.classList.add("js");
  if (reduced) doc.classList.add("reduced");

  // Email: build the mailto link only in the browser (the address is not in the HTML).
  document.querySelectorAll("[data-mail]").forEach(function (a) {
    var p = a.getAttribute("data-mail").split("|");
    a.href = "mailto:" + p[0] + "@" + p[1];
  });

  // Reading progress bar.
  var bar = document.querySelector(".progress");
  if (bar) {
    var ticking = false;
    var update = function () {
      var max = doc.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")";
      ticking = false;
    };
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // Back to top.
  var top = document.querySelector(".to-top");
  if (top) {
    var toggle = function () { top.classList.toggle("shown", scrollY > 700); };
    addEventListener("scroll", toggle, { passive: true });
    toggle();
  }

  // Reveal on scroll; elements also start their own animation (e.g. the figure).
  var reveal = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));
  if (!reduced && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
    reveal.forEach(function (el, i) {
      if (el.classList.contains("card")) el.style.setProperty("--stagger", (i % 3) * 90 + "ms");
      io.observe(el);
    });
  } else {
    reveal.forEach(function (el) { el.classList.add("is-in"); });
  }

  // Streaming bio with a live topics panel.
  var bio = document.querySelector("[data-stream]");
  if (!bio) return;
  var paras = Array.prototype.map.call(bio.querySelectorAll("p"), function (p) { return p.textContent; });
  var outs = Array.prototype.slice.call(bio.querySelectorAll("p"));
  var list = document.querySelector(".topics .bars");
  var more = document.querySelector(".topics-more");
  var items = Array.prototype.map.call(list.querySelectorAll("[data-topic]"), function (li, k) {
    return { li: li, k: k, re: new RegExp(li.getAttribute("data-topic"), "gi"), val: li.querySelector(".bar-val"), share: 0, n: 0 };
  });
  var words = document.querySelector(".js-words");
  var streaming = false, finish = null, selected = null;

  function render(text) {
    var total = 0;
    items.forEach(function (it) { it.n = (text.match(it.re) || []).length; total += it.n; });
    items.forEach(function (it) {
      it.share = total ? it.n / total : 0;
      it.li.style.setProperty("--v", it.share.toFixed(3));
      it.val.textContent = it.share.toFixed(2);
    });
    sortBars();
  }
  // Keep the bars ordered by value, animating the moves (FLIP).
  function sortBars() {
    var sorted = items.slice().sort(function (x, y) { return y.share - x.share || x.k - y.k; });
    var changed = sorted.some(function (it, i) { return list.children[i] !== it.li; });
    if (!changed) return;
    var before = new Map(items.map(function (it) { return [it, it.li.getBoundingClientRect().top]; }));
    sorted.forEach(function (it) { list.appendChild(it.li); });
    if (reduced) return;
    items.forEach(function (it) {
      var dy = before.get(it) - it.li.getBoundingClientRect().top;
      if (dy) it.li.animate([{ transform: "translateY(" + dy + "px)" }, { transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" });
    });
  }
  function highlight(it) {
    outs.forEach(function (p, i) {
      var t = paras[i];
      if (!it) { p.textContent = t; return; }
      p.textContent = "";
      var last = 0, m, re = new RegExp(it.re.source, "gi");
      while ((m = re.exec(t))) {
        p.appendChild(document.createTextNode(t.slice(last, m.index)));
        var mk = document.createElement("mark");
        mk.textContent = m[0];
        p.appendChild(mk);
        last = m.index + m[0].length;
      }
      p.appendChild(document.createTextNode(t.slice(last)));
    });
  }
  function choose(it) {
    if (streaming && finish) finish();
    selected = selected === it ? null : it;
    items.forEach(function (x) { x.btn.setAttribute("aria-pressed", String(x === selected)); });
    highlight(selected);
    if (selected) {
      var name = selected.li.querySelector(".bar-name").textContent;
      more.innerHTML = "";
      more.appendChild(document.createTextNode(selected.n + (selected.n === 1 ? " mention. " : " mentions. ")));
      var a = document.createElement("a");
      a.href = selected.li.getAttribute("data-href");
      a.textContent = "Read about " + name + " on the Research page";
      more.appendChild(a);
    } else more.textContent = "";
  }
  // Each row becomes a real button (keeps list semantics and keyboard support).
  items.forEach(function (it) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "bar-btn";
    btn.setAttribute("aria-pressed", "false");
    while (it.li.firstChild) btn.appendChild(it.li.firstChild);
    it.li.appendChild(btn);
    it.btn = btn;
    btn.addEventListener("click", function () { choose(it); });
  });
  render(paras.join(" "));
  if (reduced) return;

  // Fix the panel height so the page does not jump while the text grows.
  bio.style.minHeight = bio.offsetHeight + "px";
  outs.forEach(function (p) { p.textContent = ""; });
  var caret = document.createElement("span");
  caret.className = "caret";
  caret.setAttribute("aria-hidden", "true");
  // Screen readers get the full text at once.
  var sr = document.createElement("div");
  sr.className = "visually-hidden";
  sr.textContent = paras.join(" ");
  bio.parentNode.insertBefore(sr, bio);
  bio.setAttribute("aria-hidden", "true");
  render("");
  if (words) words.textContent = "000";

  var start = function () {
    var pi = 0, ci = 0, timer = null;
    streaming = true;
    finish = function () {
      clearTimeout(timer);
      outs.forEach(function (p, i) { p.textContent = paras[i]; });
      outs[outs.length - 1].appendChild(caret);
      caret.classList.add("done");
      if (words) words.textContent = ("00" + (paras.join(" ").match(/\S+/g) || []).length).slice(-3);
      render(paras.join(" "));
      streaming = false;
    };
    var step = function () {
      var text = paras[pi];
      ci = Math.min(text.length, ci + 2 + Math.floor(Math.random() * 3));
      var done = text.slice(0, ci);
      outs[pi].textContent = done;
      outs[pi].appendChild(caret);
      var all = paras.slice(0, pi).join(" ") + " " + done;
      if (words) words.textContent = ("00" + (all.match(/\S+/g) || []).length).slice(-3);
      render(all);
      if (ci >= text.length) { pi++; ci = 0; }
      if (pi < paras.length) timer = setTimeout(step, 28 + Math.random() * 30);
      else { streaming = false; caret.classList.add("done"); }
    };
    step();
  };
  if ("IntersectionObserver" in window) {
    var once = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { once.disconnect(); setTimeout(start, 350); }
    }, { threshold: 0.3 });
    once.observe(bio);
  } else start();
})();
