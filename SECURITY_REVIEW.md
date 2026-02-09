# Security Code Review: The Prompt Engineer's Toolkit

**Date:** 2026-02-09
**Scope:** Full codebase (`index.html`, `game.js`, `styles.css`, `prompts.json`)

## 1. Data Leaks (Passwords, API Keys, Secrets)

**No hardcoded secrets found.** The application contains no passwords, API keys, tokens, private keys, or credentials. There are no `.env` files, no external API calls, no authentication mechanisms, and no user data collection.

## 2. Cross-Site Scripting (XSS) Vulnerabilities

The code uses `.innerHTML` with unsanitized data in **5 locations**, all sourcing data from `prompts.json`. If the JSON file is tampered with (supply chain attack, compromised hosting, or MITM on HTTP), an attacker could inject arbitrary HTML/JavaScript.

| Location | Function | Sink | Data Source |
|---|---|---|---|
| `game.js:70` | `loadLevel()` | `targetTextEl.innerHTML = level.targetText` | `prompts.json` targetText |
| `game.js:108-111` | `createCardElement()` | `cardEl.innerHTML` with `card.text` and `card.technique` | `prompts.json` cards[] |
| `game.js:149-152` | `updateSelectedCards()` | `selectedCardEl.innerHTML` with `cardData.text` | Derived from card DOM |
| `game.js:290-293` | `submitAnswer()` | `explanationEl.innerHTML` with `level.explanation` | `prompts.json` explanation |
| `game.js:317` | `showGameComplete()` | `li.innerHTML` with `technique` | techniquesLearned Set |

**Severity:** Medium

**Recommendation:** Use `textContent` or DOM API methods instead of `innerHTML` wherever HTML rendering is not strictly required. For `targetText` (which uses bold markdown), use a sanitizer or build DOM nodes programmatically.

## 3. Inline Event Handler via String Interpolation

**`game.js:151`** constructs an inline `onclick` handler via innerHTML:

```js
onclick="removeSelectedCard(${index})"
```

While `index` is numeric and not directly exploitable, this pattern is incompatible with strict Content Security Policy and mixes HTML construction with event binding.

**Recommendation:** Use `addEventListener` instead of inline `onclick` attributes.

## 4. Missing Security Headers

The `index.html` does not include any security-related meta tags:

- No Content Security Policy (CSP)
- No X-Content-Type-Options

**Recommendation:** Add a CSP meta tag to restrict script execution:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'">
```

## 5. No Fetch Response Validation

`game.js:44-53` does not check `response.ok` before parsing the JSON response:

```js
const response = await fetch('prompts.json');
gameData = await response.json();
```

**Recommendation:** Add a status check before parsing:

```js
if (!response.ok) throw new Error(`HTTP ${response.status}`);
```

## 6. Informational: Math.random() Usage

`game.js:85` uses `Math.random()` for the Fisher-Yates shuffle. This is not cryptographically secure but is acceptable for a game context.

## Summary

| Finding | Severity |
|---|---|
| XSS via `.innerHTML` (5 locations) | Medium |
| Inline `onclick` via innerHTML | Low |
| No Content Security Policy | Low |
| No fetch response validation | Low |
| `Math.random()` for shuffle | Informational |
| **Hardcoded secrets / data leaks** | **None found** |
