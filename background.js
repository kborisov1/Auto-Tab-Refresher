const KEY_PREFIX = "tab:";
const MIN_MINUTES = 1;
const BADGE_TEXT = "ON";

function keyFor(tabId) {
  return `${KEY_PREFIX}${tabId}`;
}

function tabIdFromKey(key) {
  return Number(key.slice(KEY_PREFIX.length));
}

function isValidMinutes(minutes) {
  return Number.isInteger(minutes) && minutes >= MIN_MINUTES;
}

async function getEntry(tabId) {
  const key = keyFor(tabId);
  const result = await chrome.storage.session.get(key);
  return result[key] ?? null;
}

async function getAllEntries() {
  const all = await chrome.storage.session.get(null);
  return Object.entries(all).filter(([key]) => key.startsWith(KEY_PREFIX));
}

// The tab may already be gone, in which case there is no badge to set.
async function setBadge(tabId, on) {
  try {
    await chrome.action.setBadgeText({ tabId, text: on ? BADGE_TEXT : "" });
  } catch {
    // Ignore: tab no longer exists.
  }
}

async function startTimer(tabId, minutes) {
  await chrome.alarms.clear(keyFor(tabId));
  await chrome.storage.session.set({ [keyFor(tabId)]: { intervalMinutes: minutes } });
  await chrome.alarms.create(keyFor(tabId), {
    delayInMinutes: minutes,
    periodInMinutes: minutes
  });
  await setBadge(tabId, true);
  return { running: true, intervalMinutes: minutes };
}

// Shared cleanup for stop, tab close, and stale state.
async function stopTimer(tabId) {
  await chrome.alarms.clear(keyFor(tabId));
  await chrome.storage.session.remove(keyFor(tabId));
  await setBadge(tabId, false);
  return { running: false, intervalMinutes: null };
}

async function getState(tabId) {
  const entry = await getEntry(tabId);
  return entry
    ? { running: true, intervalMinutes: entry.intervalMinutes }
    : { running: false, intervalMinutes: null };
}

async function handleAlarm(alarm) {
  if (!alarm.name.startsWith(KEY_PREFIX)) {
    return;
  }
  const tabId = tabIdFromKey(alarm.name);
  const entry = await getEntry(tabId);
  if (!entry) {
    await chrome.alarms.clear(alarm.name);
    return;
  }
  try {
    await chrome.tabs.reload(tabId);
  } catch {
    await stopTimer(tabId);
  }
}

async function handleMessage(message) {
  switch (message?.type) {
    case "start":
      if (!Number.isInteger(message.tabId) || !isValidMinutes(message.minutes)) {
        return { error: "Enter a whole number of minutes, at least 1." };
      }
      return startTimer(message.tabId, message.minutes);
    case "stop":
      return stopTimer(message.tabId);
    case "getState":
      return getState(message.tabId);
    default:
      return { error: "Unknown message." };
  }
}

async function handleReplaced(addedTabId, removedTabId) {
  const entry = await getEntry(removedTabId);
  if (!entry) {
    return;
  }
  await stopTimer(removedTabId);
  await startTimer(addedTabId, entry.intervalMinutes);
}

async function reapplyBadgeIfTracked(tabId) {
  if (await getEntry(tabId)) {
    await setBadge(tabId, true);
  }
}

// Drop entries for tabs that no longer exist and restore badges for the rest.
async function reconcile() {
  for (const [key] of await getAllEntries()) {
    const tabId = tabIdFromKey(key);
    try {
      await chrome.tabs.get(tabId);
      await setBadge(tabId, true);
    } catch {
      await stopTimer(tabId);
    }
  }
}

async function resetAll() {
  await chrome.alarms.clearAll();
  const keys = (await getAllEntries()).map(([key]) => key);
  await chrome.storage.session.remove(keys);
  await reconcile();
}

chrome.alarms.onAlarm.addListener((alarm) => {
  handleAlarm(alarm);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  stopTimer(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading" || changeInfo.status === "complete") {
    reapplyBadgeIfTracked(tabId);
  }
});

chrome.tabs.onReplaced.addListener((addedTabId, removedTabId) => {
  handleReplaced(addedTabId, removedTabId);
});

chrome.runtime.onStartup.addListener(() => {
  resetAll();
});

chrome.runtime.onInstalled.addListener(() => {
  resetAll();
});

// Runs on every worker wake-up so badges survive suspension.
reconcile();
