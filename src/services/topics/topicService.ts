/**
 * CHILD PRIVACY NOTE (Rule 1, Rule 5):
 * - Curated Topic Service & Age Band Filtering
 * - Provides 120 positive, kid-safe speaking prompts across 13 categories.
 * - Statically verified non-sensitive: Never prompts for full names, addresses,
 *   school names, phone numbers, or private personal data.
 * - Supports parental category controls (parents can disable specific categories).
 */

import rawTopics from '../../data/topics.json';
import { AgeGroup } from '../../types';

export type TopicCategory =
  | 'Animals'
  | 'My Family'
  | 'Food'
  | 'Superheroes'
  | 'Space'
  | 'Hobbies'
  | 'Feelings'
  | 'Kindness'
  | 'School'
  | 'Dreams'
  | 'Would You Rather'
  | 'Tell a Story'
  | 'Show and Tell';

export interface Topic {
  id: string;
  title: string;
  category: TopicCategory;
  emoji: string;
  minAge: number;
  maxAge: number;
  helperPrompts: [string, string, string];
}

export const ALL_CATEGORIES: TopicCategory[] = [
  'Animals',
  'My Family',
  'Food',
  'Superheroes',
  'Space',
  'Hobbies',
  'Feelings',
  'Kindness',
  'School',
  'Dreams',
  'Would You Rather',
  'Tell a Story',
  'Show and Tell',
];

const topics: Topic[] = rawTopics as Topic[];

/**
 * Maps child's age band ('3-5' | '6-8' | '9-12') to numeric age ranges.
 */
function isAgeCompatible(topic: Topic, ageBand: AgeGroup): boolean {
  switch (ageBand) {
    case '3-5':
      return topic.minAge <= 5 && topic.maxAge >= 3;
    case '6-8':
      return topic.minAge <= 8 && topic.maxAge >= 6;
    case '9-12':
      return topic.minAge <= 12 && topic.maxAge >= 9;
    default:
      return true;
  }
}

/**
 * Returns all 120 curated speaking topics.
 */
export function getAllTopics(): Topic[] {
  return [...topics];
}

/**
 * Returns all 13 supported categories.
 */
export function getCategories(): TopicCategory[] {
  return [...ALL_CATEGORIES];
}

/**
 * Filters topics by age band, optional category, and parent-disabled categories.
 */
export function getTopicsByAgeBand(
  ageBand: AgeGroup,
  category?: TopicCategory,
  disabledCategories: string[] = []
): Topic[] {
  return topics.filter((t) => {
    // 1. Filter out parent-disabled categories
    if (disabledCategories.includes(t.category)) {
      return false;
    }

    // 2. Filter by specific category if requested
    if (category && t.category !== category) {
      return false;
    }

    // 3. Filter by age band suitability
    return isAgeCompatible(t, ageBand);
  });
}

/**
 * Returns a single random topic tailored for the child's age band and preferences.
 */
export function getRandomTopic(
  ageBand: AgeGroup = '6-8',
  category?: TopicCategory,
  disabledCategories: string[] = []
): Topic {
  const eligible = getTopicsByAgeBand(ageBand, category, disabledCategories);

  if (eligible.length === 0) {
    // Safe fallback if all categories in current age band were disabled
    return topics[0];
  }

  const randomIndex = Math.floor(Math.random() * eligible.length);
  return eligible[randomIndex];
}

/**
 * Gets topics grouped by category for quick browsing.
 */
export function getTopicsByCategory(
  category: TopicCategory,
  ageBand?: AgeGroup,
  disabledCategories: string[] = []
): Topic[] {
  return topics.filter((t) => {
    if (t.category !== category) return false;
    if (disabledCategories.includes(category)) return false;
    if (ageBand) return isAgeCompatible(t, ageBand);
    return true;
  });
}
