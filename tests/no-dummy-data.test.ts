import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parentDashboardService } from '../src/services/dashboard/parentDashboardService';
import { rewardsService } from '../src/services/rewards/rewardsService';
import { parentAuthService } from '../src/services/auth/parentAuthService';

describe('Real User Data Enforcement & Zero Dummy Data Suite', () => {
  beforeEach(() => {
    rewardsService.clearStorage();
    parentDashboardService.clearAllDashboardData();
  });

  it('ensures new accounts start at 0 stars, 0-day streak, Level 1, and no badges', () => {
    const testChildId = 'fresh_child_' + Date.now();
    const points = rewardsService.getPoints(testChildId);
    const streak = rewardsService.getStreak(testChildId);
    const level = rewardsService.getLevelInfo(points);
    const badges = rewardsService.getBadges(testChildId);
    const sessions = parentDashboardService.getSessions(testChildId);

    expect(points).toBe(0);
    expect(streak.currentStreak).toBe(0);
    expect(level.level).toBe(1);
    expect(badges.filter((b) => b.unlocked).length).toBe(0);
    expect(sessions.length).toBe(0);
  });

  it('guarantees seedDefaultSessionsIfEmpty returns only is_demo items in DEV and empty array in PROD', () => {
    // In dev mode, seed entries must have is_demo = true
    const devSeeds = parentDashboardService.seedDefaultSessionsIfEmpty();
    if (import.meta.env.DEV) {
      expect(devSeeds.every((s) => s.is_demo === true)).toBe(true);
    } else {
      expect(devSeeds.length).toBe(0);
    }
  });

  it('fails build if forbidden dummy strings (Leo fallback, 124 Stars, Level 3 🌟, google.parent) exist in UI source code', () => {
    const srcDir = path.resolve(__dirname, '../src');
    const forbiddenPatterns = [
      { pattern: /124 Stars/, desc: 'Hardcoded 124 Stars' },
      { pattern: /Level 3 🌟/, desc: 'Hardcoded Level 3 🌟' },
      { pattern: /Age 7 • Explorer/, desc: 'Hardcoded Age 7 • Explorer' },
      { pattern: /google\.parent@speakupstars\.com/, desc: 'Fake Google parent email' },
      { pattern: /childId === 'default_leo' \? 'Leo'/, desc: 'Hardcoded default_leo ternary' },
    ];

    const violations: string[] = [];

    function scanDir(dir: string) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (/\.(ts|tsx)$/.test(file)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          for (const item of forbiddenPatterns) {
            if (item.pattern.test(content)) {
              violations.push(`${path.relative(srcDir, fullPath)}: ${item.desc}`);
            }
          }
        }
      }
    }

    scanDir(srcDir);
    expect(violations).toEqual([]);
  });
});
