import { calculateSM2, ReviewRating } from '../services/spacedRepetitionService.js';
import assert from 'assert';

async function runTests() {
  console.log('--- Running Phase 9 Flashcard Spaced Repetition Tests ---');

  let passed = 0;
  let failed = 0;

  const test = (name: string, fn: () => void) => {
    try {
      fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (e: any) {
      console.log(`❌ FAIL: ${name}`);
      console.error(e.message || e);
      failed++;
    }
  };

  // 1. First review
  test('First review - Good rating', () => {
    const { interval, repetitions, easeFactor } = calculateSM2('Good', 0, 2.5, 0);
    assert.strictEqual(interval, 1, 'First interval should be 1');
    assert.strictEqual(repetitions, 1, 'Repetitions should be 1');
    assert.strictEqual(easeFactor, 2.5, 'Ease factor should remain unchanged on Good (quality 4)');
  });

  test('First review - Easy rating', () => {
    const { interval, repetitions, easeFactor } = calculateSM2('Easy', 0, 2.5, 0);
    assert.strictEqual(interval, 1, 'First interval should be 1');
    assert.strictEqual(repetitions, 1, 'Repetitions should be 1');
    assert.ok(easeFactor > 2.5, 'Ease factor should increase on Easy (quality 5)');
  });

  test('First review - Again rating', () => {
    const { interval, repetitions, easeFactor } = calculateSM2('Again', 0, 2.5, 0);
    assert.strictEqual(interval, 1, 'Interval resets to 1');
    assert.strictEqual(repetitions, 0, 'Repetitions reset to 0');
    assert.ok(easeFactor < 2.5, 'Ease factor should decrease');
  });

  // 2. Second review
  test('Second review - Good rating', () => {
    const { interval, repetitions } = calculateSM2('Good', 1, 2.5, 1);
    assert.strictEqual(interval, 6, 'Second interval should be 6');
    assert.strictEqual(repetitions, 2, 'Repetitions should be 2');
  });

  // 3. Third review and beyond
  test('Third review - Good rating', () => {
    const { interval, repetitions } = calculateSM2('Good', 6, 2.5, 2);
    assert.strictEqual(interval, Math.round(6 * 2.5), 'Interval should multiply by ease factor');
    assert.strictEqual(repetitions, 3, 'Repetitions should be 3');
  });

  // 4. Failing a mature card
  test('Failing a mature card', () => {
    const { interval, repetitions, easeFactor } = calculateSM2('Again', 15, 2.6, 5);
    assert.strictEqual(interval, 1, 'Interval resets to 1 on failure');
    assert.strictEqual(repetitions, 0, 'Repetitions reset to 0 on failure');
    assert.ok(easeFactor < 2.6, 'Ease factor drops on failure');
  });

  // 5. Invalid ratings
  test('Invalid rating fallback', () => {
    // We'll force cast to check
    const { interval, repetitions } = calculateSM2('Unknown' as ReviewRating, 5, 2.5, 3);
    assert.strictEqual(interval, 1, 'Invalid rating treats as failure (interval 1)');
    assert.strictEqual(repetitions, 0, 'Invalid rating treats as failure (repetitions 0)');
  });

  // 6. Minimum ease factor boundary
  test('Ease factor floor', () => {
    const { easeFactor } = calculateSM2('Again', 1, 1.35, 1);
    assert.strictEqual(easeFactor, 1.3, 'Ease factor should not drop below 1.3');
  });

  // 7. Timezone / Date boundaries
  test('Next review date calculation', () => {
    const now = new Date();
    const { nextReviewDate } = calculateSM2('Good', 0, 2.5, 0); // interval 1
    const diffHours = (nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    assert.ok(diffHours >= 23.9 && diffHours <= 24.1, 'Next review should be ~24 hours from now');
  });

  console.log(`\nTests completed. Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
