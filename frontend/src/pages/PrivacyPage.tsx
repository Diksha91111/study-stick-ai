import React, { useEffect } from 'react';
import { LegalNavbar } from '../components/layout/LegalNavbar';
import { Link } from 'react-router-dom';
import { LEGAL_LAST_UPDATED, PRIVACY_VERSION } from '../config/legal';
import { ShieldCheck, Lock, Database, Bot, Bell, ArrowRight, Eye, Server } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: 'introduction', title: '1. Introduction' },
    { id: 'collection', title: '2. Information We Collect' },
    { id: 'usage', title: '3. How We Use Your Information' },
    { id: 'ai-processing', title: '4. AI Features and Data Processing' },
    { id: 'uploaded-resources', title: '5. Uploaded Study Materials' },
    { id: 'cookies', title: '6. Cookies and Storage Technologies' },
    { id: 'third-parties', title: '7. Third-Party Service Providers' },
    { id: 'retention', title: '8. Data Retention' },
    { id: 'security', title: '9. Data Security Measures' },
    { id: 'user-rights', title: '10. User Choices and Account Controls' },
    { id: 'student-privacy', title: '11. Student and Age Considerations' },
    { id: 'updates', title: '12. Updates to This Privacy Policy' },
    { id: 'contact', title: '13. Contact Information' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <LegalNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Page Title & Metadata */}
        <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacy Policy • Version {PRIVACY_VERSION}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Privacy Policy
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>Last updated: <strong>{LEGAL_LAST_UPDATED}</strong></span>
            <span>•</span>
            <span>Effective date: <strong>{LEGAL_LAST_UPDATED}</strong></span>
            <span>•</span>
            <Link to="/terms" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
              View Terms & Conditions →
            </Link>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
            This Privacy Policy details what information Study Stick AI collects from students, how that information is utilized to personalize your academic routine, and how your data is protected. We believe in transparent, straightforward explanations of actual application functionality.
          </p>
        </div>

        {/* Content with Table of Contents on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
          {/* Table of Contents */}
          <aside className="lg:col-span-1 hidden lg:block sticky top-24 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] mb-2">
              Table of Contents
            </h3>
            <nav className="space-y-1">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="block py-1 px-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
                >
                  {sec.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Policy Text Body */}
          <div className="lg:col-span-3 space-y-10 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {/* Section 1 */}
            <section id="introduction" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                1. Introduction
              </h2>
              <p>
                Study Stick AI ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy applies to the Study Stick AI platform, web application, and related services.
              </p>
              <p>
                We collect and process personal and academic information strictly to deliver, personalize, and maintain educational tools—such as adaptive study schedules, sleep routines, code playgrounds, learning paths, knowledge graphs, and AI tutoring.
              </p>
            </section>

            {/* Section 2 */}
            <section id="collection" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                2. Information We Collect
              </h2>
              <p>
                We only collect data necessary for providing Study Stick AI functionality:
              </p>

              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                    A. Account & Identity Information
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Your name, email address, password (stored strictly as a secure bcrypt hash; never stored in plaintext), email verification status, and avatar selection.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                    B. Student Academic Profile & Schedule Data
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    College or university name, degree program, academic branch/major, current semester, target competitive exams (e.g., GATE, GRE, JEE), daily study hours targets, timetable slots, and scheduled tasks.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                    C. Sleep & Routine Preferences
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Target sleep duration, typical bedtime, wake time, chronotype classification (e.g. early bird, night owl), and routine notification preferences.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                    D. Learning Activity & Mastery Evidence
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Topic progress (status, attempts, correct answers), practice quiz and final assessment attempt scores, question-by-question responses, SM-2 flashcard review history (repetitions, ease factors, intervals), and code execution attempts in Code Lab.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                    E. AI Assistant Interactions & Uploads
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Conversation prompts, AI tutor mode settings (e.g. Learn, Practice, Exam Mode), and uploaded educational resources (PDFs, study notes) processed for tutoring analysis.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wide">
                    F. Notification & Contact Settings
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Notification preferences for in-app alerts, email reminders, and optional phone numbers provided with explicit opt-in consent for WhatsApp study reminders.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="usage" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                3. How We Use Your Information
              </h2>
              <p>We process collected information for the following specific purposes:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Account Authentication & Verification:</strong> Verifying email identity with 6-digit OTP codes, managing authenticated sessions via secure JWT tokens, and providing password recovery.</li>
                <li><strong>Personalized Planning:</strong> Generating dynamic timetable slots, aligning daily study hours with your college schedule, and reminding you of exam countdowns.</li>
                <li><strong>Adaptive Learning Path & Knowledge Graph:</strong> Calculating real mastery scores, detecting concept weaknesses, and determining prerequisite eligibility.</li>
                <li><strong>Notifications & Reminders:</strong> Dispatching in-app alerts, email study reminders, and scheduled exam alerts according to your settings.</li>
                <li><strong>Service Improvement & Security:</strong> Preventing brute-force attacks, detecting duplicate submissions, and ensuring platform stability.</li>
              </ul>
              <p className="font-semibold text-slate-900 dark:text-white">
                We do not sell your personal data or academic performance to advertisers or data brokers.
              </p>
            </section>

            {/* Section 4 */}
            <section id="ai-processing" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                4. AI Features and Data Processing
              </h2>
              <p>
                Study Stick AI utilizes generative artificial intelligence (Google Gemini API) to provide intelligent features such as conversational tutoring, concept explanations, and code diagnostics:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Context Sent to AI:</strong> When you send a message in the AI Study Assistant, your prompt, conversation history, and any attached study resource text are transmitted to the AI provider to generate the pedagogical response.</li>
                <li><strong>No Model Training on Private Account Identifiers:</strong> We do not sell your academic profile to third parties for commercial AI training.</li>
                <li><strong>Safe Context Forwarding:</strong> When clicking "Ask AI" from the Knowledge Graph or Code Lab, only relevant academic context (concept title, error snippet, or mastery level) is passed to help the tutor assist you.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="uploaded-resources" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                5. Uploaded Study Materials
              </h2>
              <p>
                When you upload study materials (such as lecture notes, syllabi, or PDF resources):
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Files are processed locally and on the server solely to extract text and analyze concepts for your student account.</li>
                <li>Uploaded resources are associated exclusively with your authenticated user ID and are not publicly shared or made accessible to other students.</li>
                <li>You may delete uploaded resources at any time through the Study Resources library.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="cookies" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                6. Cookies and Storage Technologies
              </h2>
              <p>
                We use strictly necessary cookies and local storage tokens for security and core functionality:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>HttpOnly Refresh Cookies:</strong> Secure, HttpOnly cookies store your refresh token with restricted paths (`/api/auth`) to prevent malicious JavaScript access (XSS mitigation).</li>
                <li><strong>Short-Lived Access Tokens:</strong> 15-minute access tokens authenticate API requests.</li>
                <li><strong>Local UI Preferences:</strong> Local storage stores non-sensitive UI settings such as your light/dark theme preference.</li>
              </ul>
              <p>
                We do not deploy third-party advertising tracking cookies or cross-site behavioral tracking scripts.
              </p>
            </section>

            {/* Section 7 */}
            <section id="third-parties" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                7. Third-Party Service Providers
              </h2>
              <p>
                We share data with third-party service providers only to the extent necessary to deliver core platform services:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Google Cloud / Gemini API:</strong> Processes educational prompts to generate pedagogical explanations and study advice.</li>
                <li><strong>SMTP Email Infrastructure (Gmail SMTP / Nodemailer):</strong> Transmits transactional OTP verification codes and scheduled study alerts to your email address.</li>
                <li><strong>Official WhatsApp Provider API (Optional):</strong> Transmits study reminders to your phone number only if you explicitly enable WhatsApp notifications.</li>
                <li><strong>Database Infrastructure (MongoDB):</strong> Stores encrypted passwords, hashed tokens, and academic records.</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="retention" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                8. Data Retention
              </h2>
              <p>
                We retain your account details, academic schedules, flashcards, and assessment records for as long as your account remains active to provide continuous progress tracking across academic semesters. Verification OTPs expire automatically within 15 minutes and password reset tokens expire within 1 hour.
              </p>
            </section>

            {/* Section 9 */}
            <section id="security" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                9. Data Security Measures
              </h2>
              <p>
                We implement technical and organizational safeguards to protect your student records:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Cryptographic Hashing:</strong> Passwords are cryptographically hashed using salted bcrypt. OTP verification tokens and refresh tokens are hashed with SHA-256 before database storage. Plaintext passwords and raw tokens are never persisted.</li>
                <li><strong>User-Scoped Authorization:</strong> Every backend endpoint enforces user-level authorization middleware (`requireAuth`), preventing cross-user data access.</li>
                <li><strong>Rate Limiting & Deduplication:</strong> Login and registration endpoints implement submission guards and rate limiting to protect against brute-force attacks.</li>
                <li><strong>Transport Security:</strong> All API communication between the browser and backend is encrypted via HTTPS / TLS.</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section id="user-rights" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                10. User Choices and Account Controls
              </h2>
              <p>You retain direct control over your data within Study Stick AI:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Profile & Goal Updates:</strong> Modify your college details, degree, branch, and target exams at any time in Student Profile.</li>
                <li><strong>Communication Preferences:</strong> Enable or disable email reminders or WhatsApp notifications at any time in Notification Preferences.</li>
                <li><strong>Content Removal:</strong> Delete tasks, timetable slots, flashcards, or uploaded study files directly in the application.</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section id="student-privacy" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                11. Student and Age Considerations
              </h2>
              <p>
                Study Stick AI is built for college students, university learners, and competitive exam candidates. We do not knowingly solicit or collect personal information from children under 13 without verifiable parental or institutional guardian consent. If you believe a child has provided us personal data without consent, please contact us for immediate removal.
              </p>
            </section>

            {/* Section 12 */}
            <section id="updates" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                12. Updates to This Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. When we make material revisions, we will update the version number (currently v{PRIVACY_VERSION}) and request your review and acceptance when you next log in.
              </p>
            </section>

            {/* Section 13 */}
            <section id="contact" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                13. Contact Information
              </h2>
              <p>
                For privacy inquiries, data deletion requests, or questions regarding how your study data is processed, please contact:
              </p>
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                privacy@studystick.ai
              </div>
            </section>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Study Stick AI. Educational Academic Planner & Exam Hub.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors">
              Terms & Conditions
            </Link>
            <span>•</span>
            <Link to="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors">
              Sign In
            </Link>
            <span>•</span>
            <Link to="/signup" className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};
