/* =========================================================================
   Loriuscripts — interaction engine
   Custom cursor · spotlight · particles · smooth scroll · reveals ·
   magnetic buttons · tilt · counters · command palette · toasts
   Vanilla JS, no dependencies. Everything degrades gracefully.
   ========================================================================= */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Loading screen ---------- */
  window.addEventListener("load", function () {
    const loader = $(".loader");
    if (loader) setTimeout(() => loader.classList.add("done"), 1400);
  });

  /* ---------- Custom cursor + spotlight (pointer-fine only) ---------- */
  if (fine && !reduceMotion) {
    const cursor = $(".cursor");
    const dot = $(".cursor-dot");
    const spot = $(".spotlight");
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    let rx = cx, ry = cy;

    window.addEventListener("mousemove", (e) => {
      cx = e.clientX; cy = e.clientY;
      if (dot) { dot.style.left = cx + "px"; dot.style.top = cy + "px"; }
      if (spot) { spot.style.left = cx + "px"; spot.style.top = cy + "px"; }
    });

    (function ring() {
      rx += (cx - rx) * 0.18;
      ry += (cy - ry) * 0.18;
      if (cursor) { cursor.style.left = rx + "px"; cursor.style.top = ry + "px"; }
      requestAnimationFrame(ring);
    })();

    $$("a, button, .card, .kbd-hint, input, .quote, .stat").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor && cursor.classList.add("hover"));
      el.addEventListener("mouseleave", () => cursor && cursor.classList.remove("hover"));
    });
  }

  /* ---------- Particle field ---------- */
  (function particles() {
    const canvas = $("#particles");
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext("2d");
    let w, h, pts;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      const count = Math.min(70, Math.floor((w * h) / 26000));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.4 + 0.4,
        a: Math.random() * 0.5 + 0.1
      }));
    }
    resize();
    window.addEventListener("resize", resize);

    (function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255," + p.a + ")";
        ctx.fill();
      }
      requestAnimationFrame(draw);
    })();
  })();

  /* ---------- Scroll progress ---------- */
  const progress = $(".scroll-progress");
  const toTop = $(".to-top");
  function onScroll() {
    const st = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.width = (max > 0 ? (st / max) * 100 : 0) + "%";
    if (toTop) toTop.classList.toggle("show", st > 600);
    // Hide nav on scroll down, show on scroll up
    if (nav) {
      if (st > lastY && st > 300) nav.classList.add("hidden");
      else nav.classList.remove("hidden");
    }
    lastY = st;
  }
  const nav = $(".nav");
  let lastY = 0;
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toTop) {
    toTop.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })
    );
  }

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  $$("[data-reveal]").forEach((el, i) => {
    if (!el.style.getPropertyValue("--delay")) {
      el.style.setProperty("--delay", (i % 6) * 60 + "ms");
    }
    io.observe(el);
  });

  /* ---------- Magnetic buttons ---------- */
  if (fine && !reduceMotion) {
    $$("[data-magnetic]").forEach((el) => {
      const strength = parseFloat(el.dataset.magnetic) || 0.35;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
      });
      el.addEventListener("mouseleave", () => (el.style.transform = ""));
    });
  }

  /* ---------- Card spotlight + tilt ---------- */
  if (fine && !reduceMotion) {
    $$(".card").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
        const tiltX = (py - 0.5) * -5;
        const tiltY = (px - 0.5) * 5;
        card.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-3px)`;
      });
      card.addEventListener("mouseleave", () => (card.style.transform = ""));
    });
  }

  /* ---------- Animated counters ---------- */
  const counterIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        const decimals = (el.dataset.decimals && parseInt(el.dataset.decimals)) || 0;
        const dur = 1600;
        const start = performance.now();
        function tick(now) {
          const t = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          const val = target * eased;
          el.textContent =
            (decimals ? val.toFixed(decimals) : Math.floor(val).toLocaleString()) + suffix;
          if (t < 1) requestAnimationFrame(tick);
          else
            el.textContent =
              (decimals ? target.toFixed(decimals) : target.toLocaleString()) + suffix;
        }
        if (reduceMotion) {
          el.textContent =
            (decimals ? target.toFixed(decimals) : target.toLocaleString()) + suffix;
        } else {
          requestAnimationFrame(tick);
        }
        counterIO.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  $$("[data-count]").forEach((el) => counterIO.observe(el));

  /* ---------- Smooth anchor scroll ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  /* ---------- Newsletter toast ---------- */
  const news = $("#news-form");
  if (news) {
    news.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = news.querySelector("input");
      if (!input.value.trim()) return;
      input.value = "";
      toast("You're on the list. Welcome to the ecosystem.");
    });
  }

  function toast(msg) {
    let stack = $(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      document.body.appendChild(stack);
    }
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML =
      '<span class="ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>' +
      msg;
    stack.appendChild(t);
    setTimeout(() => {
      t.classList.add("out");
      setTimeout(() => t.remove(), 400);
    }, 3200);
  }
  window.LoriusToast = toast;

  /* ---------- Command palette (Ctrl/Cmd + K) ---------- */
  const overlay = $(".cmdk-overlay");
  if (overlay) {
    const input = $(".cmdk-input input", overlay);
    const list = $(".cmdk-list", overlay);
    const items = $$(".cmdk-item", overlay);
    let active = 0;

    function open() {
      overlay.classList.add("open");
      input.value = "";
      filter("");
      setTimeout(() => input.focus(), 60);
    }
    function close() {
      overlay.classList.remove("open");
    }
    function toggle() {
      overlay.classList.contains("open") ? close() : open();
    }
    function visibleItems() {
      return items.filter((i) => i.style.display !== "none");
    }
    function setActive(i) {
      const vis = visibleItems();
      vis.forEach((v) => v.classList.remove("active"));
      if (!vis.length) return;
      active = (i + vis.length) % vis.length;
      vis[active].classList.add("active");
      vis[active].scrollIntoView({ block: "nearest" });
    }
    function filter(q) {
      q = q.toLowerCase();
      let empty = true;
      items.forEach((it) => {
        const match = it.dataset.keywords.toLowerCase().includes(q);
        it.style.display = match ? "" : "none";
        if (match) empty = false;
      });
      let e = $(".cmdk-empty", overlay);
      if (empty) {
        if (!e) {
          e = document.createElement("div");
          e.className = "cmdk-empty";
          e.textContent = "No results found.";
          list.appendChild(e);
        }
      } else if (e) e.remove();
      active = 0;
      setActive(0);
    }
    function run(item) {
      const href = item.dataset.href;
      close();
      if (href && href.startsWith("#")) {
        const t = $(href);
        if (t) t.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      } else if (href) {
        window.location.href = href;
      }
    }

    window.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      } else if (e.key === "Escape") {
        close();
      } else if (overlay.classList.contains("open")) {
        if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
        else if (e.key === "Enter") {
          e.preventDefault();
          const vis = visibleItems();
          if (vis[active]) run(vis[active]);
        }
      }
    });

    input.addEventListener("input", () => filter(input.value));
    items.forEach((it) => it.addEventListener("click", () => run(it)));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    const opener = $("[data-cmdk-open]");
    if (opener) opener.addEventListener("click", open);
  }

  /* ---------- Year ---------- */
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
