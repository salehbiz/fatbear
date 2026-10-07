import { STORY_START, INTRO_TRAVEL, AUDIENCE_END, PASSES_END, TOTAL_TRAVEL, demandDistanceAt, BUSINESS_TRAVEL } from './profile-motion.mjs';
import { range } from './math.mjs';

const social = s => STORY_START + s * (AUDIENCE_END - STORY_START);
const demand = d => AUDIENCE_END + demandDistanceAt(d);
const business = b => PASSES_END + b * BUSINESS_TRAVEL;

// One index for the rail, the footer label and the segmented progress line.
// `start` is where a chapter's label takes over; `focus` is where a jump lands, a settled beat inside it.
export const CHAPTERS = Object.freeze([
  { id: 'create', numeral: 'I', name: 'Create', start: INTRO_TRAVEL, focus: social(.29), headline: 'You make the content. We handle the rest.', lead: 'You make the content.', emphasis: 'We handle the rest.', color: '#deded2', asset: null },
  { id: 'get-seen', numeral: 'II', name: 'Get Seen', start: social(.44), focus: social(.72), headline: 'Fans want more. Nobody answers.', lead: 'Fans want more.', emphasis: 'Nobody answers.', color: '#d9e6e9', asset: 'seen' },
  { id: 'connect', numeral: 'III', name: 'Connect', start: social(.93), focus: demand(.38), headline: 'Every message answered, around the clock.', lead: 'Every message answered,', emphasis: 'around the clock.', color: '#e9dfcf', asset: 'connect' },
  { id: 'unlock', numeral: 'IV', name: 'Unlock', start: demand(.53), focus: demand(.72), headline: 'Turn that attention into monthly income.', lead: 'Turn that attention', emphasis: 'into monthly income.', color: '#e7cbbc', asset: 'unlock' },
  { id: 'build', numeral: 'V', name: 'Build', start: business(.14), focus: business(.96), headline: 'Your fans are already there. Let’s open the door.', lead: 'Your fans are already there.', emphasis: 'Let’s open the door.', color: '#eeece3', asset: null },
  { id: 'belong', numeral: 'VI', name: 'Belong', start: TOTAL_TRAVEL, focus: TOTAL_TRAVEL + 1, destination: 'belong', headline: 'Three steps. Barely any lift.', lead: 'Three steps.', emphasis: 'Barely any lift.', color: '#eee7d8', asset: 'belong' },
]);

export function chapterAt(world) {
  let index = 0;
  for (let i = 0; i < CHAPTERS.length; i++) if (world >= CHAPTERS[i].start) index = i;
  return index;
}
export const chapterLabel = index => `${CHAPTERS[index].numeral} / ${CHAPTERS[index].name}`;
// The final two viewport units represent the normal-flow invitation, not more pinned film.
export const chapterEnd = index => index + 1 < CHAPTERS.length ? CHAPTERS[index + 1].start : TOTAL_TRAVEL + 2;
export const chapterProgress = world => CHAPTERS.map((chapter, i) => range(world, chapter.start, chapterEnd(i)));
export const INTRO_COPY = 'You already have the fans. We build and run the platform that turns them into income.';
export const CLOSING_COPY = 'Talk to us. We plan your platform. You approve every launch.';
export const themeReveal = (world, start) => range(world, start - .25, start + .25);
