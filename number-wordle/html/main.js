// FiveM NUI version of Bro, What’s the Number?
// Supports both browser and FiveM NUI. NUI listens for open/config message.

let CODE_LENGTH = 5;
let ATTEMPTS = 6;
let TIMER_SECONDS = 120;
let ALLOW_LEADING_ZEROS = true;
let ALLOWED_DIGITS = "0123456789";
let THEME = "default";
let WIN_SOUND = "win.mp3";
let FAIL_SOUND = "fail.mp3";

let secretCode = '';
let attempts = [];
let timer = 0; // Always set in startGame()
let timerInterval = null;
let gameEnded = false;
let currentGuess = [];

const attemptsGrid = document.getElementById('attempts-grid');
const resultMessage = document.getElementById('result-message');
const timerDisplay = document.getElementById('timer');

// Apply config from FiveM NUI or defaults
function applySettings(settings) {
  CODE_LENGTH = settings.codeLength !== undefined ? settings.codeLength : 5;
  ATTEMPTS = settings.attempts !== undefined ? settings.attempts : 6;
  TIMER_SECONDS = settings.timer !== undefined ? settings.timer : 120;
  ALLOW_LEADING_ZEROS = settings.allowLeadingZeros !== undefined ? settings.allowLeadingZeros : true;
  ALLOWED_DIGITS = settings.allowedDigits || "0123456789";
  THEME = settings.theme || "default";
  WIN_SOUND = settings.winSound || "win.mp3";
  FAIL_SOUND = settings.failSound || "fail.mp3";
}

// Listen for NUI open/config (FiveM)
window.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'open') {
    applySettings(event.data.settings || {});
    startGame();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // If not running as NUI (i.e., in browser), use config from window.fivemConfig if present
  if (window.fivemConfig) {
    applySettings(window.fivemConfig);
  }
  startGame();
});

function startGame() {
  secretCode = generateSecretCode();
  attempts = [];
  timer = TIMER_SECONDS;
  gameEnded = false;
  currentGuess = Array(CODE_LENGTH).fill('');
  resultMessage.textContent = '';
  renderGrid();
  updateTimerDisplay();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer--;
    updateTimerDisplay();
    if (timer <= 0) {
      playFailSound();
      endGame(false);
    }
  }, 1000);
}

function generateSecretCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALLOWED_DIGITS[Math.floor(Math.random() * ALLOWED_DIGITS.length)];
  }
  if (!ALLOW_LEADING_ZEROS && code[0] === '0') return generateSecretCode();
  return code;
}

function renderGrid() {
  attemptsGrid.innerHTML = '';
  for (let i = 0; i < ATTEMPTS; i++) {
    const row = document.createElement('div');
    row.className = 'attempt-row';
    if (i === attempts.length && !gameEnded) {
      // Color interpolation: green (#3cb371) to blood red (#b22222)
      const colorStops = [
        '#3cb371', '#7fc44f', '#c5c44f', '#c48b4f', '#c45c4f', '#b22222'
      ];
      const borderColor = colorStops[Math.min(attempts.length, colorStops.length-1)];
      for (let j = 0; j < CODE_LENGTH; j++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.inputMode = 'numeric';
        input.pattern = '\\d';
        input.className = 'grid-guess-input';
        input.autocomplete = 'off';
        input.value = currentGuess[j];
        input.id = `grid-guess-input-${j}`;
        input.disabled = gameEnded;
        input.style.borderColor = borderColor;
        row.appendChild(input);
      }
    } else if (i < attempts.length) {
      // Previous guesses
      const guess = attempts[i];
      let feedback = getFeedback(guess, secretCode);
      for (let j = 0; j < CODE_LENGTH; j++) {
        const box = document.createElement('div');
        box.className = 'digit-box';
        box.textContent = guess[j];
        if (feedback[j] === 'correct') {
          box.classList.add('correct');
        } else if (feedback[j] === 'misplaced') {
          box.classList.add('misplaced');
        } else {
          box.classList.add('incorrect');
        }
        row.appendChild(box);
      }
    } else {
      // Empty rows
      for (let j = 0; j < CODE_LENGTH; j++) {
        const box = document.createElement('div');
        box.className = 'digit-box';
        row.appendChild(box);
      }
    }
    attemptsGrid.appendChild(row);
  }
  setupInputNavigationInGrid();
}

function updateTimerDisplay() {
  const min = Math.floor(timer / 60).toString().padStart(2, '0');
  const sec = (timer % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${min}:${sec}`;
}

function getFeedback(guess, code) {
  // Returns array: 'correct', 'misplaced', 'incorrect'
  let feedback = Array(CODE_LENGTH).fill('incorrect');
  let codeArr = code.split('');
  let guessArr = guess.split('');
  let used = Array(CODE_LENGTH).fill(false);
  // First pass: correct
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guessArr[i] === codeArr[i]) {
      feedback[i] = 'correct';
      used[i] = true;
    }
  }
  // Second pass: misplaced
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (feedback[i] === 'correct') continue;
    for (let j = 0; j < CODE_LENGTH; j++) {
      if (!used[j] && guessArr[i] === codeArr[j]) {
        feedback[i] = 'misplaced';
        used[j] = true;
        break;
      }
    }
  }
  return feedback;
}

function setupInputNavigationInGrid() {
  if (gameEnded) return;
  let autoSubmitTimeout = null;
  for (let j = 0; j < CODE_LENGTH; j++) {
    const input = document.getElementById(`grid-guess-input-${j}`);
    if (!input) continue;
    input.addEventListener('input', (e) => {
      if (gameEnded) { e.target.blur(); return; }
      const val = e.target.value;
      if (!ALLOWED_DIGITS.includes(val)) {
        e.target.value = '';
        currentGuess[j] = '';
        return;
      }
      currentGuess[j] = val;
      // If last box filled, auto-submit after 500ms
      if (j === CODE_LENGTH - 1 && currentGuess.every(d => d.length === 1)) {
        if (autoSubmitTimeout) clearTimeout(autoSubmitTimeout);
        autoSubmitTimeout = setTimeout(() => {
          submitGuessFromGrid();
        }, 500);
      } else {
        if (j < CODE_LENGTH - 1) {
          document.getElementById(`grid-guess-input-${j+1}`).focus();
        }
      }
    });
    input.addEventListener('keydown', (e) => {
      if (gameEnded) { e.preventDefault(); return; }
      if (e.key === 'Backspace') {
        if (input.value === '' && j > 0) {
          document.getElementById(`grid-guess-input-${j-1}`).focus();
        }
      } else if (e.key === 'ArrowLeft' && j > 0) {
        document.getElementById(`grid-guess-input-${j-1}`).focus();
        e.preventDefault();
      } else if (e.key === 'ArrowRight' && j < CODE_LENGTH - 1) {
        document.getElementById(`grid-guess-input-${j+1}`).focus();
        e.preventDefault();
      }
    });
    // Autofocus on first empty
    if (j === 0 && input.value === '') {
      input.focus();
    }
  }
}

function submitGuessFromGrid() {
  if (gameEnded) return;
  const guess = currentGuess.join('');
  if (guess.length !== CODE_LENGTH || ![...guess].every(d => ALLOWED_DIGITS.includes(d))) {
    currentGuess = Array(CODE_LENGTH).fill('');
    renderGrid();
    return;
  }
  attempts.push(guess);
  currentGuess = Array(CODE_LENGTH).fill('');
  renderGrid();
  if (guess === secretCode) {
    endGame(true);
    return;
  }
  if (attempts.length >= ATTEMPTS) {
    playFailSound();
    endGame(false);
    return;
  }
}

function playFailSound() {
  // Try both DOM element and new Audio object for maximum coverage
  const failAudio = document.getElementById('fail-audio');
  if (failAudio) {
    try {
      failAudio.pause();
      failAudio.currentTime = 0;
      failAudio.volume = 1.0;
      console.log('Attempting to play fail.mp3 via DOM element');
      failAudio.play().then(() => {
        console.log('fail.mp3 playback started via DOM element');
      }).catch((err) => {
        console.error('fail.mp3 play() error (DOM element):', err);
      });
    } catch (e) {
      console.error('fail.mp3 playback exception (DOM element):', e);
    }
  } else {
    console.error('fail-audio element not found');
  }
  // Always also try new Audio instance
  try {
    const failAudio2 = new Audio('fail.mp3');
    failAudio2.volume = 1.0;
    console.log('Attempting to play fail.mp3 via new Audio');
    failAudio2.play().then(() => {
      console.log('fail.mp3 playback started via new Audio');
    }).catch((err) => {
      console.error('fail.mp3 play() error (new Audio):', err);
    });
  } catch (e2) {
    console.error('fail.mp3 playback exception (new Audio):', e2);
  }
}

function endGame(won) {
  gameEnded = true;
  clearInterval(timerInterval);
  // Play win sound only on win
  if (won) {
    const winAudio = document.getElementById('win-audio');
    if (winAudio) {
      winAudio.pause();
      winAudio.currentTime = 0;
      winAudio.volume = 1.0;
      winAudio.play().catch(() => {});
    }
    setTimeout(() => {
      fadeOutAndClearGame(won);
    }, 1000);
  } else {
    fadeOutAndClearGame(won);
  }
  // If running in FiveM NUI, send result to Lua
  if (window.GetParentResourceName) {
    fetch(`https://${GetParentResourceName()}/numberGameResult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        result: won ? 'passed' : 'failed',
        code: secretCode,
        attempts: attempts
      })
    });
  }
}

function fadeOutAndClearGame(won) {
  const container = document.querySelector('.game-container');
  if (container) {
    container.style.transition = 'opacity 0.7s';
    container.style.opacity = '1';
    // Remove all container styles that might add border/background
    container.style.background = 'none';
    container.style.border = 'none';
    container.style.boxShadow = 'none';
    container.style.padding = '0';
    container.style.margin = '0';
    // Replace with Pass/Fail message, no background/border
    container.innerHTML = `<div style="font-size:2.5em;text-align:center;font-weight:bold;color:${won ? '#3cb371' : '#b22222'};background:none;border:none;box-shadow:none;padding:0;margin:0;">${won ? 'Pass' : 'Fail'}</div>`;
    setTimeout(() => {
      container.style.opacity = '0';
      setTimeout(() => {
        container.innerHTML = '';
        // Optionally, send close event for NUI
        if (window.GetParentResourceName) {
          fetch(`https://${GetParentResourceName()}/closeNumberGame`, { method: 'POST' });
        }
      }, 700);
    }, 1500); // Message stays for 1.5s (1s if win, plus fade)
  }
}
