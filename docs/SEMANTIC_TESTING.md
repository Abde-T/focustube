# Semantic Relevance Testing Guide

This guide provides representative examples to test the improved semantic relevance system.

## Test Setup

1. Reload the extension in Chrome
2. Set your goals to: `software engineering`, `programming`
3. Set relevance threshold to: `30%` (default)
4. Enable debug mode to see classification badges

---

## Test Cases

### 1. Clearly Relevant Videos

**Expected:** Should be ALLOWED with Strong or Moderate similarity

#### Test: "React Server Components Explained"
- **Expected Result:** ALLOWED
- **Expected Similarity:** Strong (≥0.7) or Moderate (≥0.5)
- **Reason:** Direct match to software engineering/programming topics

#### Test: "How to Build a REST API"
- **Expected Result:** ALLOWED
- **Expected Similarity:** Strong or Moderate
- **Reason:** Core software engineering concept

#### Test: "TypeScript Generics Deep Dive"
- **Expected Result:** ALLOWED
- **Expected Similarity:** Strong or Moderate
- **Reason:** Programming language feature

#### Test: "How I Built My SaaS"
- **Expected Result:** ALLOWED
- **Expected Similarity:** Strong or Moderate
- **Reason:** Software development + entrepreneurship overlap

---

### 2. Ambiguous Videos

**Expected:** May be ALLOWED or BLOCKED depending on threshold, should show Weak similarity

#### Test: "Coding is Easy"
- **Expected Result:** ALLOWED (if threshold ≤30%) or BLOCKED (if higher)
- **Expected Similarity:** Weak (≥0.3)
- **Reason:** Short phrase, semantic match should recognize "coding" as programming-related

#### Test: "How I Stay Productive"
- **Expected Result:** BLOCKED (unless productivity is a goal)
- **Expected Similarity:** Weak or Very weak
- **Reason:** Productivity is tangentially related but not directly programming

#### Test: "Things I Learned Building a Company"
- **Expected Result:** BLOCKED (unless entrepreneurship is a goal)
- **Expected Similarity:** Weak
- **Reason:** Business-focused, not technical

#### Test: "The Future of Technology"
- **Expected Result:** BLOCKED
- **Expected Similarity:** Weak or Very weak
- **Reason:** Too broad, not specifically about programming

---

### 3. Clearly Unrelated Videos

**Expected:** Should be BLOCKED with Very weak similarity

#### Test: "Top 10 Football Moments"
- **Expected Result:** BLOCKED
- **Expected Similarity:** Very weak (<0.3)
- **Reason:** Sports content, no semantic overlap

#### Test: "Celebrity Drama"
- **Expected Result:** BLOCKED
- **Expected Similarity:** Very weak
- **Reason:** Entertainment content

#### Test: "Funny Cat Compilation"
- **Expected Result:** BLOCKED
- **Expected Similarity:** Very weak
- **Reason:** Entertainment content

#### Test: "Best Gaming Moments"
- **Expected Result:** BLOCKED
- **Expected Similarity:** Very weak
- **Reason:** Gaming content (unless gaming is a goal)

---

## User Intent Matching Test

Test the AI Topic Generator with natural language descriptions:

### Test 1: "I want to learn programming"
**Expected High Relevance:**
- Programming
- Software Engineering
- Web Development

**Expected Low Relevance:**
- Gaming
- Entertainment
- Sports

### Test 2: "I want to build SaaS products"
**Expected High Relevance:**
- Entrepreneurship
- Software Engineering
- Business

**Expected Low Relevance:**
- Entertainment
- Sports
- Cooking

---

## Verification Steps

For each test video:

1. **Check the badge** (debug mode):
   - Green badge with "ALLOWED" + similarity label
   - Red badge with "BLOCKED" + similarity label

2. **Check the explanation** (click on blocked/uncertain videos):
   - Should show topic relevance scores
   - Should show descriptive labels (Strong/Moderate/Weak/Very weak)

3. **Check console logs**:
   - Open DevTools (F12)
   - Look for `[FocusTube] Semantic matches:` logs
   - Verify scores are reasonable

---

## Debugging

If results are unexpected:

1. **Check cache stats** in console:
   ```javascript
   // In DevTools console, after loading the extension
   chrome.runtime.sendMessage({type: 'GET_CACHE_STATS'})
   ```

2. **Check model loading**:
   - Look for model initialization logs
   - Verify `all-MiniLM-L6-v2` is being used

3. **Check topic profiles**:
   - Verify semantic profiles are loaded
   - Check that prototypes are being used

---

## Expected Improvements

Compared to the old system:

1. **"Coding is Easy"** should now score higher (Weak instead of Very weak)
2. **"How to reach your potential as a programmer"** should score higher (Weak or Moderate)
3. **"Computer science in the AI era"** should score higher (Moderate)
4. Similarity labels should be descriptive (Strong/Moderate/Weak) not percentages
5. Explanations should show actual topic scores with labels

---

## Threshold Calibration

If results are too strict or too lenient:

1. Adjust the relevance threshold in settings
2. Current thresholds in `relevanceThresholds.ts`:
   - Strong: 0.7
   - Moderate: 0.5
   - Weak: 0.3
   - Default video threshold: 0.3

3. Report which videos are incorrectly classified for fine-tuning
