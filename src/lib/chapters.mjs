import { STORY_START, INTRO_TRAVEL, AUDIENCE_END, PASSES_END, TOTAL_TRAVEL, demandDistanceAt, BUSINESS_TRAVEL } from './profile-motion.mjs';
import { range } from './math.mjs';

const social = s => STORY_START + s * (AUDIENCE_END - STORY_START);
const demand = d => AUDIENCE_END + demandDistanceAt(d);
const business = b => PASSES_END + b * BUSINESS_TRAVEL;

// One index for the rail, the footer label and the segmented progress line.
// `start` is where a chapter's label takes over; `focus` is where a jump lands, a settled beat inside it.
export const CHAPTERS = Object.freeze([
  { id: 'create', numeral: 'I', name: 'Create', start: INTRO_TRAVEL, focus: social(.29), headline: 'Your world starts with what you create.', lead: 'Your world starts with', emphasis: 'what you create.', color: '#deded2', asset: null },
  { id: 'get-seen', numeral: 'II', name: 'Get Seen', start: social(.44), focus: social(.72), headline: 'A moment becomes momentum.', lead: 'A moment becomes', emphasis: 'momentum.', color: '#d9e6e9', asset: 'seen' },
  { id: 'connect', numeral: 'III', name: 'Connect', start: social(.93), focus: demand(.38), headline: 'People don’t just watch. They connect.', lead: 'People don’t just watch.', emphasis: 'They connect.', color: '#e9dfcf', asset: 'connect' },
  { id: 'unlock', numeral: 'IV', name: 'Unlock', start: demand(.53), focus: demand(.72), headline: 'Give your audience more to come back for.', lead: 'Give your audience', emphasis: 'more to come back for.', color: '#e7cbbc', asset: 'unlock' },
  { id: 'build', numeral: 'V', name: 'Build', start: business(.14), focus: business(.96), headline: 'Build something of your own.', lead: 'Build something', emphasis: 'of your own.', color: '#eeece3', asset: null },
  { id: 'belong', numeral: 'VI', name: 'Belong', start: TOTAL_TRAVEL, focus: TOTAL_TRAVEL + 1, destination: 'belong', headline: 'Your next chapter starts with your people.', lead: 'Your next chapter starts', emphasis: 'with your people.', color: '#eee7d8', asset: 'belong' },
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
export const INTRO_COPY = 'A membership club for creators. A place to connect, collaborate, and build what comes next.';
export const CLOSING_COPY = 'Find your people. Share your perspective. Explore what comes next with Fat Bear.';
export const themeReveal = (world, start) => range(world, start - .25, start + .25);
