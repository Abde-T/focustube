# FocusTube — Improvement Changelog

## 2026-08-29 — AI Architecture Upgrade & Feature Expansion

### Problem
The extension relied on an external API (OpenRouter/Llama 3) for topic generation, which was slow and required an API key. Additionally, the classification for uncertain videos was based on simple heuristics, and the extension lacked a way to learn from user feedback or provide a temporary Focus Mode.

### Change
1. Migrated topic generation to local, browser-based semantic similarity using `Transformers.js` (`Xenova/all-MiniLM-L6-v2`).
2. Replaced heuristic classification with local semantic classification for uncertain videos, complete with similarity scores and explanations.
3. Implemented a learned preferences system that adjusts topic weights based on user 'allow' or 'block' actions.
4. Added a Focus Mode feature to temporarily override user topics with a specific goal and timer.

### Implementation
- Added `@xenova/transformers` and updated `manifest.json` CSP to allow WASM execution.
- Created `embeddingService.ts` for caching and executing semantic matching locally.
- Rewrote `mockClassifier.ts` as `SemanticClassifier` using cosine similarity against video metadata.
- Created `preferences.ts` and `focusMode.ts` to manage state in `chrome.storage.local`.
- Updated popup UI with new tabs for Focus Mode and Learned Preferences.

### Result
FocusTube is now completely self-contained and private, requiring no external API keys. It intelligently learns from user interactions, provides transparent deterministic explanations for classifications, and includes a highly requested Focus Mode for deep work sessions.

## [Needs verification] — Initial Filtering Foundation
### Problem
Users need a way to block distracting content on YouTube.
### Change
Implemented base content filtering extension.
### Implementation
Used MutationObserver to detect video cards and a local JSON configuration to determine blocked categories.
### Result
Basic functionality established.

## [Needs verification] — UI Interactions & Confirmations
### Problem
Blocked videos could still be clicked, and uncertain videos needed a way for users to manually allow them without annoying popups.
### Change
Disabled clicks on blocked videos and implemented inline confirmation for uncertain videos.
### Implementation
Intercepted clicks on `.focustube-blocked` and `.focustube-uncertain` elements. Added an inline confirmation modal overlay over the video thumbnails.
### Result
Improved user experience by preventing accidental clicks on blocked content.

## [Needs verification] — Dynamic Topic Selection
### Problem
The extension only supported a small set of hardcoded focus topics (mostly development-specific).
### Change
Expanded the default list of focus topics and distractions, and added a scrollable UI for users to select them.
### Implementation
Updated the popup UI with a `overflow-y: scroll` container and a list of checkboxes for various genres. Saved selections to local storage.
### Result
Users can now customize their focus and distraction categories.

## [Needs verification] — Real-time Filtering Updates
### Problem
Users had to manually reload the YouTube page for new topic selections to take effect.
### Change
Implemented real-time layout updates when settings change.
### Implementation
Added a `PROFILE_CHANGED` broadcast message from the popup/background worker to the content script. The content script re-evaluates all visible videos immediately upon receiving the message.
### Result
Seamless user experience with instant visual feedback on settings changes.

## [Needs verification] — AI-Powered Topic Extraction
### Problem
Users want to specify their goals in natural language rather than hunting for checkboxes.
### Change
Integrated OpenRouter API to extract focus topics from natural language input.
### Implementation
Added a text area in the popup. When the user submits a goal (e.g., "I only want to see programming videos"), it sends a prompt to `meta-llama/llama-3.1-8b-instruct` via OpenRouter. The AI returns a JSON array of relevant topics, which are then added to the user's active focus goals.
### Result
Highly intuitive, agentic configuration of focus goals.

## [Needs verification] — Secure API Key Management
### Problem
API keys were hardcoded in the extension source code.
### Change
Moved API keys to `.env` configuration.
### Implementation
Added `dotenv` and updated `build.mjs` to inject `process.env.OPENROUTER_API_KEY` at build time using `esbuild`. Installed `@types/node` to resolve TypeScript compilation errors.
### Result
Improved security and maintainability for API integrations.

## [Needs verification] — Layout Stability & Shorts Eradication
### Problem
The CSS used for debugging and uncertain videos (e.g., `border: 2px solid`) was breaking YouTube's strict grid layout math, causing massive empty spaces. Additionally, YouTube Shorts were just getting red borders instead of being completely hidden.
### Change
Fixed YouTube grid shifts and aggressively removed YouTube Shorts.
### Implementation
Swapped `border` for `outline` and `outline-offset` to apply visual styles without altering the CSS box model. Updated the Shorts blocking logic to use `display: none !important` to completely eradicate Shorts from the feed.
### Result
Flawless integration with the YouTube UI and successful eradication of highly addictive Shorts content.

## [Needs verification] — Modern Popup UI Redesign
### Problem
The extension popup looked dated and resembled a basic MVP.
### Change
Completely overhauled the popup UI architecture.
### Implementation
Replaced the scrolling list of checkboxes with a tabbed interface ("Topics" vs "Settings"). Replaced native checkboxes with modern, selectable "pills" (chips). Built a premium header with a unified stats bar, implemented the 'Outfit' Google Font, and fixed scroll boundaries so only the tab content scrolls while the header remains fixed.
### Result
A premium, highly polished user interface that looks like a native application.
