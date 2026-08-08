/* Readyset — coordinator console. Vanilla-JS port of the v2 design handoff.
   Five state variables drive everything; all display values are derived from `step`.
   Steps 5 and 7 block deliberately: the AI cannot advance past a human decision. */

(function () {
  "use strict";

  /* Demo tuning (kept configurable per handoff) */
  const CONFIG = {
    replyDelayMs: 1100,      // 300–3000: how long Emily's reply takes at step 4
    includeHazardBeat: true, // false ends the arc at step 8
    showSourceNotes: true,   // false hides provenance notes on filled fields
  };

  const CAPTIONS = {
    1: "New email lands in the stream.",
    2: "Extraction runs — three fields stall the job.",
    3: "One clarifying question goes back to Emily.",
    4: "Her reply fills the gaps.",
    5: "Duplicate suggested — your call.",
    6: "Linked, not merged.",
    7: "Work order composed. Approve when ready.",
    8: "Handed to Maximo. Counter frozen.",
    9: "Hazard bypasses automation entirely.",
  };

  const PRI = {
    P1: { bg: "#4A3413", fg: "#E5B25C", rail: "#C08A2E" },
    P2: { bg: "#2C5648", fg: "#F5F2E9", rail: "#2C5648" },
    P3: { bg: "#1D4034", fg: "#7FB79A", rail: "#3E6355" },
    P4: { bg: "#16332B", fg: "#5E7A6D", rail: "#24473B" },
  };

  const CHIP = {
    READY: { bg: "#2FD284", fg: "#0B211B", border: "#2FD284" },
    ESCALATED: { bg: "transparent", fg: "#E5B25C", border: "#C08A2E" },
    CLARIFYING: { bg: "#1D4034", fg: "#C9DED3", border: "#3E6355" },
    NEW: { bg: "#1D4034", fg: "#A8C4B6", border: "#3E6355" },
  };

  const GATE_TAG_COLOR = {
    PASSED: "#7FB79A",
    WAITING: "#F5F2E9",
    "N/A": "#5E7A6D",
    HUMAN: "#7FB79A",
    ESCALATED: "#E5B25C",
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    clock: $("clock"),
    clockState: $("clock-state"),
    stepBtn: $("btn-step"),
    backBtn: $("btn-back"),
    restartBtn: $("btn-restart"),
    caption: $("caption"),
    crumbs: $("crumbs"),
    streamCount: $("stream-count"),
    sortBtn: $("btn-sort"),
    cards: $("cards"),
    work: $("work"),
    hazardSlot: $("hazard-slot"),
    agentFeed: $("agent-feed"),
    gateRows: $("gate-rows"),
  };

  const state = { step: 1, seconds: 0, linked: null, awaiting: false, sort: "priority" };
  let replyTimer = null;
  let prev = null; // previous derived snapshot, for animation gating

  const maxStep = () => (CONFIG.includeHazardBeat ? 9 : 8);
  const blocked = (s) => s === 5 || s === 7;
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ---------- derived state ---------- */

  function derive() {
    const s = state.step;
    const replied = s > 4 || (s === 4 && !state.awaiting);
    const linked = state.linked === "linked";
    const emilyStatus = s >= 7 ? "READY" : s >= 3 ? "CLARIFYING" : "NEW";
    return {
      step: s,
      replied,
      linked,
      resolved: state.linked !== null && s >= 6,
      emilyStatus,
      selected: s >= 2,
      hazard: s >= 9,
      showDupe: s >= 5,
      dupeOpen: s === 5,
      showOrder: s >= 7,
      approved: s >= 8,
      awaiting: s === 4 && state.awaiting,
      frozen: s >= 8,
      logLen: logEntries(s, replied, linked, state.awaiting).length,
      msgLen: (s >= 3 ? 1 : 0) + (replied ? 1 : 0),
    };
  }

  function logEntries(s, replied, linked, awaiting) {
    const L = (text, sub, amber) => ({ text, sub: sub || "", amber: !!amber });
    const log = [L("4 requests across 4 channels. Triaging by priority.", "Nothing dispatched without you.")];
    if (s >= 2) log.push(L("Reading Emily’s email — 3 of 5 dispatch fields missing.", "Site and contact resolved from her tenancy record."));
    if (s >= 3) log.push(L("Drafting one ask-back — a single plain-language message, not a form.", "Sent directly to Emily; you see it here as it goes."));
    if (s >= 3) log.push(L("No hazard keywords. Emergency filter passed.", "Hazards never reach this path."));
    if (s === 3 || (s === 4 && awaiting)) log.push(L("Reply usually lands in minutes — Emily just hits reply.", "No portal, no login."));
    if (replied && s >= 4) log.push(L("All five fields grounded — every value carries its source.", ""));
    if (s >= 5) log.push(L("PF-4796 — “water dripping in level 2 ceiling”, portal, 3 hours earlier. Looks like the same leak.", "Flagging for you. I don’t merge.", true));
    if (s >= 6) log.push(L(linked ? "Linked to PF-4796 on your confirmation. Both reports kept." : "Kept separate on your call. Both stay open.", "Nothing deleted."));
    if (s >= 7) log.push(L("Work order composed. Plumbing suggested from the asset class.", "Dispatch and scope stay with you."));
    if (s >= 8) log.push(L("Handed to Maximo as WO-4831. Emily notified.", "Time-to-ready 4:07 against a 2.4-day baseline."));
    if (s >= 9) log.push(L("PF-4836 — “burning smell near the switchboard”. Hazard keywords matched.", "Handed straight to the on-call manager. I only spot them fast.", true));
    return log;
  }

  /* ---------- render ---------- */

  function render() {
    const d = derive();
    const p = prev; // null on init/restart
    const fwd = (cond) => cond(d) && (!p || !cond(p)); // appeared this transition

    renderHeader(d);
    renderControls(d);
    renderCrumbs(d);
    renderCards(d, p, fwd);
    renderWork(d, p, fwd);
    renderAgent(d, p, fwd);
    renderGates(d);

    prev = d;
    document.dispatchEvent(new CustomEvent("readyset:render", { detail: { step: d.step } }));
  }

  function fmtClock(secs) {
    return Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");
  }

  function renderHeader(d) {
    const secs = d.frozen ? 247 : state.seconds;
    els.clock.textContent = fmtClock(secs);
    els.clockState.textContent = d.frozen ? "frozen on approval" : "counting since 12:18";
  }

  function renderControls(d) {
    const b = blocked(d.step);
    els.stepBtn.textContent = b ? "Your call" : "Step →";
    els.stepBtn.classList.toggle("your-call", b);
    els.stepBtn.setAttribute("aria-disabled", String(b));
    els.caption.textContent = b
      ? d.step === 5
        ? "waiting on you — link or keep separate"
        : "waiting on you — approve the work order"
      : CAPTIONS[d.step];
    els.sortBtn.textContent = state.sort === "priority" ? "by priority" : "by newest";
  }

  function renderCrumbs(d) {
    const defs = [["INTAKE", 1], ["READ", 2], ["ASK-BACK", 3], ["REPLY", 4], ["DEDUPE", 5], ["READY", 7], ["APPROVED", 8]];
    let cur = 0;
    defs.forEach((c, i) => { if (d.step >= c[1]) cur = i; });
    els.crumbs.innerHTML = defs
      .map((c, i) => `<li class="${i === cur ? "cur" : i < cur ? "done" : ""}">${c[0]}</li>`)
      .join("");
  }

  function requestList(d) {
    const emily = {
      id: "PF-4831", channel: "EMAIL", who: "Emily Tran · tenant, level 2", time: "12:18",
      excerpt: "Water leaking from the ceiling near our office again — it’s getting worse.",
      status: d.emilyStatus, priority: "P2", sel: d.selected,
      linked: d.linked, linkLabel: "LINKED → PF-4796", slide: !prev,
    };
    const base = [
      { id: "PF-4796", channel: "PORTAL", who: "Marcus Webb · tenant, level 2", time: "09:12", excerpt: "Water dripping in level 2 ceiling, Building A", status: "NEW", priority: "P2", linked: d.linked, linkLabel: "LINKED → PF-4831" },
      { id: "PF-4802", channel: "PHONE", who: "transcript · reception", time: "10:40", excerpt: "…loading dock roller door sticking halfway…", status: "CLARIFYING", priority: "P3" },
      { id: "PF-4788", channel: "SMS", who: "Priya Raman · tenant, level 3", time: "08:05", excerpt: "Aircon in 3.05 running cold overnight", status: "READY", priority: "P4" },
    ];
    const hazard = {
      id: "PF-4836", channel: "SMS", who: "unregistered mobile · level 3", time: "12:24",
      excerpt: "burning smell near the switchboard on L3", status: "ESCALATED", priority: "P1",
      slide: prev && !prev.hazard,
    };
    let list = d.hazard ? [hazard, emily].concat(base) : [emily].concat(base);
    const byTime = (a, b) => (a.time < b.time ? 1 : -1);
    return state.sort === "priority"
      ? list.slice().sort((a, b) => (a.priority === b.priority ? byTime(a, b) : a.priority < b.priority ? -1 : 1))
      : list.slice().sort(byTime);
  }

  function renderCards(d) {
    const list = requestList(d);
    els.streamCount.textContent = list.length + " open";
    els.cards.innerHTML = list
      .map((r) => {
        const pri = PRI[r.priority];
        const chip = CHIP[r.status];
        return `<li class="card${r.sel ? " sel" : ""}${r.slide ? " an-slide" : ""}" style="border-left-color:${pri.rail}">
          <div class="card-meta">
            <span class="chips">
              <span class="chip-pri" style="background:${pri.bg};color:${pri.fg}">${r.priority}</span>
              <span class="chip-chan">${r.channel}</span>
            </span>
            <span class="rid">${r.id}</span>
          </div>
          <div class="card-who">${r.who}</div>
          <div class="card-excerpt">${r.excerpt}</div>
          <div class="card-foot">
            <span class="chip-status" style="background:${chip.bg};color:${chip.fg}">${r.status}</span>
            <span class="card-time">${r.time}</span>
          </div>
          ${r.linked ? `<div class="card-linked">${r.linkLabel}</div>` : ""}
        </li>`;
      })
      .join("");
  }

  function renderWork(d, p, fwd) {
    const chip = CHIP[d.emilyStatus];
    const src = (t) => (CONFIG.showSourceNotes ? t : "");
    const fieldDefs = [
      ["SITE", "Building A · Southbank", "tenancy record", d.step >= 2, p && p.step >= 2],
      ["ZONE", "Level 2 — above meeting room 2.14", "from reply", d.replied, p && p.replied],
      ["ASSET", "Ceiling void — chilled-water pipework", "reply + register", d.replied, p && p.replied],
      ["ACCESS", "Tomorrow 7–9am, tenant on site from 7", "from reply", d.replied, p && p.replied],
      ["CONTACT", "Emily Tran · 0412 884 013", "mobile on file", d.step >= 2, p && p.step >= 2],
    ];
    const nFilled = fieldDefs.filter((f) => f[3]).length;

    const fields = fieldDefs
      .map(([label, value, source, filled, was]) => `<div class="frow">
        <div class="flabel">${label}</div>
        <div class="fvalue${filled ? "" : " missing"}${filled && !was ? " an-fade" : ""}">${filled ? value : "— missing"}</div>
        <div class="fsrc${filled ? "" : " needed"}">${filled ? src(source) : "needed"}</div>
      </div>`)
      .join("");

    const dupTag = d.resolved ? (d.linked ? "LINKED BY HUMAN" : "KEPT SEPARATE") : "LIKELY DUPLICATE · 87%";
    const dup = !d.showDupe ? "" : `<div class="dup-panel${fwd((x) => x.showDupe) ? " an-fade-340" : ""}">
      <div class="dup-head"><span class="dup-tag">${dupTag}</span><span class="rid">PF-4796</span></div>
      <div class="dup-reasons">
        <div>· same zone — level 2</div>
        <div>· same asset class — water</div>
        <div>· reported 3 hours apart</div>
        <div>· different channel, different reporter</div>
      </div>
      <div class="dup-rationale">Suggested, never auto-merged — a wrong merge silently kills a real issue. Nothing is deleted either way.</div>
      ${d.dupeOpen ? `<div class="dup-actions">
        <button class="btn-link" id="btn-link-dup" type="button">Link as duplicate</button>
        <button class="btn-separate" id="btn-keep-sep" type="button">Keep separate</button>
      </div>` : ""}
      ${d.resolved ? `<div class="dup-outcome">${d.linked ? "Linked, not merged. Both reports kept." : "Kept separate. Both reports stay open and independent."}</div>` : ""}
    </div>`;

    const orderRows = [
      ["REPORTS", d.linked ? "PF-4831 + PF-4796" : "PF-4831", d.linked ? "(both kept)" : "(kept separate)"],
      ["SCOPE", "Ceiling void leak — Level 2, above 2.14", ""],
      ["ACCESS", "Tomorrow 7–9am · Emily Tran on site", ""],
      ["SUGGESTED TRADE", "Plumbing", "suggested, dispatch stays with you"],
      ["DESTINATION", "Maximo — WO draft", "source of record unchanged"],
    ];
    const order = !d.showOrder ? "" : `<div class="order-panel${fwd((x) => x.showOrder) ? " an-fade-340" : ""}">
      <div class="order-head">
        <div class="order-title">Work order — dispatch ready</div>
        <span class="order-tag">${d.approved ? "APPROVED" : "READY"}</span>
      </div>
      <div class="order-rows">${orderRows
        .map(([l, v, n]) => `<div class="orow"><div class="olabel">${l}</div><div class="ovalue">${v}${n ? ` <span class="onote">${n}</span>` : ""}</div></div>`)
        .join("")}</div>
      ${d.step === 7 ? `<button class="btn-approve" id="btn-approve" type="button">Approve work order</button>` : ""}
      ${d.approved ? `<div class="approved-block${fwd((x) => x.approved) ? " an-fade-320" : ""}">
        <div class="approved-meta">HANDED OFF · 12:22 · MAXIMO</div>
        <div class="approved-text">Sent to your work-order system. Emily notified: “Your report is logged as WO-4831 — a plumber is booked for tomorrow 7–9am.”</div>
        <div class="approved-note">Dispatch and scope stay with you. Readyset does not book trades.</div>
      </div>` : ""}
    </div>`;

    els.work.innerHTML = `<div class="work-head">
        <div class="idgroup"><span class="rid">PF-4831</span><span class="rmeta">P2 · EMAIL · RECEIVED 12:18</span></div>
        <span class="status-pill" style="background:${chip.bg};color:${chip.fg};border-color:${chip.border}">${d.emilyStatus}</span>
      </div>
      <div class="orig-panel">
        <div class="orig-label">ORIGINAL · VERBATIM · EMAIL</div>
        <div class="orig-body">“Hi, there’s water leaking from the ceiling near our office again. Can someone come look at it? It’s getting worse. – Emily”</div>
      </div>
      <div class="fields-block">
        <div class="fields-head">
          <div class="fields-label">DISPATCH FIELDS</div>
          <div class="fields-progress">${nFilled} / 5 resolved</div>
        </div>
        ${fields}
      </div>
      ${dup}${order}`;

    const linkBtn = $("btn-link-dup");
    if (linkBtn) {
      linkBtn.addEventListener("click", () => decide("linked"));
      $("btn-keep-sep").addEventListener("click", () => decide("separate"));
    }
    const approveBtn = $("btn-approve");
    if (approveBtn) approveBtn.addEventListener("click", () => enter(8));
  }

  function renderAgent(d, p, fwd) {
    els.hazardSlot.innerHTML = !d.hazard ? "" : `<div class="hazard-banner${fwd((x) => x.hazard) ? " an-fade-320" : ""}">
      <div class="hazard-tag">ESCALATED · HUMAN</div>
      <div class="hazard-text">Possible hazard — routed straight to on-call staff. Readyset never automates emergencies.</div>
    </div>`;

    const log = logEntries(d.step, d.replied, d.linked, state.awaiting);
    const prevLogLen = p ? p.logLen : 0;
    const logHtml = log
      .map((l, i) => `<div class="log-entry${i >= prevLogLen ? " an-fade" : ""}">
        <div class="dot${l.amber ? " amber" : ""}"></div>
        <div class="log-body"><div class="log-text">${l.text}</div>${l.sub ? `<div class="log-sub">${l.sub}</div>` : ""}</div>
      </div>`)
      .join("");

    const messages = [];
    if (d.step >= 3) messages.push({ who: "TO: EMILY TRAN", at: "SENT · T+0:42", text: "Thanks Emily — quick check so we can dispatch straight away: which room or area is the leak closest to, and is it OK for a contractor to access it tomorrow 7–9am?" });
    if (d.replied) messages.push({ who: "FROM: EMILY TRAN", at: "REPLY · T+2:58", text: "It’s right above meeting room 2.14. And yes, morning is fine — I’m in from 7." });
    const prevMsgLen = p ? p.msgLen : 0;
    const msgHtml = messages
      .map((m, i) => `<div class="msg-card${i >= prevMsgLen ? " an-fade-320" : ""}">
        <div class="msg-head"><span>${m.who}</span><span>${m.at}</span></div>
        <div class="msg-text">${m.text}</div>
      </div>`)
      .join("");

    const waiting = d.awaiting ? `<div class="waiting">WAITING FOR REPLY…</div>` : "";
    els.agentFeed.innerHTML = logHtml + msgHtml + waiting;
  }

  function renderGates(d) {
    const s = d.step;
    const defs = [
      ["Emergency filter", s >= 9 ? "ESCALATED" : s >= 3 ? "PASSED" : "N/A"],
      ["Duplicate confirm", s >= 6 ? "PASSED" : s === 5 ? "WAITING" : "N/A"],
      ["Approve to system of record", s >= 8 ? "PASSED" : s >= 7 ? "WAITING" : "N/A"],
      ["Dispatch & scope", "HUMAN"],
    ];
    els.gateRows.innerHTML = defs
      .map(([label, tag]) => `<div class="gate-row">
        <div class="gate-label">${esc(label)}</div>
        <span class="gate-tag" style="color:${GATE_TAG_COLOR[tag]}">${tag}</span>
      </div>`)
      .join("");
  }

  /* ---------- transitions ---------- */

  function enter(step) {
    clearTimeout(replyTimer);
    state.step = step;
    state.awaiting = false;
    if (step < 6) state.linked = null;
    if (step === 4) {
      state.awaiting = true;
      replyTimer = setTimeout(() => {
        state.awaiting = false;
        render();
      }, CONFIG.replyDelayMs);
    }
    render();
  }

  function decide(choice) {
    clearTimeout(replyTimer);
    state.linked = choice;
    state.step = 6;
    state.awaiting = false;
    render();
  }

  function go(dir) {
    const s = state.step;
    if (dir > 0) {
      if (blocked(s)) return;
      enter(Math.min(maxStep(), s + 1));
    } else {
      enter(Math.max(1, s - 1));
    }
  }

  function reset() {
    clearTimeout(replyTimer);
    state.step = 1;
    state.seconds = 0;
    state.linked = null;
    state.awaiting = false;
    prev = null; // Emily's card slides in again
    render();
  }

  /* ---------- wiring ---------- */

  els.stepBtn.addEventListener("click", () => go(1));
  els.backBtn.addEventListener("click", () => go(-1));
  els.restartBtn.addEventListener("click", reset);
  els.sortBtn.addEventListener("click", () => {
    state.sort = state.sort === "priority" ? "newest" : "priority";
    render();
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
  });

  setInterval(() => {
    if (state.step < 8) {
      state.seconds += 1;
      els.clock.textContent = fmtClock(state.seconds);
    }
  }, 1000);

  render();
})();
