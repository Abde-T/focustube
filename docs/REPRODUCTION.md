# Reproduction Guide

## Requirements
* Node.js (v18 or higher recommended)
* npm (Node Package Manager)
* Google Chrome (or Chromium-based browser)
* OpenRouter API Key

## Installation
```bash
# Clone the repository (if applicable)
# git clone <repository>
# cd <repository>

# Install dependencies
npm install
```

## Configuration
Create a `.env` file in the root directory (where `build.mjs` is located) and add your OpenRouter API key:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

## Development
Build the extension using the build script:

```bash
npm run build
```
This will compile the TypeScript files and bundle everything into the `dist/` directory.

## Chrome Extension Installation
1. Open Google Chrome.
2. Navigate to `chrome://extensions/`.
3. Enable **Developer mode** (toggle in the top right corner).
4. Click **Load unpacked**.
5. Select the `dist` directory inside the `youtube-blocker` project folder.
6. Pin the FocusTube extension to your toolbar for easy access.
7. Open or reload a YouTube tab to verify FocusTube is active.

## Testing
* **Video Detection & Filtering**: Browse YouTube and observe the borders around videos. Debug mode will highlight blocked videos with red outlines and uncertain videos with yellow outlines.
* **Shorts Filtering**: Toggle "Block YouTube Shorts" in the extension settings. Reload YouTube and observe that the Shorts shelf and Shorts videos are completely hidden (`display: none`).
* **AI Classification**: Open the extension popup, type a goal like "I only want to see videos about space exploration" into the AI Topic Generator, and click "Analyze". Verify that new topics are generated and applied.
* **Layout Integrity**: Ensure that the YouTube grid remains intact (no large empty spaces) when videos are highlighted.

## Demo Scenario
1. Open the FocusTube extension popup.
2. In the AI Topic Generator, type: "I am trying to learn software engineering and web development".
3. Click "Analyze & Add Topics". Watch the spinner, then observe the generated topics appear as active pills (e.g., "Software Engineering", "Programming").
4. Ensure "Block YouTube Shorts" is enabled in the Settings tab.
5. Open `https://www.youtube.com`.
6. Scroll through the feed.
7. Observe that technical videos are allowed (no red outlines), while entertainment or off-topic videos are blocked (red outlines, clicks disabled).
8. Observe that the Shorts shelf is completely absent from the homepage.
9. Change the active topics manually by clicking the pills in the popup.
10. Observe the YouTube page instantly updating its visual filtering without requiring a page reload.

## Troubleshooting
* **AI Generator fails**: Check that your `.env` file contains a valid `OPENROUTER_API_KEY` and that you have run `npm run build` afterward. The key is injected at build time.
* **Extension UI doesn't update**: When making changes to the popup HTML/CSS, you must close the popup, click the "Reload" icon on the extension card in `chrome://extensions/`, and reopen the popup.
* **Layout Shifts**: If videos appear huge or leave empty gaps, ensure the CSS uses `outline` instead of `border`, as `border` breaks YouTube's grid calculations.
