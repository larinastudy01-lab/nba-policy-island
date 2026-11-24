"use strict";
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  else root.NBAPolicy=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
const POLICY_CHALLENGE = {
  id: "warriors-ticket-allocation",
  stationId: "warriors",
  storageKey: "nba-policy-island:policy-progress:v1",
  tickets: 60,
  students: { registered: 20, budget: 30 },
  generalFans: { registered: 60, budget: 45 },
  prices: { regular: 45, student: 30, lottery: 30 },
  studentSeats: 20,
  goals: { students: 15, revenue: 2000 },
  plans: [
    { id: "regular", name: "原價售票", tradeoff: "票房最高，但原價超過學生預算，沒有學生能入場。" },
    { id: "reserved", name: "學生保留席", tradeoff: "用部分票房換取學生入場機會，仍能同時達到學生人數與收入目標。" },
    { id: "lottery", name: "全場降價抽籤", tradeoff: "所有登記者都有相同中籤機率，但收入低於目標，且單次抽籤不保證學生人數。" }
  ]
};

function calculatePolicy(planId) {
  const data = POLICY_CHALLENGE;
  const plan = data.plans.find((item) => item.id === planId);
  if (!plan) throw new RangeError("Unknown policy plan.");
  let students = 0;
  let generalFans = 0;
  let revenue = 0;
  let formula = "";
  let lotteryChance = null;

  if (planId === "regular") {
    // 本情境學生預算低於原價，原價票由負擔得起的一般球迷購買。
    students = data.students.budget >= data.prices.regular ? Math.min(data.students.registered, data.tickets) : 0;
    generalFans = data.generalFans.budget >= data.prices.regular ? Math.min(data.generalFans.registered, data.tickets - students) : 0;
    revenue = (students + generalFans) * data.prices.regular;
    formula = `${students + generalFans} 張 × ${data.prices.regular} 點 = ${revenue.toLocaleString("zh-TW")} 點`;
  } else if (planId === "reserved") {
    students = data.students.budget >= data.prices.student ? Math.min(data.studentSeats, data.students.registered, data.tickets) : 0;
    generalFans = data.generalFans.budget >= data.prices.regular ? Math.min(data.generalFans.registered, data.tickets - data.studentSeats) : 0;
    revenue = students * data.prices.student + generalFans * data.prices.regular;
    formula = `${students} 張 × ${data.prices.student} 點 ＋ ${generalFans} 張 × ${data.prices.regular} 點 = ${revenue.toLocaleString("zh-TW")} 點`;
  } else {
    const eligibleStudents = data.students.budget >= data.prices.lottery ? data.students.registered : 0;
    const eligibleFans = data.generalFans.budget >= data.prices.lottery ? data.generalFans.registered : 0;
    const pool = eligibleStudents + eligibleFans;
    const sold = Math.min(data.tickets, pool);
    lotteryChance = pool === 0 ? 0 : sold / pool;
    students = eligibleStudents * lotteryChance;
    generalFans = eligibleFans * lotteryChance;
    revenue = sold * data.prices.lottery;
    formula = `${sold} 張 × ${data.prices.lottery} 點 = ${revenue.toLocaleString("zh-TW")} 點；每人中籤機率 ${sold} ÷ ${pool} = ${lotteryChance * 100}%`;
  }

  const studentGoalMet = students >= data.goals.students;
  const revenueGoalMet = revenue >= data.goals.revenue;
  return {
    planId, name: plan.name, students, generalFans, total: students + generalFans, revenue,
    isExpected: planId === "lottery", lotteryChance, studentGoalMet, revenueGoalMet,
    passed: studentGoalMet && revenueGoalMet, formula, tradeoff: plan.tradeoff
  };
}

// storage 由呼叫端提供，可在終端機測試，亦能處理儲存權限被拒絕的環境。
// 完成代表已確認一項決策；是否達成兩項目標由 calculatePolicy 分開判定。
function createPolicySession(storage) {
  let selectedPlan = "regular";
  let result = null;
  let completedPlanId = null;
  let comparisonVisible = false;
  let storageAvailable = Boolean(storage && typeof storage.getItem === "function" && typeof storage.setItem === "function");
  let raw = null;
  if (storageAvailable) {
    try { raw = storage.getItem(POLICY_CHALLENGE.storageKey); }
    catch { storageAvailable = false; }
  }
  try {
    const saved = JSON.parse(raw);
    if (saved && saved.version === 1 && saved.challengeId === POLICY_CHALLENGE.id && saved.stationId === POLICY_CHALLENGE.stationId && saved.completed === true && POLICY_CHALLENGE.plans.some((plan) => plan.id === saved.planId)) {
      selectedPlan = saved.planId;
      completedPlanId = saved.planId;
      result = calculatePolicy(saved.planId);
      comparisonVisible = true;
    }
  } catch { /* 無效或舊版紀錄不影響關卡運行。 */ }

  return {
    getState() {
      return { selectedPlan, result: result ? { ...result } : null, completedPlanId, comparisonVisible, storageAvailable };
    },
    selectPlan(planId) {
      if (!POLICY_CHALLENGE.plans.some((plan) => plan.id === planId)) throw new RangeError("Unknown policy plan.");
      if (selectedPlan !== planId) {
        selectedPlan = planId;
        result = null;
      }
    },
    simulate() {
      if (selectedPlan === null) return null;
      result = calculatePolicy(selectedPlan);
      comparisonVisible = true;
      return { ...result };
    },
    retry() {
      result = null;
    },
    reset() {
      selectedPlan = null;
      result = null;
      comparisonVisible = false;
    },
    confirm() {
      if (!result || result.planId !== selectedPlan) return false;
      completedPlanId = selectedPlan;
      if (storageAvailable) {
        try {
          storage.setItem(POLICY_CHALLENGE.storageKey, JSON.stringify({
            version: 1, challengeId: POLICY_CHALLENGE.id, stationId: POLICY_CHALLENGE.stationId,
            completed: true, planId: completedPlanId
          }));
        } catch { storageAvailable = false; }
      }
      return true;
    }
  };
}

function seatAllocation(planId){
  const result=calculatePolicy(planId);
  const seats=Array.from({length:POLICY_CHALLENGE.tickets},(_,index)=>({id:`seat-${String(index+1).padStart(2,"0")}`,type:result.isExpected?(index%4===0?"student":"general"):(index<result.students?"student":"general"),expected:result.isExpected}));
  return {seats,students:result.students,generalFans:result.generalFans,expected:result.isExpected,
    description:result.isExpected?"60 席期望值示意：平均 15 名學生、45 名一般球迷；斜線席位不代表單次抽籤實際座位。":`60 席分配：學生 ${result.students} 席、一般球迷 ${result.generalFans} 席。`};
}
return {POLICY_CHALLENGE,calculatePolicy,createPolicySession,seatAllocation};
});
