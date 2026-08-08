/* Readyset — phone view tabs. app.js drives the demo; this decides which console
   panel is on screen. Each step lands on the panel where its beat happens; a
   manual tab tap holds until the next step. */

(function () {
  "use strict";

  var TAB_FOR_STEP = { 1: "intake", 2: "work", 3: "agent", 4: "work", 5: "work", 6: "work", 7: "work", 8: "work", 9: "agent" };

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".m-tab"));
  var panels = {
    intake: document.getElementById("panel-intake"),
    work: document.getElementById("work"),
    agent: document.getElementById("panel-agent"),
  };

  function show(name) {
    tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", String(on));
    });
    Object.keys(panels).forEach(function (k) {
      panels[k].classList.toggle("active", k === name);
    });
  }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () { show(t.dataset.tab); });
  });

  var lastStep = 1; // app.js has already rendered step 1 by the time we run
  document.addEventListener("readyset:render", function (e) {
    var step = e.detail.step;
    if (step === lastStep) return; // re-render within a step (sort, reply) keeps the user's tab
    lastStep = step;
    show(TAB_FOR_STEP[step] || "work");
    window.scrollTo({ top: 0, behavior: "auto" });
  });

  show("intake");
})();
