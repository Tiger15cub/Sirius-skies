export function scheduleTaskAtMidnightUTC(task: () => void): void {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(now.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0); // Set to 00:00 UTC

  const timeUntilNextExecution = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    task();
    scheduleTaskAtMidnightUTC(task);
  }, timeUntilNextExecution);
}

export function calculateOneMinuteBeforeMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  const oneMinuteBeforeMidnight = new Date(midnight.getTime() - 60000);

  return oneMinuteBeforeMidnight.toISOString();
}
