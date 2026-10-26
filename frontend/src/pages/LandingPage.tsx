import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { IntroAnimation } from '../components/intro/IntroAnimation';
import {
  Zap,
  Sparkles,
  ArrowRight,
  Calendar,
  BookOpen,
  TrendingUp,
  Trophy,
  Bell,
  BrainCircuit,
  Compass,
  CheckSquare,
  BarChart2,
  RefreshCw,
  Award,
  Clock,
  Target,
  Menu,
  X,
  Layers,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
  Activity
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen text-slate-900 dark:text-slate-100 font-sans selection:bg-purple-200 selection:text-purple-800 transition-colors duration-500">
      {/* ==================== INTRO SPLASH ANIMATION ==================== */}
      {showIntro && (
        <IntroAnimation onComplete={() => setShowIntro(false)} />
      )}

      {/* ==================== 0. FULL PAGE BACKGROUND & SMOOTH TRANSITION ==================== */}

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Light Mode Background Layer */}
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-in-out ${
            theme === 'light' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: "url('/images/light-study-bg.png')" }}
        />

        {/* Dark Mode Background Layer */}
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ease-in-out ${
            theme === 'dark' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: "url('/images/dark-study-bg.png')" }}
        />

        {/* Soft Glass Overlays for Readability */}
        <div
          className={`absolute inset-0 transition-colors duration-700 ease-in-out ${
            theme === 'dark'
              ? 'bg-slate-950/40 backdrop-blur-[2px]'
              : 'bg-white/40 backdrop-blur-[1px]'
          }`}
        />
      </div>

      {/* Main Content Wrapper (Z-index 10 above fixed background) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ==================== 1. NAVBAR ==================== */}
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-purple-100/60 dark:border-slate-800/60 shadow-sm transition-colors duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            {/* Left: Brand */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  Study Stick
                </span>
                <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-black tracking-wider uppercase shadow-xs">
                  AI
                </span>
              </div>
            </Link>

            {/* Center: Navigation Links (Desktop) */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('ecosystem')}
                className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                About
              </button>
            </div>

            {/* Right: Theme Toggle & Auth Actions (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
              {/* Theme Toggle Button ☀️ / 🌙 */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle Light/Dark Theme"
                className="relative p-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/70 dark:border-slate-700/70 hover:scale-105 transition-all flex items-center gap-1 shadow-inner cursor-pointer"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                    theme === 'light'
                      ? 'bg-white text-amber-500 shadow-sm font-bold scale-100'
                      : 'text-slate-400 opacity-60'
                  }`}
                >
                  ☀️
                </span>
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all duration-300 ${
                    theme === 'dark'
                      ? 'bg-purple-600 text-amber-300 shadow-sm font-bold scale-100'
                      : 'text-slate-500 opacity-60'
                  }`}
                >
                  🌙
                </span>
              </button>

              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-600/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Actions: Theme Toggle & Hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme Mobile"
                className="p-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/70 dark:border-slate-700/70 flex items-center gap-1"
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    theme === 'light' ? 'bg-white text-amber-500 font-bold' : 'opacity-50'
                  }`}
                >
                  ☀️
                </span>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    theme === 'dark' ? 'bg-purple-600 text-amber-300 font-bold' : 'opacity-50'
                  }`}
                >
                  🌙
                </span>
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden px-4 pt-2 pb-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-purple-100 dark:border-slate-800 space-y-3">
              <button
                onClick={() => scrollToSection('hero')}
                className="block w-full text-left py-2 text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400"
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="block w-full text-left py-2 text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="block w-full text-left py-2 text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('ecosystem')}
                className="block w-full text-left py-2 text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400"
              >
                About
              </button>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="w-full text-center py-3 rounded-xl bg-purple-600 text-white font-bold text-sm"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="w-full text-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-700 dark:text-slate-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="w-full text-center py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* ==================== 2. HERO SECTION ==================== */}
        <section id="hero" className="relative py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Content */}
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50/80 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/60 text-xs font-semibold text-purple-700 dark:text-purple-300 shadow-xs backdrop-blur-xs">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 fill-current animate-pulse-subtle" />
                  <span>AI-Powered Study Management</span>
                </div>

                {/* Heading */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                  Your Personal{' '}
                  <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-500 dark:from-purple-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                    AI Study Companion
                  </span>
                </h1>

                {/* Tagline */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm font-bold tracking-wide uppercase">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-100/80 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">Plan</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-100/80 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200">Learn</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-100/80 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">Practice</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-100/80 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200">Analyze</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="px-2.5 py-1 rounded-lg bg-violet-100/80 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200">Adapt</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">Improve</span>
                </div>

                {/* Description */}
                <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                  Study Stick AI helps students organize academics, competitive exam preparation,
                  learning and progress in one intelligent platform.
                </p>

                {/* CTA Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link
                    to="/signup"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-bold text-base shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => scrollToSection('features')}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 font-bold text-base shadow-xs hover:shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Explore Features</span>
                    <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </button>
                </div>
              </div>

              {/* Right Side: Interactive Ecosystem Visual */}
              <div className="lg:col-span-6 relative flex items-center justify-center">
                <div className="relative w-full max-w-lg bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-purple-100 dark:border-slate-800 shadow-2xl shadow-purple-900/10 space-y-5 transition-colors duration-500">
                  {/* Micro Dashboard Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        AI
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Study Stick AI Workspace</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Real-time Student Ecosystem</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Active Sync
                    </div>
                  </div>

                  {/* Grid of Micro Feature Widgets */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* 1. Progress Chart */}
                    <div className="p-3.5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900/50 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-purple-900 dark:text-purple-200">
                        <span>Syllabus Target</span>
                        <TrendingUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="text-xl font-extrabold text-purple-950 dark:text-white">85%</div>
                      <div className="w-full bg-purple-200/60 dark:bg-purple-900/60 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-purple-600 dark:bg-purple-400 h-1.5 rounded-full w-[85%]" />
                      </div>
                      <p className="text-[9px] text-purple-700 dark:text-purple-300 font-medium">Ahead of schedule</p>
                    </div>

                    {/* 2. Target Goal */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-blue-900 dark:text-blue-200">
                        <span>Mock Prep Score</span>
                        <Trophy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-xl font-extrabold text-blue-950 dark:text-white">92 / 100</div>
                      <div className="flex items-center gap-1 text-[9px] text-blue-700 dark:text-blue-300 font-semibold">
                        <Sparkles className="w-3 h-3 text-amber-500" /> Top 5% Percentile
                      </div>
                    </div>
                  </div>

                  {/* 3. Study Plan & Calendar Row */}
                  <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Weekly Schedule Matrix</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                        28 Hours / Wk
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 pt-1">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => (
                        <div
                          key={day}
                          className={`text-center p-1.5 rounded-xl border text-[10px] font-bold ${
                            idx % 2 === 0
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Floating Decorative Task Cards */}
                  <div className="hidden sm:flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 shadow-xl animate-float absolute -top-5 -right-6 z-20 max-w-[200px]">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-extrabold text-slate-900 dark:text-white">Task Completed</div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Self-Study Block + Quiz</div>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-xl animate-float-delayed absolute -bottom-5 -left-6 z-20 max-w-[220px]">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-extrabold text-slate-900 dark:text-white">✨ AI Optimization</div>
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Timetable dynamically adjusted</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 3. FEATURES SECTION ==================== */}
        <section id="features" className="py-20 lg:py-28 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-50/80 dark:bg-purple-950/60 text-xs font-bold text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                <Layers className="w-3.5 h-3.5" />
                <span>Core Capabilities</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Everything You Need to Study Smarter
              </h2>
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-normal">
                Unified tools crafted specifically to help students manage academic commitments,
                competitive preparation, and personalized learning goals.
              </p>
            </div>

            {/* 6 Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: 'Smart Planning',
                  desc: 'Personalized schedules based on goals and available time.',
                  icon: Calendar,
                  color: 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 group-hover:bg-purple-600',
                  border: 'hover:border-purple-300 dark:hover:border-purple-700'
                },
                {
                  title: 'Learning Resources',
                  desc: 'Notes, summaries, flashcards, quizzes and practice.',
                  icon: BookOpen,
                  color: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 group-hover:bg-indigo-600',
                  border: 'hover:border-indigo-300 dark:hover:border-indigo-700'
                },
                {
                  title: 'Progress Tracking',
                  desc: 'Understand your study progress and performance.',
                  icon: TrendingUp,
                  color: 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 group-hover:bg-blue-600',
                  border: 'hover:border-blue-300 dark:hover:border-blue-700'
                },
                {
                  title: 'Competitive Preparation',
                  desc: 'Manage academics and competitive exam preparation together.',
                  icon: Trophy,
                  color: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 group-hover:bg-amber-600',
                  border: 'hover:border-amber-300 dark:hover:border-amber-700'
                },
                {
                  title: 'Smart Reminders',
                  desc: 'Stay on track with tasks, deadlines and study sessions.',
                  icon: Bell,
                  color: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 group-hover:bg-rose-600',
                  border: 'hover:border-rose-300 dark:hover:border-rose-700'
                },
                {
                  title: 'Personalized AI',
                  desc: 'Get recommendations based on your learning progress.',
                  icon: BrainCircuit,
                  color: 'bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 group-hover:bg-violet-600',
                  border: 'hover:border-violet-300 dark:hover:border-violet-700'
                }
              ].map((feat) => {
                const IconComponent = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group space-y-4 ${feat.border}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl ${feat.color} flex items-center justify-center group-hover:scale-110 group-hover:text-white transition-all`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{feat.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== 4. HOW IT WORKS ==================== */}
        <section id="how-it-works" className="py-20 lg:py-28 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50/80 dark:bg-indigo-950/60 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                <Activity className="w-3.5 h-3.5" />
                <span>Step-by-Step Workflow</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                How Study Stick AI Works
              </h2>
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-normal">
                A continuous, intelligent cycle designed for steady retention and goal achievement.
              </p>
            </div>

            {/* Workflow Cards */}
            <div className="relative">
              {/* Connector Line (Desktop) */}
              <div className="hidden lg:block absolute top-1/2 left-4 right-4 h-1 bg-gradient-to-r from-purple-300 via-indigo-400 to-emerald-300 dark:from-purple-900 dark:via-indigo-800 dark:to-emerald-900 -translate-y-1/2 z-0 opacity-60" />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">
                {[
                  {
                    step: '01',
                    title: 'Plan',
                    desc: 'Set schedules and allocate study slots based on your routine.',
                    icon: Compass,
                    color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-900'
                  },
                  {
                    step: '02',
                    title: 'Learn',
                    desc: 'Access structured summaries, notes, and key concepts.',
                    icon: BookOpen,
                    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-900'
                  },
                  {
                    step: '03',
                    title: 'Practice',
                    desc: 'Solve targeted quizzes, flashcards, and mock questions.',
                    icon: CheckSquare,
                    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900'
                  },
                  {
                    step: '04',
                    title: 'Analyze',
                    desc: 'Track study hours, topic mastery, and weak spots.',
                    icon: BarChart2,
                    color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-900'
                  },
                  {
                    step: '05',
                    title: 'Adapt',
                    desc: 'Dynamically adjust timetables when plans change.',
                    icon: RefreshCw,
                    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-900'
                  },
                  {
                    step: '06',
                    title: 'Improve',
                    desc: 'Reach higher retention, better scores, and goal mastery.',
                    icon: Award,
                    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-900'
                  }
                ].map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <div
                      key={item.step}
                      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all space-y-3 flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-black text-slate-400 dark:text-slate-500 font-mono tracking-wider">
                            {item.step}
                          </span>
                          <div className={`w-10 h-10 rounded-2xl border ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 5. AI PERSONALIZATION SECTION ==================== */}
        <section id="ai-personalization" className="py-20 lg:py-28 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-50/80 dark:bg-purple-950/60 text-xs font-bold text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Smart Adaptation Engine</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Personalized AI Intelligence
              </h2>
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-normal">
                How Study Stick AI seamlessly synthesizes your unique inputs into an optimized study roadmap.
              </p>
            </div>

            {/* AI Flow Conversion Diagram */}
            <div className="bg-white/70 dark:bg-slate-900/75 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-purple-100 dark:border-slate-800 shadow-xl max-w-4xl mx-auto space-y-8 transition-colors duration-500">
              {/* Top Inputs Layer */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { title: 'Your Schedule', icon: Calendar },
                  { title: 'Your Goals', icon: Target },
                  { title: 'Your Tasks', icon: CheckSquare },
                  { title: 'Available Time', icon: Clock },
                  { title: 'Your Progress', icon: TrendingUp }
                ].map((inputItem) => {
                  const Icon = inputItem.icon;
                  return (
                    <div
                      key={inputItem.title}
                      className="p-3 bg-white/90 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs text-center space-y-1.5 hover:border-purple-400 transition-all"
                    >
                      <Icon className="w-4 h-4 mx-auto text-purple-600 dark:text-purple-400" />
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{inputItem.title}</div>
                    </div>
                  );
                })}
              </div>

              {/* Downward Arrow */}
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center animate-bounce">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>

              {/* Central AI Node */}
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-600 text-white flex flex-col items-center justify-center shadow-xl shadow-purple-500/30 border-2 border-white/80 dark:border-slate-700">
                    <Sparkles className="w-8 h-8 fill-current text-amber-300 animate-pulse-subtle" />
                    <span className="text-xs font-black uppercase tracking-wider mt-1">✨ AI</span>
                  </div>
                  <div className="absolute -inset-2 bg-purple-500/20 rounded-3xl blur-xl -z-10 group-hover:bg-purple-500/40 transition-all" />
                </div>
              </div>

              {/* Downward Arrow */}
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center animate-bounce">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>

              {/* Result: Personalized Study Plan */}
              <div className="max-w-md mx-auto bg-white/90 dark:bg-slate-800/90 rounded-3xl p-6 border-2 border-purple-500 dark:border-purple-400 shadow-xl shadow-purple-500/10 text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Output Ready
                </div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">Personalized Study Plan</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Optimized study slots, prioritized tasks, collision safeguards, and spaced revision
                  milestones generated automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 6. COMPLETE STUDY ECOSYSTEM ==================== */}
        <section id="ecosystem" className="py-20 lg:py-28 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/60 text-xs font-bold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>Unified Architecture</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Your Complete Study Ecosystem
              </h2>
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-normal">
                A single intelligent platform bringing together all dimensions of your academic life.
              </p>
            </div>

            {/* Radial Ecosystem Diagram */}
            <div className="max-w-4xl mx-auto bg-white/75 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden transition-colors duration-500">
              <div className="flex flex-col items-center justify-center space-y-8">
                {/* Center Core */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white text-center shadow-2xl border border-purple-500/30 max-w-xs">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 mx-auto flex items-center justify-center text-white mb-2 shadow-md">
                    <Zap className="w-6 h-6 fill-current" />
                  </div>
                  <h3 className="text-lg font-black tracking-tight">Study Stick AI</h3>
                  <p className="text-[11px] text-purple-200">Central Intelligence Core</p>
                </div>

                {/* Connected Nodes */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
                  {['Plan', 'Learn', 'Practice', 'Analyze', 'Adapt', 'Improve'].map((node, index) => (
                    <div
                      key={node}
                      className="p-4 rounded-2xl bg-purple-50/80 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/60 text-center hover:bg-purple-600 hover:text-white transition-all duration-300 group shadow-xs cursor-default"
                    >
                      <div className="text-xs font-mono font-bold text-purple-500 dark:text-purple-400 group-hover:text-purple-200 mb-1">
                        0{index + 1}
                      </div>
                      <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-white">
                        {node}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 7. FINAL CTA ==================== */}
        <section className="py-20 relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-8 sm:p-14 text-center shadow-2xl shadow-purple-950/30 border border-purple-700/40 space-y-6">
              {/* Background Glow Orbs */}
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -top-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                  Ready to Study Smarter?
                </h2>
                <p className="text-purple-200 text-sm sm:text-base leading-relaxed">
                  Turn your goals into a personalized study plan with Study Stick AI.
                </p>

                <div className="pt-4 flex justify-center">
                  <Link
                    to="/signup"
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold text-base shadow-xl shadow-purple-500/30 flex items-center gap-2 transition-all transform hover:scale-105"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================== 8. FOOTER ==================== */}
        <footer className="mt-auto bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-md text-slate-400 py-14 border-t border-slate-800 transition-colors duration-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
              {/* Left Brand */}
              <div className="flex flex-col items-center md:items-start gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <span className="font-extrabold text-xl text-white tracking-tight">
                    Study Stick AI
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Plan. Learn. Practice. Analyze. Adapt. Improve.
                </p>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-300">
                <button onClick={() => scrollToSection('hero')} className="hover:text-purple-400 transition-colors">
                  Home
                </button>
                <button onClick={() => scrollToSection('features')} className="hover:text-purple-400 transition-colors">
                  Features
                </button>
                <button onClick={() => scrollToSection('how-it-works')} className="hover:text-purple-400 transition-colors">
                  How It Works
                </button>
                <button onClick={() => scrollToSection('ecosystem')} className="hover:text-purple-400 transition-colors">
                  About
                </button>
                <Link to="/login" className="hover:text-purple-400 transition-colors">
                  Sign In
                </Link>
                <Link to="/signup" className="hover:text-purple-400 transition-colors">
                  Sign Up
                </Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
              <p>© 2026 Study Stick AI. Intelligent Study Management Platform.</p>
              <p className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <span>Built for High Academic & Competitive Performance</span>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
