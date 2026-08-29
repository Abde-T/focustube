# Evidence / Traceability

This document maps the core hackathon claims to specific evidence within the repository.

| Claim | Evidence |
| :--- | :--- |
| **Filters YouTube videos** | `src/content/uiModifier.ts`, `src/content/youtubeObserver.ts` (Detects and filters video cards) |
| **Uses AI classification** | `src/popup/popup.ts` (Integrates with OpenRouter `meta-llama/llama-3.1-8b-instruct` to extract topics from natural language input) |
| **Secure API key management** | `build.mjs`, `.env` (Injects variables at build-time using esbuild's `define` plugin) |
| **Handles dynamic YouTube content** | `src/content/youtubeObserver.ts` (Uses `MutationObserver` with requestAnimationFrame batching to handle infinite scroll efficiently) |
| **Blocks YouTube Shorts** | `src/content/uiModifier.ts` (Specifically targets and applies `display: none !important` to Shorts shelves and elements) |
| **Real-time UX Updates** | `src/background/serviceWorker.ts`, `src/popup/popup.ts` (Passes `PROFILE_CHANGED` messages to content scripts for instant layout updates) |
| **Modern Tabbed UI** | `src/popup/popup.html`, `src/popup/popup.ts` (Implements custom Pill components, active states, and a flex-locked header layout) |

## Notes for Evaluators
- You can inspect the compiled output in the `dist/` folder after running `npm run build`. 
- The AI Topic Generator in the popup acts as an agentic feature, parsing raw human intent into structured configuration parameters for the extension.
- The project is designed with a "Fail-Open" architecture (as seen in the filtering logic) so that users are never completely blocked from navigating YouTube if classification fails.
