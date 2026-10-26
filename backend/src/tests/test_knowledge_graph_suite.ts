import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { ProgrammingProgress } from '../models/ProgrammingProgress.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';
import { LearningPath } from '../models/LearningPath.js';
import { learningPathService } from '../services/learningPathService.js';
import { knowledgeGraphService } from '../services/knowledgeGraphService.js';

process.env.NODE_ENV = 'test_runner';

async function runKnowledgeGraphTests() {
  console.log('================================================================================');
  console.log('🧪 VERIFYING STUDY STICK AI KNOWLEDGE GRAPH INTEGRATION SUITE');
  console.log('================================================================================\n');

  await connectDB();

  const timestamp = Date.now();
  const testEmailA = `kg_student_a_${timestamp}@studystick.ai`;
  const testEmailB = `kg_student_b_${timestamp}@studystick.ai`;

  try {
    // 1. Create two test students for user isolation
    const userA = await User.create({
      name: 'Student Knowledge A',
      email: testEmailA,
      password: 'HashedPassword123!',
      isEmailVerified: true,
    });

    const userB = await User.create({
      name: 'Student Knowledge B',
      email: testEmailB,
      password: 'HashedPassword123!',
      isEmailVerified: true,
    });

    console.log('--- Test 1: Initial Empty Graph State (No fabricated mastery) ---');
    const initialGraphA = await knowledgeGraphService.getKnowledgeGraph(userA._id, true);
    
    // Check Variables node
    const variablesNode = initialGraphA.nodes.find((n) => n.title === 'Variables and data types');
    if (!variablesNode) throw new Error('Variables and data types node missing from graph');
    if (variablesNode.status !== 'AVAILABLE') {
      throw new Error(`Expected Variables to be AVAILABLE initially, got: ${variablesNode.status}`);
    }
    if (variablesNode.mastery !== null) {
      throw new Error(`Expected initial mastery to be null (Not assessed yet), got: ${variablesNode.mastery}`);
    }

    // Check Conditions node (prerequisite is Variables, so must be LOCKED)
    const conditionsNode = initialGraphA.nodes.find((n) => n.title === 'Conditions and loops');
    if (!conditionsNode) throw new Error('Conditions and loops node missing from graph');
    if (conditionsNode.status !== 'LOCKED') {
      throw new Error(`Expected Conditions to be LOCKED initially, got: ${conditionsNode.status}`);
    }

    // Check Summary
    if (initialGraphA.summary.assessedCount !== 0) {
      throw new Error(`Expected assessedCount to be 0, got ${initialGraphA.summary.assessedCount}`);
    }
    if (initialGraphA.summary.averageMastery !== null) {
      throw new Error(`Expected averageMastery to be null, got ${initialGraphA.summary.averageMastery}`);
    }
    if (!initialGraphA.summary.recommendedNext || initialGraphA.summary.recommendedNext.title !== 'Variables and data types') {
      throw new Error(`Expected recommendedNext to be Variables, got ${initialGraphA.summary.recommendedNext?.title}`);
    }
    console.log('✅ Test 1 PASSED: Initial graph has real status (Variables AVAILABLE, Conditions LOCKED), no fabricated mastery\n');

    console.log('--- Test 2: Explicit Start of Topic (AVAILABLE -> LEARNING) ---');
    await learningPathService.startTopic(userA._id, 'Variables and data types');
    
    const learningGraph = await knowledgeGraphService.getKnowledgeGraph(userA._id, false);
    const updatedVariables = learningGraph.nodes.find((n) => n.title === 'Variables and data types');
    const updatedConditions = learningGraph.nodes.find((n) => n.title === 'Conditions and loops');

    if (updatedVariables?.status !== 'LEARNING') {
      throw new Error(`Expected Variables to be LEARNING, got: ${updatedVariables?.status}`);
    }
    if (updatedConditions?.status !== 'LOCKED') {
      throw new Error(`Expected Conditions to remain LOCKED, got: ${updatedConditions?.status}`);
    }
    console.log('✅ Test 2 PASSED: Starting topic transitions Variables to LEARNING, Conditions remains LOCKED\n');

    console.log('--- Test 3: Pass Assessment & Verify Unlock Behavior ---');
    // Submit passing assessment (8/10 = 80%)
    const questions = await learningPathService.generateAssessment(userA._id, 'Variables and data types');
    const answers = questions.map((q: any, idx: number) => ({
      questionId: q.id,
      selectedAnswer: idx < 8 ? q.options[0] : 'WRONG_ANSWER_CHOICE', // 8 correct out of 10
    }));

    // Submit with simulated passing score
    const submissionResult = await learningPathService.submitAssessment(
      userA._id,
      'Variables and data types',
      answers,
      5
    );

    // Fetch updated knowledge graph
    const masteredGraph = await knowledgeGraphService.getKnowledgeGraph(userA._id, false);
    const masteredVar = masteredGraph.nodes.find((n) => n.title === 'Variables and data types');
    const unlockedConditions = masteredGraph.nodes.find((n) => n.title === 'Conditions and loops');

    if (masteredVar?.status !== 'MASTERED') {
      throw new Error(`Expected Variables to be MASTERED, got: ${masteredVar?.status}`);
    }
    if (masteredVar.mastery === null || masteredVar.mastery < 70) {
      throw new Error(`Expected real mastery >= 70%, got: ${masteredVar?.mastery}`);
    }
    if (masteredVar.evidence.assessmentAttemptsCount !== 1) {
      throw new Error(`Expected assessmentAttemptsCount to be 1, got ${masteredVar.evidence.assessmentAttemptsCount}`);
    }

    // Critical Requirement 31 verification:
    // Conditions must become AVAILABLE, NOT automatically LEARNING / IN_PROGRESS!
    if (unlockedConditions?.status !== 'AVAILABLE') {
      throw new Error(`CRITICAL: Expected Conditions to become AVAILABLE, but got: ${unlockedConditions?.status}`);
    }
    console.log(`✅ Test 3 PASSED: Passing Variables marked it MASTERED (${masteredVar.mastery}%), unlocked Conditions as AVAILABLE (not automatically LEARNING)\n`);

    console.log('--- Test 4: Graph Persistence (Refresh Simulation) ---');
    const refreshedGraph = await knowledgeGraphService.getKnowledgeGraph(userA._id, false);
    const refVar = refreshedGraph.nodes.find((n) => n.title === 'Variables and data types');
    const refCond = refreshedGraph.nodes.find((n) => n.title === 'Conditions and loops');

    if (refVar?.mastery !== masteredVar.mastery || refVar?.status !== 'MASTERED') {
      throw new Error('Graph state changed after re-fetch!');
    }
    if (refCond?.status !== 'AVAILABLE') {
      throw new Error('Conditions state changed after re-fetch!');
    }
    console.log('✅ Test 4 PASSED: Persisted data identically maintained across refresh\n');

    console.log('--- Test 5: Start Conditions & Fail Assessment (Weak Concept Detection) ---');
    await learningPathService.startTopic(userA._id, 'Conditions and loops');

    // Submit failing assessment (4/10 = 40%)
    const condQuestions = await learningPathService.generateAssessment(userA._id, 'Conditions and loops');
    const failingAnswers = condQuestions.map((q: any, idx: number) => ({
      questionId: q.id,
      selectedAnswer: idx < 4 ? q.options[0] : 'WRONG_FAILING_CHOICE',
    }));

    await learningPathService.submitAssessment(
      userA._id,
      'Conditions and loops',
      failingAnswers,
      6
    );

    const weakGraph = await knowledgeGraphService.getKnowledgeGraph(userA._id, false);
    const weakConditions = weakGraph.nodes.find((n) => n.title === 'Conditions and loops');

    if (weakConditions?.status !== 'WEAK' && weakConditions?.status !== 'NEEDS_REVISION') {
      throw new Error(`Expected Conditions to be WEAK or NEEDS_REVISION, got: ${weakConditions?.status}`);
    }
    if (!weakConditions.weakConcept) {
      throw new Error('Expected weakConcept flag to be true');
    }
    if (!weakConditions.weakReason || weakConditions.weakReason.length === 0) {
      throw new Error('Expected deterministic weakReason to be populated');
    }
    console.log(`✅ Test 5 PASSED: Failed quiz sets status to ${weakConditions.status}, weakConcept=true, reason="${weakConditions.weakReason}"\n`);

    console.log('--- Test 6: User Isolation Verification ---');
    const graphUserB = await knowledgeGraphService.getKnowledgeGraph(userB._id, false);
    const varB = graphUserB.nodes.find((n) => n.title === 'Variables and data types');
    const condB = graphUserB.nodes.find((n) => n.title === 'Conditions and loops');

    if (varB?.status !== 'AVAILABLE' || varB?.mastery !== null) {
      throw new Error(`SECURITY LEAK: User B has User A's Variables mastery: ${varB?.mastery}`);
    }
    if (condB?.status !== 'LOCKED') {
      throw new Error(`SECURITY LEAK: User B has Conditions unlocked prematurely: ${condB?.status}`);
    }
    if (graphUserB.summary.mastered !== 0) {
      throw new Error(`SECURITY LEAK: User B shows mastered concepts from User A: ${graphUserB.summary.mastered}`);
    }
    console.log('✅ Test 6 PASSED: Strict user isolation verified. User B has zero leakage from User A\n');

    console.log('================================================================================');
    console.log('🎉 ALL KNOWLEDGE GRAPH SUITE INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('================================================================================\n');
  } finally {
    // Cleanup test records
    await User.deleteMany({ email: { $in: [testEmailA, testEmailB] } });
    await ProgrammingProgress.deleteMany({});
    await AssessmentAttempt.deleteMany({});
    await LearningPath.deleteMany({});
    await mongoose.connection.close();
  }
}

runKnowledgeGraphTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
