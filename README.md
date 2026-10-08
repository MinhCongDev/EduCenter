# EduCenter – Training Center Management System

A modern, centralized Training Center Management System built with the **MERN** stack (MongoDB, Express, React, Node.js) and TypeScript.

---

## 🏗️ Architecture Overview

```
EduCenter/
├── backend/         # Node.js + Express + TypeScript REST API
├── frontend/        # React + TypeScript + Vite SPA
└── docs/            # Project documentation
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v20+ (tested with v22.15.1)
- **npm** v10+
- **MongoDB** v7+ (local or Atlas)

---

### 1. Clone and setup

```bash
# Repository is already initialized
cd EduCenter
```

---

### 2. Backend Setup

```bash
cd backend

# Copy environment variables
copy .env.example .env
# Then edit .env and set MONGODB_URI and JWT_SECRET

# Install dependencies
npm install

# Run in development mode
npm run dev
```

Backend will start at: **http://localhost:5000**

Health check: **http://localhost:5000/api/health**

---

### 3. Frontend Setup

```bash
cd frontend

# Copy environment variables (already done in Phase 1)
# .env is pre-configured for local development

# Install dependencies (already done)
npm install

# Run in development mode
npm run dev
```

Frontend will start at: **http://localhost:5173**

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/educenter` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | *(required)* |
| `JWT_EXPIRES_IN` | JWT access token TTL | `7d` |
| `JWT_REFRESH_SECRET` | JWT refresh signing secret | *(required)* |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `30d` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `VITE_APP_NAME` | Application name | `EduCenter` |

---

## 🧩 Technology Stack

### Backend
- **Runtime**: Node.js v22+
- **Framework**: Express 4
- **Language**: TypeScript 5
- **Database**: MongoDB + Mongoose 8
- **Auth**: JWT + bcryptjs
- **Validation**: Zod
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 19 + TypeScript
- **Build**: Vite 8
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios
- **Linting**: ESLint 10 + TypeScript-ESLint

---

## 👥 User Roles

| Role | Description |
|---|---|
| `STUDENT` | Enrolled students – enroll in classes, view grades, submit assignments |
| `TEACHER` | Instructors – manage classes, create assignments, record attendance |
| `TRAINING_STAFF` | Admin staff – manage all entities, process enrollments and requests |
| `DIRECTOR` | Management – view dashboards and reports, monitor operations |

---

## 📡 API Endpoints

| Module | Base Path |
|---|---|
| Auth | `/api/auth` |
| Users | `/api/users` |
| Students | `/api/students` |
| Teachers | `/api/teachers` |
| Staff | `/api/staff` |
| Courses | `/api/courses` |
| Classes | `/api/classes` |
| Enrollments | `/api/enrollments` |
| Schedules | `/api/schedules` |
| Attendance | `/api/attendance` |
| Assignments | `/api/assignments` |
| Submissions | `/api/submissions` |
| Payments | `/api/payments` |
| Feedback | `/api/feedback` |
| Announcements | `/api/announcements` |
| Notifications | `/api/notifications` |
| Reports | `/api/reports` |
| Health | `/api/health` |

---

## 🗺️ Frontend Routes

### Public (Guest)
| Route | Page |
|---|---|
| `/` | Home |
| `/courses` | Course Catalog |
| `/announcements` | Announcements |
| `/login` | Login |
| `/register` | Register |

### Student (protected)
| Route | Page |
|---|---|
| `/student/dashboard` | Dashboard |

### Teacher (protected)
| Route | Page |
|---|---|
| `/teacher/dashboard` | Dashboard |

### Training Staff (protected)
| Route | Page |
|---|---|
| `/staff/dashboard` | Dashboard |

### Director (protected)
| Route | Page |
|---|---|
| `/director/dashboard` | Dashboard |

---

## 📋 Development Phases

| Phase | Status | Description |
|---|---|---|
| **Phase 1** | ✅ Complete | Project setup, configuration, health check, basic routing |
| **Phase 2** | 🔜 Pending | MongoDB data model design and Mongoose models |
| **Phase 3** | 🔜 Pending | Authentication, JWT, RBAC, user management |
| **Phase 4** | 🔜 Pending | Students, teachers, staff, courses, classes, enrollments, schedules |
| **Phase 5** | 🔜 Pending | Attendance, assignments, submissions, academic results |
| **Phase 6** | 🔜 Pending | Payment processing and gateway abstraction |
| **Phase 7** | 🔜 Pending | Feedback, announcements, notifications |
| **Phase 8** | 🔜 Pending | Director dashboard and management reports |
| **Phase 9** | 🔜 Pending | Full frontend integration and role-based UI |
| **Phase 10** | 🔜 Pending | Testing, documentation, error handling, final cleanup |

---

## 🏥 Health Check

```bash
GET http://localhost:5000/api/health
GET http://localhost:5000/api/health/ping
```

---

## 📄 License

This project was created for university coursework purposes.
