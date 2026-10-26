import React, { useState, useEffect } from 'react';
import { plannerService, PlannerDashboard, StudySession } from '../services/plannerService';
import { 
  Calendar, Clock, CheckCircle2, XCircle, AlertCircle, 
  Brain, Zap, Layers, Code2, Map, Repeat, Play, Info
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function PlannerPage() {
  const [data, setData] = useState<PlannerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reschedulePreview, setReschedulePreview] = useState<{ id: string, message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await plannerService.getDashboard();
      setData(res);
    } catch (err: any) {
      setError('Failed to load planner data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'completed' | 'missed') => {
    setActionLoading(id);
    try {
      await plannerService.updateSessionStatus(id, status);
      await loadData(); // refresh data
    } catch (err) {
      alert('Failed to update session');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = async (id: string) => {
    setActionLoading(id);
    try {
      const newSession = await plannerService.rescheduleSession(id);
      setReschedulePreview({
        id,
        message: `Successfully rescheduled to ${new Date(newSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. ${newSession.reasoning}`
      });
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reschedule. Ensure you have available blocks today.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRegenerate = async () => {
    setActionLoading('regen');
    try {
      await plannerService.forceRegenerate();
      await loadData();
    } catch (err) {
      alert('Failed to regenerate schedule');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center text-indigo-500 gap-4">
          <Calendar className="w-12 h-12 animate-pulse" />
          <p className="font-semibold text-lg">Loading Unified Planner...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 mt-10">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Error Loading Planner</h2>
        <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
        <button onClick={loadData} className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return <Code2 className="w-5 h-5" />;
      case 'learning_path': return <Map className="w-5 h-5" />;
      case 'flashcards': return <Layers className="w-5 h-5" />;
      case 'exam_prep': return <Zap className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Overview */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-500" />
            Adaptive Daily Planner
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Your unified view of classes, deadlines, and smart study sessions.
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free Study Time</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {Math.floor(data.availableStudyTimeMinutes / 60)}h {data.availableStudyTimeMinutes % 60}m
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleRegenerate}
            disabled={actionLoading === 'regen'}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
          >
            <Repeat className={`w-4 h-4 ${actionLoading === 'regen' ? 'animate-spin' : ''}`} />
            Regenerate Plan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Schedule Column */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            Today's AI Schedule
          </h2>

          {data.sessions.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Nothing scheduled!</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No pressing tasks, exams, or flashcards are due. Enjoy your free time or regenerate the schedule to pull in lower priority work.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.sessions.map((session, idx) => (
                <div key={session._id} className={`bg-white dark:bg-slate-900 rounded-2xl border ${session.status === 'completed' ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10' : session.status === 'missed' ? 'border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-800'} shadow-sm p-5 relative overflow-hidden transition-all`}>
                  
                  {session.status === 'completed' && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500 rotate-45 translate-x-8 -translate-y-8" />}
                  {session.status === 'missed' && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500 rotate-45 translate-x-8 -translate-y-8" />}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl mt-1 ${session.status === 'completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : session.status === 'missed' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                        {getTypeIcon(session.sessionType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md uppercase">
                            {session.durationMinutes} min
                          </span>
                        </div>
                        <h3 className={`text-lg font-bold ${session.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                          {session.title}
                        </h3>
                        {session.status === 'planned' && session.reasoning && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 flex items-start gap-1.5">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            {session.reasoning}
                          </p>
                        )}
                        
                        {reschedulePreview?.id === session._id && (
                          <div className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/50 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                            {reschedulePreview.message}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:ml-auto border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-4 sm:pt-0">
                      {session.status === 'planned' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(session._id, 'completed')}
                            disabled={actionLoading !== null}
                            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Done
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(session._id, 'missed')}
                            disabled={actionLoading !== null}
                            className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            Missed
                          </button>
                        </>
                      )}
                      
                      {session.status === 'missed' && (
                        <button 
                          onClick={() => handleReschedule(session._id)}
                          disabled={actionLoading !== null}
                          className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 w-full sm:w-auto"
                        >
                          <Repeat className="w-4 h-4" />
                          Reschedule
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          {/* Commitments Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Today's Fixed Commitments
            </h3>
            {data.commitments.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No college classes or fixed blocks today.</p>
            ) : (
              <div className="space-y-3">
                {data.commitments.map((c: any) => (
                  <div key={c._id} className="flex justify-between items-center text-sm border-l-2 pl-3 py-1" style={{ borderLeftColor: c.color || '#6366f1' }}>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{c.title}</span>
                    <span className="text-slate-500 font-medium">{c.startTime} - {c.endTime}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Items Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Brain className="w-4 h-4 text-indigo-500" />
              Quick Summary
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Layers className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Flashcards Due</span>
                </div>
                <span className="text-sm font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-0.5 rounded-full">
                  {data.flashcardsDueCount}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Code2 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Pending Tasks</span>
                </div>
                <span className="text-sm font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  {data.tasksSummary.pending + data.tasksSummary.inProgress}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Upcoming Exams</span>
                </div>
                <span className="text-sm font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  {data.upcomingExams.length}
                </span>
              </div>
            </div>
            
            {(data.flashcardsDueCount > 0 || data.tasksSummary.pending > 0) && (
              <Link to="/academic" className="mt-6 block text-center text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                View All Details &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
