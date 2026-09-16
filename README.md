# Fatbear cinematic creator story

Brief typographic entrance → Fat [film] Bear → standing-to-eye footage → the pupil opens onto a frameless glass post → tall floating profile → follower growth → audience outcome → centered profile → purchase-intent inbox → bio link → Passes landing page.

## Run locally

Requires Node.js 20.19+ (or a current supported LTS) and npm.

```sh
npm install
npm run dev -- --port 5173
```

Open http://127.0.0.1:5173 and scroll. The development server is local only. `npm run build` produces the static website in `dist/`; `npm run preview` serves that build.

## Approved media

`public/media/opening.mp4` is an untouched copy of `Fatbear-Standing-To-Eye-Faster-720p.mp4`: 7.583 seconds, 1280×720, 24fps, silent. It uses Clips 6 and 7, with the eye hold accelerated. The website scrubs 24fps WebP frames instead of seeking the MP4. Playback reaches the first fully black frame (zero-based 169); the trailing black hold is excluded from the scroll mapping.

The 182 extracted WebP files total approximately 8.4MB. Only a bounded subset is decoded at once: up to 24 frames on narrow screens or 40 on desktop, with up to three concurrent requests. Sparse anchors provide fallbacks for jumps. The original poster remains visible until a decoded frame is ready.

To regenerate the prototype media, install `ffmpeg`, `ffprobe`, and `cwebp`, then:

```sh
python3 scripts/prepare-media.py /absolute/path/to/matching-edit.mp4
```

The script preserves its source, generates the poster/avatar/frame sequence, and identifies the first terminal black frame. Its current export is intentionally 720p. A future 4K replacement should preserve this edit and use device-appropriate frame renditions; it should not indiscriminately send 4K frames to phones. If the shot framing changes, retune the measured focal points in `src/lib/math.mjs`.

`VITE_MEDIA_BASE` changes the runtime asset base (default `/media`). If moving all media to a CDN, update the poster preload in `index.html` as well.

## Motion and layout

A self-running opening plays on load with scrolling locked: the typographic mark, then `Fat [film] Bear`, then the media slot expands to the full viewport, about 1.4 seconds in all. It rests on the full-screen film with the footer ("A creator's world. Yours to build.", "Scroll to explore", "It starts with you.") and the brand still in place, set in light type once they are on the film; the first 0.35 viewport heights of scroll take them away while the film begins. A reload that restores a mid-story position skips the opening, and so does any real scroll while it plays; "Replay the story" returns to the top and runs it again. Narrative positions below are still measured in the original 29.7 viewport heights of travel; the master scroll timeline spans 28.62 of them because the expansion's 1.08 (`INTRO_TRAVEL`) belong to the opening. The film's 4.02 viewport heights of physical travel are preserved. The social story begins 0.2 viewport heights before the film's last frame. With WebGL (`src/lib/FilmRenderer.ts`) the film renders through a dissolve shader: over the 0.35 viewports before that (`src/lib/reveal-motion.mjs`) colour drains into the page's paper tone (`--page-background`) while Sobel edges draw the iris fibres in the story's ink, then the paper burns outward from the featured photograph's subject with a charcoal edge until the film has gone; the story beneath shares that paper, so the handoff is a drawn edge sweeping across one surface rather than a cut from black. Without WebGL the same window uses a clip-path aperture cut into the film surface (`?film=2d` previews it on the dev server). Either way the closing frames stay visible around the opening and nothing is hidden behind a separate cover. It opens onto a large glass post already beside the chapter copy (`ARRIVAL` in `src/lib/profile-motion.mjs`), which settles into its resting pose while the copy fades in; there is no full-screen photograph beat. Then: tall floating profile → follower growth → quiet profile outcome. A further 7.6 viewport heights continue from that exact camera pose into her messages, back to her bio, and into an illustrative Passes landing page. The earlier physical scroll distances remain unchanged. Nine more viewport heights show the first $40 sale, the original crew reveal (source 00:05.5–00:16), and an illustrative creator dashboard ending at $80,000 monthly gross revenue. The bio-link jump still ends at the Passes page, at 20.7 viewport heights.

`src/lib/chapters.mjs` is the single index of the ten chapters (roman numeral, name, the world position where its label takes over, and a settled `focus` position inside it). It drives the chapter rail on the left (desktop, from 1024px; names appear from 1500px, where the profile close-up and the dashboard leave the rail's column clear), the footer label, and the ten-segment progress line; clicking a rail entry scrolls to that chapter's focus. `src/lib/story.ts` owns the social camera. A single persistent photograph moves from the measured post-image box into the measured first grid tile. The profile and post use DOM text and layout, with CSS perspective; there is no rendered video of the interface. The camera follows a deterministic path from the right side to the left, then returns. Minimum-jerk position curves and shallow scroll-linked rotations preserve a readable profile header during the larger growth view. The lower grid may extend below the viewport in this close-up, with a fixed lower-edge fade. The full profile and detached navigation return for the outcome.

Followers accelerate from 284 to 28,684, adding exactly 28,400. Likes end at 128,640. Rolling digits settle to the deterministic count with short GSAP tweens. Scroll reverses every narrative transition. Local like/save controls are available during the stable post hold. The bio link provides an optional keyboard/click shortcut to the local Passes preview. Other social icons are illustrative.

`src/lib/creator.mjs` centralizes the fictional identity and metrics. `src/lib/profile-motion.mjs` centralizes story timing and pure transition/count helpers. The featured photo comes from the supplied footage. Five new reference-based creator portraits live in `public/media/profile/`: café, city, studio, coast, and backstage. Exact prompts are in `design/creator-scenes-prompts.md`. The pale editorial background is original SVG/CSS geometry. Its line field and foreground orbit move at slower, different rates than the profile; a separate soft shadow reinforces the separation. The former gallery asset remains archived but is not loaded by the site.

Depth and entrances live in `src/lib/depth.mjs`: chapter copy and the notification cards drift against the camera at their own rates for as long as they are on stage (phones only lift, keeping copy clear of the post below it); headline lines enter from alternating sides and land exactly on their layout position; the profile grid tiles, Passes tiles, dashboard stat cards and transactions bloom in with a short stagger, settling scale, saturation and light together. A bloom's filter exists only while it is blooming and is removed once settled. All camera and background motion follows scroll; there is no idle or mouse parallax. The smoked glass stays translucent throughout, with opaque photographs and a verified illustrative identity. There is no hardware frame, Dynamic Island, or OS status bar. The featured photograph uses fixed raster dimensions and transform-based cropping. No animated backdrop blur is used. The short-phone inbox compresses its glass surface and clip region to keep message text readable. The brief Passes handoff uses a circular reveal centered on the measured bio link. Mobile places copy above the scene, arrives with the post already below that copy (`ARRIVAL_MOBILE`), reduces lateral travel, rotation and notification density, and enlarges local controls. Reduced-motion preferences select normal document flow with the post, full profile, outcome, all eight messages, and the Passes preview. `?motion=reduce` previews that view on the dev server.

## Placeholders and references

- Temporary typographic Fatbear identity, no supplied brand logo.
- Type is self-hosted through Fontsource under their open-font licences: Archivo (variable weight and width; the wordmark, brand and masthead are set at weight 900 and 125% width, headlines at 700), Instrument Serif italic for editorial emphasis, Instrument Sans for interface and body text, and Geist Mono for eyebrows, chapter labels, numerals and counters. No font assets from Shopify have been copied.
- Maya / `maya.creates`, caption, reactions, and all social metrics are fictional demo content centralized in `src/lib/creator.mjs`; illustrative reaction copy is in `src/components/SocialStory.tsx`.
- Like and save buttons change local React state only. The inbox is fictional and read-only. The Passes bio link stays within this local prototype; no external account is contacted. Preview collection buttons filter the existing creator portraits locally.
- The Passes landing page is fictional, pending a real UI reference and destination. This build ends on that page; checkout, revenue dashboards, backend integration, analytics, and public deployment are not included. The interface stays frameless and translucent, with detached social navigation.

Reference direction: [Paul Kalkbrenner](https://www.paulkalkbrenner.net/) for the large wordmark with embedded media, and [Shopify Winter '26](https://www.shopify.com/editions/winter2026) for immersive composition and the passage into a new chapter. The supplied reference screenshots are in the sibling `antigravity-references/` directory. The live Sidekick section was inspected during this revision, including its spacious editorial layout and floating UI layers. The implementation adapts that pacing and depth to Fatbear; it does not claim a frame-perfect reconstruction.

## Verification

```sh
npm test
npm run build
```

Twenty-two focused automated tests cover reversible frame mapping, focal crop bounds, cache limits, eviction and teardown, late decode completion, missing-frame fallback, reversible bounded audience growth, profile-image endpoint geometry, rolling-digit endpoints, preserved opening travel, profile-header containment across sizes, continuous reversible camera travel, fixed-raster photo cropping, inbox slides, progressive messages, bio-link bounds and tap endpoints, short-screen readability, and the Passes reveal. TypeScript checking runs as part of the build.

Browser QA covered 390×844 and 1440×900 layouts, forward and reverse scrolling, large scroll jumps, the aperture, frameless post and tall profile states, notification placement, audience outcome, local like/save interaction, and the static reduced-motion preview (no canvas, no pinning, no horizontal overflow). No runtime errors were observed in those checks. Physical iOS/Android device performance and real throttled-network testing remain to be verified; desktop viewport emulation does not establish mobile GPU performance.

## Inbox and Passes continuation

`src/lib/demand-motion.mjs` holds the pure camera, slide, row, cursor, press and reveal functions. `src/lib/demand.ts` applies them within the existing master render; no independent animation clock is introduced. `src/demand.css` contains the new screens and responsive/reduced-motion rules. The interface shares one glass surface, one Instagram profile instance, and the existing featured photograph. The original editorial field is also reused behind Passes.

The two lead messages are “I wanna buy.” and “Send me the link!” Supporting conversations scroll into view. The camera returns to the same profile and its final 28,684 followers before zooming into the measured `passes.com/maya` label. The cursor/hand approach, compression, ripple, and circular reveal are functions of scroll progress, so all of them reverse naturally. Every required image is already present in the mounted profile or landing DOM and loaded eagerly; the continuation needs no new media files.

See `design/inbox-passes-verification.md` for this revision’s scope and checks.


Business chapter verification: `design/business-verification.md`. Run `npm test` for the 35 cache, crop, timeline, motion, depth and financial-consistency checks.
