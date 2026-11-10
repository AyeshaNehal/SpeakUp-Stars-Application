/**
 * CHILD WELL-BEING & SEASONAL FUN NOTE (Rule 1, Rule 6):
 * - Seasonal Events & "Wheel of the Day" Engine
 * - Deterministically spotlights a daily topic with +15 bonus Star Points.
 * - Rotates seasonal festival themes (Spring, Summer, Autumn, Winter) without FOMO or countdown stress.
 * - Offline cached: Works 100% locally with zero internet connection required.
 */

import { Topic, getTopicsByAgeBand, TopicCategory } from '../topics/topicService';
import { AgeGroup } from '../../types';

export interface SeasonalEvent {
  id: 'spring_sprout' | 'summer_stars' | 'autumn_harvest' | 'winter_wonder';
  name: string;
  tagline: string;
  icon: string;
  color: string;
  accentBg: string;
  featuredCategory: TopicCategory;
  bonusMultiplier: number;
}

export interface WheelOfTheDay {
  dateKey: string;
  featuredCategory: TopicCategory;
  featuredTopic: Topic;
  bonusStarPoints: number;
  seasonalEvent: SeasonalEvent;
}

class SeasonalEventsService {
  /**
   * Identifies current seasonal festival based on current month.
   */
  public getCurrentSeasonalEvent(): SeasonalEvent {
    const month = new Date().getMonth(); // 0-indexed (0 = Jan, 11 = Dec)

    if (month >= 2 && month <= 4) {
      // March, April, May
      return {
        id: 'spring_sprout',
        name: 'Spring Sprout Festival 🌱',
        tagline: 'Watch your speaking blossom with fresh nature topics!',
        icon: '🌱',
        color: 'from-emerald-400 to-teal-500',
        accentBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        featuredCategory: 'Animals',
        bonusMultiplier: 1.5,
      };
    } else if (month >= 5 && month <= 7) {
      // June, July, August
      return {
        id: 'summer_stars',
        name: 'Summer Star Quest ☀️',
        tagline: 'Shine bright with high-energy superhero and adventure tales!',
        icon: '🚀',
        color: 'from-amber-400 to-orange-500',
        accentBg: 'bg-amber-50 border-amber-200 text-amber-800',
        featuredCategory: 'Superheroes',
        bonusMultiplier: 1.5,
      };
    } else if (month >= 8 && month <= 10) {
      // September, October, November
      return {
        id: 'autumn_harvest',
        name: 'Autumn Harvest of Words 🍂',
        tagline: 'Gather warm, cozy stories and share food and play adventures!',
        icon: '🍂',
        color: 'from-orange-500 to-amber-600',
        accentBg: 'bg-orange-50 border-orange-200 text-orange-800',
        featuredCategory: 'Food',
        bonusMultiplier: 1.5,
      };
    } else {
      // December, January, February
      return {
        id: 'winter_wonder',
        name: 'Winter Wonder Voice ❄️',
        tagline: 'Cozy up with curious science and magical imagination!',
        icon: '❄️',
        color: 'from-sky-400 to-indigo-500',
        accentBg: 'bg-sky-50 border-sky-200 text-sky-800',
        featuredCategory: 'Space',
        bonusMultiplier: 1.5,
      };
    }
  }

  /**
   * Deterministically calculates the "Wheel of the Day" for a given date and age band.
   */
  public getWheelOfTheDay(ageBand: AgeGroup = '6-8', customDate?: Date): WheelOfTheDay {
    const today = customDate || new Date();
    const dateKey = today.toISOString().split('T')[0];

    // Hash the date string to get an index
    let hash = 0;
    for (let i = 0; i < dateKey.length; i++) {
      hash = (hash << 5) - hash + dateKey.charCodeAt(i);
      hash |= 0;
    }
    const safeHash = Math.abs(hash);

    const seasonal = this.getCurrentSeasonalEvent();
    const ageTopics = getTopicsByAgeBand(ageBand);

    // Pick topic deterministically
    const topicIndex = safeHash % (ageTopics.length || 1);
    const featuredTopic =
      ageTopics[topicIndex] || {
        id: 'daily_default',
        title: 'My Favorite Animal',
        category: 'Animals',
        emoji: '🐶',
        minAge: 3,
        maxAge: 5,
        helperPrompts: ['What sound does it make?', 'Why is it special?'],
      };

    return {
      dateKey,
      featuredCategory: featuredTopic.category,
      featuredTopic,
      bonusStarPoints: 15,
      seasonalEvent: seasonal,
    };
  }
}

export const seasonalEventsService = new SeasonalEventsService();
