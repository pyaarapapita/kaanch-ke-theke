---
phase: redesign-premium-experience (4ab0cfa..1d3d3ad)
reviewed: 2026-11-13T00:00:00Z
depth: standard
files_reviewed: 35
files_reviewed_list:
  - .env.example
  - index.html
  - package.json
  - scripts/prerender.js
  - src/App.css
  - src/App.jsx
  - src/index.css
  - src/components/HomePageView.jsx
  - src/components/Home/Chapter.jsx
  - src/components/Home/ChapterRail.jsx
  - src/components/Home/Home.css
  - src/components/Home/MoodShelf.jsx
  - src/components/Home/ShayariWall.jsx
  - src/components/Home/homeContent.js
  - src/components/RewindGame/RewindGame.jsx
  - src/components/RewindGame/RewindGame.css
  - src/components/Experience/ExperienceCanvas.jsx
  - src/components/Experience/StudioEnvironment.jsx
  - src/components/Experience/VinylRig.jsx
  - src/components/Experience/sceneConfig.js
  - src/components/Experience/scrollTimeline.js
  - src/components/MusicalTimeMachine/MusicalTimeMachine.jsx
  - src/components/MusicalTimeMachine/MusicalTimeMachine.css
  - src/components/MusicalTimeMachine/timeMachineMoods.js
  - src/components/ThekaCounter/ThekaCounter.jsx
  - src/components/ThekaCounter/HandwrittenReceiptModal.jsx
  - src/components/ThekaCounter/ThekaLantern.jsx
  - src/components/VinylHero/VinylHero.css
  - src/data/playlists.js
  - src/hooks/useYouTubePlayer.js
  - src/pages/PlaylistDetailPage.jsx
  - src/pages/PlaylistsPage.jsx
  - src/utils/scenePulse.js
  - src/utils/thekaAudio.js
  - src/utils/youtubeMetadata.js
findings:
  critical: 2
  warning: 9
  info: 4
  total: 15
  necessity: 1
status: issues_found
---

# Redesign Commit 1d3d3ad: Code Review Report

**Reviewed:** 2026-11-13
**Depth:** standard (plus targeted cross-file checks: CSS rule diffing, asset references, stacking contexts)
**Files Reviewed:** 35
**Status:** issues_found

## Summary

Scope: `git diff 4ab0cfa..1d3d3ad` on `redesign/premium-experience`. The deleted components were checked for leftover imports: PlaylistsModal, BottleAndGlassScene, VintageRadio, VinylHeroCanvas, VinylScene and the removed thekaAudio exports. None remain. The deleted public assets were checked for references in `index.html`, `scripts/prerender.js` and `src`. No dangling references were found.

The CSS pass was checked mechanically:
- **Parsing:** every changed stylesheet was parsed with lightningcss and postcss. There were 0 warnings and braces are balanced.
- **Malformed values:** no `var(--var(...))`, double timing functions or other malformed `transition` values remain. All 41 distinct `transition` shapes that use `var(--ease-out)` are well formed.
- **Undefined custom properties:** the only one is `--radius-sm`, and it has a fallback.
- **Keyframes:** every `animation` name used has a matching `@keyframes`.
- **Removed rules:** old and new CSS were compared rule by rule. Of the 134 class names removed from CSS, none is referenced by live JSX, `scripts/prerender.js` or `index.html`. Two removed rules still had live markup: `.time-machine-vinyl-disc.is-settled` (WR-05) and `.theka-lantern-interactive:hover`. The second one is replaced by a scoped rule in Home.css.
- **Scroll anchors:** the anchors in `scrollTimeline.js` (`#chapter-counter`, `#chapter-shayari`, `#chapter-machine`, `#chapter-rewind`, `#chapter-moods`, `#chapter-story`) all match ids that `HomePageView` renders. `sceneConfig.js` defines a `rewind` pose for every layout, plus RIM and ROOM_AND_TAPES entries.

Main problems:
1. The receipt modal is now trapped inside a low stacking context, so later chapters, the header, the player and the chapter rail draw over it.
2. A real-looking 21st.dev API key is still in pushed git history. This commit only deletes it from the working file.
3. Several keyboard and screen-reader problems in the new interactive pieces: the RewindGame, the receipt modal, the ChapterRail and the ShayariWall.

No browser was available for a runtime check (Playwright is not installed). CR-01 rests on CSS stacking rules, not on a screenshot.

## Critical Issues

### CR-01: Receipt modal is drawn under later chapters, the header, the player and the chapter rail

**File:** `src/components/ThekaCounter/ThekaCounter.jsx:66`, `src/components/Home/Home.css:16-17`, `src/components/Home/Home.css:28-30`, `src/App.css:2286-2292`
**Issue:** `HandwrittenReceiptModal` renders its `position: fixed; z-index: 1000` backdrop in place, inside `#chapter-counter`. Two new rules trap it:
- `.chapter` is `position: relative; isolation: isolate`, so each chapter is its own stacking context at z-index auto.
- `.home-flow` is `position: relative; z-index: 10`.

So `z-index: 1000` only applies inside the first chapter. Stacking contexts at the same level paint in tree order, so `#chapter-shayari`, `#chapter-machine` and the rest paint on top of the modal wherever they are in the viewport. That includes their scrims, headings and buttons. These elements also sit above everything inside `.home-flow` (z 10):
- the fixed header (z 150)
- `.cinematic-player-wrapper` (z 120)
- `.chapter-rail` (z 110)
- `.story-progress` (z 155)

Clicks on any overlapping region go to that content, not to the backdrop. The About modal does not have this problem because App.jsx renders it outside `.home-flow`.
**Fix:** Portal the dialog to `document.body`:
```jsx
import { createPortal } from 'react-dom'
// ...
return createPortal(
  <AnimatePresence>
    {isOpen && (<div className="receipt-modal-backdrop" ...>...</div>)}
  </AnimatePresence>,
  document.body
)
```

### CR-02: 21st.dev API key is still in pushed git history; deleting it from the file does not revoke it

**File:** `.env.example` (removed lines 8-11; first added in `e9cc7b1`, which is on `origin/main`)
**Issue:** At 4ab0cfa, `.env.example` held a literal key: `API_KEY_21ST=21st_sk_c59e…2ce` (redacted here). This commit deletes the lines. The key is still readable in `e9cc7b1` and 4ab0cfa on `origin/main` and `origin/redesign/premium-experience`. Anyone with read access to the repo can recover it.
**Fix:** Revoke and rotate the key at 21st.dev now. The deletion alone is not a fix. If the repo is public or shared, also purge the key from history with `git filter-repo` or BFG and force-push, then tell collaborators to re-clone. Add a secret-scanning pre-commit hook, for example gitleaks.

## Warnings

### WR-01: RewindGame drops keyboard focus to `<body>` when the prompt and result swap

**File:** `src/components/RewindGame/RewindGame.jsx:293-338`, `:174-182`
**Issue:** The "पेंसिल नहीं है? बटन से लपेटें" button lives inside the `key="prompt"` motion.div.
- When the auto-rewind finishes, `AnimatePresence` unmounts that subtree, so the focused button disappears.
- Pressing "फिर से लपेटें ↺" unmounts the result subtree, so the same thing happens.

In both cases focus falls to `document.body`. A keyboard or screen-reader user is sent back to the top of the page with no context. The slider also sets `tabIndex=-1` and `aria-disabled` once done, so there is no obvious place to continue.
**Fix:** Move focus deliberately when the state changes. Use refs on the result heading or the play button, and on the slider:
```jsx
useEffect(() => { if (pickedSong) playButtonRef.current?.focus() }, [pickedSong])
// in handleReset, after scheduleFlush():
requestAnimationFrame(() => zoneRef.current?.focus())
```
Another option: keep both buttons outside the swapped `AnimatePresence` children.

### WR-02: `role="slider"` keys go against slider semantics; ArrowLeft and ArrowDown increase the value

**File:** `src/components/RewindGame/RewindGame.jsx:142-154`, `:261-268`
**Issue:** `turn()` adds `Math.abs(delta)` to progress, so ArrowLeft and ArrowDown raise `aria-valuenow` exactly like ArrowRight and ArrowUp. The ARIA slider pattern expects Left and Down to decrease the value. Screen readers announce "slider", so users will press Left to undo and see the value go up. `End` jumps to 100, but `Home`, `PageUp` and `PageDown` do nothing. The value can never go down by any input.
**Fix:** Choose one of these:
- Keep it a slider: map Left and Down to no-op or decrement, and support Home, PageUp and PageDown.
- Make it not a slider: use `role="button"` with an `aria-describedby` that explains "arrow keys wind the tape", and expose progress through a separate `role="progressbar"`.

### WR-03: Receipt modal moves focus in but never back out, and has no focus trap

**File:** `src/components/ThekaCounter/HandwrittenReceiptModal.jsx:22-33`, `:58`; trigger in `src/components/ThekaCounter/ThekaCounter.jsx`
**Issue:** This commit adds `autoFocus` on the close button and turns the trigger into `<button aria-haspopup="dialog">`. When the dialog closes (Esc, backdrop or close button), the focused node unmounts and focus falls to `<body>`. Focus does not return to the receipt trigger. While the dialog is open, Tab leaves it and walks the page behind it, even though `aria-modal="true"` is set.
**Fix:** Give the trigger a ref (`triggerRef`). In the modal effect, keep `document.activeElement` on open and restore it on close. Add a simple Tab and Shift+Tab trap inside `.theka-receipt-parchment`.

### WR-04: The mixtape shelf says "बज रही है" (playing) and "फिर से बजाएँ" (play again) before anything has played

**File:** `src/components/Home/MoodShelf.jsx:41`, `:57`
**Issue:** `isActive` is `mood.id === activePlaylistId`. `currentPlaylistId` starts as `DEFAULT_PLAYLIST_ID` (`src/App.jsx:77`). So on first load the 90s tape shows "बज रही है" and "फिर से बजाएँ" while the player is idle. It also shows them whenever playback is paused. Only the equalizer bars check `isPlaying`.
**Fix:**
```jsx
const isLive = isActive && isPlaying
{isLive ? 'बज रही है' : isActive ? 'चुनी हुई' : 'तैयार'}
...
{isLive ? 'फिर से बजाएँ' : 'बजाएँ'}
```

### WR-05: `.time-machine-vinyl-disc.is-settled` rule removed, but markup still sets the class

**File:** `src/components/MusicalTimeMachine/MusicalTimeMachine.jsx:116`, `src/components/MusicalTimeMachine/MusicalTimeMachine.css:104-106`, `:656-657`
**Issue:** The CSS pass deleted `.time-machine-vinyl-disc.is-settled { animation: turntableSpin 6s linear infinite; }`. The JSX still adds `is-settled` once a mood is chosen, and the reduced-motion block at line 657 still names it. After a pick, the turntable now freezes instead of turning slowly. This is a regression, not a deliberate cut: the class still exists in the JSX and in the reduced-motion override.
**Fix:** Restore the rule next to `.is-spinning`. If the freeze is intended, remove the class from the JSX and the selector from the media query.

### WR-06: Global `.editorial-action-link svg` rule in Home.css breaks the share button on `/playlists/:id`

**File:** `src/components/Home/Home.css:220-222`, `src/pages/PlaylistDetailPage.jsx:205-210`
**Issue:** Home.css loads on every route, because `HomePageView` is imported eagerly in App.jsx. Its `.editorial-action-link svg { margin-left: 0.5rem }` was written for trailing play icons. This commit gives the share button a leading link icon. That icon now gets an extra 0.5rem on its left, and nothing separates it from "लिंक साझा करें", because `.editorial-action-link` has no `gap`.
**Fix:** Scope the rule to the home flow, and add a gap to the base button:
```css
.home-flow .editorial-action-link svg { margin-left: 0.5rem; }
.cta-button, .editorial-action-link { gap: 0.5rem; }
```
With the gap in place, the margin rule can be dropped entirely.

### WR-07: ChapterRail scrolls but leaves keyboard focus in the rail

**File:** `src/components/Home/ChapterRail.jsx:55-60`
**Issue:** `handleJump` calls `scrollIntoView` and does not move focus. A keyboard user who picks "०४ रील लपेटो" sees the page scroll. Their next Tab still continues from the rail, and screen readers announce nothing. The rail works like a skip link and should behave like one.
**Fix:**
```js
target.setAttribute('tabindex', '-1')
target.scrollIntoView({ behavior, block: 'start' })
target.focus({ preventScroll: true })
```
Another option: focus the chapter's `h2` (`#${id}-title`) after giving it `tabIndex={-1}`.

### WR-08: Shayari position is hidden from assistive tech

**File:** `src/components/Home/ShayariWall.jsx:83-87`
**Issue:** `aria-label` is set on a plain `<span>` with no role. ARIA 1.2 prohibits naming generic elements, and most screen readers ignore it. All the visible children are `aria-hidden`, so "शेर 3, कुल 8" is never announced.
**Fix:** Drop the `aria-label` and the `aria-hidden` attributes, or add a visually hidden text node: `<span className="sr-only">शेर {index + 1}, कुल {total}</span>`. Also consider adding `aria-roledescription="slide"` and a label to each figure.

### WR-09: Already-defended-elsewhere: component focus styles are overridden by the new global `!important` rule

**File:** `src/App.css:389-393`; `src/components/RewindGame/RewindGame.css:145`, `:158-160`; `src/components/Home/Home.css:215-217`, `:384`
**Category:** necessity
**Issue:** This commit changed the global `:focus-visible` rule to `outline: 2px solid … !important; outline-offset: 3px !important; box-shadow: none !important`. As a result, these new declarations can never apply:
- `.rewind-zone { outline: none }` and the `.rewind-zone:focus-visible { box-shadow: 0 0 0 2px … }` ring
- `box-shadow: var(--focus-gold-glow)` in the Home.css focus group
- `.counter-lantern … outline-offset: 6px`, which is pinned back to 3px

The `!important` `box-shadow: none` also removes the paper shadow from `.desk-physical-receipt` and other shadowed controls while they are focused, so they visibly "lift off" on focus.
**Fix:** Choose one source of truth. Either drop `box-shadow: none !important` and `outline-offset … !important` from the global rule and keep the component rules, or delete the dead component declarations and the `--focus-gold-glow` token that now exists only to resolve to nothing.

## Info

### IN-01: Scene pulse freezes while the canvas is inactive and replays later

**File:** `src/components/Experience/ExperienceCanvas.jsx:41`, `:195-203`; `src/components/Experience/VinylRig.jsx:66-69`
**Issue:** `signal.pulse` only decays inside VinylRig's `useFrame`. FrameDriver returns early when `document.hidden` or `!isActiveRef.current`, for example on an inner route or during the entry video. If the user switches tabs or navigates within about 2.4 s of a pulse, the pulse is left at, say, 0.4. When they come back, the record does a delayed spin burst and halo flare that nothing on the page caused.
**Fix:** Keep the pulse timestamp, and in the frame loop compute `pulse = strength * exp(-PULSE_DECAY * (now - t0))`. Or clear `signal.pulse` when `isActive` turns false.

### IN-02: Static shell and prerendered pages now show an empty hamburger icon, which React then fills

**File:** `index.html:225`, `scripts/prerender.js:55`, `src/App.jsx:621`
**Issue:** The emoji removal emptied `.mobile-toggle-icon` in the static HTML. React still renders `☰` and `✕`. On mobile, the first paint shows a label-only button, and the icon pops in on hydration, which causes a small layout shift.
**Fix:** Use the same glyph or SVG in all three places. Or draw the icon with CSS (`::before`) so the markup can stay empty everywhere.

### IN-03: Label-in-name mismatch on the active mixtape button

**File:** `src/components/Home/MoodShelf.jsx:55-57`
**Issue:** The visible text is "फिर से बजाएँ", but the accessible name is "`<title>` बजाएँ" (WCAG 2.5.3). A voice-control command that says the visible text will not match.
**Fix:** Build the `aria-label` from the visible text: `` `${isLive ? 'फिर से बजाएँ' : 'बजाएँ'}: ${mood.title}` ``.

### IN-04: Auto-rewind ignores reduced motion, and the audio module comment no longer holds

**File:** `src/components/RewindGame/RewindGame.jsx:157-172`; `src/utils/thekaAudio.js:1-2`
**Issue:** "बटन से लपेटें" always runs a 1.8 s spinning animation, even when `prefers-reduced-motion` is set. `Chapter.jsx` respects that setting. Also, `playReelTick` is now called from `requestAnimationFrame` callbacks and drag moves. The header comment says "every call is made from a user gesture". On iOS Safari, an AudioContext first created outside a gesture stays suspended.
**Fix:** With `useReducedMotion()`, call `turn(TOTAL_ANGLE)` directly. In `handleAutoRewind` and `handlePointerDown`, call `getAudioContext()` or `resume()` synchronously, and correct the comment.

---

_Reviewed: 2026-11-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

---

## Resolution (2026-11-13)

Fixed in the follow-up commit on `redesign/premium-experience`:

- CR-01: the receipt renders into `document.body` through `createPortal`.
- WR-01: focus moves to the result's play button when the prompt is replaced, and to the reel after a reset.
- WR-02: only keys that raise a slider wind the tape (ArrowRight, ArrowUp, PageUp, End).
- WR-03: the receipt traps Tab and returns focus to its opener.
- WR-04, IN-03: "बज रही है" and "फिर से बजाएँ" only while the playlist is actually playing; the accessible name starts with the visible text.
- WR-05: the slow turntable spin is restored for a chosen mood (still off for reduced motion).
- WR-06: the button icon spacing rule is scoped to `.home-flow`.
- WR-07: the chapter rail moves focus to the chapter heading.
- WR-08: the shayari counter has visually hidden text for screen readers.
- WR-09: the global `:focus-visible` rule no longer forces `box-shadow: none` or the offset.
- IN-01: a pulse is ignored while the canvas is inactive or the tab is hidden.
- IN-02: the static shell and prerendered pages show the menu glyph again.
- IN-04: auto-rewind completes at once under reduced motion; the audio comment now matches the behaviour.

Also found while verifying: the longest sher was taller than the fixed stage on desktop, so the stage now sizes itself from invisible copies of every sher.

Not fixable in code:

- CR-02: the 21st.dev key in `e9cc7b1` is already on `origin/main`. It must be revoked in the 21st.dev account. Removing it from history needs a history rewrite and a force push, which the owner has to approve.

Verification: `npm run lint` and `npm run build` pass; 44 of 44 scripted interaction checks pass against the production build at 1440 px and 390 px; no horizontal overflow at 340, 390, 820 and 1440 px.
