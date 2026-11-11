import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'public/screenshots');

const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'laptop', width: 1440, height: 900 },
];

test.describe('First-Login Onboarding & Real User Data Flow', () => {
  for (const vp of viewports) {
    test(`Full Onboarding Journey & Axe Accessibility [${vp.name} - ${vp.width}x${vp.height}]`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Clean local storage state
      await page.goto('/login');
      await page.evaluate(() => localStorage.clear());
      await page.reload();

      // ------------------------------------------------------------------------
      // SCREEN 1: /login
      // ------------------------------------------------------------------------
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('h1')).toContainText(/SpeakUp/i);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-01-login.png`), fullPage: true });

      // Run Axe accessibility scan
      const axeLogin = await new AxeBuilder({ page }).analyze();
      expect(axeLogin.violations.filter(v => v.impact === 'critical')).toEqual([]);

      // Switch to Create Account mode
      await page.click('button:has-text("Create Account")');

      // Fill parent signup form
      const testEmail = `parent_${Date.now()}_${vp.name}@teststars.com`;
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'SuperSecurePass123!');
      await page.click('button[type="submit"]');

      // ------------------------------------------------------------------------
      // SCREEN 2: /verify-email
      // ------------------------------------------------------------------------
      await page.waitForURL(/\/verify-email/);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-02-verify-email.png`), fullPage: true });

      const axeVerify = await new AxeBuilder({ page }).analyze();
      expect(axeVerify.violations.filter(v => v.impact === 'critical')).toEqual([]);

      // Click Confirm Email button
      await page.click('button:has-text("Confirm Email")');

      // ------------------------------------------------------------------------
      // SCREEN 3: /onboarding/parent
      // ------------------------------------------------------------------------
      await page.waitForURL(/\/onboarding\/parent/);
      await expect(page.locator('h1')).toContainText(/Parent.*Setup/i);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-03-parent-setup.png`), fullPage: true });

      const axeParent = await new AxeBuilder({ page }).analyze();
      expect(axeParent.violations.filter(v => v.impact === 'critical')).toEqual([]);

      // Fill parent profile (Legal guardian + name)
      await page.fill('input#parent-display-name', 'Amina');
      await page.click('input#parent-guardian-checkbox');
      await page.click('button:has-text("Save & Continue")');

      // ------------------------------------------------------------------------
      // SCREEN 4: /onboarding/consent
      // ------------------------------------------------------------------------
      await page.waitForURL(/\/onboarding\/consent/);
      await expect(page.locator('h1')).toContainText(/Parental Consent/i);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-04-consent.png`), fullPage: true });

      const axeConsent = await new AxeBuilder({ page }).analyze();
      expect(axeConsent.violations.filter(v => v.impact === 'critical')).toEqual([]);

      // Check required metrics consent (leave recordings and emails unticked)
      await page.click('input#metricsConsent');
      await page.click('button:has-text("Grant Consent")');

      // ------------------------------------------------------------------------
      // SCREEN 5: /onboarding/pin
      // ------------------------------------------------------------------------
      await page.waitForURL(/\/onboarding\/pin/);
      await expect(page.locator('h1')).toContainText(/Set Your 4-6 Digit Parent PIN/i);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-05-pin.png`), fullPage: true });

      const axePin = await new AxeBuilder({ page }).analyze();
      expect(axePin.violations.filter(v => v.impact === 'critical')).toEqual([]);

      // Set 4-digit PIN 4321
      await page.fill('input#parent-pin', '4321');
      await page.fill('input#parent-pin-confirm', '4321');
      await page.click('button:has-text("Save PIN")');

      // ------------------------------------------------------------------------
      // SCREEN 6: /onboarding/child - Wizard Step 1: Nickname
      // ------------------------------------------------------------------------
      await page.waitForURL(/\/onboarding\/child/);
      await expect(page.locator('text=Step 1 of 7')).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-06-child-step1-nickname.png`), fullPage: true });

      // PII Scrubber check: enter email, verify rejection
      await page.fill('input#child-nickname-input', 'john.doe@gmail.com');
      await page.click('button[data-testid="wizard-continue-btn"]');
      await expect(page.locator('role=alert')).toContainText(/Emails or domain names|not allowed/i);

      // Enter valid nickname
      await page.fill('input#child-nickname-input', 'NovaStar');
      await page.click('button[data-testid="wizard-continue-btn"]');

      // ------------------------------------------------------------------------
      // Child Wizard Step 2: Age Band
      // ------------------------------------------------------------------------
      await expect(page.locator('text=Step 2 of 7')).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-07-child-step2-age.png`), fullPage: true });

      // Click Age button 7 (Age band 6-8)
      await page.click('button[data-testid="age-7"]');
      await page.click('button[data-testid="wizard-continue-btn"]');

      // ------------------------------------------------------------------------
      // Child Wizard Step 3: Sparky Theme
      // ------------------------------------------------------------------------
      await expect(page.locator('text=Step 3 of 7')).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-08-child-step3-avatar.png`), fullPage: true });

      // Select Mint Sparky
      await page.click('button:has-text("Mint")');
      await page.click('button[data-testid="wizard-continue-btn"]');

      // ------------------------------------------------------------------------
      // Child Wizard Step 4: Interests
      // ------------------------------------------------------------------------
      await expect(page.locator('text=Step 4 of 7')).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-09-child-step4-interests.png`), fullPage: true });

      // Pick space & dinosaurs
      await page.click('button:has-text("Space")');
      await page.click('button:has-text("Dinosaurs")');
      await page.click('button[data-testid="wizard-continue-btn"]');

      // ------------------------------------------------------------------------
      // Child Wizard Step 5: Comfort Level
      // ------------------------------------------------------------------------
      await expect(page.locator('text=Step 5 of 7')).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-10-child-step5-comfort.png`), fullPage: true });

      // Choose "A little nervous"
      await page.click('button:has-text("A little nervous")');
      await page.click('button[data-testid="wizard-continue-btn"]');

      // ------------------------------------------------------------------------
      // Child Wizard Step 6: Parent Options
      // ------------------------------------------------------------------------
      await expect(page.locator('text=Step 6 of 7')).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-11-child-step6-parent-options.png`), fullPage: true });

      await page.click('button[data-testid="wizard-continue-btn"]');

      // ------------------------------------------------------------------------
      // Child Wizard Step 7: Welcome Screen
      // ------------------------------------------------------------------------
      await expect(page.locator('text=Step 7 of 7')).toBeVisible();
      await expect(page.locator('h2')).toContainText(/Welcome, NovaStar!/i);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-12-child-step7-welcome.png`), fullPage: true });

      // Finish Wizard -> Home
      await page.click('button:has-text("Start Speaking Adventure!")');

      // ------------------------------------------------------------------------
      // SCREEN 8: / (Home Dashboard Fresh State)
      // ------------------------------------------------------------------------
      await page.waitForURL('http://localhost:5173/');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-13-home-fresh-state.png`), fullPage: true });

      // Verify DOM Grep: Zero Hardcoded Dummy Data!
      const content = await page.content();
      expect(content).not.toContain('124 Stars');
      expect(content).not.toContain('24320');
      expect(content).not.toContain('Level 3 🌟');
      expect(content).not.toContain('4 Days Streak');
      expect(content).not.toContain('Leo');

      // Verify Real Store Dynamic State:
      await expect(page.locator('h1')).toContainText(/Ready to find your voice, NovaStar\?/i);
      await expect(page.locator('text=0 of 3 speeches completed')).toBeVisible();
      await expect(page.locator('text=Let\'s do your first speech!').first()).toBeVisible();
      await expect(page.locator('text=0 Days')).toBeVisible();

      if (vp.name === 'laptop') {
        await expect(page.locator('text=NovaStar').first()).toBeVisible();
        await expect(page.locator('text=0 Stars').first()).toBeVisible();
        await expect(page.locator('text=Level 1 🌟').first()).toBeVisible();
        await expect(page.locator('text=0d').first()).toBeVisible();
      }

      // ------------------------------------------------------------------------
      // SCREEN 9: /child-select (Multiple Children Chooser)
      // ------------------------------------------------------------------------
      await page.goto('/child-select');
      await page.waitForURL(/\/child-select/);
      await expect(page.locator('h1')).toContainText(/Who\'s Practicing Today\?/i);
      await expect(page.locator('text=NovaStar')).toBeVisible();
      await expect(page.locator('text=Add Another Child')).toBeVisible();
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${vp.name}-14-child-select.png`), fullPage: true });
    });
  }

  test('Mid-wizard browser reload resumes at saved step', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    // Complete parent auth, consent, and pin directly in sandbox
    await page.evaluate(() => {
      const parent = {
        id: 'p_resume',
        email: 'resume@test.com',
        emailVerified: true,
        displayName: 'Sam',
        isLegalGuardian: true,
        pinSet: true,
        createdAt: new Date().toISOString(),
      };
      const consent = {
        id: 'c_resume',
        parentId: 'p_resume',
        consentMetricsProcessing: true,
        consentStoreRecordings: false,
        consentEmailSummaries: false,
        policyVersion: '2026.1',
        timestamp: new Date().toISOString(),
        verificationMethod: 'signed_econsent',
      };
      const child = {
        id: 'ch_resume',
        parentId: 'p_resume',
        nickname: 'RocketKid',
        ageBand: '9-12',
        avatarId: 'purple',
        interests: ['space'],
        onboardingCompleted: false,
        onboardingStep: 4, // Paused at step 4
        createdAt: new Date().toISOString(),
      };
      const state = {
        parents: [parent],
        children: [child],
        consentRecords: [consent],
        pins: { p_resume: 'hash' },
      };
      localStorage.setItem('speakup_parent_auth_state_v2', JSON.stringify(state));
      localStorage.setItem('speakup_active_parent_id', 'p_resume');
    });

    // Navigate to /onboarding/child - should open directly at step 4
    await page.goto('/onboarding/child');
    await expect(page.locator('text=Step 4 of 7')).toBeVisible();
    await expect(page.locator('text=What topics does')).toBeVisible();
  });
});
