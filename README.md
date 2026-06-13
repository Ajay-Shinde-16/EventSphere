# EventSphere — Elite Event Management & Smart Ticketing Platform
**PGCP AC, C-DAC Bangalore 2026 | Developed by Ajay Shinde**

> Full-stack MERN application with AI-powered event suggestions, real QR tickets, role-based auth, and a premium Electric Neo-Noir UI.

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ — [nodejs.org](https://nodejs.org)
- MongoDB 7+ (local) or free Atlas cluster — [mongodb.com/atlas](https://mongodb.com/atlas)
- npm 9+

---

### Step 1 — Backend Setup

```bash
cd backend
npm install
```

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/eventsphere
JWT_SECRET=eventsphere_jwt_secret_2026
ADMIN_SECRET_KEY=ES@Admin#2026$CDAC
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16char_app_password
ANTHROPIC_API_KEY=your_claude_api_key
```

Seed the database (run once):
```bash
node seed.js
```

Start backend:
```bash
npm run dev
# Runs on http://localhost:5000
```

---

### Step 2 — Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@eventsphere.com | admin123 |
| Organizer | org@eventsphere.com | org123 |
| Attendee | user@eventsphere.com | user123 |

**Admin Registration Secret Key:** `ES@Admin#2026$CDAC`

---

## 📧 Email Setup (Gmail)

1. Enable 2-Factor Authentication on Gmail
2. Go to **Google Account → Security → App Passwords**
3. Generate App Password for "Mail"
4. Add the 16-character password to `.env` as `EMAIL_PASS`

---

## 🤖 AI Features (Claude API)

1. Get API key from [console.anthropic.com](https://console.anthropic.com)
2. Add to `.env` as `ANTHROPIC_API_KEY`
3. AI Event Suggestions in Create Event will use real Claude API

Without the key, the app uses smart offline fallbacks — all other features work normally.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS + Custom CSS Variables |
| Routing | React Router DOM 6 |
| HTTP | Axios with JWT interceptors |
| Backend | Express.js 4 |
| Database | MongoDB + Mongoose 8 |
| Auth | JWT + bcryptjs (salt=12) |
| Email | Nodemailer (Gmail SMTP) |
| QR Codes | qrcode (Node.js) |
| Charts | Chart.js 4 |
| AI | Anthropic Claude API |

---

## ✨ Features

- **14 Elite Features:** Countdown timers, waitlist, social share, print tickets, dark/light mode, CSV export, analytics, star ratings, notifications, AI suggestions, attendance certificates, seat simulation, post-event reports, real QR codes
- **Role-Based Access:** Admin / Organizer / Attendee with JWT protection
- **Real QR Tickets:** Scannable with any phone camera (Error Correction Level H)
- **AI Event Suggestions:** Claude-powered title/description generation
- **Analytics Dashboard:** Chart.js bar, doughnut, line charts
- **Attendance Certificate:** Canvas API PNG download
- **Electric Neo-Noir UI:** Glassmorphism, animated borders, bento grid

---

## 📁 Project Structure

```
EventSphere/
├── backend/
│   ├── server.js
│   ├── seed.js
│   ├── .env
│   ├── config/db.js
│   ├── models/ (User, Event, Booking, Rating, Waitlist)
│   ├── routes/ (auth, events, bookings, admin, ratings)
│   ├── middleware/authMiddleware.js
│   └── utils/ (generateToken, sendEmail)
└── frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── App.jsx
        ├── index.css
        ├── context/AuthContext.jsx
        ├── services/api.js
        ├── components/ (Navbar, MobileNav)
        └── pages/ (Home, Auth, EventDetail, MyTickets,
                    OrgDashboard, CreateEvent, ScanQR,
                    AdminDashboard, Profile)
```

---

*Developed with dedication by Ajay Shinde — PGCP AC, C-DAC Bangalore 2026*
