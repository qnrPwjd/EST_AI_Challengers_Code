(() => {
  const STORAGE_KEY = "todays-habits-v1";
  const DEFAULT_HABITS = ["물 8잔 마시기", "30분 운동하기", "책 10페이지 읽기"];

  const elements = {
    date: document.querySelector("#today-date"), greeting: document.querySelector("#greeting"),
    list: document.querySelector("#habit-list"), empty: document.querySelector("#empty-message"),
    form: document.querySelector("#add-form"), input: document.querySelector("#habit-input"),
    ring: document.querySelector("#progress-ring"), percent: document.querySelector("#progress-percent"),
    completed: document.querySelector("#completed-count"), total: document.querySelector("#total-count"),
    summary: document.querySelector("#habit-summary")
  };

  function createId() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function loadHabits() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved)) return saved;
    } catch (error) { console.warn("저장된 습관을 불러오지 못했습니다.", error); }
    return DEFAULT_HABITS.map((name) => ({ id: createId(), name, done: false }));
  }
  let habits = loadHabits();
  function saveHabits() { localStorage.setItem(STORAGE_KEY, JSON.stringify(habits)); }

  function setHeader() {
    const today = new Date();
    elements.date.textContent = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(today);
    const hour = today.getHours();
    elements.greeting.textContent = hour < 12 ? "좋은 아침이에요. 가볍게 시작해 볼까요?" : hour < 18 ? "잘하고 있어요. 오늘의 목표를 채워볼까요?" : "오늘 하루도 수고했어요. 남은 습관을 확인해 볼까요?";
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
    elements.empty.hidden = total !== 0;
    elements.list.innerHTML = "";

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

  function toggleHabit(id) { habits = habits.map((habit) => habit.id === id ? { ...habit, done: !habit.done } : habit); saveHabits(); render(); }
  function removeHabit(id) { habits = habits.filter((habit) => habit.id !== id); saveHabits(); render(); }
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = elements.input.value.trim();
    if (!name) return;
    habits.push({ id: createId(), name, done: false });
    saveHabits(); render();
    elements.input.value = "";
    elements.input.focus();
  });
  setHeader(); render();
})();
