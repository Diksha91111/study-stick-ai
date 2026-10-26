import React, { useState, useEffect } from 'react';
import { 
  learningPathService, 
  LearningPathData, 
  TopicContent, 
  QuizQuestion, 
  QuizSubmissionResult 
} from '../services/learningPathService';
import { 
  Network, 
  Map, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BookOpen, 
  BrainCircuit, 
  Target, 
  CheckCircle, 
  Layers,
  ArrowLeft,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  RotateCcw,
  Code2,
  ListChecks,
  Check,
  Send,
  Lock,
  Play
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const LearningPathPage: React.FC = () => {
  const [data, setData] = useState<LearningPathData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Workflow states
  const [viewMode, setViewMode] = useState<'overview' | 'learning' | 'quiz' | 'result'>('overview');
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  // Topic Content states
  const [topicContent, setTopicContent] = useState<TopicContent | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Quiz states
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null);

  // AI Tutor in workspace
  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorAnswer, setTutorAnswer] = useState('');
  const [isAskingTutor, setIsAskingTutor] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await learningPathService.getPath();
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load learning path');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openLearningWorkspace = async (topic: string) => {
    setActiveTopic(topic);
    setViewMode('learning');
    setIsLoadingContent(true);
    setTutorAnswer('');
    setTutorQuestion('');
    try {
      const content = await learningPathService.getTopicContent(topic);
      setTopicContent(content);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load topic content');
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleStartTopic = async (topic: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const result = await learningPathService.startTopic(topic);
      setData(result);
      await openLearningWorkspace(topic);
    } catch (err: any) {
      const code = err.response?.data?.data?.code;
      if (code === 'DUPLICATE_KEY_CONFLICT' || code === 'TOPIC_ALREADY_STARTED') {
        // Idempotent recovery
        await loadData();
        await openLearningWorkspace(topic);
      } else {
        alert(err.response?.data?.message || 'Failed to start topic');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAcceptChallenge = async (recId: string, topic: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const result = await learningPathService.updateRecommendation(recId, 'accepted');
      setData(result);
      await openLearningWorkspace(topic);
    } catch (err: any) {
      const code = err.response?.data?.data?.code;
      if (code === 'DUPLICATE_KEY_CONFLICT' || code === 'TOPIC_ALREADY_STARTED') {
        await loadData();
        await openLearningWorkspace(topic);
      } else {
        alert(err.response?.data?.message || 'Failed to accept challenge');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDismissRecommendation = async (recId: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const result = await learningPathService.updateRecommendation(recId, 'dismissed');
      setData(result);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dismiss');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartPracticeQuiz = async () => {
    if (!activeTopic) return;
    setViewMode('quiz');
    setIsLoadingQuiz(true);
    setQuizAnswers({});
    setQuizResult(null);
    try {
      const questions = await learningPathService.generateAssessment(activeTopic);
      setQuizQuestions(questions);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to load practice quiz');
      setViewMode('learning');
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeTopic || isSubmittingQuiz) return;
    
    // Check if user answered questions
    const answeredCount = Object.keys(quizAnswers).length;
    if (answeredCount < quizQuestions.length) {
      const confirmSubmit = window.confirm(
        `You have answered ${answeredCount} of ${quizQuestions.length} questions. Unanswered questions will be marked incorrect. Submit now?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmittingQuiz(true);
    try {
      const userAnswers = quizQuestions.map(q => ({
        questionId: q.id,
        selectedAnswer: quizAnswers[q.id] || ''
      }));

      const result = await learningPathService.submitAssessment(activeTopic, userAnswers, 5);
      setQuizResult(result);
      // Synchronize path, states and progress
      if (data && (result as any).path) {
        setData({
          ...data,
          path: (result as any).path,
          states: result.states,
          progressList: result.progressList
        });
      } else {
        await loadData();
      }
      setViewMode('result');
    } catch (err: any) {
      const code = err.response?.data?.data?.code;
      if (code === 'ASSESSMENT_ALREADY_SUBMITTED') {
        await loadData();
        setViewMode('overview');
      } else {
        alert(err.response?.data?.message || 'Failed to submit quiz');
      }
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  const handleAskTutor = async () => {
    if (!activeTopic || !tutorQuestion.trim() || isAskingTutor) return;
    setIsAskingTutor(true);
    try {
      const answer = await learningPathService.askAITutor(activeTopic, tutorQuestion.trim());
      setTutorAnswer(answer);
    } catch (err: any) {
      setTutorAnswer('Could not reach AI Tutor. Please try again or check the learning concepts above.');
    } finally {
      setIsAskingTutor(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex items-center gap-3 text-indigo-500">
          <BrainCircuit className="w-8 h-8 animate-pulse" />
          <span className="font-semibold text-lg">Generating personalized path...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100">
          <XCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <h2 className="text-lg font-bold">Failed to load Learning Path</h2>
          <p className="mt-2 text-red-500">{error}</p>
          <button onClick={loadData} className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-semibold transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Active / in-progress recommendation (excluding completed topics)
  const activeRecs = data.path.recommendations.filter(r => {
    const topicStatus = data.states[r.topic]?.status;
    if (topicStatus === 'COMPLETED') return false;
    return r.status === 'pending' || r.status === 'accepted';
  });
  const pendingRec = activeRecs.find(r => r.status === 'pending');
  const inProgressRec = activeRecs.find(r => r.status === 'accepted');
  const completedRecs = data.path.recommendations.filter(r => r.status === 'completed' || data.states[r.topic]?.status === 'COMPLETED');

  // Derive active topic state
  const currentTopicState = activeTopic ? data.states[activeTopic] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            {viewMode !== 'overview' && (
              <button 
                onClick={() => setViewMode('overview')}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors mr-1"
                title="Back to Overview"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <Map className="w-8 h-8 text-indigo-500" />
              Learning Path
            </h1>
          </div>
          <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">
            {viewMode === 'overview' && 'Your personalized AI-curated curriculum, adapted to your current mastery and goals.'}
            {viewMode === 'learning' && `Comprehensive learning workspace for ${activeTopic}. Master the material before attempting the practice quiz.`}
            {viewMode === 'quiz' && `Practice assessment for ${activeTopic}. Passing threshold: 70%.`}
            {viewMode === 'result' && `Practice quiz results and evaluation for ${activeTopic}.`}
          </p>
        </div>
        
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl px-5 py-3 flex items-center gap-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">Current Goal</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{data.path.currentGoal}</p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. OVERVIEW VIEW */}
      {/* ========================================================= */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* IN PROGRESS CARD */}
            {inProgressRec ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                      <span className="relative flex h-3 w-3 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                      </span>
                      CURRENTLY LEARNING
                    </div>
                    {data.states[inProgressRec.topic]?.status === 'NEEDS_REVISION' && (
                      <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Needs Revision
                      </span>
                    )}
                  </div>
                  
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{inProgressRec.topic}</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">{inProgressRec.reason}</p>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 mb-6 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">
                        <BrainCircuit className="w-6 h-6 text-indigo-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">AI Teacher's Advice</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                          "{inProgressRec.aiExplanation || 'Focus on understanding the core concept and how values behave in memory. Complete the practice quiz to master this topic.'}"
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                      <Clock className="w-4 h-4" />
                      Estimated: {inProgressRec.estimatedMinutes || 25} mins
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => openLearningWorkspace(inProgressRec.topic)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                      >
                        Continue Learning →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : pendingRec ? (
              /* UP NEXT / AVAILABLE CARD */
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden relative">
                 <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                 <div className="p-6 sm:p-8">
                   <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold mb-4 text-sm tracking-wider uppercase">
                     <Target className="w-4 h-4" />
                     Up Next
                   </div>
                   
                   <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{pendingRec.topic}</h2>
                   <p className="text-slate-600 dark:text-slate-400 mb-6">{pendingRec.reason}</p>
                   
                   <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-5 mb-6 border border-amber-100 dark:border-amber-900/20">
                     <div className="flex items-start gap-4">
                       <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-amber-200 dark:border-amber-800">
                         <BrainCircuit className="w-6 h-6 text-amber-500" />
                       </div>
                       <div>
                         <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Why this?</h4>
                         <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                           "{pendingRec.aiExplanation || 'This is the logical next step in your curriculum. Accept the challenge to unlock the learning workspace.'}"
                         </p>
                       </div>
                     </div>
                   </div>
   
                   <div className="flex flex-wrap gap-4 items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-6">
                     <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
                       <BookOpen className="w-4 h-4" />
                       Activity: {pendingRec.suggestedActivity}
                     </div>
                     <div className="flex gap-3">
                       <button 
                         onClick={() => handleDismissRecommendation(pendingRec._id)}
                         disabled={isUpdating}
                         className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                       >
                         Dismiss
                       </button>
                       <button 
                         onClick={() => handleAcceptChallenge(pendingRec._id, pendingRec.topic)}
                         disabled={isUpdating}
                         className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg shadow-sm shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                       >
                         {isUpdating ? 'Starting...' : 'Accept Challenge →'}
                       </button>
                     </div>
                   </div>
                 </div>
              </div>
            ) : (
              /* ALL CAUGHT UP */
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 text-center">
                 <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                   <CheckCircle className="w-8 h-8 text-green-500" />
                 </div>
                 <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">You're all caught up!</h2>
                 <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                   All available topics are completed or active. Check the Skill Graph on the right to start or review any available topic.
                 </p>
                 <Link to="/codelab" className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">
                   Go to Code Lab
                 </Link>
              </div>
            )}

            {/* Recent Achievements */}
            {completedRecs.length > 0 && (
               <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Completed Achievements
                  </h3>
                  <div className="space-y-4">
                    {completedRecs.slice(-4).reverse().map(rec => (
                      <div key={rec._id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{rec.topic}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Passed assessment quiz (Score: 70%+)</p>
                          </div>
                        </div>
                        <button
                          onClick={() => openLearningWorkspace(rec.topic)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          Review Material
                        </button>
                      </div>
                    ))}
                  </div>
               </div>
            )}

          </div>

          {/* Sidebar Column: Skill Graph */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-indigo-500" />
                  Skill Graph
                </h3>
                <span className="text-xs text-slate-400 font-medium">9 Core Topics</span>
              </div>
              
              <div className="space-y-4">
                {Object.keys(data.prerequisites || {}).map((topic) => {
                  const topicData = data.states[topic] || { status: 'LOCKED', mastery: null };
                  const { status, mastery } = topicData;
                  
                  const isCompleted = status === 'COMPLETED';
                  const isInProgress = status === 'IN_PROGRESS';
                  const isNeedsRevision = status === 'NEEDS_REVISION';
                  const isAvailable = status === 'AVAILABLE';
                  const isLocked = status === 'LOCKED';

                  return (
                    <div 
                      key={topic} 
                      className={`p-4 rounded-xl border transition-all ${
                        isCompleted 
                          ? 'bg-green-50/40 dark:bg-green-950/20 border-green-200 dark:border-green-900/40' 
                          : isInProgress 
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 shadow-sm ring-1 ring-indigo-500/30'
                          : isNeedsRevision
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                          : isAvailable
                          ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                          : 'bg-slate-50/60 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {isCompleted && (
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {isInProgress && (
                              <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white animate-pulse">
                                <Play className="w-2.5 h-2.5 fill-white" />
                              </div>
                            )}
                            {isNeedsRevision && (
                              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white">
                                <AlertTriangle className="w-3 h-3" />
                              </div>
                            )}
                            {isAvailable && (
                              <div className="w-5 h-5 rounded-full border-2 border-indigo-500 bg-transparent flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                              </div>
                            )}
                            {isLocked && (
                              <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                <Lock className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className={`text-sm font-bold ${isLocked ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                              {topic}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              {isCompleted && (
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                  ✓ Completed {mastery !== null ? `(${mastery}%)` : ''}
                                </span>
                              )}
                              {isInProgress && (
                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                  ▶ In Progress
                                </span>
                              )}
                              {isNeedsRevision && (
                                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                  ⚠️ Needs Revision {mastery !== null ? `(${mastery}%)` : ''}
                                </span>
                              )}
                              {isAvailable && (
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                  ● Available (Not started)
                                </span>
                              )}
                              {isLocked && (
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  🔒 Locked (Prerequisites required)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Direct Start / Open Action */}
                        <div>
                          {isAvailable && (
                            <button
                              onClick={() => handleStartTopic(topic)}
                              disabled={isUpdating}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                            >
                              {isUpdating ? '...' : 'Start Task →'}
                            </button>
                          )}
                          {isInProgress && (
                            <button
                              onClick={() => openLearningWorkspace(topic)}
                              disabled={isUpdating}
                              className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 disabled:opacity-50 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                            >
                              Continue →
                            </button>
                          )}
                          {isNeedsRevision && (
                            <button
                              onClick={() => openLearningWorkspace(topic)}
                              disabled={isUpdating}
                              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 disabled:opacity-50 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                            >
                              Retry →
                            </button>
                          )}
                          {isCompleted && (
                            <button
                              onClick={() => openLearningWorkspace(topic)}
                              className="px-2.5 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold rounded transition-colors"
                            >
                              Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. DETAILED LEARNING WORKSPACE VIEW */}
      {/* ========================================================= */}
      {viewMode === 'learning' && activeTopic && (
        <div className="space-y-8 max-w-5xl mx-auto">
          {isLoadingContent || !topicContent ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex items-center gap-3 text-indigo-500">
                <BrainCircuit className="w-8 h-8 animate-pulse" />
                <span className="font-semibold text-lg">Loading detailed curriculum for {activeTopic}...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Workspace Header Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                      {topicContent.difficulty}
                    </span>
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {topicContent.weightage}
                    </span>
                    <span className="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{topicContent.estimatedMinutes} mins
                    </span>
                  </div>
                  
                  {currentTopicState?.status === 'NEEDS_REVISION' ? (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Needs Revision (Previous score &lt; 70%)
                    </span>
                  ) : currentTopicState?.status === 'COMPLETED' ? (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                      Task In Progress
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
                  {topicContent.title}
                </h1>

                {/* Learning Objectives */}
                <div className="bg-indigo-50/60 dark:bg-indigo-950/20 rounded-xl p-5 border border-indigo-100 dark:border-indigo-900/40 mb-6">
                  <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ListChecks className="w-4 h-4" />
                    Learning Objectives
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {topicContent.objectives.map((obj, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Explanation */}
                <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed text-base">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Detailed Overview</h3>
                  {topicContent.detailedExplanation.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Core Concepts */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                  Core Concepts
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topicContent.coreConcepts.map((concept, idx) => (
                    <div key={idx} className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white text-base mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        {concept.name}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {concept.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Examples */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-indigo-500" />
                  Practical Examples & Code
                </h3>
                <div className="space-y-6">
                  {topicContent.examples.map((ex, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 font-bold text-sm text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                        {ex.title}
                      </div>
                      <pre className="p-4 bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
                        <code>{ex.code}</code>
                      </pre>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700/60">
                        <span className="font-bold text-slate-700 dark:text-slate-200">Explanation: </span>
                        {ex.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Mistakes & Important Points Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Common Mistakes */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-red-100 dark:border-red-950/40 p-6">
                  <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Common Pitfalls & Mistakes
                  </h3>
                  <ul className="space-y-3">
                    {topicContent.commonMistakes.map((mistake, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="text-red-500 font-bold">•</span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Important Key Points */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-950/40 p-6">
                  <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Key Takeaways
                  </h3>
                  <ul className="space-y-3">
                    {topicContent.importantPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Quick Revision Notes */}
              <div className="bg-slate-900 text-white rounded-2xl shadow-sm p-6 sm:p-8">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  Quick Revision Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-300">
                  {topicContent.quickRevision.map((rev, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
                      <span>{rev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ask AI Tutor Section */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-900/40 p-6 sm:p-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-500" />
                  Ask AI Tutor
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Have questions about {activeTopic}? Ask for clarification, edge cases, or memory diagrams.
                </p>

                {/* Suggested prompt chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    `Explain ${activeTopic} with an analogy`,
                    `What are common interview edge cases for ${activeTopic}?`,
                    `Show a step-by-step memory diagram example`
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTutorQuestion(chip)}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-xs font-medium text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tutorQuestion}
                    onChange={(e) => setTutorQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskTutor()}
                    placeholder={`Ask a question about ${activeTopic}...`}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleAskTutor}
                    disabled={isAskingTutor || !tutorQuestion.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-colors"
                  >
                    {isAskingTutor ? <BrainCircuit className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Ask
                  </button>
                </div>

                {tutorAnswer && (
                  <div className="mt-4 p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                    <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-400 mb-2">
                      <Sparkles className="w-4 h-4" />
                      AI Tutor Response:
                    </div>
                    {tutorAnswer}
                  </div>
                )}
              </div>

              {/* Ready for Practice Quiz Banner */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-wrap items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold mb-1">Ready to test your understanding?</h3>
                  <p className="text-indigo-100 text-sm max-w-xl">
                    Take the 6-question practice quiz for {activeTopic}. Score 70% or higher to pass this task and make the next topic available.
                  </p>
                </div>
                <button
                  onClick={handleStartPracticeQuiz}
                  className="px-6 py-3.5 bg-white text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl shadow-md transition-all hover:scale-105 flex items-center gap-2 shrink-0"
                >
                  Start Practice Quiz →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. PRACTICE QUIZ VIEW */}
      {/* ========================================================= */}
      {viewMode === 'quiz' && activeTopic && (
        <div className="space-y-8 max-w-3xl mx-auto">
          {isLoadingQuiz ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex items-center gap-3 text-indigo-500">
                <BrainCircuit className="w-8 h-8 animate-pulse" />
                <span className="font-semibold text-lg">Preparing practice quiz for {activeTopic}...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Quiz Header */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Practice Quiz</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeTopic}</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium">Answered</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {Object.keys(quizAnswers).length} / {quizQuestions.length}
                    </p>
                  </div>
                  <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-100 dark:border-indigo-800">
                    70% to Pass
                  </div>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {quizQuestions.map((q, idx) => (
                  <div key={q.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <span className="px-2.5 py-1 text-xs font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Question {idx + 1}
                      </span>
                      {q.concept && (
                        <span className="text-xs text-slate-400 font-medium">
                          {q.concept}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5 leading-relaxed">
                      {q.questionText}
                    </h3>

                    <div className="space-y-3">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = quizAnswers[q.id] === opt;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectAnswer(q.id, opt)}
                            className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-start gap-3 ${
                              isSelected
                                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-950 dark:text-indigo-200 font-medium ring-2 ring-indigo-500/30'
                                : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <span className="leading-relaxed">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit Action Bar */}
              <div className="sticky bottom-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between gap-4">
                <button
                  onClick={() => setViewMode('learning')}
                  className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  ← Back to Material
                </button>
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmittingQuiz}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-105 flex items-center gap-2"
                >
                  {isSubmittingQuiz ? (
                    <>
                      <BrainCircuit className="w-4 h-4 animate-spin" />
                      Evaluating on Server...
                    </>
                  ) : (
                    <>
                      Submit Quiz →
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. QUIZ RESULT VIEW */}
      {/* ========================================================= */}
      {viewMode === 'result' && quizResult && (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Result Banner */}
          <div className={`rounded-2xl p-6 sm:p-8 shadow-sm border ${
            quizResult.isPass
              ? 'bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent border-green-200 dark:border-green-900/50'
              : 'bg-gradient-to-br from-amber-500/10 via-red-500/5 to-transparent border-amber-200 dark:border-amber-900/50'
          }`}>
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${
                  quizResult.isPass ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {quizResult.isPass ? <CheckCircle2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                </div>
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    quizResult.isPass ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {quizResult.isPass ? '✓ Task Completed' : 'Needs Revision'}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    Practice Quiz Result
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {quizResult.isPass
                      ? 'Congratulations! You met the 70% passing threshold and mastered this topic.'
                      : 'You scored below the 70% passing threshold. Please review the material and retry.'}
                  </p>
                </div>
              </div>

              {/* Score Badges */}
              <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-6 py-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Score</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {quizResult.score} / {quizResult.totalQuestions}
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Percentage</p>
                  <p className={`text-2xl font-black ${
                    quizResult.isPass ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {quizResult.percentage}%
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Correct</p>
                  <p className="text-2xl font-black text-green-600">
                    {quizResult.correctCount}
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="text-center">
                  <p className="text-xs text-slate-400 font-semibold uppercase">Incorrect</p>
                  <p className="text-2xl font-black text-red-500">
                    {quizResult.incorrectCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Next Step Action Box */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              {quizResult.isPass ? (
                <>
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Next in Curriculum:</span>
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      {quizResult.nextTopic?.topic || 'Next Topic'}
                      <span className="ml-2 text-xs font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full">
                        Status: Available
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      The next task is unlocked and ready whenever you decide to begin.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setViewMode('overview')}
                      className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      View Path Overview
                    </button>
                    {quizResult.nextTopic && (
                      <button
                        onClick={() => handleStartTopic(quizResult.nextTopic!.topic)}
                        disabled={isUpdating}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-105 flex items-center gap-2"
                      >
                        {isUpdating ? 'Starting...' : 'Start Next Task →'}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      Action Required: Revise Topic
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Review weak concepts and retry the practice quiz to complete this task.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setViewMode('learning')}
                      className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm rounded-xl transition-colors"
                    >
                      Review Topic
                    </button>
                    <button
                      onClick={handleStartPracticeQuiz}
                      disabled={isLoadingQuiz}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md transition-all hover:scale-105 flex items-center gap-2"
                    >
                      <RotateCcw className={`w-4 h-4 ${isLoadingQuiz ? 'animate-spin' : ''}`} />
                      {isLoadingQuiz ? 'Loading...' : 'Retry Quiz'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Weak Concepts Alert if any */}
          {quizResult.weakConcepts && quizResult.weakConcepts.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-900/40">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Concepts to Reinforce
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {quizResult.weakConcepts.map((concept, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-lg border border-amber-200 dark:border-amber-800 shadow-sm"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Question Review */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-indigo-500" />
              Detailed Question Review
            </h3>

            {quizResult.questionsReview.map((qr, idx) => (
              <div
                key={qr.questionId || idx}
                className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border p-6 ${
                  qr.isCorrect
                    ? 'border-green-200 dark:border-green-900/40'
                    : 'border-red-200 dark:border-red-900/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-xs font-bold text-slate-400">
                    Question {idx + 1}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${
                    qr.isCorrect
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  }`}>
                    {qr.isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {qr.isCorrect ? 'Correct (+1)' : 'Incorrect (0)'}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                  {qr.questionText}
                </h4>

                <div className="space-y-2 mb-4 text-sm">
                  <div className={`p-3 rounded-lg border ${
                    qr.isCorrect
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/40 text-green-900 dark:text-green-200'
                      : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40 text-red-900 dark:text-red-200'
                  }`}>
                    <span className="font-bold">Your Answer: </span>
                    {qr.userAnswer || '(No answer provided)'}
                  </div>

                  {!qr.isCorrect && (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 text-green-900 dark:text-green-200">
                      <span className="font-bold">Correct Answer: </span>
                      {qr.correctAnswer}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Explanation: </span>
                  {qr.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
