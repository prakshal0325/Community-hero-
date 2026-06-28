# 🦸 Community Hero

**AI-Powered Hyperlocal Problem Solver** — A full-stack civic engagement platform that empowers citizens to report community issues (potholes, garbage, water leakage, etc.), track resolutions, and earn rewards through gamification.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Express](https://img.shields.io/badge/Express-4-green?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-white?logo=socket.io)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4.1-purple?logo=openai)

---

## ✨ Features

- **3 Role-Based Dashboards** — Citizen, Officer, Admin with 20+ pages
- **AI Image Analysis** — Auto-categorize issues, detect duplicates, predict trends
- **AI Chat Assistant** — In-app AI chatbot for platform help
- **Interactive Maps** — Live Leaflet maps with heatmap and nearby detection
- **Gamification** — Points, XP, levels, streaks, badges, challenges, leaderboard
- **Real-Time** — Socket.IO for live complaint updates and notifications
- **Email Notifications** — Nodemailer with branded templates for OTP, status updates, and welcome emails
- **Google OAuth** — Social login alongside email/password + OTP
- **Password Reset** — Full forgot password flow with OTP verification

## 🚀 Quick Start

```bash
# Backend
cd backend && npm install
cp ../.env.example .env  # Edit with your credentials
npx prisma migrate dev --name init && npm run prisma:seed
npm run dev

# Frontend (in a new terminal)
cd frontend && npm install
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **API Docs**: http://localhost:5000/api/docs

## 🔑 Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Citizen | citizen@communityhero.app | Password@123 |
| Officer | officer@communityhero.app | Password@123 |
| Admin | admin@communityhero.app | Password@123 |

## 📁 Structure
```
├── backend/    Express + Prisma + Socket.IO + OpenAI
├── frontend/   Next.js 16 + Tailwind v4 + React Query
└── .env.example
```

See [frontend/README.md](frontend/README.md) for detailed documentation.

## 📜 License
MIT
