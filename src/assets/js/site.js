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

  initFramework(reduced);

  // Streaming bio with a live DF-QuAD computation over the research topics.
  var bio = document.querySelector("[data-stream]");
  if (!bio || reduced) return;
  var paras = Array.prototype.map.call(bio.querySelectorAll("p"), function (p) { return p.textContent; });
  var items = Array.prototype.map.call(document.querySelectorAll(".qbaf [data-topic]"), function (li) {
    return { li: li, re: new RegExp(li.getAttribute("data-topic"), "gi"), val: li.querySelector(".bar-val") };
  });
  var words = document.querySelector(".js-words");
  var BASE = 0.5, SUPPORT = 0.35;
  // DF-QuAD with supporters only: sigma = tau + (1 - tau) * (1 - prod(1 - s_i)).
  var strength = function (k) { return BASE + (1 - BASE) * (1 - Math.pow(1 - SUPPORT, k)); };
  var show = function (it, k) {
    var v = strength(k);
    it.li.style.setProperty("--v", v.toFixed(3));
    it.val.textContent = (v + 1e-9).toFixed(2);
  };

  // Fix the panel height so the page does not jump while the text grows.
  bio.style.minHeight = bio.offsetHeight + "px";
  var outs = Array.prototype.map.call(bio.querySelectorAll("p"), function (p) { p.textContent = ""; return p; });
  var caret = document.createElement("span");
  caret.className = "caret";
  caret.setAttribute("aria-hidden", "true");
  bio.setAttribute("aria-busy", "true");
  // Screen readers get the full text at once.
  var sr = document.createElement("div");
  sr.className = "visually-hidden";
  sr.textContent = paras.join(" ");
  bio.parentNode.insertBefore(sr, bio);
  bio.setAttribute("aria-hidden", "true");
  items.forEach(function (it) { show(it, 0); });
  if (words) words.textContent = "000";

  var start = function () {
    var pi = 0, ci = 0;
    var step = function () {
      var text = paras[pi];
      var n = Math.min(text.length, ci + 2 + Math.floor(Math.random() * 3));
      ci = n;
      var done = text.slice(0, ci);
      outs[pi].textContent = done;
      outs[pi].appendChild(caret);
      // count completed words and topic mentions in all text streamed so far
      var all = paras.slice(0, pi).join(" ") + " " + done;
      if (words) {
        var w = (all.match(/\S+/g) || []).length;
        words.textContent = ("00" + w).slice(-3);
      }
      items.forEach(function (it) { show(it, (all.match(it.re) || []).length); });
      if (ci >= text.length) { pi++; ci = 0; }
      if (pi < paras.length) setTimeout(step, 28 + Math.random() * 30);
      else { bio.removeAttribute("aria-busy"); caret.classList.add("done"); }
    };
    step();
  };
  if ("IntersectionObserver" in window) {
    var once = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { once.disconnect(); setTimeout(start, 350); }
    }, { threshold: 0.3 });
    once.observe(bio);
  } else start();

  // ---------------------------------------------------------------
  // Live argumentation framework: grounded, preferred, dynamic update
  // ---------------------------------------------------------------
  function initFramework(reduced) {
    var fig = document.getElementById("afx");
    if (!fig) return;
    var svg = fig.querySelector("svg");
    var flows = svg.querySelector(".flows");
    var title = fig.querySelector(".afx-title");
    var text = fig.querySelector(".afx-text");
    var tabs = Array.prototype.slice.call(fig.querySelectorAll(".afx-tabs button"));
    var pauseBtn = fig.querySelector(".afx-pause");
    var node = {}, edge = {};
    fig.querySelectorAll(".node").forEach(function (g) { node[g.getAttribute("data-arg")] = g; });
    fig.querySelectorAll(".edge").forEach(function (p) { edge[p.getAttribute("data-from") + p.getAttribute("data-to")] = p; });
    var ORDER = "abcdefhij".split("");
    var label = {};

    function set(arg, lab) {
      label[arg] = lab;
      var g = node[arg];
      g.classList.remove("in", "out", "undec");
      g.classList.add(lab);
      readout();
    }
    function setAll(map) { Object.keys(map).forEach(function (k) { set(k, map[k]); }); }
    function readout() {
      ["in", "out", "undec"].forEach(function (lab) {
        var xs = ORDER.filter(function (k) { return label[k] === lab && (k !== "j" || fig.classList.contains("with-j")); });
        fig.querySelector('[data-set="' + lab + '"]').textContent = xs.length ? "{" + xs.join(", ") + "}" : "\u2205";
      });
    }
    function say(t, html) { if (t) title.textContent = t; text.innerHTML = html; }
    function flash(from, to) {
      var src = edge[from + to];
      var f = src.cloneNode(false);
      f.removeAttribute("marker-end");
      f.setAttribute("class", "flow");
      var len = src.getTotalLength();
      f.style.strokeDasharray = len;
      f.style.strokeDashoffset = len;
      flows.appendChild(f);
      f.getBoundingClientRect();
      f.style.strokeDashoffset = 0;
      setTimeout(function () { f.classList.add("gone"); }, 650);
      setTimeout(function () { f.remove(); }, 1300);
    }
    function ping(args) {
      args.forEach(function (k) {
        node[k].classList.remove("ping"); node[k].getBoundingClientRect(); node[k].classList.add("ping");
      });
    }
    function region(on) {
      fig.classList.toggle("focus", on);
      ["a", "b", "c", "h", "i", "j"].forEach(function (k) { node[k].classList.toggle("affected", on && k !== "j"); });
    }
    function withJ(on) { fig.classList.toggle("with-j", on); readout(); }

    var G = { a: "in", b: "out", c: "in", h: "out", d: "undec", e: "undec", f: "undec", i: "undec", j: "in" };
    var U = { a: "undec", b: "undec", c: "undec", h: "undec", d: "undec", e: "undec", f: "undec", i: "undec", j: "undec" };
    var i_ = function (x) { return "<i>" + x + "</i>"; };

    // Each scene: setup, steps [function, wait ms], final state (used with reduced motion)
    var scenes = [
      {
        name: "Grounded semantics",
        setup: function () { withJ(false); region(false); setAll(U); say("Grounded semantics", "Start: every argument is undecided."); },
        steps: [
          [function () { set("a", "in"); say(null, i_("a") + " has no attackers, so it is accepted."); }, 1400],
          [function () { flash("a", "b"); }, 500],
          [function () { set("b", "out"); say(null, i_("a") + " attacks " + i_("b") + ", so " + i_("b") + " is rejected."); }, 1400],
          [function () { flash("b", "c"); }, 500],
          [function () { set("c", "in"); say(null, "The only attacker of " + i_("c") + " is rejected: " + i_("c") + " is accepted, defended by " + i_("a") + "."); }, 1500],
          [function () { flash("c", "h"); }, 500],
          [function () { set("h", "out"); say(null, i_("c") + " attacks " + i_("h") + ", so " + i_("h") + " is rejected."); }, 1400],
          [function () { ping(["d", "e", "f", "i"]); say(null, i_("d") + " and " + i_("e") + " attack each other and nothing settles them, so " + i_("d") + ", " + i_("e") + ", " + i_("f") + " and " + i_("i") + " stay undecided. This is the grounded labelling, the most skeptical one."); }, 3600]
        ],
        final: function () { withJ(false); region(false); setAll(G); say("Grounded semantics", "Only what is forced is accepted: " + i_("a") + " and " + i_("c") + " are in, " + i_("b") + " and " + i_("h") + " are out, and the conflict between " + i_("d") + " and " + i_("e") + " leaves " + i_("d") + ", " + i_("e") + ", " + i_("f") + " and " + i_("i") + " undecided."); }
      },
      {
        name: "Preferred semantics",
        setup: function () { withJ(false); region(false); setAll(G); say("Preferred semantics", "Preferred extensions are maximal admissible sets: the conflict between " + i_("d") + " and " + i_("e") + " is resolved in both ways."); },
        steps: [
          [function () {}, 1800],
          [function () { set("d", "in"); say(null, "Choose " + i_("d") + "."); }, 900],
          [function () { flash("d", "e"); }, 500],
          [function () { set("e", "out"); }, 700],
          [function () { flash("e", "f"); }, 500],
          [function () { set("f", "in"); }, 700],
          [function () { flash("f", "i"); }, 500],
          [function () { set("i", "out"); say(null, "First preferred extension: {a, c, d, f}."); }, 2600],
          [function () { setAll({ d: "undec", e: "undec", f: "undec", i: "undec" }); say(null, "Now choose " + i_("e") + "."); }, 900],
          [function () { set("e", "in"); }, 600],
          [function () { flash("e", "d"); flash("e", "f"); }, 500],
          [function () { set("d", "out"); set("f", "out"); }, 900],
          [function () { set("i", "in"); say(null, "Both attackers of " + i_("i") + ", " + i_("h") + " and " + i_("f") + ", are rejected. Second preferred extension: {a, c, e, i}. Both extensions are also stable: nothing is left undecided."); }, 4200]
        ],
        final: function () { withJ(false); region(false); setAll(G); setAll({ d: "out", e: "in", f: "out", i: "in" }); say("Preferred semantics", "Two preferred extensions, {a, c, d, f} and {a, c, e, i}, one for each way of resolving the conflict between " + i_("d") + " and " + i_("e") + ". Both are also stable. The one shown is the second."); }
      },
      {
        name: "Dynamic update",
        setup: function () { withJ(false); region(false); setAll(G); say("Dynamic update", "Frameworks change during a debate. Start from the grounded labelling."); },
        steps: [
          [function () {}, 1600],
          [function () { set("j", "in"); withJ(true); say(null, "A new argument " + i_("j") + " arrives and attacks " + i_("a") + "."); }, 700],
          [function () { flash("j", "a"); }, 1300],
          [function () { region(true); say(null, "Only arguments reachable from " + i_("a") + " can change: 5 of 10. The rest keeps its labels, so it is not recomputed."); }, 2600],
          [function () { set("a", "out"); }, 700],
          [function () { flash("a", "b"); }, 500],
          [function () { set("b", "in"); }, 700],
          [function () { flash("b", "c"); }, 500],
          [function () { set("c", "out"); }, 700],
          [function () { flash("c", "h"); }, 500],
          [function () { set("h", "in"); }, 700],
          [function () { flash("h", "i"); }, 500],
          [function () { set("i", "out"); say(null, "Incremental computation: the new grounded labelling is obtained by recomputing only the affected part and reusing the previous labels everywhere else."); }, 4400]
        ],
        final: function () { withJ(true); region(true); setAll({ j: "in", a: "out", b: "in", c: "out", h: "in", i: "out", d: "undec", e: "undec", f: "undec" }); say("Dynamic update", "After adding " + i_("j") + " and the attack on " + i_("a") + ", only the five arguments reachable from " + i_("a") + " are recomputed; " + i_("d") + ", " + i_("e") + " and " + i_("f") + " keep their labels."); }
      }
    ];

    var tabsBox = fig.querySelector(".afx-tabs");
    tabsBox.hidden = false;
    function markTab(k) { tabs.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === k)); }); }

    if (reduced) {
      // no motion: each button shows the final state of its scene
      tabs.forEach(function (b, i) { b.addEventListener("click", function () { markTab(i); scenes[i].final(); }); });
      scenes[0].final();
      return;
    }

    fig.classList.add("animated");
    fig.querySelector(".afx-controls").hidden = false;
    var run = 0, paused = false, current = 0;
    function wait(ms, id) {
      return new Promise(function (res, rej) {
        var left = ms, last = performance.now();
        (function tick() {
          if (id !== run) return rej("stop");
          var now = performance.now();
          if (!paused && !document.hidden) left -= now - last;
          last = now;
          if (left <= 0) res(); else setTimeout(tick, 60);
        })();
      });
    }
    function play(k) {
      var id = ++run;
      current = k;
      markTab(k);
      var sc = scenes[k];
      sc.setup();
      var chain = Promise.resolve();
      sc.steps.forEach(function (st) {
        chain = chain.then(function () { if (id !== run) throw "stop"; st[0](); return wait(st[1], id); });
      });
      chain.then(function () { if (id === run) play((k + 1) % scenes.length); }, function () {});
    }
    tabs.forEach(function (b, i) { b.addEventListener("click", function () { play(i); }); });
    pauseBtn.addEventListener("click", function () {
      paused = !paused;
      pauseBtn.textContent = paused ? "Play" : "Pause";
      pauseBtn.setAttribute("aria-pressed", String(paused));
      fig.classList.toggle("paused", paused);
    });
    if ("IntersectionObserver" in window) {
      var started = false;
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting && !started) { started = true; io.disconnect(); play(0); }
      }, { threshold: 0.35 });
      io.observe(fig);
      tabs.forEach(function (b) { b.addEventListener("click", function () { started = true; io.disconnect(); }); });
    } else play(0);
  }
})();
