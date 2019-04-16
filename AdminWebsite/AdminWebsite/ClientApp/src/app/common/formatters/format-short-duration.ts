function formatHours(hours: number): string {
  if (hours == 0) {
    return '';
  }
  if (hours == 1) {
    return '1 hour'
  }
  return hours + ' hours';
}

function formatMinutes(minutes: number): string {
  if (minutes == 0) {
    return '';
  }
  if (minutes == 1) {
    return '1 minute';
  }
  return minutes + ' minutes';
}

/**
 * Formats a short duration in minutes into a x hours x minutes format
 * @param duration A duration, in minutes
 */
export function FormatShortDuration(duration: number): string {
  if (duration === null || duration === undefined || duration < 0) {
    throw new Error(`Invalid duration: '${duration}'`);
  }

  if (duration === 0) {
    return '-';
  }

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${formatHours(hours)} ${formatMinutes(minutes)}`.trim();
}
