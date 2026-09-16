# Glass profile revision — verification

Latest scope: preserve the opening; reference-shaped translucent profile, detached navigation, large right-to-left camera travel, slower editorial background parallax, verified demo identity, and five new scenes of the same reference woman.

- Approved opening MP4 is SHA-256 identical to `../Fatbear-Standing-To-Eye-Faster-720p.mp4`.
- Thirteen automated checks pass, including original frame cache checks, audience endpoints, photo geometry, header containment at desktop/tablet/mobile sizes, reversible camera poses, and continuous lateral travel.
- TypeScript and Vite production build pass.
- Development browser checks at 1440×900 and 390×844: profile header and editorial text remain separate, upward scrolling reverses the journey, final followers = 28,684, and each of the five new profile images loads.
- Tested actual like/save clicks and keyboard Tab navigation. Local state toggles correctly. Keyboard focus no longer scrolls the pinned stage to a different camera position. Desktop targets exceeded 44px; mobile targets use a scale-adjusted 47px minimum before perspective.
- Resize retains the narrative position. The full original film is hidden during social beats. Fonts use the same guarded refresh path without a deferred startup scroll reset.
- Reduced-motion preview uses ordinary document flow: no pin spacer, no canvas, no horizontal overflow at 390px, 48px local controls, and visible illustrative-metrics labeling.
- Development and production were inspected for the reported flicker. Removed animated background blur, backdrop filtering, panel-height changes, and moving clip paths. Fixed stale social visibility during development refresh. No flashes or runtime errors were observed in the final tested browser states; this does not replace physical-device performance testing.
- The larger follower view intentionally extends the lower grid beneath the viewport, with a fixed lower-edge fade. Avatar, verified name, stats, biography, and actions remain visible. Full profile and detached navigation return for the closing composition.

The five exact image-generation prompts are in `creator-scenes-prompts.md`. Final web assets are `public/media/profile/{cafe,city,studio,coast,backstage}.webp`; the featured poolside photograph remains the original supplied image.
