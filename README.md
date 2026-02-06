# iClicker Monitor

A robust, privacy-focused Chrome extension designed to monitor the iClicker student interface. It automatically detects new polling questions and notifies the user via system notifications and audio alerts, ensuring you never miss a participation opportunity.

## Key Features

*   **Real-Time Detection**: Intelligently monitors the DOM for changes indicating a new question (e.g., appearance of answer options, image updates).
*   **Privacy First**: Operates entirely locally within your browser. No data is collected or transmitted.
*   **Smart Filtering**: Advanced logic prevents false positives by ignoring "Polling Closed" states and answer confirmation messages.
*   **Customizable**: Supports both heuristic auto-detection and user-defined CSS selectors for precision monitoring.
*   **Audio Alerts**: Optional "Beep" sound to ensure you are alerted even when the tab is in the background.

## Installation

1.  Clone or download this repository to your local machine.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** using the toggle in the top right corner.
4.  Click **Load unpacked**.
5.  Select the root directory of this project.

## Usage

1.  Navigate to [student.iclicker.com](https://student.iclicker.com/) and log in.
2.  Join your active class session.
3.  The extension activates automatically. It will silently monitor the page structure.
4.  When a question opens, you will receive a desktop notification and an audio alert.

## Advanced Configuration

For users requiring maximum precision, the extension supports custom CSS selectors. This allows you to target specific elements on the page (e.g., the question image container) to trigger alerts.

1.  Right-click the target element on the iClicker page (e.g., the question image).
2.  Select **Inspect**.
3.  Right-click the highlighted element in the DevTools panel -> **Copy** -> **Copy selector**.
4.  Open the extension options by clicking the icon -> **Settings**.
5.  Paste the selector into the configuration area and click **Save**.

## Development & Local Testing

This repository includes a simulation environment to verify functionality without an active class session.

### Running the Simulator
The simulator mimics the DOM structure and behavior of the iClicker student interface.

1.  Open a terminal in the project root.
2.  Start the local server:
    ```bash
    cd demo-folder
    python3 -m http.server 8000
    ```
3.  Navigate to [http://localhost:8000/demo.html](http://localhost:8000/demo.html).

### Verifying the Extension
1.  Ensure the extension is loaded and enabled.
2.  On the demo page, use the **Start Question (Open Poll)** button to simulate a new question.
    *   *Expected Behavior:* The extension should trigger a notification and sound.
3.  Use the **Stop Question (End Poll)** button to simulate the end of a question.
    *   *Expected Behavior:* The extension should remain silent.

*Note: The extension is pre-configured with permissions for `localhost` to facilitate this testing workflow.*

## License

This project is open-source and available for personal and educational use.
