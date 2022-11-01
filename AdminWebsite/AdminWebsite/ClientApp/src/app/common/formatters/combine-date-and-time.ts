/**
 * Combines a separate date and time string into a date object
 * @param date Date string in format yyy-MM-dd
 * @param time Time string in format HH:mm:ss
 */
export function CombineDateAndTime(date: string, time: string) {
    const dateParts = date.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);
    const timeParts = time.split(':');
    const hour = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const seconds = 0;
    const milliseconds = 0;

    const datetime = new Date(year, month, day, hour, minutes, seconds, milliseconds);
    return datetime;
}
