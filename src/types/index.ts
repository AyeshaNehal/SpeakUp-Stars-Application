/**
 * CHILD PRIVACY NOTE (Rule 1 & Rule 5):
 * - Data used: Nickname only, age band ('3-5' | '6-8' | '9-12'), avatar emoji/id,
 *   numeric stars/streak metrics, and sound preference.
 * - Purpose: Personalize the speech journey without identifying the child.
 * - Retention: Stored locally on-device. Zero third-party sharing.
 */
export type AgeGroup = '3-5' | '6-8' | '9-12';

export interface KidProfile {
  name: string;
  age: number;
  ageGroup: AgeGroup;
  stars: number;
  gems: number;
  level: number;
  streakDays: number;
  avatar: string;
  soundEnabled: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  iconName: string;
  badge?: string | number;
  color: 'sunny' | 'sky' | 'coral' | 'mint' | 'purple';
  description?: string;
  isPrimaryAction?: boolean;
}
