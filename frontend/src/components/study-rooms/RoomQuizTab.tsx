import React, { useState } from 'react';
import { IRoomQuizSession, RoomRole } from '../../types/studyRoom';
import {
  GraduationCap,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Plus,
  Play,
  Users,
  BarChart2,
  AlertCircle,
} from 'lucide-react';
import { studyRoomService } from '../../services/studyRoomService';

interface RoomQuizTabProps {
  roomId: string;
  quizzes: IRoomQuizSession[];
  userRole: RoomRole;
  currentUserId: string;
  onRefreshQuizzes: () => void;
}

const TOPIC_OPTIONS = [
  'Python Variables & Data Types',
  'Control Flow & Loops',
  'Functions & Scope',
  'Data Structures: Lists & Dicts',
  'Object-Oriented Programming',
  'Arrays & Strings',
  'Linked Lists',
  'Stacks & Queues',
  'Binary Trees & BST',
  'Recursion & Backtracking',
  'Dynamic Programming Basics',
  'Graphs & BFS/DFS',
];

export const RoomQuizTab: React.FC<RoomQuizTabProps> = ({
  roomId,
  quizzes,
  userRole,
  currentUserId,
  onRefreshQuizzes,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [selectedTopic, setSelectedTopic] = useState(TOPIC_OPTIONS[0]);
  const [questionCount, setQuestionCount] = useState(5);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Active quiz taking state
  const [activeQuizToTake, setActiveQuizToTake] = useState<IRoomQuizSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  const canCreate = userRole === 'OWNER' || userRole === 'ADMIN';

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);
    try {
      await studyRoomService.startQuiz(roomId, {
        title: quizTitle.trim() || `${selectedTopic} Challenge`,
        topic: selectedTopic,
        questionCount,
      });
      setIsCreateModalOpen(false);
      setQuizTitle('');
      onRefreshQuizzes();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || 'Failed to generate quiz. Try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartTakingQuiz = (quiz: IRoomQuizSession) => {
    setActiveQuizToTake(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setSubmissionResult(null);
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuizToTake) return;
    setIsSubmitting(true);
    try {
      const answersArray = activeQuizToTake.questions.map((_, idx) =>
        selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1
      );
      const res = await studyRoomService.submitQuiz(roomId, activeQuizToTake._id, answersArray);
      setSubmissionResult(res);
      onRefreshQuizzes();
    } catch (err: any) {
      console.error('Quiz submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Taking active quiz view
  if (activeQuizToTake) {
    const qIndex = currentQuestionIndex;
    const currentQ = activeQuizToTake.questions[qIndex];
    const totalQ = activeQuizToTake.questions.length;
    const isCompleted = !!submissionResult;

    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              {activeQuizToTake.topic}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activeQuizToTake.title}</h3>
          </div>
          <button
            onClick={() => setActiveQuizToTake(null)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Exit Quiz
          </button>
        </div>

        {/* Results Screen */}
        {isCompleted ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">Quiz Completed!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your individual performance has been evaluated.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  {submissionResult.percentage}%
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Correct</span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {submissionResult.correctCount} / {submissionResult.totalQuestions}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Mastery</span>
                <p className="text-xl font-black text-violet-600 dark:text-violet-400">
                  {submissionResult.percentage >= 80 ? 'Mastered' : 'Reviewed'}
                </p>
              </div>
            </div>

            {/* Questions breakdown */}
            <div className="text-left space-y-4 max-h-96 overflow-y-auto pt-4">
              {activeQuizToTake.questions.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Q{idx + 1}. {q.question}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Your answer: <span className="font-semibold">{q.options[userAns] || 'None'}</span>
                    </p>
                    {q.explanation && (
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-2 italic bg-indigo-50/50 dark:bg-indigo-950/30 p-2 rounded-xl">
                        💡 {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setActiveQuizToTake(null)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20"
            >
              Back to Room Quizzes
            </button>
          </div>
        ) : (
          /* Question Taking Screen */
          <div className="space-y-6">
            {/* Progress indicator */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Question {qIndex + 1} of {totalQ}</span>
              <span>{Math.round(((qIndex + 1) / totalQ) * 100)}%</span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                style={{ width: `${((qIndex + 1) / totalQ) * 100}%` }}
              />
            </div>

            <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQ.question}
              </h4>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[qIndex] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => setSelectedAnswers({ ...selectedAnswers, [qIndex]: optIdx })}
                    className={`w-full p-4 rounded-2xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <span>{opt}</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={qIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
              >
                Previous
              </button>

              {qIndex < totalQ - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-40"
                >
                  {isSubmitting ? 'Evaluating...' : 'Submit Assessment'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Group Quizzes & Practice</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Practice questions together. Each student answers individually and receives real evidence.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Start Group Quiz</span>
          </button>
        )}
      </div>

      {/* Quiz List */}
      {quizzes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">No Active Group Quizzes</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {canCreate
              ? 'Launch a topic challenge from the curriculum for room members to test their understanding.'
              : 'The room owner or admin can launch a group quiz.'}
          </p>
          {canCreate && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-xs hover:bg-indigo-100 transition-colors"
            >
              Start First Quiz
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quizzes.map((quiz) => {
            const hasSubmitted = quiz.submissions?.some(
              (s) => (typeof s.userId === 'string' ? s.userId : (s.userId as any)?._id) === currentUserId
            );
            const mySubmission = quiz.submissions?.find(
              (s) => (typeof s.userId === 'string' ? s.userId : (s.userId as any)?._id) === currentUserId
            );

            return (
              <div
                key={quiz._id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                      {quiz.topic}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {quiz.questions?.length || 5} Questions
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {quiz.title}
                  </h4>

                  {/* Room aggregate info */}
                  <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-around text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Participants</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {quiz.aggregate?.participantCount || quiz.submissions?.length || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Score</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {quiz.aggregate?.averageScore ? `${quiz.aggregate.averageScore}%` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Highest</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {quiz.aggregate?.highestScore ? `${quiz.aggregate.highestScore}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {hasSubmitted ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Completed ({mySubmission?.percentage}%)</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Not attempted yet</span>
                  )}

                  <button
                    onClick={() => handleStartTakingQuiz(quiz)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{hasSubmitted ? 'Review' : 'Join Quiz'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Quiz Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Start Group Quiz</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 text-xs text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Select Topic
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                >
                  {TOPIC_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Quiz Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${selectedTopic} Sprint Challenge`}
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Question Count
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value={3}>3 Questions (Quick check)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={8}>8 Questions (Comprehensive)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-40"
                >
                  {isCreating ? 'Generating...' : 'Launch Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
