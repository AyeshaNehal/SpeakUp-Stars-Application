# ⭐ SpeakUp Stars

> A fun, bright, and encouraging web app for kids aged 3 to 12 to practice speaking confidence!

---

## 🚀 Tech Stack
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom kid-friendly theme extensions
- **Animation**: Framer Motion (bouncy springs, kid-friendly transitions)
- **Routing**: React Router DOM (v7)
- **Icons**: Lucide React
- **PWA Ready**: Vite Plugin PWA with web app manifest & service worker

---

## 🎨 Design System

### 1. Typography
- **Headings**: `Fredoka` (Google Fonts) – rounded, bold, ultra-friendly
- **Body**: `Nunito` (Google Fonts) – clean, legible, high clarity for young readers
- **Fluid Sizing**: Clamped responsive font scaling (`clamp(...)`) from 360px mobile to 1280px+ laptop

### 2. Color Palette
- ☀️ **Sunny Yellow**: `#FFD12E` (Energy, joy, stars)
- 🌊 **Sky Blue**: `#38BDF8` (Calm, friendly, open space)
- 🪸 **Coral**: `#FF6B6B` (Excitement, active speaking buttons)
- 🍃 **Mint**: `#3FD094` (Success, encouragement, progress)
- 🔮 **Purple**: `#B388FF` (Magic, rewards, badges)

---

## 📱 Responsive Architecture Rules

| Device Tier | Width | Layout Behaviors |
| :--- | :--- | :--- |
| **Phone** | `360px` – `767px` | Mobile-first single column, fixed bottom navigation bar, **56px minimum touch targets**, safe area insets |
| **Tablet** | `768px` – `1023px` | Adaptive 2-column grids, sticky left navigation rail, expanded topic cards |
| **Laptop / Desktop** | `1024px` – `1280px+` | Persistent tactile left sidebar, centered `max-w-7xl` content, side panels (tips, streaks, rewards), hover physics & keyboard navigation |
| **Orientations** | Portrait & Landscape | Dynamic safe-area padding (`env(safe-area-inset-*)`), fluid flex/grid layouts with zero fixed pixel containers |

---

## 🧩 Reusable Core Components

All components live in [`src/components/common/`](file:///d:/SpeakUp%20Stars/src/components/common):
- [`Button.tsx`](file:///d:/SpeakUp%20Stars/src/components/common/Button.tsx): Tactile 3D buttons with press sink effects, 56px min touch target, spring physics, and color variants (`sunny`, `sky`, `coral`, `mint`, `purple`, `outline`, `ghost`).
- [`Card.tsx`](file:///d:/SpeakUp%20Stars/src/components/common/Card.tsx): Bubbly pastel cards with fluid padding, optional interactive hover lifts, and border accents.
- [`Modal.tsx`](file:///d:/SpeakUp%20Stars/src/components/common/Modal.tsx): Pop-in dialog with backdrop blur, 56px close touch target, keyboard Escape listener, and body scroll locking.
- [`ProgressBar.tsx`](file:///d:/SpeakUp%20Stars/src/components/common/ProgressBar.tsx): Rounded progress bar with animated twinkling star thumb and vibrant gradients.
- [`AppLayout.tsx`](file:///d:/SpeakUp%20Stars/src/components/layout/AppLayout.tsx): Layout controller dynamically rendering [`BottomNav.tsx`](file:///d:/SpeakUp%20Stars/src/components/layout/BottomNav.tsx) on mobile and [`Sidebar.tsx`](file:///d:/SpeakUp%20Stars/src/components/layout/Sidebar.tsx) on desktop.

---

## 🗺️ Routes & Pages

- **`/`**: [`HomePage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/HomePage.tsx) – Daily speaking adventure hero, mission progress, featured topics, and interactive component demo modal.
- **`/wheel`**: [`WheelPage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/WheelPage.tsx) – Interactive spinning topic wheel with category starter prompts.
- **`/record`**: [`RecordPage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/RecordPage.tsx) – Voice recording booth with pulsing mic, animated audio wave bars, and timer.
- **`/results`**: [`ResultsPage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/ResultsPage.tsx) – Confidence score meters, badge unlock celebration, and recording review.
- **`/rewards`**: [`RewardsPage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/RewardsPage.tsx) – Star vault, mystery chest, and earned sticker collection.
- **`/profile`**: [`ProfilePage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/ProfilePage.tsx) – Mascot avatar picker, age tiers (3-5, 6-8, 9-12), and streak stats.
- **`/parent`**: [`ParentDashboardPage.tsx`](file:///d:/SpeakUp%20Stars/src/pages/ParentDashboardPage.tsx) – Parent/Guardian zone with speech analytics, privacy controls, and coaching tips.

---

## 🛠️ Getting Started

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
