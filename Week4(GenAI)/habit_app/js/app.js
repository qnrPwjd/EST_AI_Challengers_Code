(() => {
  const STORAGE_KEY = "todays-habits-v1";
  const META_STORAGE_KEY = "todays-habits-meta-v1";
  const DEFAULT_HABITS = ["물 8잔 마시기", "30분 운동하기", "책 10페이지 읽기"];

  const elements = {
    date: document.querySelector("#today-date"), greeting: document.querySelector("#greeting"),
    list: document.querySelector("#habit-list"), empty: document.querySelector("#empty-message"),
    form: document.querySelector("#add-form"), input: document.querySelector("#habit-input"),
    ring: document.querySelector("#progress-ring"), percent: document.querySelector("#progress-percent"),
    completed: document.querySelector("#completed-count"), total: document.querySelector("#total-count"),
    summary: document.querySelector("#habit-summary"), streak: document.querySelector("#streak-count"),
    weeklyChart: document.querySelector("#weekly-chart"),
    celebration: document.querySelector("#celebration")
  };

  function createId() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  function getPreviousDateKey(date = new Date()) {
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    return getLocalDateKey(yesterday);
  }
  function loadMeta() {
    try {
      const saved = JSON.parse(localStorage.getItem(META_STORAGE_KEY));
      if (saved && typeof saved === "object") return saved;
    } catch (error) { console.warn("저장된 연속 기록을 불러오지 못했습니다.", error); }
    return { date: getLocalDateKey(), streak: 0, lastCompletedDate: null, history: {} };
  }
  function loadHabits() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved)) return saved;
    } catch (error) { console.warn("저장된 습관을 불러오지 못했습니다.", error); }
    return DEFAULT_HABITS.map((name) => ({ id: createId(), name, done: false }));
  }
  let habits = loadHabits();
  let meta = loadMeta();
  meta.history = meta.history && typeof meta.history === "object" ? meta.history : {};
  function saveHabits() { localStorage.setItem(STORAGE_KEY, JSON.stringify(habits)); }
  function saveMeta() { localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta)); }
  function getRate() {
    return habits.length ? Math.round((habits.filter((habit) => habit.done).length / habits.length) * 100) : 0;
  }
  function saveTodayRate() {
    meta.history[getLocalDateKey()] = getRate();
    saveMeta();
  }
  function getWeekDates() {
    const today = new Date();
    const mondayOffset = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - mondayOffset);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
  }

  function resetForNewDay() {
    const today = getLocalDateKey();
    if (meta.date === today) return;
    habits = habits.map((habit) => ({ ...habit, done: false }));
    meta.date = today;
    saveHabits();
    saveMeta();
  }

  function setHeader() {
    const today = new Date();
    elements.date.textContent = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(today);
    const hour = today.getHours();
    elements.greeting.textContent = hour < 12 ? "좋은 아침이에요. 가볍게 시작해 볼까요?" : hour < 18 ? "잘하고 있어요. 오늘의 목표를 채워볼까요?" : "오늘 하루도 수고했어요. 남은 습관을 확인해 볼까요?";
  }

  function renderWeeklyChart() {
    const today = getLocalDateKey();
    const weekdayNames = ["월", "화", "수", "목", "금", "토", "일"];
    elements.weeklyChart.innerHTML = "";
    getWeekDates().forEach((date, index) => {
      const dateKey = getLocalDateKey(date);
      const rate = dateKey === today ? getRate() : (meta.history[dateKey] || 0);
      const day = document.createElement("div");
      day.className = `week-day${dateKey === today ? " is-today" : ""}`;
      day.innerHTML = `<span class="week-rate">${rate}%</span><div class="week-bar-track"><div class="week-bar" style="--rate: ${rate}%"></div></div><span>${weekdayNames[index]}</span>`;
      elements.weeklyChart.append(day);
    });
  }

  function render() {
    const completed = habits.filter((habit) => habit.done).length;
    const total = habits.length;
    const rate = total ? Math.round((completed / total) * 100) : 0;
    elements.ring.style.setProperty("--progress", `${rate}%`);
    elements.ring.setAttribute("aria-label", `오늘의 달성률 ${rate}퍼센트`);
    elements.percent.textContent = `${rate}%`;
    elements.completed.textContent = completed;
    elements.total.textContent = total;
    elements.summary.textContent = total ? `${completed}/${total} 완료` : "습관을 추가해 보세요";
    elements.streak.textContent = `연속 ${meta.streak}일째`;
    elements.empty.hidden = total !== 0;
    elements.list.innerHTML = "";

    renderWeeklyChart();

    habits.forEach((habit) => {
      const item = document.createElement("li");
      item.className = `habit-item${habit.done ? " is-done" : ""}`;
      const checkbox = document.createElement("input");
      checkbox.className = "habit-check";
      checkbox.type = "checkbox";
      checkbox.checked = habit.done;
      checkbox.setAttribute("aria-label", `${habit.name} 완료 여부`);
      checkbox.addEventListener("change", () => toggleHabit(habit.id));
      const name = document.createElement("span");
      name.className = "habit-name";
      name.textContent = habit.name;
      const remove = document.createElement("button");
      remove.className = "delete-button";
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `${habit.name} 삭제`);
      remove.addEventListener("click", () => removeHabit(habit.id));
      item.append(checkbox, name, remove);
      elements.list.append(item);
    });
  }

  function showCelebration() {
    elements.celebration.hidden = false;
    window.setTimeout(() => { elements.celebration.hidden = true; }, 2400);
  }

  function recordStreakIfComplete() {
    const now = new Date();
    const today = getLocalDateKey(now);
    if (!habits.length || !habits.every((habit) => habit.done) || meta.lastCompletedDate === today) return;
    meta.streak = meta.lastCompletedDate === getPreviousDateKey(now) ? meta.streak + 1 : 1;
    meta.lastCompletedDate = today;
    meta.date = today;
    saveMeta();
  }

  function toggleHabit(id) {
    resetForNewDay();
    habits = habits.map((habit) => habit.id === id ? { ...habit, done: !habit.done } : habit);
    saveHabits();
    recordStreakIfComplete();
    saveTodayRate();
    render();
    if (habits.length > 0 && habits.every((habit) => habit.done)) showCelebration();
  }
  function removeHabit(id) { resetForNewDay(); habits = habits.filter((habit) => habit.id !== id); saveHabits(); saveTodayRate(); render(); }
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    resetForNewDay();
    const name = elements.input.value.trim();
    if (!name) {
      elements.form.classList.remove("is-invalid");
      void elements.form.offsetWidth;
      elements.form.classList.add("is-invalid");
      elements.input.setCustomValidity("습관을 입력해 주세요.");
      elements.input.reportValidity();
      elements.input.focus();
      return;
    }
    elements.input.setCustomValidity("");
    elements.form.classList.remove("is-invalid");
    habits.push({ id: createId(), name, done: false });
    saveHabits(); saveTodayRate(); render();
    elements.input.value = "";
    elements.input.focus();
  });
  elements.input.addEventListener("input", () => {
    elements.input.setCustomValidity("");
    elements.form.classList.remove("is-invalid");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      resetForNewDay();
      saveTodayRate();
      render();
    }
  });
  resetForNewDay();
  saveTodayRate();
  setHeader(); render();
})();
