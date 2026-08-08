/* Readyset demo — scripted scene engine.
   Steps run in order; steps with `gate` pause autoplay until the named
   button is clicked (the human-decides moments). */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const els = {
    clock: $("clock"),
    playBtn: $("btn-play"),
    stepBtn: $("btn-step"),
    restartBtn: $("btn-restart"),
    scenes: Array.from($("scenes").children),
    intakeNote: $("intake-note"),
    channelFeed: $("channel-feed"),
    agentFeed: $("agent-feed"),
    orderEmpty: $("order-empty"),
    order: $("order"),
    orderStatus: $("order-status"),
    dupCard: $("dup-card"),
    dupDone: $("dup-done"),
    linkDupBtn: $("btn-link-dup"),
    approveRow: $("approve-row"),
    approveBtn: $("btn-approve"),
    sentNote: $("sent-note"),
    queueTag: $("wo-4796-tag"),
    queueCard: $("wo-4796"),
    queueCount: $("queue-count"),
    metricBaseline: document.querySelector(".metric-baseline"),
  };

  /* ---------- helpers ---------- */

  let clockSeconds = 0;
  let clockAnim = null;

  function fmt(s) {
    return Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  }

  function setClock(target, instant) {
    if (clockAnim) cancelAnimationFrame(clockAnim);
    if (instant || reduced) {
      clockSeconds = target;
      els.clock.textContent = fmt(target);
      return;
    }
    const from = clockSeconds;
    const t0 = performance.now();
    const dur = 550;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      clockSeconds = from + (target - from) * eased;
      els.clock.textContent = fmt(clockSeconds);
      if (p < 1) clockAnim = requestAnimationFrame(tick);
    };
    clockAnim = requestAnimationFrame(tick);
  }

  function channelCard({ id, chan, from, text }) {
    const li = document.createElement("li");
    li.className = "feed-card";
    li.id = id;
    li.innerHTML =
      '<div class="feed-meta"><span class="chan">' + chan + "</span><span>" + from + "</span></div>" +
      "<p>" + text + "</p>";
    els.channelFeed.appendChild(li);
    return li;
  }

  function agentLine(html, mood) {
    const li = document.createElement("li");
    li.className = "agent-line" + (mood ? " " + mood : "");
    li.innerHTML = html;
    els.agentFeed.appendChild(li);
    li.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
    return li;
  }

  function msgCard({ head, stamp, text, reply, typeIt, onDone }) {
    const li = document.createElement("li");
    li.className = "msg-card" + (reply ? " reply" : "");
    li.innerHTML =
      '<div class="msg-head"><span>' + head + "</span><span>" + stamp + "</span></div><p></p>";
    els.agentFeed.appendChild(li);
    const p = li.querySelector("p");
    if (!typeIt || reduced) {
      p.textContent = text;
      li.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
      if (onDone) onDone();
      return li;
    }
    const textNode = document.createTextNode("");
    const caret = document.createElement("span");
    caret.className = "typing-caret";
    p.appendChild(textNode);
    p.appendChild(caret);
    finishTyping = () => {
      textNode.nodeValue = text;
      caret.remove();
      finishTyping = null;
    };
    let i = 0;
    const t0 = performance.now();
    const CPS = 140; // chars/sec; time-based so background-tab timer throttling can't stall it
    const step = () => {
      i = Math.min(text.length, Math.max(i + 1, Math.ceil(((performance.now() - t0) / 1000) * CPS)));
      textNode.nodeValue = text.slice(0, i);
      li.scrollIntoView({ block: "nearest" });
      if (i < text.length) {
        typeTimer = setTimeout(step, 18);
      } else {
        caret.remove();
        finishTyping = null;
        if (onDone) onDone();
      }
    };
    typeTimer = setTimeout(step, 120);
    return li;
  }

  function setField(id, value, cls, src, srcOk) {
    const f = $(id);
    const dd = f.querySelector("dd");
    dd.textContent = value;
    dd.className = cls || "";
    const srcEl = f.querySelector(".src");
    srcEl.textContent = src || "";
    srcEl.className = "src" + (srcOk ? " ok" : "");
    if (!reduced) {
      f.classList.remove("flash");
      void f.offsetWidth;
      f.classList.add("flash");
    }
  }

  function setStatus(text, cls) {
    els.orderStatus.textContent = text;
    els.orderStatus.className = "tag " + (cls || "");
  }

  function setScene(name) {
    let hit = false;
    els.scenes.forEach((li) => {
      if (li.dataset.scene === name) {
        li.className = "active";
        hit = true;
      } else {
        li.className = hit ? "" : "done";
      }
    });
  }

  const askText =
    "Hi Emily — on it. Two quick things so we can book the technician first try:\n" +
    "1. Which room on level 4 — 4.02 (small) or 4.06 (boardroom)?\n" +
    "2. When can they get in today, and who should they ask for?\n" +
    "— Readyset, for 140 Collins facilities";

  const replyText =
    "It's 4.06, the boardroom. Any time after 2pm — ask for me at level 4 reception. Thanks! — Emily";

  const ackText =
    "Booked — your reference is WO-4831. A technician is attending the level 4 boardroom after 2pm today. We'll update you here.";

  /* ---------- the script ---------- */

  const steps = [
    { scene: "intake", d: 500, run() {
      els.intakeNote.textContent = "4 channels · live";
      channelCard({ id: "c-emily", chan: "EMAIL", from: "Emily Tran · tenant, level 4",
        text: "Hi, the big meeting room on level 4 is freezing again. Same as last month — can someone take a look?" });
    }},
    { d: 800, run() {
      channelCard({ id: "c-sms", chan: "SMS", from: "0412 ··· ··· · tenant, level 2",
        text: "toilet on level 2 still leaking??" });
    }},
    { d: 800, run() {
      channelCard({ id: "c-phone", chan: "PHONE", from: "transcript · reception",
        text: "…lift two is making a grinding noise when it stops on five…" });
    }},
    { d: 800, run() {
      channelCard({ id: "c-switch", chan: "EMAIL", from: "J. Okafor · tenant, ground",
        text: "There's a burning smell near the switchboard on the ground floor." });
    }},
    { d: 900, run() {
      agentLine("4 new requests across 3 channels. Triaging.");
    }},
    { d: 1100, run() {
      const c = $("c-switch");
      const tag = document.createElement("span");
      tag.className = "tag t-escalated";
      tag.textContent = "ESCALATED · HUMAN";
      c.appendChild(tag);
      agentLine("Possible electrical hazard — handed straight to the on-call manager.<span class='why'>The agent never manages emergencies. It only spots them fast.</span>", "warn");
    }},
    { d: 1300, run() {
      $("c-sms").classList.add("dim");
      $("c-phone").classList.add("dim");
      $("c-switch").classList.add("dim");
      agentLine("2 routine requests queued. Focusing on Emily's email — 4 of 6 dispatch fields are missing.");
    }},
    { scene: "read", d: 1200, run() {
      $("c-emily").classList.add("focus");
      els.orderEmpty.hidden = true;
      els.order.hidden = false;
      setStatus("INCOMPLETE", "tag-muted");
      setClock(8);
      setField("f-issue", "HVAC — no heating (recurring)", "confirmed", "0.96", true);
      setField("f-site", "140 Collins St", "confirmed", "directory", true);
      setField("f-zone", "Level 4 — “the big meeting room”", "ambig", "4.02 or 4.06?");
      setField("f-asset", "AC-L4-··", "ambig", "depends on room");
      setField("f-access", "missing", "pending", "");
      setField("f-contact", "missing", "pending", "");
    }},
    { d: 1600, run() {
      agentLine("Two fields missing, two ambiguous. Drafting one ask-back — a single plain-language message, not a form.");
    }},
    { scene: "askback", d: 1300, async: true, run(next) {
      setClock(42);
      setStatus("WAITING ON REPLY", "t-waiting");
      msgCard({ head: "TO: EMILY TRAN", stamp: "SENT · T+0:42", text: askText, typeIt: true, onDone: next });
    }},
    { d: 1400, run() {
      agentLine("Reply usually lands in minutes — Emily just hits reply. No portal, no login.<span class='stamp'>waiting…</span>");
    }},
    { scene: "reply", d: 1800, run() {
      setClock(178);
      msgCard({ head: "FROM: EMILY TRAN", stamp: "REPLY · T+2:58", text: replyText, reply: true });
    }},
    { d: 1300, run() {
      setClock(185);
      setField("f-zone", "4.06 — Boardroom, level 4", "confirmed", "from reply", true);
      setField("f-asset", "AC-L4-06", "confirmed", "resolved", true);
      setField("f-access", "Today, after 14:00", "confirmed", "from reply", true);
      setField("f-contact", "Emily Tran — level 4 reception", "confirmed", "from reply", true);
      agentLine("All six fields grounded — every value logged with its source.", "good");
    }},
    { scene: "dedupe", d: 1500, run() {
      agentLine("Checking against 14 open orders…");
    }},
    { d: 1100, gate: "linkDup", run() {
      setClock(196);
      setStatus("DUPLICATE?", "t-dup");
      els.dupCard.hidden = false;
      els.linkDupBtn.classList.add("armed");
      agentLine("WO-4796 — “aircon not working, level 4”, phoned in 2 days ago — looks like the same issue. Flagging for the coordinator.", "warn");
    }},
    { d: 700, run() {
      els.dupCard.hidden = true;
      els.dupDone.hidden = false;
      els.queueCard.classList.add("linked");
      els.queueTag.textContent = "LINKED → WO-4831";
      els.queueTag.className = "tag t-sent";
      els.queueCount.textContent = "0 unassigned";
      setClock(220);
      agentLine("Linked by the coordinator. Both reporters now get updates from one order.", "good");
    }},
    { scene: "ready", d: 1000, gate: "approve", run() {
      setStatus("READY", "t-ready");
      els.approveRow.hidden = false;
      els.approveBtn.classList.add("armed");
      agentLine("Work order is dispatch-ready. Nothing is written to your system of record without a human click.");
    }},
    { d: 600, run() {
      setClock(252, true);
      els.clock.classList.add("done");
      els.metricBaseline.innerHTML = "team baseline: <s>2.4 days</s>";
      els.approveRow.hidden = true;
      els.sentNote.hidden = false;
      setStatus("SENT ✓", "t-sent");
    }},
    { d: 900, run() {
      msgCard({ head: "TO: EMILY TRAN", stamp: "ACK · T+4:12", text: ackText });
    }},
    { d: 1100, run() {
      agentLine("<strong>Reported → ready in 4 min 12 s.</strong> Team baseline: 2.4 days. <a class='how-link' href='#how-it-works' style='color:var(--signal)'>See how it works ↓</a>", "good");
      els.playBtn.textContent = "Play it again";
      els.playBtn.classList.remove("playing");
    }},
  ];

  /* ---------- engine ---------- */

  let idx = 0;
  let playing = false;
  let timer = null;
  let typeTimer = null;
  let waitingGate = null;
  let finishTyping = null;

  function clearTimers() {
    clearTimeout(timer);
    clearTimeout(typeTimer);
    if (finishTyping) finishTyping();
    timer = null;
  }

  function runStep(i, thenAuto) {
    const s = steps[i];
    if (!s) return;
    if (s.scene) setScene(s.scene);
    if (s.async && thenAuto && !reduced) {
      s.run(() => { idx = i + 1; if (playing) queueNext(); });
      if (s.gate) armGate(s.gate);
      return; // next queued by onDone
    }
    s.run(function () {});
    idx = i + 1;
    if (s.gate) {
      armGate(s.gate);
      return; // wait for human
    }
    if (thenAuto && playing) queueNext();
  }

  function queueNext() {
    if (idx >= steps.length) { playing = false; return; }
    const s = steps[idx];
    timer = setTimeout(() => runStep(idx, true), reduced ? 350 : s.d);
  }

  function armGate(name) {
    playing = false;
    els.playBtn.classList.remove("playing");
    waitingGate = name;
    els.stepBtn.disabled = true;
  }

  function gateCleared() {
    waitingGate = null;
    els.stepBtn.disabled = false;
    playing = true;
    els.playBtn.classList.add("playing");
    queueNext();
  }

  els.linkDupBtn.addEventListener("click", () => {
    if (waitingGate !== "linkDup") return;
    els.linkDupBtn.classList.remove("armed");
    gateCleared();
  });

  els.approveBtn.addEventListener("click", () => {
    if (waitingGate !== "approve") return;
    els.approveBtn.classList.remove("armed");
    gateCleared();
  });

  els.playBtn.addEventListener("click", () => {
    if (idx >= steps.length) { reset(); }
    if (waitingGate) return; // gates need their own click
    if (playing) {
      playing = false;
      clearTimers();
      els.playBtn.textContent = "Resume";
      els.playBtn.classList.remove("playing");
    } else {
      playing = true;
      els.playBtn.textContent = "Pause";
      els.playBtn.classList.add("playing");
      if (idx === 0) runStep(0, true); else queueNext();
    }
  });

  els.stepBtn.addEventListener("click", () => {
    if (waitingGate) return;
    clearTimers();
    playing = false;
    els.playBtn.textContent = idx >= steps.length - 1 ? "Play it again" : "Resume";
    els.playBtn.classList.remove("playing");
    runStep(idx, false);
  });

  function reset() {
    clearTimers();
    playing = false;
    waitingGate = null;
    idx = 0;
    clockSeconds = 0;
    els.clock.textContent = "0:00";
    els.clock.classList.remove("done");
    els.metricBaseline.innerHTML = "team baseline: 2.4 days";
    els.channelFeed.innerHTML = "";
    els.agentFeed.innerHTML = "";
    els.orderEmpty.hidden = false;
    els.order.hidden = true;
    els.dupCard.hidden = true;
    els.dupDone.hidden = true;
    els.approveRow.hidden = true;
    els.sentNote.hidden = true;
    els.linkDupBtn.classList.remove("armed");
    els.approveBtn.classList.remove("armed");
    els.queueCard.classList.remove("linked");
    els.queueTag.textContent = "UNASSIGNED · 2D";
    els.queueTag.className = "tag tag-muted";
    els.queueCount.textContent = "1 unassigned";
    els.intakeNote.textContent = "4 channels · listening";
    els.scenes.forEach((li) => (li.className = ""));
    els.stepBtn.disabled = false;
    els.playBtn.textContent = "Play the demo";
    els.playBtn.classList.remove("playing");
    ["f-issue", "f-site", "f-zone", "f-asset", "f-access", "f-contact"].forEach((id) => {
      setField(id, "—", "pending", "");
      $(id).classList.remove("flash");
    });
    setStatus("INCOMPLETE", "tag-muted");
  }

  els.restartBtn.addEventListener("click", reset);
})();
