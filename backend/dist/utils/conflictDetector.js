"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSleepConflict = exports.doRangesOverlap = exports.timeToMinutes = void 0;
const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
};
exports.timeToMinutes = timeToMinutes;
const doRangesOverlap = (start1, end1, start2, end2) => {
    return start1 < end2 && end1 > start2;
};
exports.doRangesOverlap = doRangesOverlap;
/**
 * Check if a slot overlaps with the user's sleep window.
 * Sleep window usually spans overnight (e.g. 23:00 to 07:00).
 */
const checkSleepConflict = (slotStart, slotEnd, bedTime, wakeTime) => {
    const sStart = (0, exports.timeToMinutes)(slotStart);
    const sEnd = (0, exports.timeToMinutes)(slotEnd);
    const bTime = (0, exports.timeToMinutes)(bedTime);
    const wTime = (0, exports.timeToMinutes)(wakeTime);
    let inSleepWindow = false;
    if (bTime > wTime) {
        // Overnight sleep (e.g., 23:00 to 07:00)
        // Sleep spans [bTime, 1440) AND [0, wTime)
        const lateNightConflict = (0, exports.doRangesOverlap)(sStart, sEnd, bTime, 1440);
        const earlyMorningConflict = (0, exports.doRangesOverlap)(sStart, sEnd, 0, wTime);
        inSleepWindow = lateNightConflict || earlyMorningConflict;
    }
    else {
        // Sleep within same calendar day (e.g., 01:00 to 08:00)
        inSleepWindow = (0, exports.doRangesOverlap)(sStart, sEnd, bTime, wTime);
    }
    if (inSleepWindow) {
        return {
            hasConflict: true,
            reason: `Slot (${slotStart} - ${slotEnd}) conflicts with your designated sleep schedule (${bedTime} - ${wakeTime}). Sufficient rest is vital for academic retention!`,
        };
    }
    return { hasConflict: false };
};
exports.checkSleepConflict = checkSleepConflict;
