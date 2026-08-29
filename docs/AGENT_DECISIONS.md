# Agent Decision Log

## Decision: Build-time injection of Environment Variables

### Context
The AI Topic Generator required an OpenRouter API key. Extensions run client-side, making it difficult to hide keys without a backend proxy.

### Decision
Use `dotenv` and `esbuild`'s `define` feature to inject the API key into the bundle at build time (`process.env.OPENROUTER_API_KEY`).

### Reason
- Prevents committing the raw key to the repository source files.
- Simplifies the architecture (no need for a separate proxy server just for a hackathon).
- Allows evaluators to easily supply their own key via a `.env` file.

### Tradeoff
The API key is technically still visible in the compiled `dist/` bundle. For a production release, a backend proxy service would be required to completely secure the key.

---

## Decision: `outline` vs `border` for Visual Debugging

### Context
When testing the extension, blocked and uncertain videos were given red or yellow borders. This was causing massive empty spaces on the YouTube homepage.

### Decision
Swap CSS `border` for `outline` and `outline-offset`.

### Reason
- YouTube's grid layout relies on precise width calculations (e.g., exactly 25% for a 4-column layout).
- Adding a 2px `border` physically adds 4px to the total width of the element in the CSS Box Model, breaking the grid math and causing early wrapping.
- `outline` is drawn *outside* the element's bounding box and does not affect the layout dimensions at all.

### Tradeoff
None. `outline` achieves the exact same visual effect without side effects.

---

## Decision: Broadcast Messaging for Real-time Updates

### Context
When a user changes their focus topics in the popup, the YouTube page needs to reflect those changes.

### Decision
Implement a `PROFILE_CHANGED` message broadcast from the popup/service worker to the content script.

### Reason
- Avoids forcing the user to manually refresh the page.
- The content script already has references to all visible video elements via the MutationObserver.
- Triggering a manual re-evaluation loop on message receipt provides instant, seamless UX.

### Tradeoff
Requires re-running the classification logic on already processed elements, which is a minor performance hit, but perfectly acceptable for local deterministic filtering.

---

## Decision: Interactive "Pills" over Checkboxes

### Context
The user requested a "full UI redesign" for the popup, moving away from basic checkboxes.

### Decision
Replace standard `<input type="checkbox">` elements with custom div-based "Pill" components.

### Reason
- Pills (or chips) are highly space-efficient and modern.
- They provide larger click targets.
- They allow for distinct active states (e.g., purple for focus goals, red for distractions) without relying on native browser styling overrides.

### Tradeoff
Requires custom JavaScript event handling to manage the active state classes and sync them with the user profile, rather than relying on native form input behaviors.
