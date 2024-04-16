export class ErrorMessages {
    public static readonly ErrorStartDateRequired = 'Start date is required';
    public static readonly ErrorEndDateRequired = 'End date is required';
    public static readonly ErrorEndTimeCannotBeBeforeStartTime = 'End time cannot be before Start time';
    public static readonly ErrorEndDatetimeMustBeAfterStartDatetime = 'End datetime must be after Start datetime';
    public static readonly ErrorOverlappingDatetimes = 'You cannot enter overlapping non-availability for the same person';
    public static readonly ErrorStartTimeRequired = 'Start time is required';
    public static readonly ErrorEndTimeRequired = 'End time is required';
    public static readonly WarningRecordLimitExceeded = 'Showing only 20 Records, For more records please use filter by date';
    public static readonly WarningNoWorkingHoursForVho = 'There are no non-availability hours uploaded for this team member';
    public static readonly DeleteRowMessageNonAvailabilityHours = 'Non-availability hours deleted successfully';
}
