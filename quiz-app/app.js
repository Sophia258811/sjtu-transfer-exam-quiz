const STORAGE_KEY = "sjtu-2025-transfer-quiz-v1";

const saved = (() => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
})();

const state = {
  view: "practice",
  mode: "all",
  year: "all",
  family: "all",
  index: 0,
  answers: saved.answers || {},
  favorites: new Set(Array.isArray(saved.favorites) ? saved.favorites : []),
};

const elements = {
  navButtons: [...document.querySelectorAll(".nav-button")],
  views: [...document.querySelectorAll(".view")],
  modeButtons: [...document.querySelectorAll(".mode-button")],
  yearFilter: document.querySelector("#yearFilter"),
  topicFilter: document.querySelector("#topicFilter"),
  scopeCount: document.querySelector("#scopeCount"),
  answeredStat: document.querySelector("#answeredStat"),
  accuracyStat: document.querySelector("#accuracyStat"),
  mathStat: document.querySelector("#mathStat"),
  logicStat: document.querySelector("#logicStat"),
  progressFill: document.querySelector("#progressFill"),
  resetProgress: document.querySelector("#resetProgress"),
  emptyState: document.querySelector("#emptyState"),
  questionCard: document.querySelector("#questionCard"),
  questionNumber: document.querySelector("#questionNumber"),
  yearBadge: document.querySelector("#yearBadge"),
  subjectBadge: document.querySelector("#subjectBadge"),
  topicBadge: document.querySelector("#topicBadge"),
  kindBadge: document.querySelector("#kindBadge"),
  favoriteButton: document.querySelector("#favoriteButton"),
  questionStem: document.querySelector("#questionStem"),
  optionList: document.querySelector("#optionList"),
  explanationPanel: document.querySelector("#explanationPanel"),
  feedbackTitle: document.querySelector("#feedbackTitle"),
  answerLine: document.querySelector("#answerLine"),
  explanationText: document.querySelector("#explanationText"),
  sourceNote: document.querySelector("#sourceNote"),
  prevButton: document.querySelector("#prevButton"),
  nextButton: document.querySelector("#nextButton"),
  positionText: document.querySelector("#positionText"),
  topicGrid: document.querySelector("#topicGrid"),
  startExtra: document.querySelector("#startExtra"),
};

const isScorable = (question) => question.correct >= 0;
const isAnswered = (question) => isScorable(question) && Boolean(state.answers[question.id]);
const isWrong = (question) => {
  const answer = state.answers[question.id];
  return isScorable(question) && answer && answer.choice !== question.correct;
};

function familyFor(question) {
  if (question.kind === "archive") {
    return question.subject === "逻辑" ? "历年逻辑" : "历年数学";
  }
  if (question.subject === "逻辑") {
    return question.id <= 40 || question.id === 67 || question.id === 68
      ? "形式逻辑"
      : "论证逻辑";
  }

  const topic = question.topic;
  if (/集合|命题|稠密/.test(topic)) return "集合与命题";
  if (/数列|同余/.test(topic)) return "数列与同余";
  if (/函数|导数|多项式|代数/.test(topic)) return "函数与代数";
  if (/直线|极坐标|圆|抛物线|几何最值/.test(topic)) return "解析几何";
  if (/概率|统计|二项|分支/.test(topic)) return "概率统计";
  return "几何与向量";
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        answers: state.answers,
        favorites: [...state.favorites],
      })
    );
  } catch {
    // The quiz still works when storage is unavailable.
  }
}

function getFilteredQuestions() {
  return QUESTIONS.filter((question) => {
    if (state.year !== "all" && question.year !== state.year) return false;
    if (state.mode === "数学" && question.subject !== "数学") return false;
    if (state.mode === "逻辑" && question.subject !== "逻辑") return false;
    if (state.mode === "extra" && question.kind !== "extra") return false;
    if (state.mode === "unanswered" && isAnswered(question)) return false;
    if (state.mode === "wrong" && !isWrong(question)) return false;
    if (state.mode === "favorite" && !state.favorites.has(question.id)) return false;
    if (state.family !== "all" && familyFor(question) !== state.family) return false;
    return true;
  });
}

function getFamiliesForMode() {
  let candidates = QUESTIONS.filter(
    (question) => state.year === "all" || question.year === state.year
  );

  if (state.mode === "数学" || state.mode === "逻辑") {
    candidates = candidates.filter((question) => question.subject === state.mode);
  }
  if (state.mode === "extra") {
    candidates = candidates.filter((question) => question.kind === "extra");
  }
  if (state.mode === "unanswered") {
    candidates = candidates.filter((question) => !isAnswered(question));
  }
  if (state.mode === "wrong") {
    candidates = candidates.filter(isWrong);
  }
  if (state.mode === "favorite") {
    candidates = candidates.filter((question) => state.favorites.has(question.id));
  }

  return [...new Set(candidates.map(familyFor))];
}

function renderTopicFilter() {
  const families = getFamiliesForMode();
  if (!families.includes(state.family)) state.family = "all";

  elements.topicFilter.innerHTML = [
    '<option value="all">全部专题</option>',
    ...families.map(
      (family) => `<option value="${family}">${family}</option>`
    ),
  ].join("");
  elements.topicFilter.value = state.family;
}

function renderStats() {
  const scorable = QUESTIONS.filter(isScorable);
  const answered = scorable.filter(isAnswered);
  const correct = answered.filter(
    (question) => state.answers[question.id].choice === question.correct
  ).length;
  const accuracy = answered.length ? Math.round((correct / answered.length) * 100) : 0;
  const progress = scorable.length ? (answered.length / scorable.length) * 100 : 0;

  elements.answeredStat.textContent = `${answered.length} / ${scorable.length}`;
  elements.accuracyStat.textContent = `${accuracy}%`;
  elements.progressFill.style.width = `${progress}%`;

  const subjectRate = (subject) => {
    const rows = scorable.filter((question) => question.subject === subject);
    const done = rows.filter(isAnswered);
    if (!done.length) return "0%";
    const ok = done.filter(
      (question) => state.answers[question.id].choice === question.correct
    ).length;
    return `${Math.round((ok / done.length) * 100)}%`;
  };

  elements.mathStat.textContent = subjectRate("数学");
  elements.logicStat.textContent = subjectRate("逻辑");
}

function optionLabel(index) {
  return String.fromCharCode(65 + index);
}

function renderQuestion() {
  const list = getFilteredQuestions();
  elements.scopeCount.textContent = `${list.length} 题`;

  if (!list.length) {
    elements.emptyState.hidden = false;
    elements.questionCard.hidden = true;
    elements.positionText.textContent = "0 / 0";
    elements.prevButton.disabled = true;
    elements.nextButton.disabled = true;
    renderStats();
    return;
  }

  elements.emptyState.hidden = true;
  elements.questionCard.hidden = false;
  state.index = Math.min(state.index, list.length - 1);

  const question = list[state.index];
  const answer = state.answers[question.id];
  const revealed = Boolean(answer) || !isScorable(question);
  const favorite = state.favorites.has(question.id);

  elements.questionNumber.textContent =
    question.kind === "extra"
      ? `拓展题 ${question.id - 60}`
      : `第 ${question.number} 题`;
  elements.yearBadge.textContent = `${question.year} 年`;
  elements.subjectBadge.textContent = question.subject;
  elements.topicBadge.textContent = question.topic;
  elements.kindBadge.textContent =
    question.kind === "extra" ? "拓展" : question.kind === "archive" ? "回忆卷" : "原题";
  elements.kindBadge.classList.toggle("badge-warm", question.kind !== "extra");
  elements.questionStem.innerHTML = question.stem;
  elements.favoriteButton.classList.toggle("is-active", favorite);
  elements.favoriteButton.setAttribute(
    "aria-label",
    favorite ? "取消收藏" : "收藏题目"
  );

  elements.optionList.innerHTML = question.options
    .map((option, index) => {
      const selected = answer?.choice === index;
      const correct = revealed && isScorable(question) && index === question.correct;
      const wrong = revealed && selected && isScorable(question) && index !== question.correct;
      const classes = [
        "option-button",
        selected ? "is-selected" : "",
        correct ? "is-correct" : "",
        wrong ? "is-wrong" : "",
      ]
        .filter(Boolean)
        .join(" ");

      return `
        <button
          class="${classes}"
          type="button"
          data-option="${index}"
          ${revealed ? "disabled" : ""}
        >
          <span class="option-key">${optionLabel(index)}</span>
          <span class="option-copy">${option}</span>
        </button>
      `;
    })
    .join("");

  if (revealed) {
    const warning = !isScorable(question);
    const answeredCorrectly =
      isScorable(question) && answer?.choice === question.correct;

    elements.explanationPanel.hidden = false;
    elements.feedbackTitle.className = warning
      ? "is-warning"
      : answeredCorrectly
        ? "is-correct"
        : "is-wrong";
    elements.feedbackTitle.textContent = warning
      ? question.kind === "archive" ? "答案待核对" : "题面异常"
      : answeredCorrectly
        ? "回答正确"
        : "回答错误";
    elements.answerLine.textContent = warning
      ? "本题暂不计正确率"
      : `正确答案：${optionLabel(question.correct)}`;
    elements.explanationText.innerHTML = question.explanation;
    elements.sourceNote.innerHTML = question.sourceFile
      ? `${question.note} <a href="${encodeURI(question.sourceFile)}" target="_blank" rel="noreferrer">查看原卷</a>`
      : question.note || "";
  } else {
    elements.explanationPanel.hidden = true;
  }

  elements.positionText.textContent = `${state.index + 1} / ${list.length}`;
  elements.prevButton.disabled = state.index === 0;
  elements.nextButton.disabled = state.index === list.length - 1;
  renderStats();
}

function renderKnowledge() {
  const original = QUESTIONS.filter((question) => question.kind !== "extra");
  const counts = new Map();

  original.forEach((question) => {
    const family = familyFor(question);
    counts.set(family, (counts.get(family) || 0) + 1);
  });

  const max = Math.max(...counts.values());
  const ordered = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  elements.topicGrid.innerHTML = ordered
    .map(([family, count]) => {
      const subject = /形式逻辑|论证逻辑/.test(family) ? "逻辑" : "数学";
      return `
        <article class="topic-item">
          <span>${subject} · 知识板块</span>
          <strong>${count} 题</strong>
          <div class="topic-bar" aria-hidden="true">
            <i style="width:${(count / max) * 100}%"></i>
          </div>
          <p>${family}</p>
        </article>
      `;
    })
    .join("");
}

function switchView(view) {
  state.view = view;
  elements.navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
  elements.views.forEach((section) => {
    section.classList.toggle("is-active", section.id === `${view}View`);
  });
}

function switchMode(mode) {
  state.mode = mode;
  state.index = 0;
  elements.modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === mode);
  });
  renderTopicFilter();
  renderQuestion();
}

function selectAnswer(choice) {
  const question = getFilteredQuestions()[state.index];
  if (!question || !isScorable(question) || state.answers[question.id]) return;
  state.answers[question.id] = { choice };
  saveState();
  renderQuestion();
}

function moveQuestion(delta) {
  const list = getFilteredQuestions();
  if (!list.length) return;
  state.index = Math.max(0, Math.min(list.length - 1, state.index + delta));
  renderQuestion();
}

function toggleFavorite() {
  const question = getFilteredQuestions()[state.index];
  if (!question) return;
  if (state.favorites.has(question.id)) {
    state.favorites.delete(question.id);
  } else {
    state.favorites.add(question.id);
  }
  saveState();
  renderQuestion();
}

elements.navButtons.forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

elements.modeButtons.forEach((button) => {
  button.addEventListener("click", () => switchMode(button.dataset.mode));
});

elements.topicFilter.addEventListener("change", () => {
  state.family = elements.topicFilter.value;
  state.index = 0;
  renderQuestion();
});

elements.yearFilter.addEventListener("change", () => {
  state.year = elements.yearFilter.value;
  state.index = 0;
  renderTopicFilter();
  renderQuestion();
});

elements.optionList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-option]");
  if (!button) return;
  selectAnswer(Number(button.dataset.option));
});

elements.prevButton.addEventListener("click", () => moveQuestion(-1));
elements.nextButton.addEventListener("click", () => moveQuestion(1));
elements.favoriteButton.addEventListener("click", toggleFavorite);

elements.resetProgress.addEventListener("click", () => {
  if (!window.confirm("清空全部作答、错题与收藏？")) return;
  state.answers = {};
  state.favorites = new Set();
  state.index = 0;
  saveState();
  renderTopicFilter();
  renderQuestion();
});

elements.startExtra.addEventListener("click", () => {
  switchView("practice");
  switchMode("extra");
});

document.addEventListener("keydown", (event) => {
  if (state.view !== "practice") return;
  if (["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName)) return;

  if (event.key === "ArrowLeft") moveQuestion(-1);
  if (event.key === "ArrowRight") moveQuestion(1);

  const number = Number(event.key) - 1;
  if (number >= 0 && number <= 4) selectAnswer(number);
});

renderTopicFilter();
renderKnowledge();
renderQuestion();
