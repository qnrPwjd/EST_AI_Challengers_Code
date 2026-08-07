// 기존 게임 상태와 함수를 그대로 활용해 굴림 효과만 덧붙입니다.
state.rolling = false;

const originalRender = render;
const originalChoose = choose;

render = function () {
  originalRender();

  if (!state.rolling) return;

  document.querySelectorAll('.die').forEach((die, index) => {
    // 고정 주사위는 현재 눈과 위치를 유지하고, 나머지만 굴립니다.
    if (state.held[index]) {
      die.classList.remove('rolling');
    } else {
      die.classList.add('rolling');
    }
    die.classList.add('disabled');
    die.onclick = null;
  });
  $('#roll-btn').disabled = true;
  $('#roll-btn').textContent = '굴리는 중…';
  $('#turn-sub').textContent = '주사위를 굴리는 중…';
  $('#hint').textContent = '잠시 후 주사위 결과가 표시됩니다.';
};

choose = function (key) {
  if (state.rolling) return;
  originalChoose(key);
};

roll = function () {
  if (state.rolls >= 3 || state.busy || state.rolling) return;

  state.rolling = true;
  render();

  const rollingDice = setInterval(() => {
    state.dice = state.dice.map((value, index) =>
      state.held[index] ? value : Math.floor(Math.random() * 6) + 1
    );
    render();
  }, 85);

  setTimeout(() => {
    clearInterval(rollingDice);
    state.dice = state.dice.map((value, index) =>
      state.held[index] ? value : Math.floor(Math.random() * 6) + 1
    );
    state.rolls++;
    state.rolling = false;
    render();
  }, 650);
};

// game.js가 등록한 클릭 동작을 애니메이션 버전으로 교체합니다.
$('#roll-btn').onclick = roll;

// AI도 플레이어처럼 주사위를 굴리고, 고정한 뒤 족보를 선택합니다.
function aiRollDice(done) {
  state.rolling = true;
  render();

  const rollingDice = setInterval(() => {
    state.dice = state.dice.map((value, index) =>
      state.held[index] ? value : Math.floor(Math.random() * 6) + 1
    );
    render();
  }, 85);

  setTimeout(() => {
    clearInterval(rollingDice);
    state.dice = state.dice.map((value, index) =>
      state.held[index] ? value : Math.floor(Math.random() * 6) + 1
    );
    state.rolls++;
    state.rolling = false;
    render();
    done();
  }, 650);
}

function aiBestCategory() {
  return cats
    .filter(category => state.scores[1][category[0]] === undefined)
    .map(category => [category, category[2](state.dice)])
    .sort((a, b) => b[1] - a[1])[0][0];
}

aiTurn = function () {
  state.busy = true;
  state.held = [false, false, false, false, false];
  render();

  // 사람처럼 첫 굴림을 시작하는 짧은 준비 시간
  setTimeout(() => {
    aiRollDice(() => {
      const frequencies = state.dice.map(value => count(state.dice, value));
      const bestCount = Math.max(...frequencies);
      const canKeepDice = bestCount >= 2;

      // 같은 눈이 둘 이상이면 해당 주사위를 고정해 두 번째 굴림을 시도합니다.
      if (canKeepDice) {
        state.held = frequencies.map(frequency => frequency === bestCount);
        render();
      }

      const selectCategory = () => {
        const best = aiBestCategory();
        state.busy = false;
        render();
        setTimeout(() => choose(best[0]), 450);
      };

      if (canKeepDice && state.rolls < 2) {
        setTimeout(() => aiRollDice(selectCategory), 450);
      } else {
        setTimeout(selectCategory, 450);
      }
    });
  }, 500);
};
