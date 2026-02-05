# iClicker Monitor Extension

A simple, private Chrome extension that notifies you when a new question appears on the iClicker student website.

## Features
- **Privacy First**: Only runs on `student.iclicker.com`. No data collection.
- **Auto-Detection**: Monitors the page for "Polling", "Question", or active "Submit" buttons automatically.
- **Custom Selectors**: For advanced users, you can specify exactly which DOM elements to watch.
- **Alerts**: System notification + Optional "Beep" sound.

## Installation

1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked**.
5. Select the `iclicker-listener` folder from this project.

## Usage

1. Log in to [student.iclicker.com](https://student.iclicker.com/).
2. Join your class session.
3. The extension is now active. It will check for changes on the page.
4. When a question appears, you will get a system notification and a beep (if enabled).

## Configuration (Improving Accuracy)

If the auto-detection is missing questions or triggering falsely, you can tell the extension exactly where to look.

1. Right-click on the "Question" text, the "Timer", or the "Status Bar" on the iClicker page.
2. Select **Inspect**.
3. In the Elements panel that opens, the element will be highlighted.
4. Right-click the highlighted line -> **Copy** -> **Copy selector**.
5. Click the iClicker Monitor extension icon -> **Settings**.
6. Paste the selector into the text area.
7. Click **Save**.

## Testing

To ensure permissions are correct:
1. Click the extension icon.
2. Click **Test Notification**.
3. You should see a notification and hear a sound (if enabled).
