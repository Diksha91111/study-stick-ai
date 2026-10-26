import mongoose from 'mongoose';
import { ProgrammingProgress, ProgrammingTopic, TopicStatus } from '../models/ProgrammingProgress.js';
import { aiOrchestrator } from '../ai/core/aiOrchestrator.js';
import { LearningPath, ILearningRecommendation, ILearningPath } from '../models/LearningPath.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';
import { TOPIC_CONTENT_DATA, TOPIC_QUIZ_QUESTIONS } from '../data/topicContentData.js';

// Define Prerequisites Graph
export const PREREQUISITES: Record<ProgrammingTopic, ProgrammingTopic[]> = {
  'Variables and data types': [],
  'Conditions and loops': ['Variables and data types'],
  'Arrays and strings': ['Conditions and loops'],
  'Searching and sorting': ['Arrays and strings'],
  'Recursion': ['Conditions and loops'],
  'Linked lists, stacks, and queues': ['Arrays and strings'],
  'Trees and graphs': ['Linked lists, stacks, and queues', 'Recursion'],
  'Dynamic programming': ['Recursion', 'Arrays and strings'],
  'Time and space complexity': ['Conditions and loops'],
};

export const PASSING_SCORE_THRESHOLD = 70; // 70% passing threshold

// In-flight submission lock map to serialize concurrent duplicate submissions per user and topic
const submissionLocks = new Map<string, Promise<any>>();

export const learningPathService = {
  getTopicStates: async (userId: string | mongoose.Types.ObjectId): Promise<Record<ProgrammingTopic, { status: TopicStatus, mastery: number | null }>> => {
    const progressList = await ProgrammingProgress.find({ userId });
    const progressMap = new Map<string, any>(progressList.map(p => [p.topic, p]));

    const isMastered = (topic: ProgrammingTopic): boolean => {
      const p = progressMap.get(topic);
      if (!p) return false;
      if (p.status === 'COMPLETED') return true;
      // Also support legacy / test heuristic if attempts >= 3 with >= 70% accuracy
      if (p.attempts >= 3 && (p.correctAnswers / Math.max(1, p.attempts)) >= 0.7) return true;
      return false;
    };

    const states = {} as Record<ProgrammingTopic, { status: TopicStatus, mastery: number | null }>;

    for (const topic of Object.keys(PREREQUISITES) as ProgrammingTopic[]) {
      const p = progressMap.get(topic);
      let mastery: number | null = null;
      if (p && p.attempts > 0) {
        if (p.examQuestionsAttempted > 0) {
          mastery = Math.min(100, Math.round((p.correctAnswers / p.examQuestionsAttempted) * 100));
        } else {
          mastery = Math.min(100, Math.round((p.correctAnswers / Math.max(1, p.attempts)) * 100));
        }
      }

      let status: TopicStatus = p?.status;
      if (!status || status === 'LOCKED') {
        const prereqs = PREREQUISITES[topic];
        const prereqsMet = prereqs.every(req => isMastered(req));
        status = prereqsMet ? 'AVAILABLE' : 'LOCKED';
      }

      states[topic] = { status, mastery };
    }

    return states;
  },

  getAvailableTopics: (states: Record<ProgrammingTopic, { status: TopicStatus, mastery: number | null }>): ProgrammingTopic[] => {
    return (Object.keys(states) as ProgrammingTopic[]).filter(t => states[t].status === 'AVAILABLE');
  },

  getTopicMastery: async (userId: string | mongoose.Types.ObjectId): Promise<Record<ProgrammingTopic, number | null>> => {
    const states = await learningPathService.getTopicStates(userId);
    const masteries = Object.keys(PREREQUISITES).reduce((acc, topic) => {
      acc[topic as ProgrammingTopic] = states[topic as ProgrammingTopic].mastery;
      return acc;
    }, {} as Record<ProgrammingTopic, number | null>);
    return masteries;
  },

  generateDeterministicRecommendation: (
    availableTopics: ProgrammingTopic[],
    masteries: Record<ProgrammingTopic, number | null>,
    weakTopics: ProgrammingTopic[]
  ): ILearningRecommendation | null => {
    if (availableTopics.length === 0) return null;

    // Prioritize weak topics among available
    const weakAvailable = availableTopics.filter(t => weakTopics.includes(t));
    const targetTopic = weakAvailable.length > 0 ? weakAvailable[0] : availableTopics[0];

    return {
      topic: targetTopic,
      reason: weakAvailable.length > 0 ? 'Weak area detected based on recent attempts.' : 'Prerequisites met. Ready to learn.',
      suggestedActivity: `Practice ${targetTopic} exercises`,
      estimatedMinutes: TOPIC_CONTENT_DATA[targetTopic]?.estimatedMinutes || 30,
      status: 'pending',
      createdAt: new Date(),
    };
  },

  generateAIExplanation: async (topic: string, goal: string, weakErrors: string[]): Promise<string> => {
    try {
      const prompt = `You are an AI programming teacher. 
A student is about to study "${topic}". Their current goal is: "${goal}".
They recently struggled with these errors (if any): ${weakErrors.join(', ')}.
Provide a concise, encouraging 2-sentence explanation of why they should practice this topic and what specific activity they should do next.
Do not fabricate stats. Focus on pedagogy.`;

      const result = await aiOrchestrator.processRequest({
        message: prompt,
        taskType: 'codeExplanation',
        options: {
          systemInstruction: 'You are an encouraging AI programming tutor.',
          temperature: 0.7,
        },
      });
      
      return result.text;
    } catch (error) {
      return 'Focusing on this topic will build a solid foundation for your overall programming goals.';
    }
  },

  generateLearningPath: async (userId: string | mongoose.Types.ObjectId, goal?: string): Promise<ILearningPath> => {
    let path = await LearningPath.findOne({ userId });
    
    if (!path) {
      try {
        path = await LearningPath.findOneAndUpdate(
          { userId },
          { $setOnInsert: { userId, currentGoal: goal || 'Master fundamental programming concepts', recommendations: [] } },
          { upsert: true, new: true }
        );
      } catch {
        path = await LearningPath.findOne({ userId });
      }
    }

    if (!path) {
      path = (await LearningPath.findOne({ userId }))!;
    }
    
    if (!path) {
      throw new Error('Failed to create or retrieve learning path');
    }

    if (goal && path.currentGoal !== goal) {
      path.currentGoal = goal;
      await path.save();
    }

    const states = await learningPathService.getTopicStates(userId);

    // If an in-progress or needs-revision topic exists in progress, ensure it is represented (unless dismissed)
    const progressList = await ProgrammingProgress.find({ userId });
    const inProgressTopic = progressList.find(p => {
      if (p.status !== 'IN_PROGRESS' && p.status !== 'NEEDS_REVISION') return false;
      const rec = path.recommendations.find(r => r.topic === p.topic);
      return !rec || rec.status !== 'dismissed';
    });

    if (inProgressTopic) {
      const existingRec = path.recommendations.find(r => r.topic === inProgressTopic.topic && r.status === 'accepted');
      if (!existingRec) {
        path.recommendations.push({
          topic: inProgressTopic.topic,
          reason: inProgressTopic.status === 'NEEDS_REVISION' ? 'Requires revision based on recent quiz attempt.' : 'In progress topic.',
          suggestedActivity: `Continue learning and practice ${inProgressTopic.topic}`,
          estimatedMinutes: TOPIC_CONTENT_DATA[inProgressTopic.topic]?.estimatedMinutes || 30,
          status: 'accepted',
          createdAt: new Date(),
        });
      }
      await path.save();
      return path;
    }

    // Check if there is already a pending recommendation
    const hasPending = path.recommendations.some(r => r.status === 'pending');
    if (hasPending) {
      await path.save();
      return path;
    }

    const availableTopics = learningPathService.getAvailableTopics(states);
    const masteries = Object.keys(PREREQUISITES).reduce((acc, topic) => {
      acc[topic as ProgrammingTopic] = states[topic as ProgrammingTopic].mastery;
      return acc;
    }, {} as Record<ProgrammingTopic, number | null>);
    
    const weakTopics: ProgrammingTopic[] = [];
    let recentErrors: string[] = [];

    for (const p of progressList) {
      const score = masteries[p.topic];
      if (score !== null && score < 60) {
        weakTopics.push(p.topic);
        recentErrors = recentErrors.concat(p.recentErrors);
      }
    }

    const rec = learningPathService.generateDeterministicRecommendation(availableTopics, masteries, weakTopics);
    
    if (rec) {
      rec.aiExplanation = await learningPathService.generateAIExplanation(rec.topic, path.currentGoal, recentErrors.slice(0, 3));
      path.recommendations.push(rec);
    }

    await path.save();
    return path;
  },

  startTopic: async (userId: string | mongoose.Types.ObjectId, topic: ProgrammingTopic): Promise<{ path: ILearningPath, prerequisites: any, states: any, progressList: any }> => {
    // 1. Verify prerequisites
    const states = await learningPathService.getTopicStates(userId);
    const currentTopicState = states[topic];

    if (!currentTopicState) {
      throw new Error(`Unknown topic: ${topic}`);
    }

    if (currentTopicState.status === 'LOCKED') {
      throw new Error(`Prerequisites not completed for topic: ${topic}`);
    }

    // 2. Atomic and idempotent progress update (prevents E11000 duplicate key on concurrent requests)
    const existingProgress = await ProgrammingProgress.findOne({ userId, topic });
    let progress;
    if (existingProgress && existingProgress.status === 'COMPLETED') {
      progress = existingProgress;
    } else {
      progress = await ProgrammingProgress.findOneAndUpdate(
        { userId, topic },
        {
          $setOnInsert: {
            attempts: 0,
            correctAnswers: 0,
            hintsRequested: 0,
            lessonsCompleted: 0,
            examScoreSum: 0,
            examQuestionsAttempted: 0,
            recentErrors: [],
          },
          $set: {
            status: existingProgress?.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
            lastActivity: new Date()
          }
        },
        { upsert: true, new: true }
      );
    }

    // 3. Update or sync recommendations in LearningPath safely
    let path = await LearningPath.findOne({ userId });
    if (!path) {
      try {
        path = await LearningPath.findOneAndUpdate(
          { userId },
          { $setOnInsert: { userId, currentGoal: 'Master fundamental programming concepts', recommendations: [] } },
          { upsert: true, new: true }
        );
      } catch {
        path = await LearningPath.findOne({ userId });
      }
    }

    if (!path) {
      path = (await LearningPath.findOne({ userId }))!;
    }

    if (!path) {
      throw new Error('Failed to find or create learning path');
    }

    // Mark previous active recommendations as superseded if different topic
    path.recommendations.forEach(r => {
      if (r.topic === topic) {
        r.status = 'accepted';
      }
    });

    const hasTopicRec = path.recommendations.some(r => r.topic === topic && r.status === 'accepted');
    if (!hasTopicRec) {
      path.recommendations.push({
        topic,
        reason: 'Explicitly started by student.',
        suggestedActivity: `Master concepts and complete practice quiz for ${topic}`,
        estimatedMinutes: TOPIC_CONTENT_DATA[topic]?.estimatedMinutes || 30,
        status: 'accepted',
        createdAt: new Date(),
      });
    }

    await path.save();

    const updatedStates = await learningPathService.getTopicStates(userId);
    const progressList = await ProgrammingProgress.find({ userId }).select('topic status attempts correctAnswers examScoreSum');

    return { path, prerequisites: PREREQUISITES, states: updatedStates, progressList };
  },

  updateRecommendationStatus: async (
    userId: string | mongoose.Types.ObjectId, 
    recId: string, 
    status: 'accepted' | 'dismissed' | 'completed'
  ): Promise<ILearningPath> => {
    const path = await LearningPath.findOne({ userId });
    if (!path) throw new Error('Learning path not found');

    const rec = path.recommendations.find((r: any) => r._id?.toString() === recId);
    if (!rec) throw new Error('Recommendation not found');

    rec.status = status;

    if (status === 'accepted') {
      // Transition ProgrammingProgress to IN_PROGRESS atomically and idempotently
      await ProgrammingProgress.findOneAndUpdate(
        { userId, topic: rec.topic },
        {
          $setOnInsert: {
            attempts: 0,
            correctAnswers: 0,
            hintsRequested: 0,
            lessonsCompleted: 0,
            examScoreSum: 0,
            examQuestionsAttempted: 0,
            recentErrors: [],
          },
          $set: {
            lastActivity: new Date()
          }
        },
        { upsert: true }
      );
      // Only transition to IN_PROGRESS if not already COMPLETED
      await ProgrammingProgress.updateOne(
        { userId, topic: rec.topic, status: { $ne: 'COMPLETED' } },
        { $set: { status: 'IN_PROGRESS' } }
      );
    } else if (status === 'dismissed') {
      await ProgrammingProgress.updateOne(
        { userId, topic: rec.topic, status: 'IN_PROGRESS' },
        { $set: { status: 'AVAILABLE', lastActivity: new Date() } }
      );
    }

    await path.save();
    
    if (status === 'dismissed' || status === 'completed') {
       return await learningPathService.generateLearningPath(userId);
    }
    
    return path;
  },

  getTopicContent: (topic: ProgrammingTopic) => {
    const content = TOPIC_CONTENT_DATA[topic];
    if (!content) {
      throw new Error(`Content not found for topic: ${topic}`);
    }
    return content;
  },

  generateAssessment: async (userId: string | mongoose.Types.ObjectId, topic: ProgrammingTopic) => {
    // Check if topic questions exist in curated question repository
    const questions = TOPIC_QUIZ_QUESTIONS[topic];
    if (questions && questions.length > 0) {
      // Never expose correctAnswer or explanation prior to submission!
      return questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        type: q.type,
        options: q.options,
        concept: q.concept
      }));
    }

    // Fallback: AI generated questions if topic is custom
    try {
      const prompt = `Generate 5 multiple-choice questions for "${topic}".
Output MUST be strict JSON matching:
[{"id": "q1", "questionText": "...", "type": "mcq", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "...", "concept": "..."}]`;
      const result = await aiOrchestrator.processRequest({
        message: prompt,
        taskType: 'codeExplanation',
        options: { temperature: 0.3 }
      });
      const parsed = JSON.parse(result.text.replace(/```json/g, '').replace(/```/g, '').trim());
      return parsed.map((q: any) => ({
        id: q.id,
        questionText: q.questionText,
        type: q.type || 'mcq',
        options: q.options,
        concept: q.concept || topic
      }));
    } catch {
      throw new Error('Failed to generate assessment questions');
    }
  },

  submitAssessment: async (
    userId: string | mongoose.Types.ObjectId, 
    topic: ProgrammingTopic, 
    userAnswers: { questionId: string; selectedAnswer: string }[], 
    timeTakenMinutes: number
  ) => {
    const lockKey = `${userId.toString()}:${topic}`;
    if (submissionLocks.has(lockKey)) {
      return await submissionLocks.get(lockKey);
    }

    const submissionPromise = (async () => {
      // 1. Duplicate submission guard (deduplicate exact identical submissions within 5s)
      const recentAttempt = await AssessmentAttempt.findOne({
        userId,
        topic,
        submissionTime: { $gte: new Date(Date.now() - 5000) }
      }).sort({ submissionTime: -1 });

      const isExactDuplicate = !!(recentAttempt &&
        recentAttempt.questions.length === userAnswers.length &&
        userAnswers.every((ans, idx) => recentAttempt.questions[idx]?.userAnswer === ans.selectedAnswer));

      if (isExactDuplicate && recentAttempt) {
        const allStates = await learningPathService.getTopicStates(userId);
        const nextEligibleTopic = Object.keys(PREREQUISITES).find(t => 
          t !== topic && allStates[t as ProgrammingTopic]?.status === 'AVAILABLE'
        );
        const progressDoc = await ProgrammingProgress.findOne({ userId, topic });
        return {
          attemptId: recentAttempt._id,
          topic,
          isPass: recentAttempt.isPass,
          score: recentAttempt.correctAnswersCount,
          totalQuestions: recentAttempt.totalQuestions,
          percentage: recentAttempt.scorePercentage,
          correctCount: recentAttempt.correctAnswersCount,
          incorrectCount: recentAttempt.totalQuestions - recentAttempt.correctAnswersCount,
          questionsReview: recentAttempt.questions.map(q => ({
            questionId: q.questionId,
            questionText: q.questionText,
            userAnswer: q.userAnswer,
            correctAnswer: q.correctAnswer,
            isCorrect: q.isCorrect,
            explanation: q.explanation,
            concept: topic
          })),
          weakConcepts: recentAttempt.questions.filter(q => !q.isCorrect).map(() => topic),
          status: progressDoc?.status || (recentAttempt.isPass ? 'COMPLETED' : 'NEEDS_REVISION'),
          nextTopic: nextEligibleTopic ? { topic: nextEligibleTopic, status: 'AVAILABLE' } : null
        };
      }

      // 2. Evaluate answers
      const topicQuestions = TOPIC_QUIZ_QUESTIONS[topic] || [];
      const questionMap = new Map<string, any>(topicQuestions.map(q => [q.id, q]));

      let correctCount = 0;
      const evaluatedQuestions = userAnswers.map(ans => {
        const serverQ = questionMap.get(ans.questionId);
        const correctAnswer = serverQ?.correctAnswer || 'N/A';
        const explanation = serverQ?.explanation || 'See lesson material for detailed explanation.';
        const questionText = serverQ?.questionText || 'Assessment question';
        const concept = serverQ?.concept || topic;

        const isCorrect = Boolean(ans.selectedAnswer && serverQ?.correctAnswer && ans.selectedAnswer.trim() === serverQ.correctAnswer.trim());
        if (isCorrect) correctCount++;

        return {
          questionId: ans.questionId,
          questionText,
          userAnswer: ans.selectedAnswer || '',
          correctAnswer,
          isCorrect,
          explanation,
          concept
        };
      });

      const totalQuestions = userAnswers.length > 0 ? userAnswers.length : 1;
      const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
      const isPass = scorePercentage >= PASSING_SCORE_THRESHOLD;

      // 3. Persist single attempt record
      const attempt = await AssessmentAttempt.create({
        userId,
        topic,
        startTime: new Date(Date.now() - (timeTakenMinutes || 5) * 60000),
        submissionTime: new Date(),
        timeTakenMinutes: timeTakenMinutes || 5,
        questions: evaluatedQuestions.map(q => ({
          questionId: q.questionId,
          questionText: q.questionText,
          userAnswer: q.userAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect: q.isCorrect,
          explanation: q.explanation
        })),
        correctAnswersCount: correctCount,
        totalQuestions,
        scorePercentage,
        isPass
      });

      // 4. Update Progress atomically (prevents Mongoose VersionError and duplicate key issues)
      const weakConcepts = evaluatedQuestions.filter(q => !q.isCorrect).map(q => q.concept);
      const updatedProgress = await ProgrammingProgress.findOneAndUpdate(
        { userId, topic },
        {
          $inc: {
            attempts: 1,
            examQuestionsAttempted: totalQuestions,
            correctAnswers: correctCount,
            examScoreSum: scorePercentage,
          },
          $set: {
            status: isPass ? 'COMPLETED' : 'NEEDS_REVISION',
            lastActivity: new Date(),
            recentErrors: weakConcepts.slice(0, 5)
          }
        },
        { new: true, upsert: true }
      );

      let nextEligibleTopic: ProgrammingTopic | null = null;

      if (isPass) {
        // Atomic recommendation update
        await LearningPath.updateOne(
          { userId, 'recommendations.topic': topic, 'recommendations.status': { $in: ['accepted', 'pending'] } },
          { $set: { 'recommendations.$.status': 'completed' } }
        );

        // Unlock dependent topics whose prerequisites are now ALL met -> change to AVAILABLE (NEVER IN_PROGRESS)
        const allStates = await learningPathService.getTopicStates(userId);
        for (const candidateTopic of Object.keys(PREREQUISITES) as ProgrammingTopic[]) {
          if (candidateTopic === topic) continue;
          const candidateState = allStates[candidateTopic];

          if (candidateState.status === 'AVAILABLE') {
            await ProgrammingProgress.updateOne(
              { userId, topic: candidateTopic },
              { 
                $setOnInsert: { 
                  attempts: 0, 
                  correctAnswers: 0, 
                  hintsRequested: 0, 
                  lessonsCompleted: 0, 
                  examScoreSum: 0, 
                  examQuestionsAttempted: 0, 
                  recentErrors: [] 
                },
                $set: { status: 'AVAILABLE', lastActivity: new Date() } 
              },
              { upsert: true }
            );
            if (!nextEligibleTopic) {
              nextEligibleTopic = candidateTopic;
            }
          }
        }
      }

      return {
        attemptId: attempt._id,
        topic,
        isPass,
        score: correctCount,
        totalQuestions,
        percentage: scorePercentage,
        correctCount,
        incorrectCount: totalQuestions - correctCount,
        questionsReview: evaluatedQuestions,
        weakConcepts: Array.from(new Set(weakConcepts)),
        status: updatedProgress.status,
        nextTopic: nextEligibleTopic ? { topic: nextEligibleTopic, status: 'AVAILABLE' } : null
      };
    })();

    submissionLocks.set(lockKey, submissionPromise);
    try {
      return await submissionPromise;
    } finally {
      submissionLocks.delete(lockKey);
    }
  },

  askAITutor: async (topic: string, question: string): Promise<string> => {
    try {
      const prompt = `You are a knowledgeable, encouraging AI tutor helping a student learn "${topic}".
The student asks: "${question}".
Provide a clear, pedagogical answer with a short code example if applicable. Keep it within 3-4 paragraphs.`;

      const result = await aiOrchestrator.processRequest({
        message: prompt,
        taskType: 'chat',
        options: {
          systemInstruction: 'You are an expert, encouraging programming tutor.',
          temperature: 0.5
        }
      });
      return result.text;
    } catch {
      return `When studying ${topic}, focus on understanding the core concept and how values behave in memory. Try testing small code snippets in the Code Lab!`;
    }
  }
};
