"use strict";

// 只在 Node 執行：純計算、儲存及輕量 DOM 事件替身測試，不啟動瀏覽器。
const test = require("node:test");
const assert = require("node:assert/strict");
const { POLICY_CHALLENGE, calculatePolicy, createPolicySession } = require("../script.js");
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
