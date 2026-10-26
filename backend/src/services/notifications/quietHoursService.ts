export interface QuietHoursConfig {
  enabled: boolean;
  startTime: string; // HH:mm, e.g. "22:30"
  endTime: string; // HH:mm, e.g. "07:00"
}

export class QuietHoursService {
  /**
   * Validate IANA timezone string
   */
  static isValidTimezone(timeZone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Extract local hour and minute in the specified timezone
   */
  static getLocalTimeParts(
    date: Date,
    timeZone: string
  ): { hour: number; minute: number; totalMinutes: number } {
    const tz = this.isValidTimezone(timeZone) ? timeZone : 'Asia/Kolkata';
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    let hour = 0;
    let minute = 0;

    for (const part of parts) {
      if (part.type === 'hour') {
        hour = parseInt(part.value, 10);
        if (hour === 24) hour = 0;
      } else if (part.type === 'minute') {
        minute = parseInt(part.value, 10);
      }
    }

    return { hour, minute, totalMinutes: hour * 60 + minute };
  }

  /**
   * Parse "HH:mm" to total minutes from midnight
   */
  static parseTimeToMinutes(timeStr: string): number {
    const [h, m] = (timeStr || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
    return (h % 24) * 60 + (m % 60);
  }

  /**
   * Check if the given date falls into quiet hours for the user's timezone
   */
  static isInQuietHours(
    date: Date,
    timeZone: string,
    quietHours: QuietHoursConfig
  ): boolean {
    if (!quietHours || !quietHours.enabled) {
      return false;
    }

    const startMinutes = this.parseTimeToMinutes(quietHours.startTime || '22:30');
    const endMinutes = this.parseTimeToMinutes(quietHours.endTime || '07:00');

    if (startMinutes === endMinutes) {
      return false;
    }

    const { totalMinutes } = this.getLocalTimeParts(date, timeZone);

    if (startMinutes > endMinutes) {
      // Overnight span (e.g. 22:30 to 07:00)
      return totalMinutes >= startMinutes || totalMinutes < endMinutes;
    } else {
      // Same-day span (e.g. 13:00 to 15:00)
      return totalMinutes >= startMinutes && totalMinutes < endMinutes;
    }
  }

  /**
   * If in quiet hours, calculate the next allowed send time (end of quiet hours)
   */
  static getNextAllowedTime(
    date: Date,
    timeZone: string,
    quietHours: QuietHoursConfig
  ): Date {
    if (!this.isInQuietHours(date, timeZone, quietHours)) {
      return date;
    }

    const startMinutes = this.parseTimeToMinutes(quietHours.startTime || '22:30');
    const endMinutes = this.parseTimeToMinutes(quietHours.endTime || '07:00');
    const { totalMinutes } = this.getLocalTimeParts(date, timeZone);

    let minutesToAdd = 0;
    if (startMinutes > endMinutes) {
      // Overnight quiet hours
      if (totalMinutes >= startMinutes) {
        // Evening before midnight: remainder of today + endMinutes tomorrow
        minutesToAdd = (1440 - totalMinutes) + endMinutes;
      } else {
        // Morning after midnight: endMinutes - current minutes
        minutesToAdd = endMinutes - totalMinutes;
      }
    } else {
      // Same-day quiet hours
      minutesToAdd = endMinutes - totalMinutes;
    }

    // Add 1 extra minute buffer so we land strictly outside the quiet hour boundary
    const rescheduled = new Date(date.getTime() + (minutesToAdd + 1) * 60 * 1000);
    return rescheduled;
  }
}
