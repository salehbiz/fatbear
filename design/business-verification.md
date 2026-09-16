# Creator business chapter

Implemented September 13, 2026. Local illustrative preview only.

## Sequence

The existing 20.7 viewport heights remain in place. Nine further viewports contain the first $40 content purchase, expansion from the Passes cover into the original crew footage, contraction into a creator dashboard, growing activity and a quiet $80,000 finish.

The desktop dashboard is at most 1120px wide. Mobile uses a portrait dashboard; short screens prioritize the earnings, subscriber and purchase totals over the chart. Floating notifications include both a subscription and a message on mobile. The final desktop view includes recent purchases and two message previews.

## Footage and continuity

Source: `/Users/apple/Documents/Projects/elysm new/ELYSM_Combined_Master.mp4`.

Use 00:05.500–00:16.000, 24fps, 1280×720, 252 JPEG frames. Detailed inspection showed Instagram borders still present at 00:05.000, so the original 00:04 proposal was corrected. The later eye return and black tail are omitted. The Passes cover now uses the exact first clean film frame, with a matching crop. One canvas handles the film expansion and contraction. Inactive decoded frames are released; each sequence has a separate frame-path resolver and bounded cache.

Measured desktop entry alignment: x/y/width differ by 0px, height differs by approximately 0.00012px. The final film frame settles into the dashboard’s behind-the-scenes preview.

## Consistent demo figures

2,000 subscriptions at $25 produce $50,000; 750 content purchases at $40 produce $30,000. The first $40 sale is included in that purchase total. The chart and earnings derive from the same values, with $80,000 as the final monthly gross revenue. The display explicitly says “Illustrative month · Gross revenue.” No net-profit, recurring-revenue, payment or live account claims are made.

## Verification

- 29 automated tests pass: earlier cache/crop/scroll checks, separate frame paths and release/reload, business totals, reverse/jump determinism, dashboard containment, and film transition endpoints.
- Production TypeScript/Vite build passes. Vite reports the informational main-bundle size warning at approximately 500kB minified (161kB gzip); no runtime library was added.
- Browser checked at 1440×900, 390×844 and 320×568. Final earnings and supporting figures fit without internal or horizontal overflow. Compact layout was adjusted to separate totals from activity rows.
- Verified first-sale overlay, crew reveal, dashboard growth, backwards traversal, resizing and exact source-photo alignment. The bio link still lands at the Passes endpoint rather than skipping to the new dashboard.
- Reduced-motion view renders the poster and dashboard in document flow with final totals and no canvas. Desktop messages and existing local controls remain available.
- Media remains a 720p prototype. No public deployment, live messages, checkout or billing integration was performed.

## Passes reference revision — September 13

Replaced the olive studio dashboard with the supplied Passes reference's white workspace, left creator navigation, Dashboard/Explore header, outlined monthly metric cards, and Performance Metrics panel. Total Revenue is larger than the supporting metrics; all period labels read This Month. The original $80,000 total, $50,000 membership revenue, $30,000 content revenue and scroll-driven counters are unchanged. Navigation is illustrative, as before; no live account controls were added.

The film now lands in the measured preview inside the revenue panel. Checked clean reload, desktop 1440×900, mobile 390×844 and 320×568, reverse scroll into the film and forward into animated revenue. No horizontal overflow on mobile. The smallest layout hides the chart to preserve readable counts. Existing 29 tests and production build pass; Vite still reports its existing bundle-size advisory.

## Revenue refresh and footer regression fix

Removed the cached-total guard from the metrics renderer. It now reconciles the current digit nodes, accessibility label, support metrics, and SVG chart together. BusinessStory also reconciles after React commits, so Fast Refresh at a stationary endpoint cannot leave fresh zero digits or a flat chart beneath final supporting metrics. A browser refresh of the component at progress 1 preserved $80,000, the leading digit's -8em transform and the chart's $80K endpoint without scrolling.

Activity now adapts to its own available height, with shorter rows and a contained panel. At 1440×900 the message ended at y727 and the footer started at y783. At 1470×835 the shorter panel omits messages rather than overlapping the footer. Mobile 390×844 retains the final $80,000 and chart. Reverse scrolling still decreases the totals and returning to the end restores $80,000. Two regression tests cover DOM replacement at an unchanged total and settling/reversing digit motion. All 31 tests and the production build pass; browser error log is empty.

## Revenue typography clearance

Replaced the rolling digit windows' hard-coded .55em width and negative letter spacing with true 1ch tabular widths, a small inter-digit gap, and separate currency/comma spacing. The amount now sizes against the finance panel's own width, preserving clearance on narrow layouts. Removed strike-through from completed onboarding labels while retaining the green completion checks. Visually verified $80,000 at 1470×835 and 320×568; the small-screen amount and suffix end at x238 inside a panel ending at x291. Build passed after the typography change.
