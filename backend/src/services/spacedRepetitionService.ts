export type ReviewRating = 'Again' | 'Hard' | 'Good' | 'Easy';

export interface SM2Result {
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: Date;
}

export const calculateSM2 = (
  rating: ReviewRating,
  currentInterval: number,
  currentEaseFactor: number,
  currentRepetitions: number
): SM2Result => {
  let quality: number;

  switch (rating) {
    case 'Again':
      quality = 1; // 1: Incorrect response; the correct one remembered
      break;
    case 'Hard':
      quality = 3; // 3: Correct response recalled with serious difficulty
      break;
    case 'Good':
      quality = 4; // 4: Correct response after a hesitation
      break;
    case 'Easy':
      quality = 5; // 5: Perfect response
      break;
    default:
      quality = 0; // Default to complete failure if invalid
  }

  let newInterval: number;
  let newRepetitions: number;
  let newEaseFactor = currentEaseFactor;

  if (quality < 3) {
    // Failed to recall
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Successful recall
    if (currentRepetitions === 0) {
      newInterval = 1;
    } else if (currentRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * currentEaseFactor);
    }
    newRepetitions = currentRepetitions + 1;
  }

  // Update ease factor
  newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setUTCDate(nextReviewDate.getUTCDate() + newInterval);
  // Ensure we standardize the time of day, e.g., end of the day or exact time.
  // We'll just add exactly interval * 24 hours to the current time, or set it to start of that day.
  // Let's use exact 24 hours for simplicity or set to 00:00:00. Let's just keep the time.

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    nextReviewDate,
  };
};
