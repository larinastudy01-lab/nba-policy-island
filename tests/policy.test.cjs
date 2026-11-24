"use strict";

// 只在 Node 執行：純計算、儲存及輕量 DOM 事件替身測試，不啟動瀏覽器。
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { pathToFileURL } = require("node:url");
const { TOUR_DATA, POLICY_CHALLENGE, calculatePolicy, createPolicySession } = require("../script.js");
const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const source = fs.readFileSync(path.join(root, "script.js"), "utf8");
const key = POLICY_CHALLENGE.storageKey;

function memoryStorage(initial = {}) {
  const records = new Map(Object.entries(initial));
  return {
    writes: 0,
    getItem(name) { return records.get(name) ?? null; },
    setItem(name, value) { this.writes += 1; records.set(name, value); }
  };
}

const expected = [
  { id: "regular", students: 0, generalFans: 60, total: 60, revenue: 2700, passed: false, isExpected: false },
  { id: "reserved", students: 20, generalFans: 40, total: 60, revenue: 2400, passed: true, isExpected: false },
  { id: "lottery", students: 15, generalFans: 45, total: 60, revenue: 1800, passed: false, isExpected: true }
];

for (const row of expected) {
  test(`${row.id}: exact admission, revenue and goal results`, () => {
    const result = calculatePolicy(row.id);
    for (const field of ["students", "generalFans", "total", "revenue", "passed", "isExpected"]) {
      assert.equal(result[field], row[field], field);
    }
    assert.equal(result.studentGoalMet, row.students >= 15);
    assert.equal(result.revenueGoalMet, row.revenue >= 2000);
    assert.ok(result.tradeoff.length > 0);
  });
}

test("only reserved passes both goals; no plan oversells or exceeds group registration", () => {
  const results = POLICY_CHALLENGE.plans.map((plan) => calculatePolicy(plan.id));
  assert.deepEqual(results.filter((result) => result.passed).map((result) => result.planId), ["reserved"]);
  for (const result of results) {
    assert.ok(result.students <= POLICY_CHALLENGE.students.registered);
    assert.ok(result.generalFans <= POLICY_CHALLENGE.generalFans.registered);
    assert.equal(result.students + result.generalFans, 60);
  }
});

test("lottery computes expectation from a shared pool, rather than a random sample", () => {
  const result = calculatePolicy("lottery");
  assert.equal(result.lotteryChance, 60 / 80);
  assert.equal(result.students, 20 * result.lotteryChance);
  assert.equal(result.generalFans, 60 * result.lotteryChance);
  assert.equal(result.isExpected, true);
  assert.deepEqual(calculatePolicy("lottery"), result);
});

test("invalid plans are rejected and cannot modify the current choice", () => {
  const session = createPolicySession(memoryStorage());
  assert.throws(() => calculatePolicy("__proto__"), RangeError);
  assert.throws(() => session.selectPlan("unknown"), RangeError);
  assert.equal(session.getState().selectedPlan, "regular");
});

test("a trial is required before confirmation, and changing plans invalidates a stale result", () => {
  const storage = memoryStorage();
  const session = createPolicySession(storage);
  assert.equal(session.confirm(), false);
  session.simulate();
  assert.equal(session.getState().completedPlanId, null);
  assert.equal(storage.writes, 0);
  session.selectPlan("reserved");
  assert.equal(session.getState().result, null);
  assert.equal(session.confirm(), false);
  assert.equal(storage.writes, 0);
  assert.equal(session.simulate().revenue, 2400);
  assert.equal(session.confirm(), true);
  assert.equal(storage.writes, 1);
});

test("retry preserves the confirmed decision and does not write a new save", () => {
  const storage = memoryStorage();
  const session = createPolicySession(storage);
  session.selectPlan("reserved");
  session.simulate();
  session.confirm();
  const saved = storage.getItem(key);
  session.retry();
  session.selectPlan("lottery");
  session.simulate();
  assert.equal(session.getState().completedPlanId, "reserved");
  assert.equal(storage.getItem(key), saved);
  assert.equal(storage.writes, 1);
});

test("reload restores a confirmed decision; completion remains distinct from passing goals", () => {
  for (const row of expected) {
    const storage = memoryStorage({ unrelated: "keep me" });
    const session = createPolicySession(storage);
    session.selectPlan(row.id);
    session.simulate();
    assert.equal(session.confirm(), true);
    const restored = createPolicySession(storage).getState();
    assert.equal(restored.selectedPlan, row.id);
    assert.equal(restored.completedPlanId, row.id);
    assert.equal(restored.result.passed, row.passed);
    assert.equal(restored.comparisonVisible, true);
    assert.equal(storage.getItem("unrelated"), "keep me");
  }
});

test("malformed, foreign and unsupported saved data are ignored", () => {
  const valid = { version: 1, challengeId: POLICY_CHALLENGE.id, stationId: "warriors", completed: true, planId: "reserved" };
  const invalid = [
    "broken JSON", "null", "{}", "[]",
    JSON.stringify({ ...valid, version: 2 }),
    JSON.stringify({ ...valid, stationId: "other-team" }),
    JSON.stringify({ ...valid, challengeId: "other-challenge" }),
    JSON.stringify({ ...valid, completed: false }),
    JSON.stringify({ ...valid, planId: "<script>invalid</script>" })
  ];
  for (const saved of invalid) {
    const state = createPolicySession(memoryStorage({ [key]: saved })).getState();
    assert.equal(state.completedPlanId, null);
    assert.equal(state.selectedPlan, "regular");
    assert.equal(state.result, null);
  }
});

test("unavailable storage never blocks calculation or in-page completion", () => {
  const cases = [null,
    { getItem() { throw new Error("blocked"); }, setItem() {} },
    { getItem() { return null; }, setItem() { throw new Error("quota"); } }
  ];
  for (const storage of cases) {
    const session = createPolicySession(storage);
    session.selectPlan("reserved");
    assert.equal(session.simulate().passed, true);
    assert.equal(session.confirm(), true);
    assert.equal(session.getState().completedPlanId, "reserved");
    assert.equal(session.getState().storageAvailable, false);
  }
});

// 此替身只實作本專案用到的元素、事件及焦點紀錄；不模擬排版或原生按鍵行為。
function boot(storage = memoryStorage()) {
  const nodes = new Map();
  const inputs = [];
  const document = { activeElement: null };
  class Element {
    constructor(tag = "div") {
      this.tagName = tag.toUpperCase();
      this.children = [];
      this.listeners = new Map();
      this.attributes = new Map();
      this.style = {};
      this.dataset = {};
      this.firstChild = { textContent: "" };
      this.textContent = "";
      this.hidden = false;
      this.disabled = false;
      this.checked = false;
      this.className = "";
      this.value = "";
      this._html = "";
    }
    set innerHTML(value) { this._html = value; this.children = []; }
    get innerHTML() { return this._html; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    append(child) { this.children.push(child); if (child.id) nodes.set(child.id, child); }
    querySelector(selector) { return this.children.find((child) => child.className.split(" ").includes(selector.slice(1))) ?? null; }
    addEventListener(type, callback) { const handlers = this.listeners.get(type) ?? []; handlers.push(callback); this.listeners.set(type, handlers); }
    emit(type) {
      if (this.disabled) return;
      const event = { target: this, preventDefault() { this.defaultPrevented = true; } };
      for (const callback of this.listeners.get(type) ?? []) callback(event);
      return event;
    }
    focus() { document.activeElement = this; }
  }
  const attributes = (raw) => Object.fromEntries([...raw.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map((match) => [match[1], match[2] ?? ""]));
  for (const match of html.matchAll(/<([a-z][a-z\d-]*)\b([^>]*)>/gi)) {
    const attrs = attributes(match[2]);
    if (!attrs.id && match[1] !== "input") continue;
    const element = new Element(match[1]);
    element.id = attrs.id;
    element.name = attrs.name;
    element.value = attrs.value ?? "";
    element.checked = Object.hasOwn(attrs, "checked");
    element.hidden = Object.hasOwn(attrs, "hidden");
    if (attrs.id) nodes.set(attrs.id, element);
    if (match[1] === "input") inputs.push(element);
  }
  const cityEnglish = new Element("span");
  document.querySelector = (selector) => selector.startsWith("#") ? nodes.get(selector.slice(1)) ?? null : selector === ".city-english" ? cityEnglish : null;
  document.querySelectorAll = (selector) => {
    const name = selector.match(/^input\[name="([^"]+)"\]$/)?.[1];
    if (!name) throw new Error(`Unsupported test selector: ${selector}`);
    return inputs.filter((input) => input.name === name);
  };
  document.createElement = (tag) => new Element(tag);
  const context = vm.createContext({ document, window: { localStorage: storage }, module: { exports: {} } });
  vm.runInContext(source, context, { filename: "script.js" });
  return {
    document, storage,
    get(id) { assert.ok(nodes.has(id), `Missing element ${id}`); return nodes.get(id); },
    select(name, value) {
      const group = inputs.filter((input) => input.name === name);
      const selected = group.find((input) => input.value === value);
      assert.ok(selected, `Missing option ${name}:${value}`);
      for (const input of group) input.checked = input === selected;
      selected.emit("change");
    }
  };
}

test("initial app keeps live scoreboard, while the untried policy cannot be confirmed", () => {
  const app = boot();
  assert.equal(app.get("map-scoreboard").dataset.state, "live");
  assert.match(app.get("map-scoreboard").innerHTML, /78/);
  assert.equal(app.get("marker-warriors").dataset.state, "live");
  assert.equal(app.get("policy-results").hidden, true);
  assert.equal(app.get("confirm-policy").disabled, true);
  assert.equal(app.get("marker-warriors").querySelector(".marker-complete").hidden, true);
});

test("actual game change handlers preserve policy choice, result and independent completion marker", () => {
  const app = boot();
  app.select("policy-plan", "reserved");
  assert.equal(app.get("policy-form").emit("submit").defaultPrevented, true);
  const resultHTML = app.get("policy-result-content").innerHTML;
  assert.match(resultHTML, /2,400/);
  assert.match(resultHTML, /data-passed="true"/);
  assert.equal(app.document.activeElement, app.get("policy-result-title"));
  for (const state of Object.keys(TOUR_DATA.stations[0].games)) {
    app.select("game-state", state);
    assert.equal(app.get("map-scoreboard").dataset.state, state);
    assert.equal(app.get("station-game").dataset.state, state);
    assert.equal(app.get("marker-warriors").dataset.state, state);
    assert.equal(app.get("plan-reserved").checked, true);
    assert.equal(app.get("policy-result-content").innerHTML, resultHTML);
    assert.equal(app.get("marker-warriors").dataset.policyCompleted, "false");
  }
  app.get("confirm-policy").emit("click");
  assert.equal(app.storage.writes, 1);
  assert.match(app.get("map-policy-progress").textContent, /1／1/);
  for (const state of ["idle", "scheduled", "live", "final"]) {
    app.select("game-state", state);
    assert.equal(app.get("marker-warriors").dataset.policyCompleted, "true");
    assert.equal(app.get("marker-warriors").querySelector(".marker-complete").hidden, false);
    assert.match(app.get("marker-warriors").getAttribute("aria-label"), /政策挑戰已完成/);
    assert.equal(app.get("policy-result-content").innerHTML, resultHTML);
    assert.equal(app.storage.writes, 1);
  }
  assert.match(app.get("map-scoreboard").innerHTML, /108/);
  assert.match(app.get("map-scoreboard").innerHTML, /101/);
});

test("UI invalidates stale results and clearly labels lottery expectation and comparison", () => {
  const app = boot();
  app.get("policy-form").emit("submit");
  app.select("policy-plan", "lottery");
  assert.equal(app.get("policy-results").hidden, true);
  assert.equal(app.get("confirm-policy").disabled, true);
  app.get("confirm-policy").emit("click");
  assert.equal(app.storage.writes, 0);
  app.get("policy-form").emit("submit");
  assert.match(app.get("policy-result-content").innerHTML, /期望值/);
  assert.match(app.get("policy-result-content").innerHTML, /單次學生人數可能高於或低於/);
  assert.match(app.get("policy-result-content").innerHTML, /1,800/);
  assert.match(app.get("policy-comparison-cards").innerHTML, /平均 15 人/);
  assert.match(app.get("policy-comparison-cards").innerHTML, /平均 45 人/);
  assert.equal((app.get("policy-comparison-cards").innerHTML.match(/class="comparison-card"/g) ?? []).length, 3);
});

test("a full app reload restores progress and retry preserves it", () => {
  const storage = memoryStorage();
  const first = boot(storage);
  first.select("policy-plan", "reserved");
  first.get("policy-form").emit("submit");
  first.get("confirm-policy").emit("click");
  const refreshed = boot(storage);
  assert.equal(refreshed.get("plan-reserved").checked, true);
  assert.match(refreshed.get("policy-result-content").innerHTML, /2,400/);
  assert.match(refreshed.get("map-policy-progress").textContent, /1／1/);
  assert.equal(refreshed.get("marker-warriors").dataset.policyCompleted, "true");
  refreshed.get("retry-policy").emit("click");
  assert.equal(refreshed.get("policy-results").hidden, true);
  assert.equal(refreshed.get("marker-warriors").dataset.policyCompleted, "true");
  assert.equal(refreshed.document.activeElement, refreshed.get("plan-reserved"));
  refreshed.select("policy-plan", "regular");
  assert.match(refreshed.get("policy-completion-message").textContent, /學生保留席/);
  assert.equal(storage.writes, 1);
});

test("HTML IDs, same-page navigation and asset paths work for file and Pages subpaths", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "No duplicate HTML IDs");
  const refs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (ref.startsWith("data:")) continue;
    if (ref.startsWith("#")) { assert.ok(ids.includes(ref.slice(1)), `Missing anchor ${ref}`); continue; }
    assert.ok(ref.startsWith("./"), `Relative URL required: ${ref}`);
    assert.ok(fs.existsSync(path.resolve(root, ref)), `Missing asset ${ref}`);
    const localURL = new URL(ref, pathToFileURL(path.join(root, "index.html")));
    const pagesURL = new URL(ref, "https://example.github.io/nba-policy-island/index.html");
    assert.equal(localURL.protocol, "file:");
    assert.ok(pagesURL.pathname.startsWith("/nba-policy-island/"));
  }
  assert.equal(/\son\w+\s*=/i.test(html), false, "Use addEventListener, not inline handlers");
});
