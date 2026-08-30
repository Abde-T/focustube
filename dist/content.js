"use strict";
(() => {
  // src/content/videoExtractor.ts
  var SELECTORS = {
    // Video card containers
    videoCards: [
      "ytd-rich-item-renderer",
      // Home page grid items
      "ytd-video-renderer",
      // Search results
      "ytd-compact-video-renderer",
      // Sidebar recommendations
      "ytd-grid-video-renderer"
      // Channel page grid
    ],
    // Shorts-specific containers
    shortsCards: [
      "ytd-rich-section-renderer",
      // Shorts shelf section on home
      "ytd-reel-shelf-renderer",
      // Shorts shelf on home
      "ytd-reel-item-renderer"
      // Individual short in shelf
    ],
    // Metadata selectors within a video card
    title: [
      "#video-title",
      "a#video-title-link",
      "span#video-title",
      "h3 a"
    ],
    channel: [
      "#channel-name a",
      "ytd-channel-name a",
      "#channel-name #text",
      ".ytd-channel-name a",
      "yt-formatted-string#text"
    ],
    description: [
      "#description-text",
      "ytd-text-inline-expander yt-attributed-string",
      "#description-inner yt-attributed-string",
      "ytd-video-secondary-info-renderer #description"
    ],
    link: [
      "a#video-title-link",
      "a#thumbnail",
      "h3 a",
      "a.yt-simple-endpoint"
    ]
  };
  var ALL_VIDEO_CARD_SELECTORS = [
    ...SELECTORS.videoCards,
    ...SELECTORS.shortsCards
  ].join(", ");
  function extractVideoId(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      const vParam = urlObj.searchParams.get("v");
      if (vParam) return vParam;
      const shortsMatch = urlObj.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) return shortsMatch[1];
      const embedMatch = urlObj.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      if (embedMatch) return embedMatch[1];
      return null;
    } catch {
      return null;
    }
  }
  function queryFirst(parent, selectors) {
    for (const sel of selectors) {
      const el = parent.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function isShortElement(element) {
    const tag = element.tagName.toLowerCase();
    if (SELECTORS.shortsCards.some((sel) => tag === sel || element.matches(sel))) {
      return true;
    }
    const links = element.querySelectorAll("a[href]");
    for (const link of links) {
      const href = link.href || link.getAttribute("href") || "";
      if (href.includes("/shorts/")) return true;
    }
    return false;
  }
  function extractVideoMetadata(element) {
    const isShort = isShortElement(element);
    const titleEl = queryFirst(element, SELECTORS.title);
    const title = titleEl?.textContent?.trim() || titleEl?.getAttribute("title")?.trim() || "";
    const channelEl = queryFirst(element, SELECTORS.channel);
    const channel = channelEl?.textContent?.trim() || "";
    const descriptionEl = queryFirst(element, SELECTORS.description);
    const description = descriptionEl?.textContent?.trim() || "";
    const linkEl = queryFirst(element, SELECTORS.link);
    const href = linkEl?.getAttribute("href") || "";
    const fullUrl = href ? new URL(href, window.location.origin).href : "";
    const videoId = extractVideoId(fullUrl);
    if (isShort && !videoId) {
      return {
        videoId: `shorts-shelf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: title || "Shorts Shelf",
        channel: channel || "YouTube Shorts",
        url: fullUrl || window.location.href,
        isShort: true,
        element
      };
    }
    if (!videoId || !title) {
      return null;
    }
    return {
      videoId,
      title,
      channel,
      description,
      url: fullUrl,
      isShort,
      element
    };
  }
  function isVideoCard(element) {
    return element.matches(ALL_VIDEO_CARD_SELECTORS);
  }

  // src/data/topicHierarchy.ts
  var PARENT_TOPICS = {
    "tech": {
      label: "Tech",
      children: [
        "programming",
        "software engineering",
        "web development",
        "mobile development",
        "data science",
        "machine learning",
        "artificial intelligence",
        "cybersecurity",
        "devops",
        "cloud computing",
        "engineering",
        "mechanical engineering",
        "electrical engineering",
        "civil engineering"
      ]
    },
    "business": {
      label: "Business",
      children: [
        "entrepreneurship",
        "business",
        "marketing",
        "sales",
        "finance",
        "investing",
        "personal finance",
        "economics"
      ]
    },
    "science": {
      label: "Science",
      children: [
        "science",
        "physics",
        "chemistry",
        "biology",
        "astronomy",
        "environmental science",
        "mathematics",
        "calculus",
        "statistics",
        "algebra",
        "geometry"
      ]
    },
    "history": {
      label: "History",
      children: [
        "history",
        "world history",
        "ancient history",
        "modern history"
      ]
    },
    "languages": {
      label: "Languages",
      children: [
        "language learning",
        "english",
        "spanish",
        "french",
        "german",
        "japanese",
        "chinese",
        "korean"
      ]
    },
    "productivity": {
      label: "Productivity",
      children: [
        "productivity",
        "time management",
        "goal setting",
        "study skills",
        "personal development",
        "self improvement"
      ]
    },
    "design": {
      label: "Design",
      children: [
        "design",
        "graphic design",
        "ui design",
        "ux design",
        "photography",
        "video editing",
        "animation",
        "architecture",
        "interior design"
      ]
    },
    "health": {
      label: "Health",
      children: [
        "fitness",
        "mental health",
        "meditation",
        "mindfulness",
        "yoga",
        "nutrition",
        "medicine",
        "nursing"
      ]
    },
    "cooking": {
      label: "Cooking",
      children: [
        "cooking",
        "baking",
        "healthy eating",
        "meal prep"
      ]
    },
    "music": {
      label: "Music",
      children: [
        "music",
        "guitar",
        "piano",
        "music production",
        "songwriting"
      ]
    },
    "writing": {
      label: "Writing",
      children: [
        "writing",
        "creative writing",
        "journaling",
        "blogging"
      ]
    },
    "social_sciences": {
      label: "Social Sciences",
      children: [
        "philosophy",
        "psychology",
        "sociology",
        "political science",
        "law",
        "education",
        "teaching",
        "research"
      ]
    },
    "lifestyle": {
      label: "Lifestyle",
      children: [
        "gardening",
        "diy",
        "woodworking",
        "automotive",
        "travel",
        "geography",
        "cultures",
        "religion"
      ]
    }
  };
  function getChildTopics(parentTopicId) {
    const parent = PARENT_TOPICS[parentTopicId];
    return parent ? parent.children : [];
  }
  function isParentTopic(topicId) {
    return PARENT_TOPICS.hasOwnProperty(topicId);
  }
  function expandTopics(topics) {
    const expanded = [];
    for (const topic of topics) {
      if (isParentTopic(topic)) {
        expanded.push(...getChildTopics(topic));
      } else {
        expanded.push(topic);
      }
    }
    return [...new Set(expanded)];
  }

  // src/content/videoFilter.ts
  var CATEGORY_KEYWORDS = {
    entertainment: [
      "funny",
      "prank",
      "challenge",
      "try not to",
      "compilation",
      "fails",
      "tiktok",
      "meme",
      "memes",
      "viral",
      "cringe",
      "satisfying",
      "asmr",
      "mukbang",
      "unboxing",
      "vlog"
    ],
    celebrity: [
      "celebrity",
      "kardashian",
      "beyonce",
      "taylor swift",
      "drake",
      "kanye",
      "gossip",
      "red carpet",
      "paparazzi",
      "tmz",
      "hollywood",
      "famous"
    ],
    drama: [
      "drama",
      "beef",
      "exposed",
      "cancelled",
      "canceled",
      "tea",
      "response to",
      "claps back",
      "callout",
      "call out",
      "feud",
      "controversy",
      "scandal"
    ],
    reaction: [
      "reaction",
      "reacts to",
      "reacting to",
      "react",
      "first time watching",
      "first time hearing",
      "my reaction"
    ],
    gaming: [
      "gameplay",
      "gaming",
      "lets play",
      "let's play",
      "walkthrough",
      "playthrough",
      "fortnite",
      "minecraft",
      "roblox",
      "gta",
      "valorant",
      "league of legends",
      "apex legends",
      "call of duty",
      "elden ring",
      "twitch",
      "stream highlights",
      "speedrun"
    ]
  };
  var TOPIC_KEYWORDS = {
    "software engineering": [
      "software",
      "engineering",
      "developer",
      "development",
      "programming",
      "coding",
      "code",
      "coder",
      "dev",
      "api",
      "backend",
      "frontend",
      "full stack",
      "fullstack",
      "devops",
      "agile",
      "scrum",
      "git",
      "github",
      "debug",
      "refactor",
      "architecture",
      "microservices",
      "system design",
      "interview",
      "leetcode",
      "dsa",
      "algorithm",
      "data structure",
      "web dev",
      "app dev",
      "mobile dev",
      "computer science",
      "computer",
      "cs",
      "tech",
      "technology",
      "software engineer",
      "software development",
      "programming language",
      "javascript",
      "python",
      "java",
      "typescript",
      "react",
      "node",
      "database",
      "sql",
      "nosql",
      "cloud",
      "aws",
      "azure",
      "docker",
      "kubernetes",
      "linux",
      "operating system",
      "network",
      "security"
    ],
    "programming": [
      "programming",
      "coding",
      "code",
      "python",
      "javascript",
      "typescript",
      "java",
      "c++",
      "rust",
      "golang",
      "ruby",
      "php",
      "swift",
      "kotlin",
      "react",
      "angular",
      "vue",
      "node",
      "django",
      "flask",
      "spring",
      "tutorial",
      "course",
      "learn",
      "beginner",
      "advanced",
      "project",
      "build",
      "create",
      "develop",
      "compiler",
      "interpreter"
    ],
    "entrepreneurship": [
      "entrepreneur",
      "startup",
      "business",
      "founder",
      "ceo",
      "venture",
      "investment",
      "pitch",
      "saas",
      "revenue",
      "growth",
      "marketing",
      "hustle",
      "side project",
      "bootstrap",
      "fundraising",
      "vc",
      "product market fit",
      "mvp",
      "launch"
    ],
    "science": [
      "science",
      "physics",
      "chemistry",
      "biology",
      "research",
      "experiment",
      "scientific",
      "discovery",
      "nasa",
      "space",
      "quantum",
      "molecule",
      "evolution",
      "climate",
      "nature",
      "documentary",
      "lab"
    ],
    "history": [
      "history",
      "historical",
      "ancient",
      "medieval",
      "war",
      "empire",
      "civilization",
      "century",
      "archaeology",
      "museum",
      "documentary"
    ],
    "mathematics": [
      "math",
      "mathematics",
      "calculus",
      "algebra",
      "geometry",
      "statistics",
      "probability",
      "theorem",
      "proof",
      "equation",
      "linear algebra"
    ],
    "language learning": [
      "language",
      "learn",
      "spanish",
      "french",
      "german",
      "japanese",
      "chinese",
      "korean",
      "vocabulary",
      "grammar",
      "fluent",
      "polyglot",
      "duolingo",
      "immersion",
      "pronunciation"
    ],
    "productivity": [
      "productivity",
      "productive",
      "time management",
      "focus",
      "habit",
      "routine",
      "workflow",
      "notion",
      "obsidian",
      "organization",
      "efficiency",
      "goal setting",
      "deep work",
      "pomodoro"
    ],
    "personal finance": [
      "finance",
      "financial",
      "investing",
      "investment",
      "stock",
      "crypto",
      "budget",
      "money",
      "wealth",
      "savings",
      "retirement",
      "portfolio",
      "dividend",
      "index fund",
      "real estate"
    ],
    "design": [
      "design",
      "ui",
      "ux",
      "figma",
      "sketch",
      "adobe",
      "photoshop",
      "illustrator",
      "graphic",
      "typography",
      "color theory",
      "branding",
      "logo",
      "creative",
      "art",
      "illustration",
      "animation"
    ],
    "fitness": [
      "fitness",
      "workout",
      "exercise",
      "gym",
      "training",
      "muscle",
      "cardio",
      "strength",
      "nutrition",
      "diet",
      "health",
      "yoga",
      "running",
      "bodybuilding",
      "CrossFit",
      "wellness"
    ],
    "cooking": [
      "cooking",
      "recipe",
      "cook",
      "chef",
      "kitchen",
      "meal",
      "food",
      "baking",
      "nutrition",
      "healthy eating",
      "ingredient",
      "dish"
    ]
  };
  function topicKeywordRelevance(text, topic) {
    const keywords = TOPIC_KEYWORDS[topic.toLowerCase()];
    if (!keywords || keywords.length === 0) {
      return text.includes(topic.toLowerCase()) ? 0.6 : 0;
    }
    let matches = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        matches++;
      }
    }
    if (text.includes(topic.toLowerCase())) {
      matches += 3;
    }
    if (matches >= 3) return 0.8;
    if (matches >= 2) return 0.6;
    if (matches >= 1) return 0.4;
    return 0;
  }
  function matchBlockedCategory(text, blockedCategories, userGoals) {
    const expandedGoals = expandTopics(userGoals);
    for (const goal of expandedGoals) {
      const goalKeywords = TOPIC_KEYWORDS[goal.toLowerCase()];
      if (goalKeywords) {
        for (const keyword of goalKeywords) {
          if (text.includes(keyword)) {
            return null;
          }
        }
      }
    }
    for (const category of blockedCategories) {
      const keywords = CATEGORY_KEYWORDS[category.toLowerCase()];
      if (!keywords) continue;
      let matches = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          matches++;
          if (matches >= 2) {
            return category;
          }
        }
      }
    }
    return null;
  }
  function applyLocalFilters(video, profile) {
    if (profile.filteringEnabled === false) {
      return {
        action: "allow",
        reason: "",
        confidence: 1,
        source: "local"
      };
    }
    if (profile.allowedChannels?.length) {
      const channelLower = video.channel.toLowerCase();
      const isAllowed = profile.allowedChannels.some(
        (allowed) => channelLower.includes(allowed.toLowerCase())
      );
      if (isAllowed) {
        return {
          action: "allow",
          reason: `Allowed channel: ${video.channel}`,
          confidence: 1,
          source: "local"
        };
      }
    }
    if (video.isShort) {
      if (profile.blockShorts) {
        return {
          action: "block",
          reason: "YouTube Short",
          confidence: 1,
          source: "local"
        };
      }
      if (video.videoId.startsWith("shorts-shelf-")) {
        return {
          action: "allow",
          reason: "Shorts shelf wrapper",
          confidence: 1,
          source: "local"
        };
      }
    }
    const focusActive = profile.goals?.length === 1 && profile.blockedDisplayMode === "hide";
    if (focusActive) {
      const combined = `${video.title.toLowerCase()} ${video.channel.toLowerCase()}`;
      const focusTopic = profile.goals[0];
      const relevance = topicKeywordRelevance(combined, focusTopic);
      if (relevance >= 0.4) {
        return {
          action: "allow",
          reason: `Matches focus topic: ${focusTopic} (keyword relevance ${Math.round(relevance * 100)}%)`,
          confidence: relevance,
          source: "local"
        };
      }
      return {
        action: "uncertain",
        reason: "Focus Mode: requires AI classification",
        confidence: 0,
        source: "local"
      };
    }
    if (profile.blockedChannels?.length) {
      const channelLower = video.channel.toLowerCase();
      const blockedChannel = profile.blockedChannels.find(
        (blocked) => channelLower.includes(blocked.toLowerCase())
      );
      if (blockedChannel) {
        return {
          action: "block",
          reason: `Blocked channel: ${blockedChannel}`,
          confidence: 1,
          source: "local"
        };
      }
    }
    if (profile.blockedKeywords?.length) {
      const titleLower = video.title.toLowerCase();
      const matchedKeyword = profile.blockedKeywords.find(
        (keyword) => titleLower.includes(keyword.toLowerCase())
      );
      if (matchedKeyword) {
        return {
          action: "block",
          reason: `Blocked keyword: "${matchedKeyword}"`,
          confidence: 1,
          source: "local"
        };
      }
    }
    if (profile.blockedCategories?.length) {
      const combined = `${video.title.toLowerCase()} ${video.channel.toLowerCase()}`;
      const matchedCategory = matchBlockedCategory(combined, profile.blockedCategories, profile.goals);
      if (matchedCategory) {
        return {
          action: "block",
          reason: `Category: ${matchedCategory}`,
          confidence: 0.85,
          source: "local",
          categories: [matchedCategory]
        };
      }
    }
    return {
      action: "uncertain",
      reason: "Requires AI classification",
      confidence: 0,
      source: "local"
    };
  }

  // src/content/uiModifier.ts
  var PREFIX = "focustube";
  var originalDisplays = /* @__PURE__ */ new WeakMap();
  var debugMode = true;
  function setDebugMode(enabled) {
    debugMode = enabled;
  }
  function injectStyles() {
    if (document.getElementById(`${PREFIX}-styles`)) return;
    const style = document.createElement("style");
    style.id = `${PREFIX}-styles`;
    style.textContent = `
    .${PREFIX}-blocked {
      display: none !important;
      pointer-events: none !important;
    }

    .${PREFIX}-debug-blocked {
      position: relative;
      opacity: 0.3;
      outline: 2px solid #ff4444 !important;
      outline-offset: -2px;
      border-radius: 8px;
      overflow: visible;
      pointer-events: none !important;
    }

    .${PREFIX}-uncertain {
      position: relative;
      opacity: 0.7;
      outline: 2px solid #ffaa00 !important;
      outline-offset: -2px;
      border-radius: 8px;
    }

    .${PREFIX}-badge {
      position: absolute;
      top: 4px;
      left: 4px;
      z-index: 9999;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.3;
      pointer-events: none;
      white-space: pre-line;
      max-width: 90%;
    }

    .${PREFIX}-badge--blocked {
      background: rgba(255, 68, 68, 0.95);
      color: white;
    }

    .${PREFIX}-badge--uncertain {
      background: rgba(255, 170, 0, 0.95);
      color: #1a1a1a;
    }

    .${PREFIX}-badge--allowed {
      background: rgba(68, 187, 68, 0.85);
      color: white;
    }

    /* Inline Confirm styles */
    .${PREFIX}-inline-confirm {
      position: absolute;
      inset: 0;
      z-index: 99999;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
      padding: 16px;
      text-align: center;
      border-radius: inherit;
    }
    .${PREFIX}-inline-confirm p { font-size: 13px; margin: 0 0 12px; font-weight: 600; line-height: 1.4; color: #fff; }
    .${PREFIX}-inline-confirm label { font-size: 11px; display: flex; align-items: center; gap: 6px; margin-bottom: 12px; cursor: pointer; color: #ccc; }
    .${PREFIX}-inline-actions { display: flex; gap: 8px; }
    .${PREFIX}-inline-actions button { padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px; }
    .${PREFIX}-btn-cancel { background: #334; color: #fff; }
    .${PREFIX}-btn-watch { background: #ffaa00; color: #000; }
  `;
    document.head.appendChild(style);
  }
  function setShortsBlocking(enabled) {
    const SHORTS_STYLE_ID = `${PREFIX}-shorts-global`;
    const existing = document.getElementById(SHORTS_STYLE_ID);
    if (enabled && !existing) {
      const style = document.createElement("style");
      style.id = SHORTS_STYLE_ID;
      style.textContent = `
      /* Global Shorts blocking \u2014 hides all known Shorts containers */

      /* Shorts shelves (home page and search) */
      ytd-reel-shelf-renderer,
      ytd-rich-shelf-renderer[is-shorts],
      ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
      ytd-rich-section-renderer:has(ytd-reel-shelf-renderer),

      /* Individual Shorts items (old and new renderers) */
      ytd-reel-item-renderer,
      yt-shorts-lockup-view-model,

      /* Any video card containing a /shorts/ link */
      ytd-video-renderer:has(a[href*="/shorts/"]),
      ytd-grid-video-renderer:has(a[href*="/shorts/"]),
      ytd-rich-item-renderer:has(a[href*="/shorts/"]),
      ytd-compact-video-renderer:has(a[href*="/shorts/"]),

      /* Elements with Shorts-specific class names (newer YouTube UI) */
      [class*="shortsLockupViewModelHost"],

      /* Sidebar/navigation Shorts entry */
      ytd-guide-entry-renderer:has(a[title="Shorts"]),
      ytd-mini-guide-entry-renderer:has(a[title="Shorts"]) {
        display: none !important;
      }
    `;
      document.head.appendChild(style);
    } else if (!enabled && existing) {
      existing.remove();
    }
  }
  function applyFilterResult(video, result, profile) {
    const el = video.element;
    if (profile.filteringEnabled === false) {
      cleanElement(el);
      return;
    }
    if (!originalDisplays.has(el)) {
      originalDisplays.set(el, el.style.display);
    }
    cleanElement(el);
    switch (result.action) {
      case "block":
        applyBlock(el, result, video, profile);
        break;
      case "uncertain":
        applyUncertain(el, result);
        break;
      case "allow":
        if (debugMode) {
          applyAllowDebug(el, result);
        }
        break;
    }
  }
  function applyBlock(el, result, video, profile) {
    if (video.isShort) {
      el.classList.add(`${PREFIX}-blocked`);
      return;
    }
    const hideCompletely = profile.blockedDisplayMode === "hide";
    if (!debugMode || hideCompletely) {
      el.classList.add(`${PREFIX}-blocked`);
    } else {
      el.classList.add(`${PREFIX}-debug-blocked`);
      const text = [
        "BLOCKED",
        `Reason: ${result.reason}`,
        result.source === "ai" ? `Confidence: ${Math.round(result.confidence * 100)}%` : ""
      ].filter(Boolean).join("\n");
      addBadge(el, "blocked", text);
    }
  }
  function applyUncertain(el, result) {
    el.classList.add(`${PREFIX}-uncertain`);
    if (debugMode) {
      const text = result.explanation ? `UNCERTAIN

${result.explanation}` : `UNCERTAIN
${result.reason}`;
      addBadge(el, "uncertain", text);
    }
    el.__focustube_explanation = result.explanation || result.reason;
    el.__focustube_categories = result.categories || [];
    el.addEventListener("click", handleUncertainClick, true);
  }
  function applyAllowDebug(el, result) {
    addBadge(el, "allowed", `ALLOWED
${result.reason}`);
  }
  function addBadge(el, type, text) {
    const badge = document.createElement("div");
    badge.className = `${PREFIX}-badge ${PREFIX}-badge--${type}`;
    badge.textContent = text;
    badge.dataset.focustube = "badge";
    const computed = window.getComputedStyle(el);
    if (computed.position === "static") {
      el.style.position = "relative";
    }
    el.appendChild(badge);
  }
  function cleanElement(el) {
    el.classList.remove(
      `${PREFIX}-blocked`,
      `${PREFIX}-debug-blocked`,
      `${PREFIX}-uncertain`
    );
    el.querySelectorAll(`[data-focustube="badge"]`).forEach(
      (badge) => badge.remove()
    );
    const original = originalDisplays.get(el);
    if (original !== void 0) {
      el.style.display = original;
    }
  }
  async function handleUncertainClick(e) {
    const target = e.currentTarget;
    if (e.target.closest(`.${PREFIX}-inline-confirm`)) {
      return;
    }
    let videoUrl = "";
    const links = target.querySelectorAll("a#video-title-link, a#thumbnail, a.yt-simple-endpoint");
    for (const link of links) {
      if (link.hasAttribute("href")) {
        videoUrl = link.href;
        if (videoUrl.includes("/watch") || videoUrl.includes("/shorts")) {
          break;
        }
      }
    }
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_PROFILE" });
      const profile = response?.profile;
      const requireConfirm = profile?.requireUncertainConfirmation ?? true;
      if (!requireConfirm) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      target.dataset.focustubeExplanation = e.currentTarget instanceof HTMLElement && e.currentTarget.__focustube_explanation ? e.currentTarget.__focustube_explanation : "";
      target.dataset.focustubeCategories = e.currentTarget instanceof HTMLElement && e.currentTarget.__focustube_categories ? JSON.stringify(e.currentTarget.__focustube_categories) : "[]";
      let vidId = "";
      const metadataLink = target.querySelector("a#video-title-link, a#thumbnail");
      if (metadataLink && metadataLink.href) {
        const u = new URL(metadataLink.href, window.location.origin);
        vidId = u.searchParams.get("v") || "";
      }
      target.dataset.focustubeVideoId = vidId;
      showInlineConfirm(target, videoUrl, profile);
    } catch {
    }
  }
  function showInlineConfirm(target, videoUrl, profile) {
    if (target.querySelector(`.${PREFIX}-inline-confirm`)) return;
    const overlay = document.createElement("div");
    overlay.className = `${PREFIX}-inline-confirm`;
    overlay.dataset.focustube = "inline-confirm";
    const explanation = target.dataset.focustubeExplanation || "Are you sure you want to watch this uncertain video?";
    const lines = explanation.split("\n").map((l) => l.trim()).filter(Boolean);
    const formattedExplanation = lines.length > 1 ? lines.map((line, i) => `<p style="margin: 2px 0; font-size: ${i < lines.length - 1 ? "11px" : "13px"}; color: ${i < lines.length - 1 ? "#aaa" : "#fff"}">${line}</p>`).join("") : `<p>${explanation}</p>`;
    overlay.innerHTML = `
    <div style="margin-bottom: 12px;">${formattedExplanation}</div>
    <label>
      <input type="checkbox" id="${PREFIX}-dont-ask-${Date.now()}" />
      Don't ask again
    </label>
    <div class="${PREFIX}-inline-actions">
      <button class="${PREFIX}-btn-cancel">Cancel</button>
      <button class="${PREFIX}-btn-watch">Watch</button>
    </div>
  `;
    const computed = window.getComputedStyle(target);
    if (computed.position === "static") {
      target.style.position = "relative";
    }
    target.appendChild(overlay);
    const btnCancel = overlay.querySelector(`.${PREFIX}-btn-cancel`);
    const btnWatch = overlay.querySelector(`.${PREFIX}-btn-watch`);
    const dontAskCheckbox = overlay.querySelector('input[type="checkbox"]');
    btnCancel.addEventListener("click", (e) => {
      e.stopPropagation();
      overlay.remove();
    });
    btnWatch.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (dontAskCheckbox.checked && profile) {
        profile.requireUncertainConfirmation = false;
        await chrome.runtime.sendMessage({ type: "UPDATE_PROFILE", profile });
      }
      try {
        const topics = JSON.parse(target.dataset.focustubeCategories || "[]");
        const videoId = target.dataset.focustubeVideoId || "";
        if (videoId && topics.length > 0) {
          chrome.runtime.sendMessage({
            type: "RECORD_DECISION",
            videoId,
            topics,
            decision: "allow"
          });
        }
      } catch (err) {
        console.warn("Failed to record decision", err);
      }
      overlay.remove();
      if (videoUrl) {
        window.location.href = videoUrl;
      }
    });
  }
  function restoreAll() {
    document.querySelectorAll(`.${PREFIX}-blocked, .${PREFIX}-debug-blocked, .${PREFIX}-uncertain`).forEach((el) => {
      el.removeEventListener("click", handleUncertainClick, true);
      cleanElement(el);
    });
    document.querySelectorAll(`[data-focustube="badge"], [data-focustube="inline-confirm"]`).forEach((el) => el.remove());
  }

  // src/content/youtubeObserver.ts
  var processedVideos = /* @__PURE__ */ new Set();
  var processedElements = /* @__PURE__ */ new WeakSet();
  var isPaused = false;
  var observer = null;
  var batchTimer = null;
  var pendingElements = [];
  var userProfile = null;
  var videoElementMap = /* @__PURE__ */ new Map();
  function initializeObserver(profile) {
    userProfile = profile;
    injectStyles();
    setShortsBlocking(profile.blockShorts);
    processExistingCards();
    startObserver();
    listenForNavigation();
    listenForProfileChanges();
  }
  function processExistingCards() {
    const cards = document.querySelectorAll(ALL_VIDEO_CARD_SELECTORS);
    cards.forEach((card) => {
      if (!processedElements.has(card)) {
        scheduleProcessing(card);
      }
    });
  }
  function scheduleProcessing(element) {
    if (processedElements.has(element)) return;
    pendingElements.push(element);
    if (batchTimer !== null) {
      clearTimeout(batchTimer);
    }
    batchTimer = window.setTimeout(() => {
      processBatch();
      batchTimer = null;
    }, 100);
  }
  function processBatch() {
    if (!userProfile) return;
    const elements = pendingElements.splice(0);
    isPaused = true;
    for (const element of elements) {
      if (processedElements.has(element)) continue;
      processVideoCard(element);
    }
    isPaused = false;
  }
  function processVideoCard(element) {
    if (!userProfile) return;
    processedElements.add(element);
    const metadata = extractVideoMetadata(element);
    if (!metadata) return;
    if (processedVideos.has(metadata.videoId)) return;
    processedVideos.add(metadata.videoId);
    videoElementMap.set(metadata.videoId, element);
    const localResult = applyLocalFilters(metadata, userProfile);
    if (localResult.action !== "uncertain") {
      applyFilterResult(metadata, localResult, userProfile);
      logResult(metadata, localResult);
      sendStatUpdate(localResult.action);
      return;
    }
    requestClassification(metadata);
  }
  function requestClassification(video) {
    const serializable = {
      videoId: video.videoId,
      title: video.title,
      channel: video.channel,
      description: video.description,
      url: video.url,
      isShort: video.isShort
    };
    chrome.runtime.sendMessage(
      {
        type: "CLASSIFY_VIDEO",
        video: serializable,
        userProfile
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.warn(
            "[FocusTube] Classification request failed:",
            chrome.runtime.lastError.message
          );
          return;
        }
        if (response?.result) {
          handleClassificationResponse(video, response);
        }
      }
    );
  }
  function handleClassificationResponse(video, response) {
    const result = {
      action: response.result.action,
      reason: response.result.reason,
      confidence: response.result.confidence,
      source: response.cached ? "cache" : "ai",
      categories: response.result.categories
    };
    const isFocusMode = userProfile?.goals?.length === 1 && userProfile?.blockedDisplayMode === "hide";
    if (isFocusMode) {
      if (result.action === "uncertain") {
        result.action = "block";
        result.reason = `Focus Mode: ${result.reason}`;
      }
    }
    isPaused = true;
    applyFilterResult(video, result, userProfile);
    isPaused = false;
    logResult(video, result);
    sendStatUpdate(result.action);
  }
  function startObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver((mutations) => {
      if (isPaused) return;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (isVideoCard(node) && !processedElements.has(node)) {
            scheduleProcessing(node);
            continue;
          }
          const cards = node.querySelectorAll(ALL_VIDEO_CARD_SELECTORS);
          cards.forEach((card) => {
            if (!processedElements.has(card)) {
              scheduleProcessing(card);
            }
          });
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  function listenForNavigation() {
    document.addEventListener("yt-navigate-finish", () => {
      setTimeout(processExistingCards, 500);
    });
  }
  function listenForProfileChanges() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "PROFILE_CHANGED") {
        chrome.runtime.sendMessage({ type: "GET_PROFILE" }, (response) => {
          if (response?.profile) {
            const profile = response.profile;
            chrome.runtime.sendMessage({ type: "GET_FOCUS_MODE" }, (focusRes) => {
              if (focusRes?.state?.active) {
                profile.blockShorts = true;
                profile.blockedDisplayMode = "hide";
                profile.goals = [focusRes.state.topic];
              }
              userProfile = profile;
              setShortsBlocking(profile.blockShorts);
              processedVideos.clear();
              processedElements = /* @__PURE__ */ new WeakSet();
              videoElementMap.clear();
              restoreAll();
              processExistingCards();
            });
          }
        });
      }
    });
  }
  function logResult(video, result) {
    const icon = result.action === "block" ? "\u{1F6AB}" : result.action === "allow" ? "\u2705" : "\u2753";
    console.log(`[FocusTube] ${icon} ${video.title.slice(0, 50)}...`, {
      action: result.action,
      reason: result.reason,
      confidence: result.confidence,
      source: result.source
    });
  }
  function sendStatUpdate(action) {
    chrome.runtime.sendMessage({ type: "UPDATE_STATS", action }).catch(() => {
    });
  }

  // src/content/index.ts
  var DEFAULT_PROFILE = {
    goals: ["software engineering", "programming"],
    blockedCategories: ["entertainment", "celebrity", "drama", "reaction", "gaming"],
    blockShorts: true
  };
  async function initialize() {
    try {
      const debugConfig = await chrome.runtime.sendMessage({ type: "GET_DEBUG" });
      if (debugConfig) {
        setDebugMode(debugConfig.enabled);
      }
    } catch {
      setDebugMode(true);
    }
    let profile;
    try {
      const response = await chrome.runtime.sendMessage({ type: "GET_PROFILE" });
      profile = response?.profile || DEFAULT_PROFILE;
      const focusRes = await chrome.runtime.sendMessage({ type: "GET_FOCUS_MODE" });
      if (focusRes?.state?.active) {
        profile.blockShorts = true;
        profile.blockedDisplayMode = "hide";
        profile.goals = [focusRes.state.topic];
      }
    } catch {
      profile = DEFAULT_PROFILE;
    }
    if (profile.blockShorts) {
      redirectShortsUrl();
    }
    if (document.body) {
      initializeObserver(profile);
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        initializeObserver(profile);
      });
    }
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "DEBUG_CHANGED") {
        setDebugMode(message.enabled);
      }
    });
    if (profile.blockShorts) {
      document.addEventListener("yt-navigate-finish", () => {
        redirectShortsUrl();
      });
    }
  }
  function redirectShortsUrl() {
    const url = window.location.href;
    const match = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const videoId = match[1];
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      window.location.replace(watchUrl);
    }
  }
  initialize().catch((err) => {
    console.error("[FocusTube] Failed to initialize:", err);
  });
})();
//# sourceMappingURL=content.js.map
