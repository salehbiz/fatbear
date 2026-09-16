// Soften touch deltas without adding artificial inertia to native page scrolling.
// Reach 99% in 160ms, independently of the screen's refresh rate.
export const MOBILE_SETTLE_MS = 160;
export function settleProgress(current, target, elapsedMs) {
 const next = target + (current - target) * Math.exp(-Math.max(0, elapsedMs) / (MOBILE_SETTLE_MS / Math.log(100)));
 return Math.abs(next - target) < .00001 ? target : next;
}

// Phone chrome and the keyboard change height without changing the composition.
export function shouldRefreshViewport(width, height, nextWidth, nextHeight, touch) {
 if (Math.abs(nextWidth - width) > 2) return true;
 return !touch && width >= 768 && Math.abs(nextHeight - height) > 2;
}

export const canvasPixelRatio = (width, ratio) => Math.min(ratio || 1, width < 768 ? 1.5 : 2);
export const mobileSceneTop = height => height < 700 ? 240 : 280;
// One shared distance unit keeps chapter links and the pin endpoint in sync.
export const storyTravelUnit = (width, height) => height * (width < 768 ? .8 : 1);
