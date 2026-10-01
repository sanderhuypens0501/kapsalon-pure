(function () {
  // Openingsuren: 0 = zondag ... 6 = zaterdag. [open, dicht] in uren.
  var HOURS = { 0: null, 1: null, 2: [10, 18], 3: [10, 18], 4: [10, 20], 5: [10, 19], 6: [9, 16] };
  var DAYS = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];

  function fmt(h) { return String(Math.floor(h)).padStart(2, "0") + ":" + (h % 1 ? "30" : "00"); }

  function brusselsNow() {
    var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Brussels", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
    var get = function (t) { return parts.find(function (p) { return p.type === t; }).value; };
    var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: map[get("weekday")], time: (parseInt(get("hour"), 10) % 24) + parseInt(get("minute"), 10) / 60 };
  }

  function updateStatus() {
    var now = brusselsNow();
    var today = HOURS[now.day];
    var isOpen = !!today && now.time >= today[0] && now.time < today[1];
    var text;
    if (isOpen) {
      text = "Nu open tot " + fmt(today[1]);
    } else {
      text = "Nu gesloten";
      for (var i = 0; i < 8; i++) {
        var d = (now.day + i) % 7, h = HOURS[d];
        if (h && (i > 0 || now.time < h[0])) {
          text = "Gesloten, opent " + (i === 0 ? "vandaag" : i === 1 ? "morgen" : DAYS[d]) + " om " + fmt(h[0]);
          break;
        }
      }
    }
    var status = document.getElementById("status");
    if (status) {
      status.classList.toggle("open", isOpen);
      status.classList.toggle("closed", !isOpen);
      document.getElementById("status-text").textContent = text;
    }
    document.querySelectorAll("#hours tr").forEach(function (tr) {
      var d = parseInt(tr.getAttribute("data-day"), 10);
      tr.classList.toggle("is-today", d === now.day);
      tr.classList.toggle("is-closed", !HOURS[d]);
    });
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  // Ontbrekende foto's tonen als nette placeholder met bestandsnaam.
  document.querySelectorAll(".ph img").forEach(function (img) {
    var mark = function () { img.closest(".ph").classList.add("is-missing"); };
    if (img.complete && img.naturalWidth === 0) mark();
    img.addEventListener("error", mark);
  });

  // Voor/na-schuifregelaar.
  document.querySelectorAll("[data-ba]").forEach(function (fig) {
    var frame = fig.querySelector(".ba-frame");
    var range = fig.querySelector(".ba-range");
    var set = function (v) { frame.style.setProperty("--pos", v + "%"); };
    range.addEventListener("input", function () { set(range.value); });
    set(range.value);
  });

  // Filter in het werk-grid.
  var filters = document.querySelectorAll(".filter");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = btn.getAttribute("data-filter");
      filters.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      document.querySelectorAll(".work-grid figure").forEach(function (fig) {
        fig.classList.toggle("is-hidden", f !== "alle" && fig.getAttribute("data-cat") !== f);
      });
    });
  });

  // Mobiel menu.
  var toggle = document.getElementById("menu-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Sluit" : "Menu";
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Menu";
      });
    });
  }

  // Stalenring in de hero: kies een lok, de foto en uitleg wisselen mee.
  var strands = Array.prototype.slice.call(document.querySelectorAll(".strand"));
  var heroImg = document.getElementById("swatch-img");
  var nameEl = document.getElementById("swatch-name");
  var textEl = document.getElementById("swatch-text");
  function choose(btn, focus) {
    strands.forEach(function (b) {
      var on = b === btn;
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    if (focus) btn.focus();
    nameEl.textContent = btn.getAttribute("data-name");
    textEl.textContent = btn.getAttribute("data-text");
    var src = btn.getAttribute("data-img");
    if (heroImg.getAttribute("src") === src) return;
    heroImg.classList.add("is-fading");
    setTimeout(function () {
      heroImg.setAttribute("src", src);
      heroImg.setAttribute("alt", btn.getAttribute("data-alt"));
      heroImg.closest(".ph").setAttribute("data-file", src.replace("img/", ""));
    }, 200);
  }
  if (heroImg) {
    heroImg.addEventListener("load", function () {
      heroImg.closest(".ph").classList.remove("is-missing");
      heroImg.classList.remove("is-fading");
    });
    heroImg.addEventListener("error", function () { heroImg.classList.remove("is-fading"); });
  }
  strands.forEach(function (btn, i) {
    btn.tabIndex = btn.getAttribute("aria-checked") === "true" ? 0 : -1;
    btn.addEventListener("click", function () { choose(btn, false); });
    btn.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = strands[(i + 1) % strands.length];
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = strands[(i - 1 + strands.length) % strands.length];
      if (next) { e.preventDefault(); choose(next, true); }
    });
  });
  // Laad de andere stalen alvast, zodat wisselen direct gaat.
  strands.forEach(function (b) { var im = new Image(); im.src = b.getAttribute("data-img"); });

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
