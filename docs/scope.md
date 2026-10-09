# Scope: Auto Tab Refresher (Chrome extension)

## Purpose
A personal, local-only Chrome extension that reloads a tab every X minutes to keep a logged-in session alive. Used only by the owner; it will not be published or distributed.

## In scope
- Per-tab refresh: the timer applies only to the tab where it was started. Each tab has its own independent timer and interval.
- Interval is set in a toolbar popup, in minutes.
- Start and stop controls in the popup for the active tab.
- The popup shows the current state of the active tab: running or stopped, and the interval in use.
- A badge on the extension icon for tabs that are currently refreshing.
- A standard page reload on each tick.
- Timers stop when Chrome is closed. Nothing is restored on the next launch, and a restored session starts with all timers off.
- A timer ends when its tab is closed.

## Out of scope
- Persistence across Chrome restarts.
- Cache-bypassing (hard) reloads.
- Detecting unsaved form input or skipping refreshes on pages with it.
- Domain-based rules, allowlists, or auto-start on specific sites.
- Notifications, logging, statistics, or history.
- Simulated user activity or background pings (refresh only).
- Syncing settings across devices.
- Publishing to the Chrome Web Store.
- Support for browsers other than Chrome.

## Behavior decisions
- **Navigation inside a refreshing tab:** the timer keeps running and reloads whatever page is currently loaded in that tab. No automatic stop on navigation.
- **Minimum interval:** 1 minute. Values below it are rejected in the popup with a short message.
- **Invalid input:** empty, zero, negative, or non-numeric values are rejected, and no timer is started.
- **Changing the interval while running:** the new value replaces the old one and the countdown restarts.
- **Stopping:** clears the timer for that tab and removes its badge.
- **Tab discarded or in background:** the refresh must still fire for background tabs. If Chrome discarded the tab, the refresh reloads it.
- **Known risk accepted by the owner:** a reload discards unsaved form data on that tab.

## Permissions principle
Request the minimum permissions needed to reload tabs and keep timers alive. No access to page content, browsing history, or network requests, and no host permissions beyond what a reload requires.

## Acceptance criteria
1. Starting a 3-minute timer on a tab reloads that tab every 3 minutes, and only that tab.
2. Two tabs with different intervals refresh independently.
3. Stopping a timer stops reloads for that tab and clears its badge.
4. The popup correctly reflects running or stopped and the interval when reopened on any tab.
5. Closing a tab clears its timer.
6. After a full Chrome restart, no timers are running.
7. Intervals under 1 minute and invalid values are rejected.
8. The timer keeps firing reliably while the tab is in the background for an extended period (at least a few hours).
