# Agent.md — FocusTube

## 1. Project Overview

**FocusTube** is a Chrome extension that uses AI to intelligently filter YouTube content according to the user's goals and preferences.

Instead of relying only on keywords or channel blocklists, the extension analyzes video metadata such as:

* Title
* Channel name
* Description
* YouTube content type
* URL
* Duration when available

The system determines whether a video is relevant to the user's current goals and either:

* Allows it
* Hides it
* Marks it as uncertain
* Explains why it was filtered

The goal is to reduce algorithmic distraction while preserving useful YouTube content.

---

## 2. Core User Experience

The user defines a goal such as:

> "I want to use YouTube mainly to learn programming and entrepreneurship. I don't want entertainment, celebrity content, drama, or Shorts."

The extension converts this into a filtering profile.

Example:

```text
Primary goals:
- Programming
- Software engineering
- Entrepreneurship

Prefer:
- Tutorials
- Educational content
- Technical discussions
- Long-form explanations

Avoid:
- Shorts
- Celebrity content
- Drama
- Reaction videos
- Gaming
- Entertainment
```

When YouTube displays videos, the extension evaluates them against this profile.

---

## 3. Filtering Pipeline

```text
YouTube
   ↓
Content Script
   ↓
Detect video cards
   ↓
Extract metadata
   ↓
Local deterministic filters
   ↓
Cached classification?
   ├── YES → use cached result
   │
   └── NO
        ↓
   AI classifier
        ↓
   Classification
        ↓
   Cache result
        ↓
   Modify YouTube UI
```

The extension MUST NOT send every video to the AI API unnecessarily.

---

## 4. Local Filtering

Before using AI, perform inexpensive deterministic checks.

Examples:

### Shorts

Detect:

* `/shorts/` URLs
* YouTube Shorts UI elements

If the user blocks Shorts:

```text
action = "block"
reason = "YouTube Short"
```

### Explicit user blocklists

Support:

* blocked keywords
* blocked channels
* allowed channels
* blocked content types

These should be evaluated before AI classification.

---

## 5. AI Classification

The AI receives metadata rather than the actual video.

Example input:

```json
{
  "video": {
    "title": "I Built a SaaS With React in 30 Days",
    "channel": "Example Developer",
    "description": "My experience building and launching a SaaS..."
  },
  "userProfile": {
    "goals": [
      "software engineering",
      "entrepreneurship"
    ],
    "preferredContent": [
      "tutorials",
      "technical discussions",
      "business case studies"
    ],
    "blockedContent": [
      "celebrity",
      "drama",
      "reaction videos",
      "gaming",
      "shorts"
    ]
  }
}
```

The AI should return structured JSON.

Example:

```json
{
  "action": "allow",
  "categories": [
    "software-engineering",
    "entrepreneurship"
  ],
  "relevance": 0.94,
  "confidence": 0.96,
  "reason": "The video discusses building and launching a SaaS using software engineering."
}
```

Possible actions:

```text
allow
block
uncertain
```

---

## 6. Important AI Rule

The AI should evaluate **relevance to the user's goals**, not whether the content is objectively good or bad.

For example:

User goal:

```text
Learn programming
```

Video:

```text
"10 Amazing Places to Visit in Japan"
```

The video may be high quality, but it should be classified as:

```text
block
```

because it does not serve the user's current goal.

---

## 7. Confidence Handling

Use confidence to avoid aggressive filtering.

Suggested behavior:

```text
confidence >= 0.80
    apply AI decision

confidence < 0.80
    mark as uncertain
```

Uncertain videos should not automatically disappear.

Instead, depending on the user's settings, they can:

* remain visible
* appear visually dimmed
* display an "AI uncertain" indicator

The user should always be able to override the decision.

---

## 8. Explainability

Every AI-filtered video should have an explanation available.

Example:

```text
Why was this hidden?

This video was classified as entertainment-focused
and has low relevance to your current goal of learning
software engineering.

Confidence: 89%
```

Do not expose chain-of-thought or internal reasoning.

Only provide a short user-facing explanation based on the classification.

---

## 9. Learning From User Feedback

Users can override classifications.

For example:

```text
Hidden video

[Show anyway]
```

or:

```text
Visible video

[Hide similar videos]
```

The extension should store these preferences locally.

Example:

```json
{
  "feedback": {
    "videoId": "abc123",
    "action": "allow",
    "categories": ["business"],
    "timestamp": 1756450000
  }
}
```

Future classifications can use these preferences.

---

## 10. Caching

AI classifications should be cached.

Cache key:

```text
videoId + profileVersion
```

Example:

```text
abc123:user-profile-v4
```

This prevents repeatedly classifying the same video.

Cache should preferably use browser storage.

Possible implementation:

```text
IndexedDB
```

or

```text
chrome.storage.local
```

depending on the data requirements.

---

## 11. Privacy

The extension should minimize data sent externally.

The AI service should receive only what is necessary for classification.

Do NOT send:

* browsing history
* cookies
* authentication tokens
* unrelated page content
* personal information

The extension should clearly tell users when video metadata is sent to an external AI service.

---

## 12. Architecture

Recommended architecture:

```text
Chrome Extension
│
├── Content Script
│   ├── Detect YouTube videos
│   ├── Extract metadata
│   ├── Hide/show cards
│   └── Display explanations
│
├── Background Service Worker
│   ├── AI requests
│   ├── Classification cache
│   └── Extension state
│
├── Popup
│   ├── Enable/disable filter
│   ├── Current goal
│   └── Quick settings
│
├── Options Page
│   ├── Goals
│   ├── Allowed categories
│   ├── Blocked categories
│   ├── Channels
│   └── AI settings
│
└── AI API
    └── LLM classification
```

---

## 13. AI Backend

For the MVP, use a small API endpoint rather than putting an API key directly into the extension.

```text
Extension
    ↓ HTTPS
/api/classify
    ↓
LLM provider
    ↓
Structured JSON
    ↓
Extension
```

The backend should be extremely small.

Its primary responsibility is:

1. Validate request
2. Construct classifier prompt
3. Call the LLM
4. Validate structured response
5. Return classification

The backend should NOT contain the main application logic.

---

## 14. MVP Scope

The first version should support:

### YouTube pages

* Home
* Search results
* Recommended videos
* Sidebar recommendations
* Watch-page recommendations

### Filtering

* Shorts
* Keywords
* Channels
* AI category classification
* User goals

### AI

* Video relevance classification
* Confidence
* Category
* Short explanation

### User controls

* Enable/disable filtering
* Configure goals
* Configure blocked categories
* Override individual videos

### Storage

Use browser-local storage.

---

## 15. Out of Scope for MVP

Do NOT initially build:

* Custom recommendation algorithms
* Video transcription
* Video downloading
* Full video analysis
* User accounts
* Social features
* Mobile applications
* Training a custom ML model
* Complex autonomous agents
* Automatic browser navigation
* Automated watching

The first objective is a reliable AI-powered filtering layer over YouTube.

---

## 16. Agentic Behavior

The project should gradually evolve beyond static classification.

The AI should eventually maintain a representation of the user's current objective.

Example:

```text
Current objective:
Prepare for software engineering interviews.

Prioritize:
- React
- TypeScript
- system design
- algorithms
- interview questions

Reduce:
- general programming news
- entertainment
- unrelated tutorials
```

The user can change the objective at any time.

The filtering system should adapt accordingly.

The agent's job is therefore:

```text
Understand user's goal
        ↓
Interpret content
        ↓
Compare content with goal
        ↓
Make filtering decision
        ↓
Learn from explicit feedback
        ↓
Adapt filtering profile
```

---

## 17. Technical Principles

1. **Performance first**

   * Never block YouTube while waiting for an AI response.
   * Avoid unnecessary API calls.

2. **Fail open**

   * If the AI service fails, videos should remain visible unless deterministic rules block them.

3. **Cache aggressively**

   * Never classify the same video repeatedly.

4. **AI should supplement deterministic logic**

   * Do not use an LLM for things that can be solved reliably with normal code.

5. **User remains in control**

   * Every AI decision can be overridden.

6. **No hidden tracking**

   * Keep user data local whenever possible.

7. **Structured AI output**

   * Never depend on parsing natural-language responses.

8. **YouTube DOM is unstable**

   * Keep YouTube-specific DOM selectors isolated in one module so they can be updated independently.

---

## 18. Success Criteria

The MVP is successful if a user can:

1. Install the extension.
2. Define what they want YouTube to help them accomplish.
3. Open YouTube normally.
4. Have irrelevant content automatically filtered.
5. See useful content remain available.
6. Understand why something was filtered.
7. Override incorrect decisions.
8. Change their goal and see the filtering behavior change.

The product should feel like:

> **"An AI layer between me and YouTube's recommendation algorithm."**

rather than:

> **"A keyword blocker for YouTube."**
