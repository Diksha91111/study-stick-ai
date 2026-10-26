export interface TimeRange {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

export const doRangesOverlap = (
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean => {
  return start1 < end2 && end1 > start2;
};

/**
 * Check if a slot overlaps with the user's sleep window.
 * Sleep window usually spans overnight (e.g. 23:00 to 07:00).
 */
export const checkSleepConflict = (
  slotStart: string,
  slotEnd: string,
  bedTime: string,
  wakeTime: string
): { hasConflict: boolean; reason?: string } => {
  const sStart = timeToMinutes(slotStart);
  const sEnd = timeToMinutes(slotEnd);
  const bTime = timeToMinutes(bedTime);
  const wTime = timeToMinutes(wakeTime);

  let inSleepWindow = false;

  if (bTime > wTime) {
    // Overnight sleep (e.g., 23:00 to 07:00)
    // Sleep spans [bTime, 1440) AND [0, wTime)
    const lateNightConflict = doRangesOverlap(sStart, sEnd, bTime, 1440);
    const earlyMorningConflict = doRangesOverlap(sStart, sEnd, 0, wTime);
    inSleepWindow = lateNightConflict || earlyMorningConflict;
  } else {
    // Sleep within same calendar day (e.g., 01:00 to 08:00)
    inSleepWindow = doRangesOverlap(sStart, sEnd, bTime, wTime);
  }

  if (inSleepWindow) {
    return {
      hasConflict: true,
      reason: `Slot (${slotStart} - ${slotEnd}) conflicts with your designated sleep schedule (${bedTime} - ${wakeTime}). Sufficient rest is vital for academic retention!`,
    };
  }

  return { hasConflict: false };
};
