# TaskFlow — Full Stack Task Management Dashboard

A full-stack personal productivity app built with **React + Vite + Tailwind CSS**, **Node.js + Express**, and **MongoDB**. Manage tasks, notes, links, meetings, a weekly schedule, and a calendar from one dashboard.

---

## Features

- **JWT auth** — register, login, show/hide password, protected routes
- **Tasks** — create, edit, soft-delete, restore; priority, due date, important flag, categories
- **Subtasks** — mini checklist on each task
- **Views** — Today, Upcoming, Important, Calendar, Notes, Links, Meetings, Trash
- **Notes & links** — dedicated note cards and bookmark-style link cards
- **Meetings** — location, meeting link, attendees, time range; optional schedule sync
- **Schedule panel** — weekly day picker and pastel event cards (right panel on desktop; sidebar entry opens a sheet on mobile/tablet)
- **Calendar** — month view with day popup for tasks and events
- **Global search** — find tasks, notes, links, and meetings from the header
- **Sort & filter** — organize task lists by date, priority, and more
- **Sidebar badges** — live counts per section
- **Trash** — soft delete with restore and empty-all
- **Deadline reminders** — upcoming due dates shown on login and every 30 minutes
- **Responsive UI** — collapsible sidebar, mobile-friendly layout

---

## Folder Structure

```
taskflow-vite/
├── frontend/                 # React + Vite
│   ├── index.html
│   ├── vite.config.js        # Dev server :3000 + /api proxy
│   ├── tailwind.config.js
│   ├── .env.example          # VITE_API_URL
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── components/       # Sidebar, TaskRow, modals, Calendar, Schedule, Search…
│       ├── context/          # AuthContext, ToastContext
│       ├── hooks/            # useTasks, useSchedule, useCounts
│       ├── pages/            # Dashboard, Login, Register
│       └── utils/            # API client, helpers
│
├── backend/                  # Express API
│   ├── controllers/
│   ├── middleware/           # Auth protect, error handler
│   ├── models/               # User, Task, Schedule
│   ├── routes/               # auth, tasks, schedule
│   ├── index.js
│   └── .env.example
│
├── package.json              # Root scripts (concurrently)
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm

### 1. Environment variables

**Backend** (`backend/.env` — copy from `.env.example`):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**Frontend** (`frontend/.env` — copy from `.env.example`):

```env
VITE_API_URL=http://localhost:5000/api
```

Vite env vars must use the `VITE_` prefix and are read via `import.meta.env.VITE_API_URL`.

### 2. Install dependencies

```bash
# From project root
npm run install:all

# Or manually
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 3. Run the app

```bash
npm run dev
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:5000 |

Other scripts:

```bash
npm run frontend   # Vite only
npm run backend    # Express + nodemon only
npm run build      # Production build of the frontend
```

---

## API Endpoints

All `/api/tasks` and `/api/schedule` routes require a Bearer JWT.

| Method | Endpoint                 | Auth | Description                |
|--------|--------------------------|------|----------------------------|
| POST   | `/api/auth/register`     | No   | Register                   |
| POST   | `/api/auth/login`        | No   | Login (returns JWT)        |
| GET    | `/api/auth/me`           | Yes  | Current user               |
| GET    | `/api/tasks`             | Yes  | List tasks (incl. trash)   |
| GET    | `/api/tasks/counts`      | Yes  | Sidebar badge counts       |
| POST   | `/api/tasks`             | Yes  | Create task / note / link  |
| PUT    | `/api/tasks/:id`         | Yes  | Update                     |
| DELETE | `/api/tasks/:id`         | Yes  | Soft or permanent delete   |
| PUT    | `/api/tasks/:id/restore` | Yes  | Restore from trash         |
| DELETE | `/api/tasks/trash`       | Yes  | Empty all trash            |
| GET    | `/api/schedule`          | Yes  | List schedule events       |
| POST   | `/api/schedule`          | Yes  | Create event               |
| PUT    | `/api/schedule/:id`      | Yes  | Update event               |
| DELETE | `/api/schedule/:id`      | Yes  | Soft or permanent delete   |
| PUT    | `/api/schedule/:id/restore` | Yes | Restore event            |
| GET    | `/api/health`            | No   | Health check               |

Auth login/register are rate-limited (30 requests / 15 min).

---

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS, Axios, React Router v6 |
| Backend  | Node.js, Express, Helmet, CORS, rate limiting   |
| Database | MongoDB, Mongoose                               |
| Auth     | JWT, bcryptjs                                   |
| Dev      | concurrently, nodemon                           |
