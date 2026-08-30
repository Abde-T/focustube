# Reproduction Guide

This guide walks you through reproducing the FocusTube solution from a clean environment, including the baseline comparison and evaluation.

## Requirements
* Node.js (v18 or higher recommended)
* npm (Node Package Manager)
* Google Chrome (or Chromium-based browser)

## Version Information
- Node.js: v18+ (tested on v18.17.0)
- npm: v9+ (tested on v9.6.7)
- Chrome: v120+ (any Chromium-based browser)
- Transformers.js: v2.16.0
- Build time: ~5-10 seconds
- Extension load time: ~1-2 seconds (model pre-loading adds ~10-20s on first load)
- Runtime cost: $0 (local inference only)

## Installation
```bash
# Clone the repository (if applicable)
# git clone <repository>
# cd <repository>

# Install dependencies
npm install
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
* **Shorts Filtering**: Toggle "Block YouTube Shorts" in the extension settings and observe that the Shorts shelf and Shorts videos are completely hidden (`display: none`).
* **AI Classification**: Open the extension popup, select focus topics from the predefined categories using the parent/child hierarchy. Verify that videos matching these topics are allowed while others are blocked.
* **Layout Integrity**: Ensure that the YouTube grid remains intact (no large empty spaces) when videos are highlighted.

## Demo Scenario
1. Open the FocusTube extension popup.
2. In the Topics tab, click on parent categories like "Tech".
3. Observe the selected topics appear as active pills.
4. Ensure "Block YouTube Shorts" is enabled in the Settings tab.
5. Open `https://www.youtube.com`.
6. Scroll through the feed.
7. Observe that technical videos are allowed (no red outlines), while entertainment or off-topic videos are blocked (red outlines, clicks disabled).
8. Observe that the Shorts shelf is completely absent from the homepage.
9. Change the active topics manually by clicking the pills in the popup.
10. Observe the YouTube page instantly updating its visual filtering without requiring a page reload.

## Troubleshooting
* **Extension UI doesn't update**: When making changes to the popup HTML/CSS, you must close the popup, click the "Reload" icon on the extension card in `chrome://extensions/`, and reopen the popup.
* **Layout Shifts**: If videos appear huge or leave empty gaps, ensure the CSS uses `outline` instead of `border`, as `border` breaks YouTube's grid calculations.

---

## Baseline Comparison

### Baseline: Manual YouTube Browsing

The baseline represents the current state without FocusTube - users relying on willpower alone to maintain focus on YouTube.

**Baseline Setup:**
1. Open Chrome without any YouTube filtering extensions installed
2. Navigate to `https://www.youtube.com`
3. Set a specific learning goal (e.g., "I want to learn programming")
4. Browse YouTube for 30 minutes, attempting to stay focused on your goal
5. Record the time spent on relevant vs irrelevant content

**Baseline Expected Behavior:**
- Without automated filtering, users must rely on willpower to ignore tempting recommendations
- YouTube's algorithm actively promotes engaging content that may not align with learning goals
- High cognitive load from constant decision-making about what to watch
- No persistent state - focus must be re-established each session

### Solution: FocusTube Extension

**Solution Setup:**
1. Follow the installation steps above
2. Open the FocusTube popup
3. Select focus topics from the predefined categories (e.g., select "Tech" → "Programming")
4. Enable "Block YouTube Shorts" in Settings
5. Set blocked display mode to "hide"
6. Browse YouTube for 30 minutes with the same goal

**Solution Expected Behavior:**
- Videos matching selected focus topics are allowed, others are blocked or hidden
- Distractions are automatically filtered based on semantic similarity
- Reduced cognitive load - filtering is automatic
- Persistent focus state across sessions

---

## Evaluation Methodology

### Primary Metric

**Relevant Content Ratio**: The percentage of time spent on videos that match the user's stated learning goal.

### Evaluation Cases

Use the following test cases to evaluate both baseline and solution:

| Case | User Goal | Expected Baseline | Expected Solution |
|------|-----------|-------------------|-------------------|
| 1 | "Learn programming" | Manual willpower required | Automated semantic filtering |
| 2 | "Learn cooking" | Manual willpower required | Automated semantic filtering |
| 3 | "Learn fitness" | Manual willpower required | Automated semantic filtering |
| 4 | "Learn machine learning" | Manual willpower required | Automated semantic filtering |
| 5 | "Learn music production" | Manual willpower required | Automated semantic filtering |
| 6 | "Learn photography" | Manual willpower required | Automated semantic filtering |
| 7 | "Learn business" | Manual willpower required | Automated semantic filtering |
| 8 | "Learn history" | Manual willpower required | Automated semantic filtering |
| 9 | "Learn language learning" | Manual willpower required | Automated semantic filtering |
| 10 | "Learn DIY/crafts" | Manual willpower required | Automated semantic filtering |

### Challenging Case

**Case 11**: "Learn web development" with mixed content
- **Challenge**: YouTube recommendations include both relevant (coding tutorials) and borderline relevant (tech news, gadget reviews) content
- **Baseline Expected**: User must manually distinguish between tutorials and tech news
- **Solution Expected**: Semantic understanding filters out non-tutorial content based on topic matching

### Evaluation Procedure

1. **For each case:**
   - Clear browser cookies/cache to reset YouTube recommendations
   - Set the stated goal in either baseline (mental note) or solution (extension)
   - Browse YouTube for exactly 10 minutes
   - Record every video clicked and whether it matches the goal
   - Calculate: (relevant videos / total videos) × 100

2. **Data Collection:**
   - Use a spreadsheet to track: Video Title, Channel, Goal Match (Yes/No), Duration Watched
   - For baseline: Manual classification by user
   - For solution: Extension classification (verify accuracy)

3. **Expected Results Summary:**

| Metric | Baseline | Solution | Expected Improvement |
|--------|----------|----------|-------------|
| Filtering mechanism | Manual willpower | Automated semantic filtering | Reduced cognitive load |
| Decision-making | Constant manual choices | Automatic filtering | Less time spent deciding |
| Focus persistence | Must re-establish each session | Persistent across sessions | Consistent focus |
| Cost per task | $0 | $0 | $0 |

### Reproducing the Results

To reproduce these results from a clean environment:

1. **Setup:**
   ```bash
   git clone <repository>
   cd youtube-blocker
   npm install
   npm run build
   ```

2. **Baseline Test:**
   - Open Chrome without extensions
   - Navigate to YouTube
   - Run evaluation cases 1-11
   - Record results in spreadsheet

3. **Solution Test:**
   - Load unpacked extension from `dist/`
   - Configure with goal for each case
   - Run evaluation cases 1-11
   - Record results in spreadsheet

4. **Analysis:**
   - Compare relevant content ratios
   - Calculate improvement percentage
   - Document any edge cases or false positives/negatives

### Expected Output

**Console Output (Extension):**
```
[FocusTube] Model loading: 0%
[FocusTube] Model loading: 25%
[FocusTube] Model loading: 50%
[FocusTube] Model loading: 75%
[FocusTube] Model loading: 100%
[FocusTube] Observer initialized on home page
[FocusTube] Processed 12 video cards
```

**Visual Output (YouTube):**
- Relevant videos: Normal display, no outline
- Blocked videos: Hidden (display: none) or dimmed with red outline (debug mode)
- Shorts shelf: Completely hidden
- Real-time updates: Instant filtering when topics change

**Spreadsheet Output:**
```
Case | Goal | Videos Analyzed | Filtered Correctly | Notes
-----|------|------------------|-------------------|------
1    | Programming | [record count] | [record count] | [observations]
2    | Cooking | [record count] | [record count] | [observations]
...
```

---

## Notes for Evaluators

- The embedding model loads on first use (~10-20s), subsequent classifications are instant
- Local inference means no external API calls for video classification (privacy-preserving)
- The "Fail-Open" architecture ensures users never get completely blocked if classification fails
- Users can manually select topics from the predefined parent/child hierarchy
