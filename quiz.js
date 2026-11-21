const MARKS = ["①", "②", "③", "④"];
const MIN_UNIT_LENGTH = 2;
const MAX_UNIT_LENGTH = 50;
const MOCK_DELAY_MS = 700;
const FIELD_NAMES = { area: "교과 영역", unit: "단원", level: "난이도" };

// 목업 문항 5개. 정답은 1~4번 보기 번호.
const MOCK_QUIZ = [
  {
    question: "컴퓨터가 정보를 처리할 때 쓰는 가장 작은 정보 단위로, 0 또는 1로 나타내는 것은 무엇인가요?",
    choices: ["바이트(byte)", "비트(bit)", "픽셀(pixel)", "헤르츠(Hz)"],
    answer: 2,
    explanation: "비트는 0과 1 중 하나를 나타내는 가장 작은 정보 단위예요. 비트 8개가 모이면 1바이트가 돼요."
  },
  {
    question: "문제를 해결하는 절차인 알고리즘을 정해진 기호와 화살표로 나타내어 흐름을 한눈에 볼 수 있게 한 것은 무엇인가요?",
    choices: ["변수", "해상도", "압축 파일", "순서도"],
    answer: 4,
    explanation: "순서도는 알고리즘의 처리 순서와 판단 흐름을 기호로 그린 그림이에요."
  },
  {
    question: "비밀번호를 안전하게 관리하는 방법으로 가장 알맞은 것은 무엇인가요?",
    choices: [
      "영문, 숫자, 특수문자를 섞어 길게 만들고 사이트마다 다르게 쓴다.",
      "기억하기 쉽게 내 생일로 정한다.",
      "친구와 서로 비밀번호를 알려 준다.",
      "모든 사이트에 같은 비밀번호를 쓴다."
    ],
    answer: 1,
    explanation: "비밀번호는 길고 복잡하게 만들고, 사이트마다 다르게 써야 하나가 알려져도 피해를 줄일 수 있어요."
  },
  {
    question: "'변수 score가 60 이상일 때만 합격을 출력한다.'처럼 조건에 따라 실행할 내용을 고르는 프로그램의 구조는 무엇인가요?",
    choices: ["반복 구조", "순차 구조", "선택(조건) 구조", "입력 구조"],
    answer: 3,
    explanation: "조건이 참인지 거짓인지에 따라 실행할 내용이 달라지는 구조를 선택(조건) 구조라고 해요."
  },
  {
    question: "많은 데이터를 학습해서 스스로 규칙을 찾아내고, 그 규칙으로 새로운 상황을 예측하는 인공지능 기술은 무엇인가요?",
    choices: ["데이터 백업", "기계 학습", "파일 압축", "화면 캡처"],
    answer: 2,
    explanation: "기계 학습은 데이터에서 규칙을 스스로 찾아 예측이나 분류에 사용하는 인공지능 기술이에요."
  }
];

const form = document.getElementById("quiz-form");
const fieldsEl = document.getElementById("form-fields");
const areaSelect = document.getElementById("area");
const unitInput = document.getElementById("unit");
const levelGroup = document.getElementById("level-group");
const generateBtn = document.getElementById("generate-btn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const actionsEl = document.getElementById("result-actions");
const summaryEl = document.getElementById("result-summary");
const emptyEl = document.getElementById("empty-state");
const cardsEl = document.getElementById("cards");
const copyBtn = document.getElementById("copy-btn");
const csvBtn = document.getElementById("csv-btn");
const regenBtn = document.getElementById("regen-btn");

const controls = { area: areaSelect, unit: unitInput, level: levelGroup };
const errorEls = {
  area: document.getElementById("area-error"),
  unit: document.getElementById("unit-error"),
  level: document.getElementById("level-error")
};
const focusTargets = {
  area: () => areaSelect,
  unit: () => unitInput,
  level: () => form.elements.level[0]
};
const updateUnitCount = bindCounter(unitInput, document.getElementById("unit-count"), MAX_UNIT_LENGTH);

let busy = false;
let shown = null; // 지금 표시 중인 결과: { conditions, items }

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// 보기 순서를 섞고 정답 번호를 다시 맞춘다.
function shuffleChoices(item) {
  const order = shuffle(item.choices.map((_, i) => i));
  return {
    ...item,
    choices: order.map((i) => item.choices[i]),
    answer: order.indexOf(item.answer - 1) + 1
  };
}

function buildMockQuiz() {
  return shuffle(MOCK_QUIZ).map(shuffleChoices);
}

/* 입력과 검증 */

// 단원 앞뒤 공백을 제거하고, 입력란에도 제거된 값을 반영한다.
function readConditions() {
  const unit = unitInput.value.trim();
  unitInput.value = unit;
  updateUnitCount();
  return { area: areaSelect.value, unit, level: form.elements.level.value };
}

function validate(conditions) {
  const errors = {};
  if (!conditions.area) errors.area = "교과 영역을 선택해 주세요.";
  if (conditions.unit.length < MIN_UNIT_LENGTH) errors.unit = `단원을 ${MIN_UNIT_LENGTH}자 이상 입력해 주세요.`;
  if (!conditions.level) errors.level = "난이도를 선택해 주세요.";
  return errors;
}

function showErrors(errors) {
  Object.keys(controls).forEach((key) => setFieldError(controls[key], errorEls[key], errors[key]));
}

areaSelect.addEventListener("change", () => setFieldError(areaSelect, errorEls.area));
unitInput.addEventListener("input", () => setFieldError(unitInput, errorEls.unit));
levelGroup.addEventListener("change", () => setFieldError(levelGroup, errorEls.level));

/* 생성 흐름 (목업) */

function setBusy(flag) {
  busy = flag;
  fieldsEl.disabled = flag;
  generateBtn.disabled = flag;
  generateBtn.textContent = flag ? "만드는 중…" : "문항 만들기";
  form.setAttribute("aria-busy", String(flag));
  [copyBtn, csvBtn, regenBtn].forEach((btn) => { btn.disabled = flag; });
}

async function generate(conditions) {
  const origin = document.activeElement;
  setBusy(true);
  setStatus(statusEl, "문항을 만드는 중이에요…", "loading");
  try {
    await delay(MOCK_DELAY_MS);
    const items = buildMockQuiz();
    showResult(conditions, items);
    setStatus(statusEl, `문항 ${items.length}개를 만들었어요. 지금은 예시(목업) 문항이에요.`, "success");
  } catch (error) {
    setStatus(statusEl, "문항을 만들지 못했어요. 입력한 내용은 그대로 두었으니 다시 시도해 주세요.", "error");
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
    setStatus(statusEl, `입력을 확인해 주세요: ${invalid.map((key) => FIELD_NAMES[key]).join(", ")}`, "error");
    focusTargets[invalid[0]]().focus();
    return;
  }
  generate(conditions);
});

// 다시 만들기는 입력란이 아니라 지금 표시된 결과의 조건을 쓴다.
regenBtn.addEventListener("click", () => {
  if (busy || !shown) return;
  generate(shown.conditions);
});

/* 결과 표시 */

function renderCard(item, index) {
  const card = createElement("article", "quiz-card");
  card.appendChild(createElement("p", "quiz-number", `${index + 1}번`));
  card.appendChild(createElement("h3", "quiz-question", item.question));

  const list = createElement("ol", "quiz-choices");
  item.choices.forEach((choice, i) => {
    const li = createElement("li", "quiz-choice");
    li.appendChild(createElement("span", "choice-mark", MARKS[i]));
    li.appendChild(document.createTextNode(choice));
    list.appendChild(li);
  });
  card.appendChild(list);

  const answerId = `answer-${index + 1}`;
  const toggle = createElement("button", "btn-secondary", "정답·해설 보기");
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", answerId);

  const answer = createElement("div", "quiz-answer");
  answer.id = answerId;
  answer.hidden = true;
  answer.appendChild(createElement("p", "answer-text", `정답: ${MARKS[item.answer - 1]} ${item.choices[item.answer - 1]}`));
  answer.appendChild(createElement("p", "answer-explanation", `해설: ${item.explanation}`));

  toggle.addEventListener("click", () => {
    const open = answer.hidden;
    answer.hidden = !open;
    toggle.textContent = open ? "정답·해설 숨기기" : "정답·해설 보기";
    toggle.setAttribute("aria-expanded", String(open));
    list.children[item.answer - 1].classList.toggle("is-correct", open);
  });

  card.appendChild(toggle);
  card.appendChild(answer);
  return card;
}

function showResult(conditions, items) {
  shown = { conditions, items };
  summaryEl.textContent = `${conditions.area} · ${conditions.unit} · 난이도 ${conditions.level} · ${items.length}문항`;
  cardsEl.replaceChildren(...items.map(renderCard));
  emptyEl.hidden = true;
  actionsEl.hidden = false;
  cardsEl.hidden = false;
  scrollToElement(resultEl);
}

/* 결과 작업: 복사, CSV */

function buildPlainText({ items }) {
  const lines = [`[퀴즈] ${summaryEl.textContent}`, ""];
  items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.question}`);
    item.choices.forEach((choice, j) => lines.push(`${MARKS[j]} ${choice}`));
    lines.push("");
  });
  lines.push("[정답 및 해설]");
  items.forEach((item, i) => {
    lines.push(`${i + 1}번 정답: ${MARKS[item.answer - 1]} ${item.choices[item.answer - 1]}`);
    lines.push(`해설: ${item.explanation}`);
  });
  return lines.join("\n");
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  if (!ok) throw new Error("copy failed");
}

copyBtn.addEventListener("click", async () => {
  if (busy || !shown) return;
  const origin = document.activeElement;
  try {
    await copyText(buildPlainText(shown));
    setStatus(statusEl, "전체 문항과 정답·해설을 복사했어요.", "success");
  } catch (error) {
    setStatus(statusEl, "복사하지 못했어요. 브라우저의 복사 권한을 확인해 주세요.", "error");
  }
  if (origin instanceof HTMLElement) origin.focus();
});

// 수식으로 해석될 수 있는 시작 문자를 막고, 모든 칸을 따옴표로 감싸 쉼표·줄바꿈이 있어도 깨지지 않게 한다.
function csvCell(value) {
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv({ items }) {
  const header = ["번호", "문제", "보기①", "보기②", "보기③", "보기④", "정답", "해설"];
  const rows = items.map((item, i) => [
    i + 1, item.question, ...item.choices, MARKS[item.answer - 1], item.explanation
  ]);
  const body = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  return `\uFEFF${body}\r\n`; // UTF-8 BOM: 엑셀에서 한글이 깨지지 않게 한다.
}

function csvFilename({ conditions }) {
  const safe = `${conditions.unit}_난이도${conditions.level}`.replace(/[\\/:*?"<>|\s]+/g, "_");
  return `퀴즈_${safe}.csv`;
}

csvBtn.addEventListener("click", () => {
  if (busy || !shown) return;
  const blob = new Blob([buildCsv(shown)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = csvFilename(shown);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus(statusEl, "CSV 파일을 내려받았어요.", "success");
});
