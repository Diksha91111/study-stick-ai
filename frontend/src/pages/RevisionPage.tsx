import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  BookOpen, Brain, Clock, CheckCircle2, XCircle, 
  ChevronRight, Play, Loader2, Sparkles, Plus, Trash2, Edit2, AlertCircle
} from 'lucide-react';
import { 
  flashcardService, FlashcardDeck, Flashcard, ReviewRating 
} from '../services/flashcardService';

export function RevisionPage() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review Session State
  const [sessionActive, setSessionActive] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<{ reviewed: number; again: number }>({ reviewed: 0, again: 0 });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Deck Management State
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  
  // AI Generation State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiSourceText, setAiSourceText] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiGeneratedCards, setAiGeneratedCards] = useState<Partial<Flashcard>[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState('');

  const location = useLocation();

  useEffect(() => {
    fetchData();
  }, [location.search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams(location.search);
      const topic = searchParams.get('topic') || undefined;

      const [decksRes, cardsRes, dueCardsRes] = await Promise.all([
        flashcardService.getDecks(),
        flashcardService.getCards({ topic }),
        flashcardService.getCards({ due: true, topic })
      ]);
      setDecks(decksRes.data || []);
      setCards(cardsRes.data || []);
      setDueCards(dueCardsRes.data || []);
    } catch (error) {
      console.error('Error fetching flashcard data', error);
    } finally {
      setLoading(false);
    }
  };

  const startSession = () => {
    if (dueCards.length > 0) {
      setSessionActive(true);
      setCurrentCardIndex(0);
      setShowAnswer(false);
      setSessionSummary({ reviewed: 0, again: 0 });
    }
  };

  const endSession = () => {
    setSessionActive(false);
    fetchData(); // Refresh counts
  };

  const handleReview = async (rating: ReviewRating) => {
    const card = dueCards[currentCardIndex];
    setSubmittingReview(true);
    try {
      const reviewId = `rev_${card._id}_${Date.now()}`;
      await flashcardService.reviewCard(card._id, rating, reviewId);
      
      setSessionSummary(prev => ({
        reviewed: prev.reviewed + 1,
        again: prev.again + (rating === 'Again' ? 1 : 0)
      }));

      if (currentCardIndex < dueCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1);
        setShowAnswer(false);
      } else {
        // Session complete
        endSession();
      }
    } catch (error) {
      console.error('Failed to submit review', error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const createDeck = async () => {
    if (!newDeckTitle.trim()) return;
    try {
      await flashcardService.createDeck({ title: newDeckTitle });
      setNewDeckTitle('');
      setShowDeckModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to create deck', error);
    }
  };

  const generateAI = async () => {
    if (!aiSourceText.trim()) return;
    setGeneratingAI(true);
    try {
      const res = await flashcardService.generateCards({ sourceText: aiSourceText, count: 5 });
      setAiGeneratedCards(res.data || []);
    } catch (error) {
      console.error('Failed to generate cards', error);
    } finally {
      setGeneratingAI(false);
    }
  };

  const saveAICards = async () => {
    if (!selectedDeckId || aiGeneratedCards.length === 0) return;
    try {
      for (const card of aiGeneratedCards) {
        try {
          await flashcardService.createCard({ ...card, deckId: selectedDeckId });
        } catch (err: any) {
          if (err.response?.status !== 409) {
            console.error('Failed to save card:', err);
          }
        }
      }
      setAiGeneratedCards([]);
      setShowAIModal(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save AI cards', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (sessionActive) {
    const card = dueCards[currentCardIndex];
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-500" />
            Revision Session
          </h2>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Card {currentCardIndex + 1} of {dueCards.length}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[400px] flex flex-col">
          {/* Progress Bar */}
          <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${((currentCardIndex) / dueCards.length) * 100}%` }}
            />
          </div>

          <div className="p-8 flex-1 flex flex-col justify-center items-center text-center">
            <h3 className="text-2xl font-medium text-slate-800 dark:text-white mb-6">
              {card.front}
            </h3>

            {showAnswer ? (
              <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 w-full animate-in fade-in slide-in-from-bottom-4">
                <p className="text-xl text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {card.back}
                </p>
                
                {card.explanation && (
                  <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-left">
                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-1">Explanation</p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm">{card.explanation}</p>
                  </div>
                )}
                
                {card.example && (
                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-left font-mono text-sm overflow-x-auto">
                    <p className="text-xs font-sans font-medium text-slate-500 dark:text-slate-400 mb-2">Example</p>
                    <pre className="text-slate-800 dark:text-slate-200">{card.example}</pre>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAnswer(true)}
                className="mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
              >
                Reveal Answer
              </button>
            )}
          </div>

          {/* Rating Buttons */}
          {showAnswer && (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 gap-4">
              {[
                { rating: 'Again', color: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50' },
                { rating: 'Hard', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50' },
                { rating: 'Good', color: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50' },
                { rating: 'Easy', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50' }
              ].map((btn) => (
                <button
                  key={btn.rating}
                  disabled={submittingReview}
                  onClick={() => handleReview(btn.rating as ReviewRating)}
                  className={`py-3 rounded-xl font-medium transition-colors ${btn.color} disabled:opacity-50`}
                >
                  {btn.rating}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-between">
            <button onClick={endSession} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                End Session
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cards Due</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{dueCards.length}</p>
          </div>
          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Cards</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{cards.length}</p>
          </div>
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Decks</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{decks.length}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-indigo-600 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
        <div>
          <h2 className="text-2xl font-bold mb-2">Spaced Repetition Review</h2>
          <p className="text-indigo-100 max-w-lg">
            {dueCards.length > 0 
              ? `You have ${dueCards.length} cards due for review today. Keep up the momentum!`
              : "You're all caught up! Check back later or create new cards to learn."}
          </p>
        </div>
        
        <div className="flex gap-3 mt-4 md:mt-0 w-full md:w-auto">
          <button 
            onClick={() => setShowAIModal(true)}
            className="flex-1 md:flex-none px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Generate with AI
          </button>
          
          <button 
            onClick={startSession}
            disabled={dueCards.length === 0}
            className="flex-1 md:flex-none px-8 py-3 bg-white text-indigo-600 hover:bg-slate-50 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Session
          </button>
        </div>
      </div>

      {/* Decks Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Your Decks</h3>
          <button 
            onClick={() => setShowDeckModal(true)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> New Deck
          </button>
        </div>

        {decks.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-medium text-slate-800 dark:text-white mb-2">No decks yet</h4>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
              Create a deck to start organizing your flashcards, or use our AI to generate them instantly from your notes.
            </p>
            <button 
              onClick={() => setShowDeckModal(true)}
              className="px-6 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
            >
              Create First Deck
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map(deck => {
              const deckCards = cards.filter(c => c.deckId === deck._id);
              const deckDue = dueCards.filter(c => c.deckId === deck._id);
              
              return (
                <div key={deck._id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group relative">
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1 pr-12">{deck.title}</h4>
                  {deck.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{deck.description}</p>
                  )}
                  
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total</p>
                        <p className="font-semibold text-slate-800 dark:text-white">{deckCards.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-orange-500 dark:text-orange-400 uppercase tracking-wider mb-1">Due</p>
                        <p className="font-semibold text-orange-600 dark:text-orange-400">{deckDue.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showDeckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Create New Deck</h3>
              <input
                type="text"
                placeholder="Deck Title (e.g. Data Structures)"
                value={newDeckTitle}
                onChange={(e) => setNewDeckTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                autoFocus
              />
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setShowDeckModal(false)} className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white">Cancel</button>
              <button onClick={createDeck} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm">Create</button>
            </div>
          </div>
        </div>
      )}

      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">AI Flashcard Generator</h3>
              </div>
              
              {aiGeneratedCards.length === 0 ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Paste your notes, code, or article text
                    </label>
                    <textarea
                      value={aiSourceText}
                      onChange={(e) => setAiSourceText(e.target.value)}
                      placeholder="e.g. Binary search is an efficient algorithm for finding an item from a sorted list of items..."
                      className="w-full h-40 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setShowAIModal(false)} className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400">Cancel</button>
                    <button 
                      onClick={generateAI} 
                      disabled={generatingAI || !aiSourceText.trim()}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      {generatingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Generate Cards
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl flex items-start gap-3 mb-6">
                    <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Generated {aiGeneratedCards.length} flashcards!</p>
                      <p className="text-sm mt-1 opacity-90">Review them below and select a deck to save them to.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 mb-6">
                    {aiGeneratedCards.map((c, i) => (
                      <div key={i} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <p className="font-medium text-slate-800 dark:text-white mb-2"><span className="text-indigo-500 mr-2">Q:</span>{c.front}</p>
                        <p className="text-slate-600 dark:text-slate-300"><span className="text-indigo-500 mr-2">A:</span>{c.back}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Save to Deck
                    </label>
                    <select
                      value={selectedDeckId}
                      onChange={(e) => setSelectedDeckId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select a deck...</option>
                      {decks.map(d => (
                        <option key={d._id} value={d._id}>{d.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button 
                      onClick={() => { setAiGeneratedCards([]); setAiSourceText(''); setShowAIModal(false); }} 
                      className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400"
                    >
                      Discard
                    </button>
                    <button 
                      onClick={saveAICards} 
                      disabled={!selectedDeckId}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      Save to Deck
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
