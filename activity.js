const MAX_UNIT_LENGTH = 50;
const MAX_GOAL_LENGTH = 200;
const MOCK_DELAY_MS = 700;
const FIELD_NAMES = { level: "학생 수준", unit: "단원명", goal: "차시 학습 목표" };
const FIELD_ERRORS = {
  level: "학생 수준을 선택해 주세요.",
  unit: "단원명을 입력해 주세요.",
  goal: "차시 학습 목표를 입력해 주세요."
};

// 목업 활동 3개. 소요 시간은 분 단위이고 한 차시(45분) 안에 들어간다.
const MOCK_ACTIVITIES = [
  {
    title: "카드로 만드는 조건 판단 순서도",
    materials: [
      "상황 카드 1세트(모둠당)",
      "순서도 기호 카드(시작·처리·판단·끝) 1세트",
      "A3 용지 1장",
      "색연필 또는 사인펜 4자루"
    ],
    minutes: 20,
    steps: [
      "모둠 안에서 기록 담당, 발표 담당, 카드 담당, 점검 담당을 정한다.",
      "상황 카드 한 장을 뽑아 '만약 ~라면'으로 시작하는 판단 조건을 찾는다.",
      "순서도 기호 카드를 용지 위에 놓아 판단 흐름을 순서도로 완성한다.",
      "다른 모둠과 순서도를 바꿔 보며 빠진 조건이 없는지 점검한다.",
      "발표 담당이 우리 모둠의 순서도를 한 문장으로 설명한다."
    ]
  },
  {
    title: "블록 코딩으로 조건 미션 해결하기",
    materials: [
      "모둠당 컴퓨터 1대(또는 태블릿)",
      "학교에서 쓰는 블록 코딩 도구(예: 엔트리)",
      "미션 활동지 1장",
      "연필 1자루"
    ],
    minutes: 25,
    steps: [
      "활동지의 미션을 함께 읽고, 어떤 조건에서 어떤 동작을 해야 하는지 표시한다.",
      "실습 담당이 조건 블록을 이용해 프로그램의 첫 번째 버전을 만든다.",
      "입력값을 바꿔 가며 실행해 보고 결과를 활동지에 기록한다.",
      "예상과 다르게 동작하면 점검 담당이 조건을 하나씩 확인해 고친다.",
      "완성한 프로그램을 짝 모둠에게 보여 주고 의견을 받는다."
    ]
  },
  {
    title: "생활 속 조건 사례 찾고 토의하기",
    materials: [
      "사례 탐구 활동지 1장",
      "포스트잇 10장(모둠당)",
      "필기구",
      "(선택) 교실 TV 또는 칠판"
    ],
    minutes: 15,
    steps: [
      "'만약 ~라면 ~한다'로 움직이는 기기나 서비스를 포스트잇에 3가지 이상 적는다.",
      "적은 사례를 '조건'과 '결과'로 나누어 활동지 표에 정리한다.",
      "가장 흥미로운 사례 하나를 골라 조건이 하나 더 늘어나면 어떻게 달라질지 토의한다.",
      "모둠 대표가 고른 사례와 토의 결과를 발표한다."
    ]
  }
];

const form = document.getElementById("activity-form");
const fieldsEl = document.getElementById("form-fields");
const levelSelect = document.getElementById("level");
const unitInput = document.getElementById("unit");
const goalInput = document.getElementById("goal");
const recommendBtn = document.getElementById("recommend-btn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const actionsEl = document.getElementById("result-actions");
const summaryEl = document.getElementById("result-summary");
const goalSummaryEl = document.getElementById("result-goal");
const emptyEl = document.getElementById("empty-state");
const cardsEl = document.getElementById("cards");
const againBtn = document.getElementById("again-btn");

const controls = { level: levelSelect, unit: unitInput, goal: goalInput };
const errorEls = {
  level: document.getElementById("level-error"),
  unit: document.getElementById("unit-error"),
  goal: document.getElementById("goal-error")
};
const updateUnitCount = bindCounter(unitInput, document.getElementById("unit-count"), MAX_UNIT_LENGTH);
const updateGoalCount = bindCounter(goalInput, document.getElementById("goal-count"), MAX_GOAL_LENGTH);

let busy = false;
let shown = null; // 지금 표시 중인 결과의 조건

/* 입력과 검증 */

// 앞뒤 공백을 제거하고, 입력란에도 제거된 값을 반영한다.
function readConditions() {
  const unit = unitInput.value.trim();
  const goal = goalInput.value.trim();
  unitInput.value = unit;
  goalInput.value = goal;
  updateUnitCount();
  updateGoalCount();
  return { level: levelSelect.value, unit, goal };
}

function validate(conditions) {
  const errors = {};
  Object.keys(FIELD_NAMES).forEach((key) => {
    if (!conditions[key]) errors[key] = FIELD_ERRORS[key];
  });
  return errors;
}

function showErrors(errors) {
  Object.keys(controls).forEach((key) => setFieldError(controls[key], errorEls[key], errors[key]));
}

Object.keys(controls).forEach((key) => {
  const eventName = key === "level" ? "change" : "input";
  controls[key].addEventListener(eventName, () => setFieldError(controls[key], errorEls[key]));
});

/* 추천 흐름 (목업) */

function setBusy(flag) {
  busy = flag;
  fieldsEl.disabled = flag;
  recommendBtn.disabled = flag;
  recommendBtn.textContent = flag ? "추천받는 중…" : "활동 추천받기";
  againBtn.disabled = flag;
  form.setAttribute("aria-busy", String(flag));
}

async function recommend(conditions) {
  const origin = document.activeElement;
  setBusy(true);
  setStatus(statusEl, "활동을 추천받는 중이에요…", "loading");
  try {
    await delay(MOCK_DELAY_MS);
    showResult(conditions, MOCK_ACTIVITIES);
    setStatus(statusEl, `활동 ${MOCK_ACTIVITIES.length}개를 추천받았어요. 지금은 예시(목업) 활동이에요.`, "success");
  } catch (error) {
    setStatus(statusEl, "활동을 추천받지 못했어요. 입력한 내용은 그대로 두었으니 다시 시도해 주세요.", "error");
  } finally {
    setBusy(false);
    if (origin instanceof HTMLElement && document.contains(origin)) origin.focus();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (busy) return;

  const conditions = readConditions();
  const errors = validate(conditions);
  showErrors(errors);

  const invalid = Object.keys(errors);
  if (invalid.length > 0) {
    setStatus(statusEl, `비어 있는 항목이 있어요: ${invalid.map((key) => FIELD_NAMES[key]).join(", ")}`, "error");
    controls[invalid[0]].focus();
    return;
  }
  recommend(conditions);
});

// 다른 활동 추천받기는 입력란이 아니라 지금 표시된 결과의 조건을 쓴다.
againBtn.addEventListener("click", () => {
  if (busy || !shown) return;
  recommend(shown);
});

/* 결과 표시 */

function renderList(tag, items) {
  const list = createElement(tag, "");
  items.forEach((item) => list.appendChild(createElement("li", "", item)));
  return list;
}

function renderCard(activity, index) {
  const card = createElement("article", "activity-card");
  card.appendChild(createElement("p", "activity-number", `활동 ${index + 1}`));
  card.appendChild(createElement("h3", "activity-title", activity.title));

  card.appendChild(createElement("h4", "", "준비물"));
  card.appendChild(renderList("ul", activity.materials));

  card.appendChild(createElement("h4", "", "소요 시간"));
  card.appendChild(createElement("p", "activity-time", `${activity.minutes}분`));

  card.appendChild(createElement("h4", "", "진행 방법"));
  card.appendChild(renderList("ol", activity.steps));
  return card;
}

function showResult(conditions, activities) {
  shown = conditions;
  summaryEl.textContent = `${conditions.unit} · 학생 수준 ${conditions.level}`;
  goalSummaryEl.textContent = `차시 학습 목표: ${conditions.goal}`;
  cardsEl.replaceChildren(...activities.map(renderCard));
  emptyEl.hidden = true;
  actionsEl.hidden = false;
  cardsEl.hidden = false;
  scrollToElement(resultEl);
}
