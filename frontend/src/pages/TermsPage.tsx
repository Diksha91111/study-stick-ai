import React, { useEffect } from 'react';
import { LegalNavbar } from '../components/layout/LegalNavbar';
import { Link } from 'react-router-dom';
import { LEGAL_LAST_UPDATED, TERMS_VERSION } from '../config/legal';
import { FileText, Shield, AlertTriangle, ArrowRight, BookOpen, Sparkles } from 'lucide-react';

export const TermsPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    { id: 'introduction', title: '1. Introduction' },
    { id: 'acceptance', title: '2. Acceptance of Terms' },
    { id: 'eligibility', title: '3. Eligibility and User Accounts' },
    { id: 'security', title: '4. Account Security' },
    { id: 'services', title: '5. Study Stick AI Services' },
    { id: 'ai-content', title: '6. AI-Generated Educational Content' },
    { id: 'responsibilities', title: '7. User Responsibilities' },
    { id: 'uploaded-content', title: '8. Uploaded Content and Study Materials' },
    { id: 'acceptable-use', title: '9. Acceptable Use Policy' },
    { id: 'intellectual-property', title: '10. Intellectual Property Rights' },
    { id: 'third-party', title: '11. Third-Party Services and Integrations' },
    { id: 'notifications', title: '12. Notifications and Communications' },
    { id: 'availability', title: '13. Service Availability and Changes' },
    { id: 'disclaimer', title: '14. Disclaimer of Warranties' },
    { id: 'liability', title: '15. Limitation of Liability' },
    { id: 'termination', title: '16. Account Suspension and Termination' },
    { id: 'changes', title: '17. Changes to These Terms' },
    { id: 'contact', title: '18. Contact Information' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <LegalNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Page Title & Metadata */}
        <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
            <FileText className="w-3.5 h-3.5" />
            Terms of Service • Version {TERMS_VERSION}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Terms & Conditions
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>Last updated: <strong>{LEGAL_LAST_UPDATED}</strong></span>
            <span>•</span>
            <span>Effective date: <strong>{LEGAL_LAST_UPDATED}</strong></span>
            <span>•</span>
            <Link to="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
              View Privacy Policy →
            </Link>
          </div>

          {/* Educational Disclaimer Highlight */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Important Educational Notice:</strong> Study Stick AI provides AI-assisted academic planning, coding exercises, and automated study guidance. AI-generated explanations, summaries, and recommendations may occasionally contain inaccuracies or errors. Students should independently verify critical academic syllabus requirements, official university notifications, and exam guidelines with their respective academic institutions.
            </div>
          </div>
        </div>

        {/* Content with Sticky Table of Contents on Desktop */}
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

          {/* Legal Text Body */}
          <div className="lg:col-span-3 space-y-10 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {/* Section 1 */}
            <section id="introduction" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                1. Introduction
              </h2>
              <p>
                Welcome to <strong>Study Stick AI</strong> ("the Service", "we", "us", or "our"). Study Stick AI is an intelligent academic planner, competitive exam companion, and learning platform designed to help students organize tasks, track sleep and study schedules, practice computer science concepts, and interact with an AI study assistant.
              </p>
              <p>
                These Terms & Conditions ("Terms") govern your access to and use of the Study Stick AI web application, services, software, and related features. By accessing or using the Service, you agree to be bound by these Terms.
              </p>
            </section>

            {/* Section 2 */}
            <section id="acceptance" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                2. Acceptance of Terms
              </h2>
              <p>
                By creating an account, clicking "I agree to the Terms & Conditions and Privacy Policy", or by using any part of the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our <Link to="/privacy" className="text-indigo-600 dark:text-indigo-400 hover:underline">Privacy Policy</Link>. If you do not agree with any part of these Terms, you must not access or use the Service.
              </p>
            </section>

            {/* Section 3 */}
            <section id="eligibility" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                3. Eligibility and User Accounts
              </h2>
              <p>
                To use the Service, you must be a student or individual capable of forming a binding agreement or possess parental or guardian consent where required by applicable laws in your jurisdiction.
              </p>
              <p>
                When creating an account, you agree to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Provide accurate, current, and complete registration information, including your real name and valid email address.</li>
                <li>Complete email OTP (one-time passcode) verification to confirm your identity.</li>
                <li>Maintain and promptly update your profile information to keep it accurate.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="security" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                4. Account Security
              </h2>
              <p>
                You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You agree to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Choose a strong, unique password and never share it with any third party.</li>
                <li>Never share OTP codes sent to your email address with anyone.</li>
                <li>Promptly notify us if you discover or suspect any unauthorized access or breach of your account security.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="services" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                5. Study Stick AI Services
              </h2>
              <p>
                The Service offers productivity, organization, and educational features, including:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Unified Planner:</strong> Weekly schedules, academic courses, daily study targets, and exam countdowns.</li>
                <li><strong>Sleep & Routine:</strong> Chronotype detection, sleep schedule tracking, and routine alerts.</li>
                <li><strong>AI Code Lab & Progress:</strong> Multi-language code playground, problem exercises, and execution tracking.</li>
                <li><strong>AI Learning Path & Knowledge Graph:</strong> Adaptive concept prerequisites, mastery mapping, and practice quizzes.</li>
                <li><strong>Spaced Repetition Flashcards:</strong> SM-2 memory retention cards and review scheduling.</li>
                <li><strong>AI Study Assistant:</strong> Pedagogical tutor providing concept explanations, study coaching, and resource analysis.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="ai-content" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                6. AI-Generated Educational Content
              </h2>
              <p>
                The Service incorporates artificial intelligence features powered by generative language models (such as Google Gemini). You acknowledge and agree that:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Possibility of Errors:</strong> Generative AI output may occasionally produce inaccurate, incomplete, or out-of-date answers ("hallucinations").</li>
                <li><strong>Educational Companion:</strong> The AI tutor is an educational aid and does not replace certified human teachers, university professors, or official exam conducting bodies.</li>
                <li><strong>Independent Verification:</strong> You are solely responsible for cross-checking any formulas, exam dates, historical facts, or code snippets generated by the assistant before using them in official exams or academic submissions.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="responsibilities" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                7. User Responsibilities
              </h2>
              <p>
                As a student using the Service, you agree to practice academic honesty. You agree not to use Study Stick AI or its AI study assistant to commit plagiarism, cheat during active proctored examinations, or misrepresent machine-generated work as your own in violation of your school or university policies.
              </p>
            </section>

            {/* Section 8 */}
            <section id="uploaded-content" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                8. Uploaded Content and Study Materials
              </h2>
              <p>
                You may upload study resources, lecture notes, textbook chapters, PDFs, images, or documents for personal analysis in the AI Study Assistant. By uploading content, you represent and warrant that:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>You own the material or possess the necessary rights and permissions to upload and process it.</li>
                <li>The material does not infringe any third party's copyright, intellectual property, or privacy rights.</li>
                <li>The material does not contain malicious code, viruses, or unlawful content.</li>
              </ul>
              <p>
                You retain ownership of all original materials you upload. You grant the Service the limited license required to parse, index, and process your materials solely to deliver study assistance to your account.
              </p>
            </section>

            {/* Section 9 */}
            <section id="acceptable-use" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                9. Acceptable Use Policy
              </h2>
              <p>You agree NOT to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Reverse engineer, decompile, or attempt to extract the source code or proprietary algorithms of the Service.</li>
                <li>Interfere with, disrupt, or place an unreasonable load on the server infrastructure or APIs.</li>
                <li>Attempt to bypass authentication, brute force OTP codes, spoof JWT tokens, or access another student's account.</li>
                <li>Automate requests using unauthorized scraping scripts, bots, or automated crawlers.</li>
                <li>Use the Service for any unlawful, harassing, defamatory, or harmful purposes.</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section id="intellectual-property" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                10. Intellectual Property Rights
              </h2>
              <p>
                The Study Stick AI software, user interface design, logos, icons, curriculum structures, question banks, knowledge graph layout engines, and documentation are the intellectual property of Study Stick AI and its creators. You are granted a personal, non-exclusive, non-transferable, revocable license to access and use the Service for personal, non-commercial educational purposes.
              </p>
            </section>

            {/* Section 11 */}
            <section id="third-party" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                11. Third-Party Services and Integrations
              </h2>
              <p>
                The Service integrates with third-party providers to deliver essential features:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Google Gemini API:</strong> Generates AI pedagogical explanations and study recommendations.</li>
                <li><strong>SMTP Email Services (Nodemailer / Gmail SMTP):</strong> Delivers account verification OTPs, password reset links, and scheduled study reminders.</li>
                <li><strong>Supported WhatsApp Notification APIs:</strong> Dispatches optional study notifications only with explicit user consent.</li>
              </ul>
              <p>
                Your interactions with third-party services are subject to their respective terms and policies. We are not responsible for downtime, rate limiting, or service modifications by third-party providers.
              </p>
            </section>

            {/* Section 12 */}
            <section id="notifications" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                12. Notifications and Communications
              </h2>
              <p>
                By providing your email address, you agree to receive essential transactional communications, including account verification codes and password recovery instructions. You may customize or disable optional academic study reminders, exam countdown alerts, and routine notifications via your Notification Preferences.
              </p>
            </section>

            {/* Section 13 */}
            <section id="availability" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                13. Service Availability and Changes
              </h2>
              <p>
                We continuously refine and improve the Service. We reserve the right to modify, update, suspend, or discontinue any feature, question bank, or curriculum module at any time without prior liability. We do not guarantee uninterrupted, error-free, or 100% uptime operation.
              </p>
            </section>

            {/* Section 14 */}
            <section id="disclaimer" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                14. Disclaimer of Warranties
              </h2>
              <p className="uppercase text-xs font-semibold text-slate-500 dark:text-slate-400">
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT USE OF THE SERVICE WILL ENSURE ADMISSION TO ANY COLLEGE, PASSING OF ANY EXAM, OR SPECIFIC ACADEMIC GRADES.
              </p>
            </section>

            {/* Section 15 */}
            <section id="liability" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                15. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law, in no event shall Study Stick AI, its developers, or contributors be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, loss of academic opportunity, or personal distress resulting from your access to or inability to use the Service.
              </p>
            </section>

            {/* Section 16 */}
            <section id="termination" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                16. Account Suspension and Termination
              </h2>
              <p>
                We reserve the right to suspend or terminate your account and access to the Service if you violate these Terms, engage in fraudulent activity, or abuse system resources. You may discontinue use of the Service at any time.
              </p>
            </section>

            {/* Section 17 */}
            <section id="changes" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                17. Changes to These Terms
              </h2>
              <p>
                We may revise these Terms periodically to reflect updates in functionality, legal requirements, or security best practices. When material updates are made, we will increment the policy version (currently v{TERMS_VERSION}) and require explicit renewed acceptance upon your next login. Your continued use of the Service following policy acceptance constitutes your agreement to the modified Terms.
              </p>
            </section>

            {/* Section 18 */}
            <section id="contact" className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                18. Contact Information
              </h2>
              <p>
                If you have questions, feedback, or concerns regarding these Terms & Conditions, please contact us through our educational support email:
              </p>
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                support@studystick.ai
              </div>
            </section>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Study Stick AI. Educational Academic Planner & Exam Hub.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors">
              Privacy Policy
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
