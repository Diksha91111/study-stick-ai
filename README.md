# 🎓 Study Stick AI

**Study Stick AI** is an AI-powered personalized study management and learning platform designed to help students **plan, learn, practice, analyze, adapt, and improve** within a single ecosystem.

Traditional study planners usually provide fixed schedules and basic task management. Study Stick AI goes beyond this by combining **academic planning, AI-assisted learning, adaptive learning paths, assessments, progress tracking, collaborative study, knowledge visualization, coding practice, flashcards, reminders, and personalized recommendations**.

The platform continuously uses a student's study activity and learning progress to provide a more personalized learning experience.

> **Plan. Learn. Practice. Analyze. Adapt. Improve.**

---

## 🎯 Problem Statement

Students often use multiple disconnected applications for:

- Study planning
- Timetable management
- Notes and resources
- Revision
- Practice quizzes
- Coding practice
- Progress tracking
- Exam preparation
- Collaborative study
- Reminders
- AI assistance

This fragmentation makes it difficult to understand actual learning progress and maintain a consistent study routine.

**Study Stick AI aims to provide a unified intelligent study ecosystem where planning, learning, practice, assessment, collaboration, and progress tracking work together.**

---

## 💡 Core Idea

The platform follows an adaptive learning cycle:

**Plan → Learn → Practice → Analyze → Adapt → Improve**

Instead of giving every student the same fixed schedule, Study Stick AI is designed around factors such as:

- Student goals
- Available study time
- Academic tasks
- Study schedule
- Learning progress
- Assessment performance
- Revision activity
- Weak concepts
- Upcoming deadlines

These signals can then be used to provide personalized study recommendations and learning experiences.

---

# ✨ Major Features

## 📅 Smart Study Planning

Students can organize their academic activities, tasks, schedules, deadlines, and study goals from one place.

The planning system is designed to help students balance their available study time with their learning priorities.

---

## 🧠 AI Study Assistant

An integrated AI-powered learning assistant helps students interact with their study material using different learning modes.

Supported experiences include:

- Learn
- Explain
- Practice
- Quiz Me
- Exam Mode
- Study Coach

The assistant is designed to support contextual learning rather than acting as a generic chatbot.

---

## 🛤️ Personalized Learning Path

Study Stick AI provides structured learning paths where concepts progress through controlled learning states.

Typical flow:

**Available → Start Learning → In Progress → Learn → Practice → Assessment → Complete**

Prerequisite concepts can remain locked until the required earlier concepts are completed.

Topics are not intended to be marked as mastered simply because they were opened. Completion can be based on actual learning and assessment evidence.

---

## 🕸️ Knowledge Graph

The Knowledge Graph provides a visual representation of the student's learning journey.

It can represent relationships between:

- Subjects
- Topics
- Concepts
- Sub-concepts
- Prerequisites
- Related concepts

Concepts can have states such as:

- Locked
- Available
- Learning
- Weak
- Needs Revision
- Mastered

The goal is to help students understand not only **what they should study next**, but also **what they know, where they are struggling, and how concepts are connected**.

---

## 📝 Quiz & Assessment System

Students can practice concepts using quizzes and assessments.

Assessment information can be used to identify:

- Correct answers
- Incorrect answers
- Scores
- Weak concepts
- Areas requiring revision
- Learning progress

This creates a feedback loop between practice and personalized learning.

---

## 🗂️ Smart Flashcards

Study Stick AI includes flashcards for revision and memory reinforcement.

The flashcard system can support spaced-repetition-based review scheduling so students can focus more frequently on material that requires additional revision.

---

## 💻 AI Code Lab

The integrated Code Lab provides a programming environment for learning and practicing code.

It includes a Monaco-based editor and an AI Programming Assistant with modes such as:

- Explain
- Teach
- Hint
- Debug
- Interview
- Exam

The objective is to help students understand programming concepts and improve problem-solving skills instead of simply generating answers.

---

## 📊 Progress Tracking

Study Stick AI tracks learning-related activity so students can understand their academic progress.

Progress information can include:

- Topics completed
- Assessment performance
- Practice activity
- Flashcard revision
- Learning-path progress
- Study activity
- Weak areas
- Mastery evidence

---

## 👥 Study Rooms

Study Rooms provide collaborative spaces where students can study together.

Study Room functionality is designed around:

- Create or join rooms
- Private/public rooms
- Study goals
- Member roles
- Focus sessions
- Study-room chat
- Shared tasks
- Shared resources
- Group quizzes
- Individual progress
- AI assistance

Collaborative activity does not automatically mean concept mastery. Individual academic progress should continue to depend on valid individual learning or assessment evidence.

---

## 🎧 Focus Audio

Study Rooms can provide optional focus audio for study sessions.

Possible focus environments include:

- Rain
- Ocean
- Forest
- Café ambience
- Fireplace
- Lo-fi focus
- Instrumental focus

Audio preferences are personal so different students can choose the environment they prefer without controlling another student's playback.

---

## 🔔 Smart Notifications

The notification system is designed to help students stay aware of important study activities such as:

- Study sessions
- Tasks
- Deadlines
- Revision
- Learning activities
- Study Room events

Email notification support is integrated using SMTP/Nodemailer.

---

## 📚 Academic & Task Management

Students can manage academic information and study-related tasks from the same application.

This helps connect everyday academic responsibilities with the broader study-planning ecosystem.

---

## ⏳ Exams & Countdowns

Important exams and academic events can be tracked using countdowns, helping students understand how much preparation time remains.

---

## 😴 Sleep & Routine

Study planning is not isolated from the student's routine.

Study Stick AI includes routine-related functionality so study planning can account for a student's available time and daily schedule.

---

## 👤 Student Profile

The Student Profile stores information needed to personalize the learning experience.

The goal is to avoid one fixed study plan for every student and instead create recommendations based on individual study context.

---

# 🔄 Personalized Learning Workflow

A simplified Study Stick AI workflow is:

```text
Student Goals
      +
Available Time
      +
Academic Tasks
      +
Learning Progress
      +
Assessment Results
      +
Revision Activity
      ↓
Study Stick AI
      ↓
Personalized Study Plan
      ↓
Learn
      ↓
Practice
      ↓
Assessment
      ↓
Progress Analysis
      ↓
Adaptation
      ↓
Improved Learning Plan
```

---

# 🏗️ Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide Icons
- Recharts
- Monaco Editor

### Backend

- Node.js
- Express.js
- TypeScript
- REST APIs

### Database

- MongoDB
- Mongoose

### Authentication & Security

- JWT-based authentication
- Access and refresh token architecture
- Password hashing
- Email OTP verification
- Protected API routes
- Role/authorization checks where required

### Email

- Nodemailer
- Gmail SMTP

### Artificial Intelligence

AI services are integrated into learning-oriented features such as:

- Study assistance
- Explanations
- Practice generation
- Quiz assistance
- Learning recommendations
- Programming assistance

---

# 🔐 Authentication Flow

The authentication architecture includes:

```text
Sign Up
   ↓
Terms & Privacy Acceptance
   ↓
Account Creation
   ↓
Email OTP
   ↓
Email Verification
   ↓
Sign In
   ↓
JWT Authentication
   ↓
Protected Application
```

The application also supports refresh-token-based session handling.

---

# 📜 Terms & Privacy

Study Stick AI includes support for:

- Terms & Conditions
- Privacy Policy
- Explicit consent during registration
- Policy-version tracking
- Re-consent architecture for future policy updates

---

# 🎨 User Interface

Study Stick AI follows a responsive SaaS/EdTech design.

### Light Mode

- White
- Lavender
- Soft blue
- Purple accents

### Dark Mode

- Deep navy
- Purple
- Electric blue

The interface uses:

- Responsive layouts
- Rounded cards
- Subtle gradients
- Glass effects
- Clean typography
- Light/Dark themes
- Accessible interaction patterns

---

# 🛡️ Security Principles

The project is designed around important security practices including:

- Backend-protected APIs
- Password hashing
- OTP verification
- JWT authentication
- User-scoped data access
- Environment-variable-based secrets
- Input validation
- Authorization checks
- Secure handling of uploaded resources
- Restricted execution architecture for code-running functionality

Sensitive credentials such as API keys, database credentials, JWT secrets, SMTP App Passwords, and other secrets must **never be committed to the repository**.

---

# 🗃️ High-Level Architecture

```text
                    ┌─────────────────────┐
                    │      Student        │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   React Frontend    │
                    │ TypeScript + Vite   │
                    └──────────┬──────────┘
                               │
                         REST API / Auth
                               │
                    ┌──────────▼──────────┐
                    │ Node/Express Backend│
                    │     TypeScript      │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼─────────────────────┐
          │                    │                     │
          ▼                    ▼                     ▼
      MongoDB              AI Services          Email/SMTP
          │                    │                     │
          ▼                    ▼                     ▼
 Student Data          Personalized AI        OTP/Notifications
 Progress Data         Learning Support
 Study Activity
```

---

# 🚀 Project Vision

The long-term goal of Study Stick AI is to create an intelligent learning ecosystem where students do not need separate applications for planning, learning, practice, revision, coding, collaboration, and progress analysis.

Instead of simply telling students **what to study**, the platform aims to help answer:

- What should I study next?
- What concepts am I weak in?
- What should I revise?
- How am I progressing?
- How should my study plan adapt?
- What should I practice next?

Study Stick AI brings these components together into one personalized learning environment.

---

## ⚠️ AI Disclaimer

AI-generated explanations, recommendations, quizzes, summaries, and other educational content may occasionally contain inaccuracies.

Students should verify important academic information using trusted educational resources.

---

# 🔮 Future Scope

Potential future improvements may include:

- More advanced adaptive-learning models
- Deeper learning analytics
- Improved recommendation systems
- Expanded collaborative learning
- Enhanced Knowledge Graph analytics
- More advanced study-resource retrieval
- Mobile application support
- Additional integrations

---

# 📌 Project Status

**Study Stick AI is under active development.**

Some modules may still be experimental, development-only, or undergoing testing and should not be considered production-ready until their respective security, performance, and deployment requirements have been validated.

---

## ⭐ Study Stick AI

**Plan. Learn. Practice. Analyze. Adapt. Improve.**

An AI-powered ecosystem for smarter and more personalized learning.
