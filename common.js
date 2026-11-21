function createElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// type: loading | success | error. message가 비어 있으면 상태 영역을 비운다.
function setStatus(statusEl, message, type) {
  statusEl.replaceChildren();
  statusEl.className = type ? `status status-${type}` : "status";
  if (!message) return;
  if (type === "loading") {
    const spinner = createElement("span", "spinner");
    spinner.setAttribute("aria-hidden", "true");
    statusEl.appendChild(spinner);
  }
  statusEl.appendChild(createElement("span", "status-text", message));
}

function setFieldError(control, errorEl, message) {
  errorEl.textContent = message || "";
  errorEl.hidden = !message;
  if (message) {
    control.setAttribute("aria-invalid", "true");
  } else {
    control.removeAttribute("aria-invalid");
  }
}

// 글자 수 표시를 갱신하는 함수를 돌려준다.
function bindCounter(input, countEl, max) {
  const update = () => {
    countEl.textContent = `${input.value.length} / ${max}`;
  };
  input.addEventListener("input", update);
  update();
  return update;
}

function scrollToElement(el) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
