# Inbox → bio link → Passes

Implemented from the supplied continuation brief, September 12, 2026.

## Scope

The approved opening still occupies 5.1 viewport heights and the existing post/profile/growth chapter still occupies eight. The next 7.6 viewport heights continue from the exact previous endpoint: center the existing profile, slide into a fictional inbox, reveal purchase intent, slide back, zoom to the measured bio link, show a scroll-driven cursor/touch press, and reveal Maya’s illustrative Passes landing page.

The inbox layout follows the structure described in the brief. No separate inbox reference image accompanied that pasted attachment. The Passes UI is an original prototype, as permitted by the original brief; it is not claimed to reproduce the live Passes product.

## Implementation

- One ScrollTrigger/Lenis progress value still controls the entire narrative. New motion has no independent timers or loops.
- One Instagram profile, one glass surface, and one persistent featured photo remain in use. Profile and inbox slide as adjacent pages inside the same crop region.
- The featured photo’s fixed-size raster moves through transforms; geometry is not rewritten during post/grid holds. The old opening’s invisible wordmark now ignores pointer input.
- Identity, final follower count, bio link, and the eight fictional conversations are centralized. The two lead messages are “I wanna buy.” and “Send me the link!”
- Camera zoom and reveal origin use the measured link label. The optional link activation moves to the local preview and never requests a live account.
- Short phones use a compact inbox and a larger camera scale to keep the lead messages readable.
- All destination images are existing local creator assets loaded eagerly in the mounted DOM. No new image generation or remote media dependency was added.
- Passes collection controls change local preview content. No checkout, revenue dashboard, live inbox, or deployment is included.

## Verification

- 22 automated tests pass: frame cache, film mapping, previous camera/count endpoints, fixed-raster photo geometry, continuation boundary, reversible inbox slides, progressive conversation rows, compact inbox sizing, measured link containment, press/release, and destination handoff.
- TypeScript and Vite production build pass.
- Browser checks at 1440×900, 390×844, and 320×568: centered inbox, key-message readability, full bio link, desktop cursor/mobile hand, and Passes arrival.
- Forward and reverse navigation, fast jumps, resize from mobile to desktop and back, and the local bio-link keyboard path were exercised. The destination remains mounted beneath its circular reveal.
- The original post’s like/save buttons work. Tabbing between visible controls preserves the camera. Passes preview filters and the “See what’s inside” control work locally.
- Desktop post crop error was zero on all four bounds. At the completed profile morph, the persistent crop matched its grid destination to less than 0.001 CSS px; there is one `.featured-photo` node.
- Reduced-motion preview checked at desktop and 390×844: normal document flow, all eight messages available, no canvas or pin spacer, no horizontal overflow, and 44px or larger control heights.
- No runtime errors appeared in the observed browser checks.

These are desktop browser/emulated-viewport checks. Physical mobile GPU performance and frame-by-frame validation in the user’s separate Chrome window were not measured.


## Profile photos and portrait destination revision

- Added eight original fictional adult profile photographs in `public/media/inbox/`, matching each contact across notes and message rows. Source prompts and original asset paths: `dm-avatar-prompts.md`. Avatars are 192px JPEGs with fixed dimensions and CSS circular crops.
- Replaced the desktop Passes spread with a centered portrait panel (maximum 420px wide). It retains the translucent material, existing content filters and CTA, with a scroll-driven shallow 3D arrival and separate cover-photo drift.
- The opening, inbox travel, bio tap, and total scroll distance are unchanged. The destination remains local and illustrative.
- Browser checked at 1440×900, 390×844, and 320×568: complete panel stays within the viewport, no internal overflow, all eight portraits load, matching note avatars load. The small-screen destination buttons measure at least 44px in both dimensions.
- Checked local CTA/filter change, keyboard focus, backward traversal to inbox, forward destination entrance, and viewport resize. Reduced-motion page retains the portrait layout in normal document flow with no horizontal overflow.
- 23 automated tests pass, including destination containment and deterministic reverse motion. Production build passes.
