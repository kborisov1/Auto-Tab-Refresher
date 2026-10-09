const statusEl = document.getElementById("status");
const countdownEl = document.getElementById("countdown");
const formEl = document.getElementById("form");
const minutesEl = document.getElementById("minutes");
const stopEl = document.getElementById("stop");
const messageEl = document.getElementById("message");

let tabId = null;
let countdownTimer = null;

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

function stopCountdown() {
  clearInterval(countdownTimer);
  countdownTimer = null;
  countdownEl.textContent = "";
}

// The alarm's scheduledTime is the next refresh; it advances after each tick.
async function startCountdown() {
  stopCountdown();
  const alarm = await chrome.alarms.get(`tab:${tabId}`);
  if (!alarm) {
    return;
  }
  const update = () => {
    const remaining = alarm.scheduledTime - Date.now();
    countdownEl.textContent = `Next refresh in ${formatRemaining(remaining)}`;
    if (remaining <= 0) {
      // Re-read so the countdown rolls over to the next period.
      startCountdown();
    }
  };
  update();
  countdownTimer = setInterval(update, 1000);
}

function render(state) {
  if (state.running) {
    statusEl.textContent = `Running every ${state.intervalMinutes} min`;
    statusEl.className = "running";
    minutesEl.value = state.intervalMinutes;
    startCountdown();
  } else {
    statusEl.textContent = "Stopped";
    statusEl.className = "";
    stopCountdown();
  }
  stopEl.disabled = !state.running;
}

function showMessage(text) {
  messageEl.textContent = text;
}

// Returns a whole number of minutes, or null if the input is invalid.
function parseMinutes(raw) {
  const text = raw.trim();
  if (!/^\d+$/.test(text)) {
    return null;
  }
  const minutes = Number(text);
  return minutes >= 1 ? minutes : null;
}

async function send(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (response?.error) {
    showMessage(response.error);
    return;
  }
  render(response);
}

async function handleStart(event) {
  event.preventDefault();
  showMessage("");
  // Read the raw text: a number input reports "" for some invalid entries.
  const minutes = parseMinutes(minutesEl.value);
  if (minutes === null || minutesEl.validity.badInput) {
    showMessage("Enter a whole number of minutes, at least 1.");
    return;
  }
  await send({ type: "start", tabId, minutes });
}

async function handleStop() {
  showMessage("");
  await send({ type: "stop", tabId });
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || tab.id === chrome.tabs.TAB_ID_NONE) {
    statusEl.textContent = "No tab available";
    formEl.querySelectorAll("button, input").forEach((el) => {
      el.disabled = true;
    });
    return;
  }
  tabId = tab.id;
  const key = `tab:${tabId}`;
  const stored = await chrome.storage.session.get(key);
  const entry = stored[key];
  render(entry
    ? { running: true, intervalMinutes: entry.intervalMinutes }
    : { running: false, intervalMinutes: null });
}

formEl.addEventListener("submit", handleStart);
stopEl.addEventListener("click", handleStop);
init();
