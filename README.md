# EventSphere — Elite Event Management Platform

A full-stack MERN ticketing platform with real QR-based check-in, Razorpay payments, automated PDF tickets, AI-powered event recommendations, and complete organizer/attendee/admin workflows.

**Live demo:** [cdacb-eventsphere.vercel.app](https://cdacb-eventsphere.vercel.app)

---

## Features

### For attendees
- Browse events by category, city, and price range with pagination
- Interactive seat-grid selection with real-time tier pricing
- Secure payments via Razorpay (test mode supported)
- Real PDF tickets emailed automatically after booking, with a clickable Google Maps link to the venue
- Cryptographically signed QR codes for check-in
- Cancel bookings with automatic refunds and email confirmation
- Waitlist auto-notification when a sold-out event frees up a seat
- Leave and read reviews on event pages
- Real-time in-app notifications (booking confirmed, cancelled, waitlist seat opened, organizer messages)
- Auto-logout after 5 minutes of inactivity for shared-device security

### For organizers
- Create and edit events with banner image upload, ticket tiers, and seat counts
- Dashboard with charts (bookings per event, revenue trend, category breakdown) and CSV export
- QR scanner for check-in, scoped to a specific event to prevent wrong-event check-ins
- Broadcast messages (email + in-app notification) to all confirmed attendees of an event
- View waitlist details (who's waiting, how long) for sold-out events
- Get notified when an attendee cancels their booking

### For admins
- Approve or reject submitted events
- Manage user accounts (activate/deactivate)
- Platform-wide stats: total users, events, bookings, revenue

### Platform-wide
- AI-powered "similar events" recommendations on event pages (via Claude)
- Branded animated splash screen on load
- Dark/light mode
- Rate limiting on login/register to prevent brute-force attacks
- Database-level race-condition protection (two people can't book the same seat simultaneously)
- Fully responsive across mobile, tablet, and desktop

---

## Tech stack

**Frontend:** React 18, Vite, React Router, Tailwind CSS, Chart.js, jsPDF, jsQR
**Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth, bcrypt
**Integrations:** Razorpay (payments), Brevo (transactional email), Claude API (AI recommendations)
**Deployment:** Vercel (frontend), Render (backend), MongoDB Atlas (database)

---

## Project structure

```
EventSphere/
├── backend/
│   ├── config/          # Database connection
│   ├── middleware/       # Auth middleware
│   ├── models/           # Mongoose schemas (User, Event, Booking, Rating, Notification)
│   ├── routes/           # API routes (auth, events, bookings, admin, payments, notifications, ratings)
│   ├── utils/            # Email templates, helpers
│   ├── seed.js           # Database seeding script
│   └── server.js         # Express app entry point
└── frontend/
    ├── public/           # Static assets, fonts, robots.txt, sitemap.xml
    └── src/
        ├── components/   # Navbar, SplashScreen, etc.
        ├── context/      # Auth context
        ├── hooks/        # useResponsive
        ├── pages/        # All route pages
        ├── services/     # API client (axios)
        └── utils/        # Ticket image/PDF generation, confetti animation
```

---

## Getting started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB)
- A [Brevo](https://www.brevo.com) account (free tier) for sending emails
- A [Razorpay](https://dashboard.razorpay.com) account (test mode) for payments

### 1. Clone the repository

```bash
git clone https://github.com/Ajay-Shinde-16/EventSphere.git
cd EventSphere
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
ADMIN_SECRET_KEY=your_admin_registration_key
EMAIL_USER=your_sender_email
BREVO_API_KEY=your_brevo_api_key
RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/` with:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment variables reference

### Backend

| Variable | Description |
|---|---|
| `PORT` | Server port (defaults to 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for signing auth tokens |
| `ADMIN_SECRET_KEY` | Secret key required to register an admin account |
| `EMAIL_USER` | Sender email address shown on outgoing emails |
| `BREVO_API_KEY` | API key from [Brevo](https://www.brevo.com) for sending transactional emails |
| `RAZORPAY_KEY_ID` | Razorpay test/live key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay test/live key secret |
| `FRONTEND_URL` | URL of the deployed frontend (used in email links) |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API (must include `/api` suffix) |

---

## Deployment

This project is deployed with:
- **Frontend:** [Vercel](https://vercel.com) — auto-deploys from the `main` branch
- **Backend:** [Render](https://render.com) — auto-deploys from the `main` branch
- **Database:** [MongoDB Atlas](https://www.mongodb.com/atlas)

When deploying your own instance, set the same environment variables in each platform's dashboard rather than committing a `.env` file.

---

## Testing payments

Razorpay's test mode lets you simulate a full payment flow without real money:

- **Test card:** `4111 1111 1111 1111`, any future expiry, any CVV
- **Test UPI:** `success@razorpay` (instant success, no OTP)

---

## License

This project was built as part of a PGCP AC program at C-DAC Bangalore, 2026.

---

## Author

**Ajay Shinde**
