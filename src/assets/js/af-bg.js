// Background: a bipolar argumentation framework. Solid arrows are attacks,
// dashed arrows with a diamond tip are supports. Nodes are coloured with the
// grounded labelling computed on the attacks; every few seconds one relation
// changes and the labelling is recomputed. Optional: without JavaScript the
// page has a plain background; with "reduce motion" the graph is static.
(function () {
  "use strict";
  var canvas = document.querySelector(".af-bg");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, nodes = [], edges = [], pulses = [], mouse = { x: -1e4, y: -1e4 };
  var col = {};

  function readColours() {
    var cs = getComputedStyle(document.documentElement);
    ["--in", "--out", "--undec", "--ink", "--paper"].forEach(function (v) { col[v.slice(2)] = cs.getPropertyValue(v).trim(); });
  }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function build() {
    var n = Math.max(16, Math.min(56, Math.round((W * H) / 36000)));
    nodes = [];
    // jittered grid so the graph covers the whole viewport evenly
    var cols = Math.ceil(Math.sqrt(n * W / H)), rows = Math.ceil(n / cols);
    var cw = W / cols, rh = H / rows;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      if (nodes.length >= n) break;
      nodes.push({
        ax: (c + rand(0.2, 0.8)) * cw, ay: (r + rand(0.2, 0.8)) * rh,
        R: rand(8, 22), w: rand(0.00012, 0.00028), ph: rand(0, 6.28), ph2: rand(0, 6.28),
        r: rand(4.5, 7), lab: "undec", mix: { in: 0, out: 0, undec: 1 }, x: 0, y: 0
      });
    }
    // each node links to its two nearest neighbours
    edges = [];
    var seen = {};
    nodes.forEach(function (a, i) {
      var near = nodes.map(function (b, j) { return [j, (a.ax - b.ax) * (a.ax - b.ax) + (a.ay - b.ay) * (a.ay - b.ay)]; })
        .filter(function (p) { return p[0] !== i; }).sort(function (p, q) { return p[1] - q[1]; }).slice(0, 2);
      near.forEach(function (p) {
        var j = p[0], key = Math.min(i, j) + "-" + Math.max(i, j);
        if (seen[key]) return; seen[key] = 1;
        var fwd = Math.random() < 0.5;
        edges.push({ s: fwd ? i : j, t: fwd ? j : i, kind: Math.random() < 0.68 ? "att" : "sup", glow: 0 });
      });
    });
    label(true);
  }

  // Grounded labelling on the attack relation.
  function label(instant) {
    var att = nodes.map(function () { return []; });
    edges.forEach(function (e) { if (e.kind === "att") att[e.t].push(e.s); });
    var lab = nodes.map(function () { return "undec"; }), changed = true;
    while (changed) {
      changed = false;
      for (var i = 0; i < nodes.length; i++) {
        if (lab[i] !== "undec") continue;
        if (att[i].every(function (a) { return lab[a] === "out"; })) { lab[i] = "in"; changed = true; }
        else if (att[i].some(function (a) { return lab[a] === "in"; })) { lab[i] = "out"; changed = true; }
      }
    }
    nodes.forEach(function (n, i) {
      n.lab = lab[i];
      if (instant) n.mix = { in: +(lab[i] === "in"), out: +(lab[i] === "out"), undec: +(lab[i] === "undec") };
    });
  }

  function resize() {
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function rgba(c, a) {
    // c is a hex colour from the CSS variables
    var h = c.replace("#", "");
    if (h.length === 3) h = h.split("").map(function (x) { return x + x; }).join("");
    var n = parseInt(h, 16);
    return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + a + ")";
  }

  function place(t) {
    nodes.forEach(function (n) {
      n.x = n.ax + Math.cos(t * n.w + n.ph) * n.R;
      n.y = n.ay + Math.sin(t * n.w * 1.3 + n.ph2) * n.R * 0.7;
      var d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
      n.near = Math.max(0, 1 - d / 160);
    });
  }

  function draw(t, dt) {
    ctx.clearRect(0, 0, W, H);
    place(t);
    // edges
    edges.forEach(function (e) {
      var a = nodes[e.s], b = nodes[e.t];
      var dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      var x1 = a.x + ux * (a.r + 3), y1 = a.y + uy * (a.r + 3), x2 = b.x - ux * (b.r + 4), y2 = b.y - uy * (b.r + 4);
      var hi = Math.max(a.near, b.near, e.glow);
      e.glow = Math.max(0, e.glow - dt / 1600);
      var alpha = 0.22 + 0.5 * hi;
      ctx.lineWidth = 1.1 + 0.9 * hi;
      if (e.kind === "att") {
        ctx.setLineDash([]);
        ctx.strokeStyle = rgba(col.ink, alpha);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * 5, y2 - uy * 5); ctx.stroke();
        ctx.fillStyle = rgba(col.ink, alpha);
        ctx.beginPath(); ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - ux * 8 - uy * 4, y2 - uy * 8 + ux * 4);
        ctx.lineTo(x2 - ux * 8 + uy * 4, y2 - uy * 8 - ux * 4); ctx.closePath(); ctx.fill();
      } else {
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = rgba(col.in, alpha + 0.05);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * 7, y2 - uy * 7); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = rgba(col.in, alpha + 0.1);
        var mx = x2 - ux * 4, my = y2 - uy * 4;
        ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(mx - uy * 3.2, my + ux * 3.2);
        ctx.lineTo(x2 - ux * 8, y2 - uy * 8); ctx.lineTo(mx + uy * 3.2, my - ux * 3.2); ctx.closePath(); ctx.fill();
      }
    });
    // pulses travelling along attacks
    pulses = pulses.filter(function (p) {
      p.k += dt / 1100;
      if (p.k >= 1) return false;
      var e = edges[p.e]; if (!e) return false;
      var a = nodes[e.s], b = nodes[e.t];
      var x = a.x + (b.x - a.x) * p.k, y = a.y + (b.y - a.y) * p.k;
      ctx.fillStyle = rgba(e.kind === "att" ? col.out : col.in, 0.75 * Math.sin(Math.PI * p.k));
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 6.283); ctx.fill();
      return true;
    });
    // nodes, cross-fading between labels
    nodes.forEach(function (n) {
      ["in", "out", "undec"].forEach(function (l) {
        var target = n.lab === l ? 1 : 0;
        n.mix[l] += (target - n.mix[l]) * Math.min(1, dt / 350);
      });
      var r = n.r * (1 + 0.35 * n.near), boost = 0.45 * n.near;
      if (n.mix.in > 0.01) {
        ctx.fillStyle = rgba(col.in, (0.5 + boost) * n.mix.in);
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.283); ctx.fill();
      }
      if (n.mix.out > 0.01) {
        ctx.setLineDash([]); ctx.lineWidth = 1.6;
        ctx.strokeStyle = rgba(col.out, (0.55 + boost) * n.mix.out);
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.283); ctx.stroke();
      }
      if (n.mix.undec > 0.01) {
        ctx.setLineDash([2.5, 2.5]); ctx.lineWidth = 1.4;
        ctx.strokeStyle = rgba(col.undec, (0.55 + boost) * n.mix.undec);
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.283); ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  }

  // A small change to the framework: flip a relation or reverse it, then relabel.
  function update() {
    if (!edges.length) return;
    var i = Math.floor(Math.random() * edges.length), e = edges[i];
    if (Math.random() < 0.5) e.kind = e.kind === "att" ? "sup" : "att";
    else { var s = e.s; e.s = e.t; e.t = s; }
    e.glow = 1;
    pulses.push({ e: i, k: 0 });
    label(false);
  }

  readColours();
  resize();
  var last = performance.now(), acc = 0, nextPulse = 900, nextUpdate = 6500;
  if (reduced) { draw(0, 1000); return; }
  function frame(now) {
    var dt = Math.min(64, now - last); last = now;
    if (!document.hidden) {
      acc += dt;
      if (acc >= 33) { // about 30 frames per second
        nextPulse -= acc; nextUpdate -= acc;
        if (nextPulse <= 0) {
          var atts = edges.map(function (e, k) { return e.kind === "att" ? k : -1; }).filter(function (k) { return k >= 0; });
          if (atts.length) pulses.push({ e: atts[Math.floor(Math.random() * atts.length)], k: 0 });
          nextPulse = rand(700, 1500);
        }
        if (nextUpdate <= 0) { update(); nextUpdate = rand(5000, 8000); }
        draw(now, acc);
        acc = 0;
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  var rt;
  addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 200); });
  addEventListener("pointermove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  addEventListener("pointerleave", function () { mouse.x = mouse.y = -1e4; });
  if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColours);
  document.addEventListener("themechange", readColours);
})();
