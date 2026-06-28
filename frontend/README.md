# 🦸 Community Hero

**AI-Powered Hyperlocal Problem Solver** — A full-stack civic engagement platform that empowers citizens to report community issues (potholes, garbage, water leakage, etc.), track resolutions, and earn rewards through gamification.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Express](https://img.shields.io/badge/Express-4-green?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-white?logo=socket.io)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4.1-purple?logo=openai)

---

## ✨ Features

### 🏛️ Three Role-Based Dashboards
- **Citizen** — Report issues, vote, comment, track complaints, view leaderboard
- **Officer** — Manage assigned complaints, update status, view analytics
- **Admin** — User management, departments, rewards, audit logs, system settings

### 🤖 AI Integration
- **Image Analysis** — Upload a photo and AI auto-categorizes the issue, assigns severity, and estimates cost/time
- **Duplicate Detection** — AI identifies near-duplicate complaints within a radius
- **Chat Assistant** — In-app AI chatbot for help navigating the platform
- **Predictive Analytics** — AI-powered predictions for area-based issue forecasting

### 🗺️ Interactive Maps
- Live map with Leaflet showing all complaints
- Heatmap visualization of issue density
- Nearby complaint detection using Haversine formula

### 🏆 Gamification
- Points & XP for reporting, verifying, and resolving issues
- Levels, streaks, badges, and achievements
- Daily/weekly/monthly challenges
- Community leaderboard

### 🔔 Real-Time
- Socket.IO for live complaint updates, comments, and votes
- Push notifications for status changes, assignments, and badges
- Notifications page with grouped display and unread badges

### 🔐 Authentication
- Email/password with JWT + refresh tokens
- Google OAuth integration
- OTP-based login and password reset
- Role-based access control

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| **Backend** | Express.js, TypeScript, Prisma ORM |
| **Database** | PostgreSQL |
| **Real-Time** | Socket.IO |
| **AI** | OpenAI GPT-4.1 |
| **Image Storage** | Cloudinary |
| **Email** | Nodemailer (SMTP) |
| **Maps** | Leaflet + React-Leaflet |
| **Charts** | Recharts |
| **State** | Zustand, React Query |
| **Auth** | JWT, bcrypt, Google OAuth |
| **Validation** | Zod |
| **API Docs** | Swagger (OpenAPI 3.0) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **PostgreSQL** ≥ 14
- **npm** or **pnpm**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/community-hero.git
cd community-hero
```

### 2. Setup Backend
```bash
cd backend
cp ../.env.example .env
# Edit .env with your database URL and API keys
npm install
npx prisma migrate dev --name init
npm run prisma:seed    # Seeds demo users and data
npm run dev
```

The backend runs at **http://localhost:5000** with API docs at **http://localhost:5000/api/docs**.

### 3. Setup Frontend
```bash
cd frontend
cp .env.local.example .env.local
# Ensure NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
npm install
npm run dev
```

The frontend runs at **http://localhost:3000**.

### 4. Demo Accounts (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Citizen | citizen@communityhero.app | Password@123 |
| Officer | officer@communityhero.app | Password@123 |
| Admin | admin@communityhero.app | Password@123 |

---

## 📁 Project Structure

```
community-hero/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (15 models)
│   │   └── seed.ts             # Demo data seed
│   └── src/
│       ├── config/             # Database, Cloudinary, OpenAI, env
│       ├── controllers/        # 9 controllers (auth, complaint, admin, chat, etc.)
│       ├── middlewares/        # Auth, error handling, rate limiting, upload, validation
│       ├── routes/             # Express routes with Swagger docs
│       ├── services/           # Business logic (AI, auth, complaints, email, gamification)
│       ├── socket/             # Socket.IO setup with rooms and auth
│       └── index.ts            # Server entry point
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx                # Landing page
│       │   ├── login/                  # Login with Google OAuth + demo
│       │   ├── register/               # Registration
│       │   ├── forgot-password/        # Password reset flow
│       │   └── dashboard/
│       │       ├── layout.tsx          # Sidebar, header, role menus
│       │       ├── citizen/            # 6 pages (overview, report, complaints, map, leaderboard, profile)
│       │       ├── officer/            # 4 pages (overview, complaints, map, analytics)
│       │       ├── admin/              # 7 pages (overview, users, departments, rewards, analytics, logs, settings)
│       │       ├── chat/               # AI assistant chat
│       │       └── notifications/      # Notifications center
│       ├── components/
│       │   └── providers.tsx           # Theme, Auth, Socket, React Query
│       └── lib/
│           ├── api.ts                  # Axios client with interceptors
│           ├── auth-context.tsx        # Auth state management
│           ├── socket.ts              # Socket.IO client + hooks
│           └── utils.ts               # Formatters, colors, helpers
└── .env.example                        # Environment variables template
```

---

## 🔑 Environment Variables

See [.env.example](.env.example) for the full list. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for JWT signing |
| `OPENAI_API_KEY` | ⚡ | Required for AI features |
| `CLOUDINARY_*` | ⚡ | Required for image uploads |
| `SMTP_USER/SMTP_PASS` | ⚠️ | For email (falls back to console log) |
| `GOOGLE_CLIENT_ID` | ⚠️ | For Google OAuth |

---

## 📖 API Documentation

With the backend running, visit:
- **Swagger UI**: http://localhost:5000/api/docs
- **OpenAPI JSON**: http://localhost:5000/api/docs.json
- **Health Check**: http://localhost:5000/api/v1/health

---

## 📜 License

This project is open source under the [MIT License](LICENSE).
