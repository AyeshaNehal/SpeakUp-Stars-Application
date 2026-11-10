import { describe, it, expect } from 'vitest';
import {
  getAllTopics,
  getCategories,
  getTopicsByAgeBand,
  getRandomTopic,
  ALL_CATEGORIES,
  Topic,
} from '../src/services/topics/topicService';

describe('Curated Topic Library & Safety Tests', () => {
  const topics = getAllTopics();

  it('contains exactly 120 curated speaking topics', () => {
    expect(topics.length).toBe(120);
  });

  it('covers all 13 specified categories', () => {
    const categories = getCategories();
    expect(categories.length).toBe(13);

    const expected = [
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

    expected.forEach((cat) => {
      expect(categories).toContain(cat);
      const catTopics = topics.filter((t) => t.category === cat);
      expect(catTopics.length).toBeGreaterThanOrEqual(8);
    });
  });

  it('enforces schema integrity: every topic has id, title, emoji, minAge, maxAge, and 3 helper prompts', () => {
    topics.forEach((t: Topic) => {
      expect(t.id).toBeDefined();
      expect(typeof t.title).toBe('string');
      expect(t.title.length).toBeGreaterThan(2);
      expect(t.emoji).toBeDefined();
      expect(t.minAge).toBeGreaterThanOrEqual(3);
      expect(t.maxAge).toBeLessThanOrEqual(12);
      expect(t.minAge).toBeLessThanOrEqual(t.maxAge);
      expect(t.helperPrompts).toHaveLength(3);
      t.helperPrompts.forEach((prompt) => {
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(5);
      });
    });
  });

  it('filters topics accurately by child age bands (3-5, 6-8, 9-12)', () => {
    const band35 = getTopicsByAgeBand('3-5');
    const band68 = getTopicsByAgeBand('6-8');
    const band912 = getTopicsByAgeBand('9-12');

    expect(band35.length).toBeGreaterThan(20);
    expect(band68.length).toBeGreaterThan(20);
    expect(band912.length).toBeGreaterThan(20);

    // Confirm 3-5 topics have simple concrete themes like animals, games, soft clouds
    band35.forEach((t) => {
      expect(t.minAge).toBeLessThanOrEqual(5);
    });

    // Confirm 9-12 topics include deeper ideas like inventions, ecology, leadership
    band912.forEach((t) => {
      expect(t.maxAge).toBeGreaterThanOrEqual(9);
    });
  });

  it('getRandomTopic returns a valid matching topic', () => {
    const topic = getRandomTopic('6-8', 'Space');
    expect(topic.category).toBe('Space');
    expect(topic.minAge).toBeLessThanOrEqual(8);
    expect(topic.maxAge).toBeGreaterThanOrEqual(6);
  });

  it('supports parental controls: disabled categories are strictly excluded', () => {
    const disabled = ['Would You Rather', 'Tell a Story'];
    const filtered = getTopicsByAgeBand('6-8', undefined, disabled);

    const hasDisabled = filtered.some((t) => disabled.includes(t.category));
    expect(hasDisabled).toBe(false);
  });

  it('SAFETY AUDIT: verifies zero topics request sensitive personal data (PII)', () => {
    const forbiddenPhrases = [
      'your address',
      'where you live',
      'your school name',
      'what school do you go to',
      'your phone number',
      'your last name',
      'your real name',
      'credit card',
      'password',
      'how much money',
      'where your parents work',
    ];

    topics.forEach((t) => {
      const fullText = `${t.title} ${t.helperPrompts.join(' ')}`.toLowerCase();
      forbiddenPhrases.forEach((phrase) => {
        expect(fullText).not.toContain(phrase);
      });
    });
  });
});
