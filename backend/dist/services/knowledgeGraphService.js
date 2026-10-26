"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.knowledgeGraphService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ProgrammingProgress_js_1 = require("../models/ProgrammingProgress.js");
const AssessmentAttempt_js_1 = require("../models/AssessmentAttempt.js");
const Flashcard_js_1 = require("../models/Flashcard.js");
const Subject_js_1 = require("../models/Subject.js");
const learningPathService_js_1 = require("./learningPathService.js");
const topicContentData_js_1 = require("../data/topicContentData.js");
const aiOrchestrator_js_1 = require("../ai/core/aiOrchestrator.js");
// Fixed pedagogical coordinates for standard DAG layout (1200x800 canvas)
const TOPIC_POSITIONS = {
    'Variables and data types': { x: 120, y: 320 },
    'Conditions and loops': { x: 380, y: 320 },
    'Arrays and strings': { x: 650, y: 190 },
    'Recursion': { x: 650, y: 440 },
    'Time and space complexity': { x: 650, y: 640 },
    'Searching and sorting': { x: 920, y: 110 },
    'Linked lists, stacks, and queues': { x: 920, y: 280 },
    'Trees and graphs': { x: 1180, y: 280 },
    'Dynamic programming': { x: 1180, y: 520 },
};
exports.knowledgeGraphService = {
    /**
     * Get full student knowledge graph
     * User-scoped, deterministic, and fast (no AI calls)
     */
    getKnowledgeGraph: async (userId, includeConcepts = true) => {
        const objectUserId = typeof userId === 'string' ? new mongoose_1.default.Types.ObjectId(userId) : userId;
        // Parallel fetch of all student learning records
        const [progressList, attemptsList, flashcardsList, academicSubjects] = await Promise.all([
            ProgrammingProgress_js_1.ProgrammingProgress.find({ userId: objectUserId }),
            AssessmentAttempt_js_1.AssessmentAttempt.find({ userId: objectUserId }).sort({ submissionTime: -1 }),
            Flashcard_js_1.Flashcard.find({ userId: objectUserId }),
            Subject_js_1.Subject.find({ userId: objectUserId }),
        ]);
        const progressMap = new Map(progressList.map((p) => [p.topic, p]));
        // Group attempts by topic
        const attemptsByTopic = new Map();
        for (const attempt of attemptsList) {
            const existing = attemptsByTopic.get(attempt.topic) || [];
            existing.push(attempt);
            attemptsByTopic.set(attempt.topic, existing);
        }
        // Group flashcards by topic
        const flashcardsByTopic = new Map();
        for (const card of flashcardsList) {
            if (card.programmingTopic) {
                const existing = flashcardsByTopic.get(card.programmingTopic) || [];
                existing.push(card);
                flashcardsByTopic.set(card.programmingTopic, existing);
            }
        }
        const now = new Date();
        const nodes = [];
        const edges = [];
        // Helper: is a topic mastered/completed?
        const isTopicCompleted = (topic) => {
            const p = progressMap.get(topic);
            if (!p)
                return false;
            if (p.status === 'COMPLETED')
                return true;
            if (p.attempts >= 3 && p.correctAnswers / Math.max(1, p.attempts) >= 0.7)
                return true;
            return false;
        };
        // Calculate dependency unlocks map
        const unlocksMap = {
            'Variables and data types': [],
            'Conditions and loops': [],
            'Arrays and strings': [],
            'Searching and sorting': [],
            'Recursion': [],
            'Linked lists, stacks, and queues': [],
            'Trees and graphs': [],
            'Dynamic programming': [],
            'Time and space complexity': [],
        };
        for (const [topic, prereqs] of Object.entries(learningPathService_js_1.PREREQUISITES)) {
            for (const prereq of prereqs) {
                if (unlocksMap[prereq]) {
                    unlocksMap[prereq].push(topic);
                }
            }
        }
        // Process all 9 foundational programming topics
        const topicsList = Object.keys(learningPathService_js_1.PREREQUISITES);
        for (const topic of topicsList) {
            const content = topicContentData_js_1.TOPIC_CONTENT_DATA[topic];
            const p = progressMap.get(topic);
            const attempts = attemptsByTopic.get(topic) || [];
            const cards = flashcardsByTopic.get(topic) || [];
            const prereqs = learningPathService_js_1.PREREQUISITES[topic] || [];
            const unlocks = unlocksMap[topic] || [];
            // Assessment stats
            const assessmentCount = attempts.length;
            let totalQuestionsAttempted = 0;
            let totalCorrectAnswers = 0;
            let latestScore = null;
            let latestPass = false;
            if (assessmentCount > 0) {
                latestScore = attempts[0].scorePercentage;
                latestPass = attempts[0].isPass;
                for (const a of attempts) {
                    totalQuestionsAttempted += a.totalQuestions || 0;
                    totalCorrectAnswers += a.correctAnswersCount || 0;
                }
            }
            else if (p && p.examQuestionsAttempted > 0) {
                totalQuestionsAttempted = p.examQuestionsAttempted;
                totalCorrectAnswers = p.correctAnswers;
            }
            else if (p && p.attempts > 0) {
                totalQuestionsAttempted = p.attempts;
                totalCorrectAnswers = p.correctAnswers;
            }
            // Flashcard stats
            const flashcardsTotal = cards.length;
            const flashcardsDue = cards.filter((c) => c.status === 'active' && new Date(c.nextReview) <= now).length;
            // Real Mastery Calculation
            let mastery = null;
            let accuracyPercentage = null;
            if (totalQuestionsAttempted > 0) {
                accuracyPercentage = Math.round((totalCorrectAnswers / totalQuestionsAttempted) * 100);
                if (latestScore !== null) {
                    // Weighted composite: 60% latest assessment score, 40% cumulative accuracy
                    mastery = Math.min(100, Math.max(0, Math.round(latestScore * 0.6 + accuracyPercentage * 0.4)));
                }
                else {
                    mastery = Math.min(100, Math.max(0, accuracyPercentage));
                }
            }
            // Confidence score based on evidence sample size
            let confidence = 0;
            if (totalQuestionsAttempted >= 15)
                confidence = 95;
            else if (totalQuestionsAttempted >= 8)
                confidence = 80;
            else if (totalQuestionsAttempted >= 4)
                confidence = 60;
            else if (totalQuestionsAttempted >= 1)
                confidence = 35;
            // Status Calculation
            const prereqsMet = prereqs.every((req) => isTopicCompleted(req));
            let status = 'LOCKED';
            const storedStatus = p?.status;
            if (!prereqsMet && (!storedStatus || storedStatus === 'LOCKED')) {
                status = 'LOCKED';
            }
            else if (storedStatus === 'COMPLETED') {
                // Mastered topic check for revision
                const lastActivityDate = p?.lastActivity ? new Date(p.lastActivity) : null;
                const daysSinceLastActivity = lastActivityDate
                    ? (now.getTime() - lastActivityDate.getTime()) / (1000 * 3600 * 24)
                    : 0;
                if (daysSinceLastActivity > 14 || flashcardsDue >= 5) {
                    status = 'NEEDS_REVISION';
                }
                else {
                    status = 'MASTERED';
                }
            }
            else if (storedStatus === 'IN_PROGRESS') {
                if (mastery !== null && mastery < 60) {
                    status = 'WEAK';
                }
                else {
                    status = 'LEARNING';
                }
            }
            else if (storedStatus === 'NEEDS_REVISION') {
                status = 'NEEDS_REVISION';
            }
            else if (storedStatus === 'AVAILABLE' || prereqsMet) {
                // If prereqs are completed and not started yet, it is AVAILABLE
                status = 'AVAILABLE';
            }
            // Weak Concept Detection
            let weakConcept = false;
            let weakReason;
            const recentErrors = p?.recentErrors ? [...p.recentErrors] : [];
            if (assessmentCount > 0 && !latestPass) {
                weakConcept = true;
                const failedQuestions = attempts[0].questions?.filter((q) => !q.isCorrect) || [];
                const questionConcepts = failedQuestions
                    .map((q) => q.concept || q.questionText?.substring(0, 30))
                    .filter(Boolean);
                weakReason =
                    questionConcepts.length > 0
                        ? `Recent assessment score below 70%: struggles with ${questionConcepts.slice(0, 2).join(', ')}`
                        : `Recent assessment score below 70% (${latestScore}%)`;
            }
            else if (mastery !== null && mastery < 60) {
                weakConcept = true;
                weakReason = `Mastery is ${mastery}% (below 60% threshold). Additional practice recommended.`;
            }
            else if (status === 'NEEDS_REVISION') {
                weakConcept = true;
                weakReason = flashcardsDue > 0
                    ? `${flashcardsDue} flashcards due for spaced repetition review.`
                    : 'Concept has not been reviewed in over 14 days.';
            }
            // Evidence Summary Explanation
            let evidenceSummary = 'Not assessed yet. Complete practice exercises or quizzes to measure mastery.';
            if (assessmentCount > 0) {
                evidenceSummary = `Latest score: ${latestScore}%. Cumulative accuracy: ${accuracyPercentage}% (${totalCorrectAnswers}/${totalQuestionsAttempted} questions over ${assessmentCount} attempt${assessmentCount > 1 ? 's' : ''}).`;
            }
            else if (p && p.attempts > 0) {
                evidenceSummary = `Practice exercises: ${totalCorrectAnswers}/${totalQuestionsAttempted} correct.`;
            }
            const nodeId = `topic_${topic.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            nodes.push({
                id: nodeId,
                title: topic,
                type: 'topic',
                subject: 'Programming & Data Structures',
                description: content?.detailedExplanation
                    ? content.detailedExplanation.split('\n')[0]
                    : `Fundamental programming concept covering ${topic}.`,
                prerequisites: prereqs.map((pr) => `topic_${pr.toLowerCase().replace(/[^a-z0-9]/g, '_')}`),
                dependencies: unlocks.map((un) => `topic_${un.toLowerCase().replace(/[^a-z0-9]/g, '_')}`),
                status,
                mastery,
                confidence,
                lastPracticedAt: p?.lastActivity || (attempts[0] ? attempts[0].submissionTime : null),
                assessmentCount,
                correctAnswers: totalCorrectAnswers,
                totalAnswers: totalQuestionsAttempted,
                flashcardsDue,
                weakConcept,
                weakReason,
                evidence: {
                    practiceQuizScore: latestScore,
                    practiceQuizCorrect: attempts[0]?.correctAnswersCount || 0,
                    practiceQuizTotal: attempts[0]?.totalQuestions || 0,
                    finalTestScore: latestScore,
                    finalTestCorrect: attempts[0]?.correctAnswersCount || 0,
                    finalTestTotal: attempts[0]?.totalQuestions || 0,
                    assessmentAttemptsCount: assessmentCount,
                    totalQuestionsAttempted,
                    totalCorrectAnswers,
                    accuracyPercentage,
                    flashcardsTotal,
                    flashcardsDue,
                    lastPracticedAt: p?.lastActivity || null,
                    recentErrors,
                    evidenceSummary,
                },
                position: TOPIC_POSITIONS[topic] || { x: 200, y: 200 },
                estimatedMinutes: content?.estimatedMinutes || 30,
            });
            // Core Prerequisite Edges between Topics
            for (const prereq of prereqs) {
                const sourceId = `topic_${prereq.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
                edges.push({
                    id: `edge_${sourceId}_to_${nodeId}`,
                    source: sourceId,
                    target: nodeId,
                    type: 'PREREQUISITE_OF',
                    label: 'Prerequisite',
                });
            }
            // Add sub-concepts if requested (drilldown view)
            if (includeConcepts && content?.coreConcepts) {
                content.coreConcepts.forEach((concept, idx) => {
                    const conceptId = `concept_${topic.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${idx}`;
                    const isConceptWeak = recentErrors.some((err) => err.toLowerCase().includes(concept.name.toLowerCase()));
                    nodes.push({
                        id: conceptId,
                        title: concept.name,
                        type: 'concept',
                        subject: 'Programming & Data Structures',
                        topic,
                        description: concept.description,
                        prerequisites: [nodeId],
                        dependencies: [],
                        status: isConceptWeak
                            ? 'WEAK'
                            : status === 'MASTERED'
                                ? 'MASTERED'
                                : status === 'LEARNING'
                                    ? 'LEARNING'
                                    : 'AVAILABLE',
                        mastery: isConceptWeak ? 45 : mastery,
                        confidence: Math.max(0, confidence - 15),
                        lastPracticedAt: p?.lastActivity || null,
                        assessmentCount,
                        correctAnswers: Math.round(totalCorrectAnswers / (content.coreConcepts.length || 1)),
                        totalAnswers: Math.round(totalQuestionsAttempted / (content.coreConcepts.length || 1)),
                        flashcardsDue: 0,
                        weakConcept: isConceptWeak,
                        weakReason: isConceptWeak
                            ? `Identified mistakes in ${concept.name} during assessment review.`
                            : undefined,
                        evidence: {
                            practiceQuizScore: latestScore,
                            practiceQuizCorrect: 0,
                            practiceQuizTotal: 0,
                            finalTestScore: latestScore,
                            finalTestCorrect: 0,
                            finalTestTotal: 0,
                            assessmentAttemptsCount: assessmentCount,
                            totalQuestionsAttempted,
                            totalCorrectAnswers,
                            accuracyPercentage,
                            flashcardsTotal: 0,
                            flashcardsDue: 0,
                            lastPracticedAt: p?.lastActivity || null,
                            recentErrors: isConceptWeak ? [concept.name] : [],
                            evidenceSummary: `Concept of ${topic}. ${concept.description}`,
                        },
                        position: {
                            x: (TOPIC_POSITIONS[topic]?.x || 200) + (idx % 2 === 0 ? -60 : 60),
                            y: (TOPIC_POSITIONS[topic]?.y || 200) + 70 + idx * 45,
                        },
                        estimatedMinutes: 10,
                    });
                    // Edge: Concept is PART_OF parent topic
                    edges.push({
                        id: `edge_${conceptId}_part_of_${nodeId}`,
                        source: nodeId,
                        target: conceptId,
                        type: 'PART_OF',
                        label: 'Part of',
                    });
                });
            }
        }
        // Include academic subjects if student has registered them
        for (let sIdx = 0; sIdx < academicSubjects.length; sIdx++) {
            const subj = academicSubjects[sIdx];
            const subjNodeId = `subj_${subj._id.toString()}`;
            nodes.push({
                id: subjNodeId,
                title: subj.name,
                type: 'subject',
                subject: subj.name,
                description: `Academic Subject • ${subj.category.replace('_', ' ')} • ${subj.credits} Credits • ${subj.syllabusProgress}% syllabus progress.`,
                prerequisites: [],
                dependencies: [],
                status: subj.syllabusProgress >= 80 ? 'MASTERED' : subj.syllabusProgress > 0 ? 'LEARNING' : 'AVAILABLE',
                mastery: subj.syllabusProgress,
                confidence: 70,
                lastPracticedAt: subj.updatedAt,
                assessmentCount: 0,
                correctAnswers: 0,
                totalAnswers: 0,
                flashcardsDue: 0,
                weakConcept: false,
                evidence: {
                    practiceQuizScore: null,
                    practiceQuizCorrect: 0,
                    practiceQuizTotal: 0,
                    finalTestScore: null,
                    finalTestCorrect: 0,
                    finalTestTotal: 0,
                    assessmentAttemptsCount: 0,
                    totalQuestionsAttempted: 0,
                    totalCorrectAnswers: 0,
                    accuracyPercentage: null,
                    flashcardsTotal: 0,
                    flashcardsDue: 0,
                    lastPracticedAt: subj.updatedAt,
                    recentErrors: [],
                    evidenceSummary: `Academic course curriculum with target of ${subj.totalHoursTarget} hours (${subj.completedHours} completed).`,
                },
                position: { x: 120 + sIdx * 250, y: 720 },
                estimatedMinutes: 60,
            });
        }
        // Calculate Real Knowledge Summary Stats
        const topicNodes = nodes.filter((n) => n.type === 'topic');
        let masteredCount = 0;
        let learningCount = 0;
        let weakCount = 0;
        let needsRevisionCount = 0;
        let availableCount = 0;
        let lockedCount = 0;
        let totalMasterySum = 0;
        let assessedCount = 0;
        for (const node of topicNodes) {
            if (node.status === 'MASTERED')
                masteredCount++;
            else if (node.status === 'LEARNING')
                learningCount++;
            else if (node.status === 'WEAK')
                weakCount++;
            else if (node.status === 'NEEDS_REVISION')
                needsRevisionCount++;
            else if (node.status === 'AVAILABLE')
                availableCount++;
            else if (node.status === 'LOCKED')
                lockedCount++;
            if (node.mastery !== null) {
                totalMasterySum += node.mastery;
                assessedCount++;
            }
        }
        const averageMastery = assessedCount > 0 ? Math.round(totalMasterySum / assessedCount) : null;
        // Recommended Next Concept (Deterministic Algorithm)
        let recommendedNext = null;
        // 1. First priority: any weak or needs-revision topic that is unlocked
        const weakOrRevision = topicNodes.find((n) => n.status === 'WEAK' || n.status === 'NEEDS_REVISION');
        if (weakOrRevision) {
            recommendedNext = {
                id: weakOrRevision.id,
                title: weakOrRevision.title,
                reason: weakOrRevision.weakReason || 'Identified as needing reinforcement based on recent quiz evidence.',
                estimatedMinutes: weakOrRevision.estimatedMinutes || 30,
            };
        }
        else {
            // 2. Next priority: in-progress learning topic
            const currentlyLearning = topicNodes.find((n) => n.status === 'LEARNING');
            if (currentlyLearning) {
                recommendedNext = {
                    id: currentlyLearning.id,
                    title: currentlyLearning.title,
                    reason: 'Currently in progress. Complete practice quiz to assess mastery.',
                    estimatedMinutes: currentlyLearning.estimatedMinutes || 30,
                };
            }
            else {
                // 3. Next priority: first available topic whose prerequisites are completed
                const firstAvailable = topicNodes.find((n) => n.status === 'AVAILABLE');
                if (firstAvailable) {
                    const prereqTitles = firstAvailable.prerequisites
                        .map((pId) => nodes.find((n) => n.id === pId)?.title)
                        .filter(Boolean);
                    const reason = prereqTitles.length > 0
                        ? `Prerequisites completed (${prereqTitles.join(', ')}). Ready to begin.`
                        : 'Foundational topic ready to start.';
                    recommendedNext = {
                        id: firstAvailable.id,
                        title: firstAvailable.title,
                        reason,
                        estimatedMinutes: firstAvailable.estimatedMinutes || 30,
                    };
                }
            }
        }
        const subjectsSummary = [
            {
                id: 'programming',
                name: 'Programming & Data Structures',
                count: topicNodes.length,
            },
            ...academicSubjects.map((s) => ({
                id: s._id.toString(),
                name: s.name,
                count: 1,
            })),
        ];
        return {
            nodes,
            edges,
            summary: {
                totalNodes: topicNodes.length,
                mastered: masteredCount,
                learning: learningCount,
                weak: weakCount,
                needsRevision: needsRevisionCount,
                available: availableCount,
                locked: lockedCount,
                averageMastery,
                assessedCount,
                recommendedNext,
            },
            subjects: subjectsSummary,
        };
    },
    /**
     * Get single node detailed breakdown
     */
    getNodeDetails: async (userId, nodeId) => {
        const graph = await exports.knowledgeGraphService.getKnowledgeGraph(userId, true);
        return graph.nodes.find((n) => n.id === nodeId) || null;
    },
    /**
     * Explain weakness on-demand using AI
     * ONLY invoked when the student explicitly clicks "Explain Weakness"
     */
    explainWeakness: async (topic, mastery, weakReason) => {
        try {
            const prompt = `You are a supportive, expert computer science tutor.
A student is struggling with the concept "${topic}".
Their current mastery is: ${mastery !== null ? `${mastery}%` : 'Not assessed yet'}.
Specific weakness evidence: "${weakReason || 'Recent incorrect quiz questions'}".
Explain concisely in 2-3 paragraphs:
1. Why students often stumble on this concept.
2. The key mental model or core intuition to master it.
3. One concrete, practical exercise or code snippet they can write right now.
Focus on pedagogy. Do not fabricate fake metrics.`;
            const result = await aiOrchestrator_js_1.aiOrchestrator.processRequest({
                message: prompt,
                taskType: 'codeExplanation',
                options: {
                    systemInstruction: 'You are an insightful and encouraging computer science tutor.',
                    temperature: 0.5,
                },
            });
            return result.text;
        }
        catch {
            return `When learning ${topic}, break the problem down into smaller steps. Focus on tracking values in memory and testing boundary cases like empty collections or zero values!`;
        }
    },
};
