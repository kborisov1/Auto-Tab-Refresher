# Auto Tab Refresher

A personal Chrome extension that reloads a tab every X minutes to keep a logged-in session alive.

- Each tab has its own timer and interval. Only the tab where you start a timer is reloaded.
- Set the interval in minutes (minimum 1) in the toolbar popup, then press Start.
- The extension icon shows an "ON" badge while a tab is refreshing.
- Timers stop when Chrome closes, and a timer ends when its tab is closed.

Reloading a tab discards any unsaved form input on that page.

## Install on Chrome

The extension is not published to the Chrome Web Store, so it is loaded as an unpacked extension. Chrome needs the extracted folder, not the `.zip` file.

1. Get the extension folder. Either copy the project folder, or unzip `Auto-Tab-Refresher.zip` somewhere permanent (for example `Documents`). Do not delete the folder afterwards, because Chrome reads the files from it.
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the `Auto-Tab-Refresher` folder, the one that contains `manifest.json`.
5. Optional: click the puzzle-piece icon in the toolbar and pin **Auto Tab Refresher** so its popup is one click away.

Works on any PC with desktop Google Chrome (Windows, macOS, Linux). It does not work in Edge, Firefox, or Chrome on a phone.

To update to a newer version, replace the folder's contents with the new files, then click the reload icon on the extension's card in `chrome://extensions`.

## Use

1. Open the tab you want to keep alive.
2. Click the extension icon, enter an interval in minutes (for example `3`), and press **Start**.
3. The tab reloads every interval. Press **Stop** in the popup to end it for that tab.

Invalid values (empty, zero, negative, decimals, text, or under 1 minute) are rejected with a short message, and no timer starts.

## Package the extension as a zip

Run these commands from the project root (the folder that contains `manifest.json`). They create `Auto-Tab-Refresher.zip`, which has a single `Auto-Tab-Refresher` folder inside so it unzips cleanly:

```bash
mkdir -p dist/Auto-Tab-Refresher
cp manifest.json background.js popup.html popup.js popup.css README.md dist/Auto-Tab-Refresher/
(cd dist && zip -r ../Auto-Tab-Refresher.zip Auto-Tab-Refresher)
rm -rf dist
```

On Windows, you can instead create the zip from File Explorer: copy the five extension files plus `README.md` into a new folder named `Auto-Tab-Refresher`, then right-click the folder and choose **Send to > Compressed (zipped) folder**.

The zip contains only what Chrome needs to run the extension and this README: `manifest.json`, `background.js`, `popup.html`, `popup.js`, `popup.css`, and `README.md`. Project docs and `CLAUDE.md` are not included.

To move it to another PC, copy `Auto-Tab-Refresher.zip` (USB, cloud drive, or email), unzip it, and follow **Install on Chrome** above.

## Project files

- `manifest.json`: extension manifest (permissions: `alarms`, `storage`).
- `background.js`: service worker that owns the timers and reloads tabs.
- `popup.html`, `popup.js`, `popup.css`: toolbar popup.
- `docs/scope.md`, `docs/architecture.md`: scope, design decisions, and test plan.
