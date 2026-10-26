# Study Stick AI ⚡
> Intelligent Study Management Platform for College Students Balancing Academics + Competitive Exams (GATE, UPSC, MPSC, SSC, etc.)

---

## 🌟 Overview

**Study Stick AI** solves the dual-pressure dilemma faced by engineering and college students who must simultaneously maintain university GPA (lectures, labs, semester assignments, practical vivas, midterms) and prepare for high-stakes competitive examinations.

### Built in 4 Strategic Phases

- **Phase 1 (Completed & Verified)**:
  - Full JWT Authentication (Access + Refresh token rotation + bcrypt)
  - Student Academic Profile (College, Degree, Branch, Semester, Competitive Exam Aspirations)
  - College Timetable & Weekly Study Slots Grid
  - Circadian Sleep Schedule & Automatic Collision Guard (flags any lecture/study slot encroaching on rest hours)
  - Academic Entities: Subjects with syllabus completion %, Assignments, Capstone Projects (with milestone checklists), and Lab Practicals (with viva preparedness tracking)
  - Real-time countdowns for urgent deadlines and upcoming exams
  - Modern, responsive student dashboard with dark/light mode
- **Phase 2 (Next)**:
  - Competitive exam goal engine (GATE, UPSC, MPSC, SSC, etc.)
  - AI personalized daily/weekly study schedule balancing college + exam prep
  - Automatic rescheduling of missed tasks
  - AI Notes, summaries, flashcards, quizzes, PYQs and mock test generation
  - Spaced repetition (SM-2 algorithm) & AI study assistant
- **Phase 3**:
  - Study-hour tracking, weak-topic detection, workload & procrastination prediction, What-if study simulator
- **Phase 4**:
  - Knowledge graph & prerequisite detection, gamification, peer study groups & accountability

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Recharts, Axios
- **Backend**: Node.js, Express, TypeScript, Zod, Mongoose
- **Database**: MongoDB (Local or MongoDB Atlas)
- **Authentication**: JWT Access Token (15m) + Refresh Token (7d) with automatic rotation

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB instance (running locally on port 27017 or a MongoDB Atlas URI)

### 1. Backend Setup
```bash
cd backend
npm install
npm run seed       # Seeds demo student Priya Sharma (priya.sharma@studystick.ai / Password123!)
npm run dev        # Starts Express TypeScript server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
```

### 3. Run Automated Tests
```bash
cd backend
npm run test:phase1
```

---

## 🔐 Demo Credentials
- **Email**: `priya.sharma@studystick.ai`
- **Password**: `Password123!`
*(Or click the "Auto-fill Test Credentials" button on the login screen)*
