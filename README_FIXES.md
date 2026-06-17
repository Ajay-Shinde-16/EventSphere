# EventSphere — Fixed Version

## Changes Made

### 🔧 Critical Bug Fixes

1. **Dark Mode Fix (AuthContext.jsx)**
   - Previous: `applyTheme` was setting `data-theme="dark"` which overwrote the default dark CSS variables
   - Fixed: Dark mode now removes the `data-theme` attribute (CSS `:root` is already dark by default), Light mode sets `data-theme="light"`
   - Dark mode is now properly enforced as default on ALL devices

2. **Bottom Nav Removed (App.jsx)**
   - Removed the `<MobileNav />` (Events / Tickets / Profile bar) from the app shell completely

3. **Tailwind Config Fixed (tailwind.config.js)**
   - Removed `darkMode: 'class'` which was conflicting with the CSS variable theme system
   - Added `xs` breakpoint (360px) for extra-small devices
   - This ensures `md:hidden`, `hidden md:flex` etc. all work correctly

### 📱 Responsive Fixes

4. **EventDetail.jsx**
   - Added `useResponsive` hook
   - Booking grid now stacks to single column on mobile
   - Outer padding is compact on mobile: `16px 12px 24px`
   - Hero section inner padding scales down

5. **MyTickets.jsx**
   - Ticket modal now stacks vertically on small screens
   - QR stub row direction changes on mobile
   - Modal overlay padding reduces from 24px to 12px on mobile
   - Ticket left panel minHeight reduced on mobile

6. **EventsBrowse.jsx**
   - Removed Windows CRLF line endings
   - Search bar wraps on mobile
   - Filter bar padding reduced on mobile
   - H1 font size scales down on mobile

7. **Home.jsx**
   - Bottom padding reduced (removed 80px for deleted bottom nav)
   - Hero H1 uses fluid `clamp()` sizing
   - Stats bar items show proper borders in 2x2 grid on mobile

8. **Auth.jsx**
   - Top padding reduced from `80px` to `32px`

9. **AdminDashboard.jsx / OrgDashboard.jsx**
   - Main content area now has `overflow: hidden` to prevent horizontal blowout
   - Content padding compact on mobile

10. **Navbar.jsx**
    - Inner container padding reduced to `0 12px` for better mobile fit

### 🎨 CSS Overhaul (index.css)

- Added `min-height: 100dvh` for proper mobile viewport height
- Added `-webkit-font-smoothing: antialiased`
- Added `appearance: none` to form inputs for iOS consistency
- `font-size: 16px !important` on inputs to prevent iOS auto-zoom
- `pills-scroll` class now uses `flex-wrap: nowrap` properly
- `table-wrap` with horizontal scroll
- `modal-inner` responsive class at 600px
- `hero-btns` class for stacking CTA buttons on mobile
- Back-to-top positioned for no-nav layout (24px from bottom)
- New `@media (max-width: 360px)` for tiny screens
- All breakpoints: 360, 480, 640, 768, 900, 1024px

## Installation

```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (separate terminal)
cd backend
npm install
node server.js
```
