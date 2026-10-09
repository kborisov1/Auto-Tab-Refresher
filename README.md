# Auto Tab Refresher

A Chrome extension that reloads a tab every X minutes to keep a logged-in session alive.

- Each tab has its own timer. Only the tab where you press Start is reloaded.
- The extension icon shows an "ON" badge while a tab is refreshing.
- Timers stop when Chrome closes or when the tab is closed.
- Reloading a tab discards any unsaved form input on that page.

## Download and install

Works on desktop Google Chrome (Windows, macOS, Linux). Not Edge, Firefox, or mobile.

1. Go to the [latest release](https://github.com/kborisov1/Auto-Tab-Refresher/releases/latest) and download `Auto-Tab-Refresher.zip`.
2. Unzip it somewhere permanent. Do not delete the folder afterwards, because Chrome reads the files from it.
3. Open `chrome://extensions` in Chrome and turn on **Developer mode** (top-right).
4. Click **Load unpacked** and select the `Auto-Tab-Refresher` folder.
5. Optional: click the puzzle-piece icon in the toolbar and pin **Auto Tab Refresher**.

## Use

1. Open the tab you want to keep alive.
2. Click the extension icon, enter an interval in minutes (minimum 1, whole numbers only), and press **Start**.
3. Press **Stop** in the popup to end the timer for that tab.
