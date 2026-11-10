/**
 * CI / Build Lint Checker for Child Privacy Compliance
 *
 * Scans dependencies and source files to ensure ZERO trackers, ads,
 * or behavioral fingerprinting SDKs are present in SpeakUp Stars.
 * Reference: PRIVACY_RULES.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Forbidden package dependencies (npm packages)
const FORBIDDEN_PACKAGES = [
  'google-analytics',
  'react-ga',
  'react-ga4',
  '@analytics/google-analytics',
  'gtag',
  'facebook-pixel',
  'react-facebook-pixel',
  'hotjar',
  'react-hotjar',
  '@hotjar/browser',
  'mixpanel',
  'mixpanel-browser',
  '@amplitude/analytics-browser',
  'amplitude-js',
  '@segment/analytics-next',
  '@fullstory/browser',
  'fullstory',
  '@microsoft/clarity',
  '@fingerprintjs/fingerprintjs',
  'react-adsense',
  'google-ads',
];

// 2. Forbidden script signatures, CDN URLs, and tracking calls
const FORBIDDEN_PATTERNS = [
  { name: 'Google Analytics / GTM', regex: /google-analytics\.com|googletagmanager\.com|\bgtag\s*\(|\bga\s*\(\s*['"]create/i },
  { name: 'Facebook Pixel / Meta', regex: /connect\.facebook\.net|\bfbevents\.js|\bfbq\s*\(/i },
  { name: 'Hotjar Behavioral Recording', regex: /static\.hotjar\.com|\bhj\s*\(\s*['"]init/i },
  { name: 'Mixpanel Analytics', regex: /api\.mixpanel\.com|\bmixpanel\.(init|track)\b/i },
  { name: 'Amplitude Analytics', regex: /cdn\.amplitude\.com|\bamplitude\.(init|track)\b/i },
  { name: 'Microsoft Clarity', regex: /clarity\.ms\/tag/i },
  { name: 'FullStory Session Recording', regex: /fullstory\.com\/s\/fs\.js|\bFS\.identify\b/i },
  { name: 'AdSense / Google Ads', regex: /pagead2\.googlesyndication\.com|adservice\.google\.com/i },
  { name: 'Browser Fingerprinting', regex: /getVisitorId|FingerprintJS\.load/i },
];

let errors = [];

// Step A: Check package.json dependencies
console.log('🔍 Checking package.json for unauthorized trackers or ad SDKs...');
const pkgPath = path.join(rootDir, 'package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  for (const dep of Object.keys(allDeps)) {
    for (const forbidden of FORBIDDEN_PACKAGES) {
      if (dep === forbidden || dep.startsWith(forbidden + '/')) {
        errors.push(`[Dependency Error] Forbidden tracking package found in package.json: "${dep}". Child privacy policy strictly prohibits analytics/ad packages.`);
      }
    }
  }
}

// Step B: Recursively scan source code & HTML files
console.log('🔍 Scanning source code and HTML templates for tracker signatures...');
const scanDirs = ['src', 'public'];
const scanFiles = ['index.html'];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip comments in check script itself
    if (filePath.includes('check-privacy.js')) return;

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.regex.test(line)) {
        const relPath = path.relative(rootDir, filePath);
        errors.push(`[Source Code Error] ${pattern.name} signature detected at ${relPath}:${index + 1}\n  >> "${line.trim().slice(0, 100)}"`);
      }
    }
  });
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        walkDir(fullPath);
      }
    } else if (entry.isFile() && /\.(js|ts|tsx|jsx|html|svg)$/.test(entry.name)) {
      scanFile(fullPath);
    }
  }
}

for (const target of scanDirs) {
  walkDir(path.join(rootDir, target));
}

for (const singleFile of scanFiles) {
  const fp = path.join(rootDir, singleFile);
  if (fs.existsSync(fp)) {
    scanFile(fp);
  }
}

// Step C: Evaluation and output
if (errors.length > 0) {
  console.error('\n❌ CHILD PRIVACY CHECK FAILED!');
  console.error('The following privacy violations were detected against PRIVACY_RULES.md:\n');
  errors.forEach((err, i) => {
    console.error(`${i + 1}. ${err}\n`);
  });
  console.error('Action Required: Remove all trackers, analytics SDKs, and ad scripts before building.\n');
  process.exit(1);
} else {
  console.log('\n✅ Child Privacy Check Passed: Zero trackers, analytics SDKs, or ad scripts detected.');
  process.exit(0);
}
