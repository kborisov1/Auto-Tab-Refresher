# Architecture: Auto Tab Refresher (Chrome extension)

## Overview
A Manifest V3 extension with no build step and no dependencies: plain JavaScript, one service worker, one popup. The service worker owns all timers and state. The popup is a thin UI that sends commands to the worker and reads state.

Files: `manifest.json`, `background.js`, `popup.html`, `popup.js`, `popup.css`.

## Key decisions

**Timers: `chrome.alarms`, one alarm per tab.** `setInterval` dies when the MV3 service worker is suspended (after about 30 seconds idle), so it cannot meet acceptance criterion 8. Alarms are owned by the browser and wake the worker when they fire. Each alarm is named `tab:<tabId>` and created with `periodInMinutes` set to the user's interval. Chrome allows alarms down to 30 seconds, so the 1-minute minimum from scope is enforced by the popup and again by the worker.

**State: `chrome.storage.session`, one key per tab.** Entry `tab:<tabId>` holds `{ intervalMinutes }`. Session storage survives service worker suspension but is cleared when Chrome closes, which gives "no timers after restart" (criterion 6) without extra code. Separate keys per tab avoid read-modify-write races between concurrent events. `chrome.storage.local` and `sync` are deliberately not used.

**Alarms are not trusted to be cleared on restart.** Chrome does not guarantee that alarms are dropped when the browser closes, and tab IDs can be reused across sessions. Two guards cover this: `runtime.onStartup` calls `chrome.alarms.clearAll()`, and the alarm handler ignores and deletes any alarm that has no matching session-storage entry. Stored state is the single source of truth; an alarm without state is garbage.

**Reload: `chrome.tabs.reload(tabId)`.** This is a standard reload (no `bypassCache`). It works on background tabs and needs no permission. For a discarded tab it should load the tab again; this is the one behavior to verify manually early (see Test plan), because the scope requires it.

**Badge: `chrome.action.setBadgeText({ tabId, text })`.** The text is a short marker such as "ON", set per tab so other tabs are unaffected. A reload is a navigation, and tab-specific action state may be reset by navigation, so the worker re-applies the badge for tracked tabs on `tabs.onUpdated` (status `loading` and `complete`) and whenever it starts up. Stopping sets the text to an empty string for that tab.

## Component responsibilities

**Service worker (`background.js`)** handles four message types from the popup (`start`, `stop`, `getState`) and five browser events:

- `alarms.onAlarm`: look up state for the tab, reload it, and drop the alarm if state or tab is missing.
- `tabs.onRemoved`: clear the alarm and the storage entry (criterion 5).
- `tabs.onUpdated`: re-apply the badge for tracked tabs.
- `tabs.onReplaced`: move state and alarm from the old tab ID to the new one, which happens with prerendered or swapped tabs.
- `runtime.onStartup` and `runtime.onInstalled`: clear all alarms and any stale session entries, then reconcile.

Listeners are registered synchronously at the top level of the script, as MV3 requires, so events wake the worker correctly.

**Popup (`popup.js`)** finds the active tab with `tabs.query({ active: true, currentWindow: true })`, which returns the tab ID without the `tabs` permission. It reads that tab's entry from session storage to show running or stopped and the interval (criterion 4). While running, it also reads the tab's alarm with `chrome.alarms.get` and ticks a once-per-second "Next refresh in mm:ss" countdown from the alarm's `scheduledTime`; this needs no extra permission and no worker involvement. Start validates the input (integer or decimal not required; a whole number of minutes, at least 1) and shows a short inline message on empty, zero, negative, non-numeric, or sub-minute values, without sending anything to the worker. Start while already running replaces the alarm, which restarts the countdown, matching the scope rule for changing the interval.

**Message flow for Start:** popup validates, sends `{ type: "start", tabId, minutes }`, the worker validates again, clears any existing alarm for that tab, writes the storage entry, creates the alarm, sets the badge, and replies with the new state. Stop is the reverse: clear alarm, delete entry, clear badge.

## Permissions
`alarms` and `storage`. Nothing else. No `tabs`, no `activeTab`, no `host_permissions`, no content scripts. `tabs.reload`, `tabs.query` by active state, and the action badge all work without extra permissions. The trade-off is that the worker never sees tab URLs or titles, which is consistent with the scope's "no access to page content or browsing history".

## Scope mapping
Navigation inside a refreshing tab needs no handling because the alarm targets the tab ID, not the URL. Closing the tab, Chrome restart, and stop all converge on the same cleanup function (delete alarm, delete entry, clear badge). No logging, notifications, or history are implemented.

## Known limits
Alarms fire late or are coalesced if the computer sleeps; after wake the alarm fires once rather than catching up. Chrome's Memory Saver may discard background tabs; the next tick reloads them. A reload discards unsaved form data, accepted in scope.

## Test plan
Manual checks mapped to the acceptance criteria: two tabs with 1- and 3-minute intervals (1, 2); stop and badge removal (3); reopen the popup on different tabs (4); close a tab and confirm in `chrome://extensions` service worker inspector that its alarm is gone (5); quit and relaunch Chrome with "continue where you left off" enabled (6); try 0, -1, 0.5, empty, and "abc" (7); leave a background tab running for several hours, including one discarded via `chrome://discards` (8). Check the discarded-tab case first, since it is the main assumption not guaranteed by documentation.
