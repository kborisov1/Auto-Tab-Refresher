const statusEl = document.getElementById("status");
const formEl = document.getElementById("form");
const minutesEl = document.getElementById("minutes");
const stopEl = document.getElementById("stop");
const messageEl = document.getElementById("message");

let tabId = null;

function render(state) {
  if (state.running) {
    statusEl.textContent = `Running every ${state.intervalMinutes} min`;
    statusEl.className = "running";
    minutesEl.value = state.intervalMinutes;
  } else {
    statusEl.textContent = "Stopped";
    statusEl.className = "";
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
