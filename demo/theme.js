/* Readyset — theme toggle. The console stage always runs dark; this switches the
   page frame between light and dark. Explicit choice persists in localStorage and
   overrides the OS preference; with no choice stored, the OS preference wins. */

(function () {
  "use strict";

  var KEY = "rs-theme";
  var root = document.documentElement;
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;

  function effective() {
    return root.dataset.theme || (mq.matches ? "dark" : "light");
  }

  function label() {
    btn.setAttribute(
      "aria-label",
      effective() === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  btn.addEventListener("click", function () {
    var next = effective() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem(KEY, next); } catch (e) { /* private mode */ }
    label();
  });

  mq.addEventListener("change", label);
  label();
})();
