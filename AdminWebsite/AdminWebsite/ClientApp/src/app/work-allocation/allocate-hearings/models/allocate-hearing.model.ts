import { AllocationHearingsResponse } from '../../../services/clients/api-client';
/**
 * Represent each row to display for hearing allocation
 */
export class AllocateHearingItemModel {
    public allocatedOfficerId: string;
    public hasChanged = false;

    constructor(
        public hearingId: string,
        public scheduledDateTime: Date,
        public duration: number,
        public caseNumber: string,
        public caseType: string,
        public allocatedOfficerUsername?: string,
        public hasWorkHoursClash?: boolean,
        public concurrentHearingsCount?: number,
        public hasNonAvailabilityClash?: boolean,
        public checked: boolean = false
    ) {}

    setChecked(isChecked: boolean) {
        this.checked = isChecked;
    }

    updateAssignedCso(username: string, id: string) {
        this.allocatedOfficerUsername = username;
        this.allocatedOfficerId = id;
        this.hasChanged = true;
        this.hasWorkHoursClash = false;
        this.hasNonAvailabilityClash = false;
    }

    hasSameScheduledDateTime(otherHearing: AllocateHearingItemModel): boolean {
        return this.scheduledDateTime.valueOf() === otherHearing.scheduledDateTime.valueOf();
    }

    isBefore(otherHearing: AllocateHearingItemModel): boolean {
        return this.scheduledDateTime.valueOf() < otherHearing.scheduledDateTime.valueOf();
    }

    isAfter(otherHearing: AllocateHearingItemModel): boolean {
        return this.scheduledDateTime.valueOf() > otherHearing.scheduledDateTime.valueOf();
    }

    // convenience function to calculate and return hearing's end time, using duration
    endDateTime(): Date {
        const startsAt = new Date(this.scheduledDateTime);
        startsAt.setMinutes(startsAt.getMinutes() + this.duration);
        return startsAt;
    }
}

/**
 * A view model to manage hearing allocations
 */
export class AllocateHearingModel {
    public hearings: AllocateHearingItemModel[];

    constructor(public originalState: AllocationHearingsResponse[]) {
        this.hearings = this.originalState.map(
            val =>
                new AllocateHearingItemModel(
                    val.hearing_id,
                    val.scheduled_date_time,
                    val.duration,
                    val.case_number,
                    val.case_type,
                    val.allocated_cso,
                    val.has_work_hours_clash,
                    val.concurrent_hearings_count,
                    val.has_non_availability_clash,
                    false
                )
        );
    }

    get selectedHearingIds(): string[] {
        return this.hearings.filter(h => h.checked).map(s => s.hearingId);
    }

    get hasSelectedHearings(): boolean {
        return this.hearings.some(h => h.checked);
    }

    get hasPendingChanges(): boolean {
        const original = this.originalState.map(h => <any>{ id: h.hearing_id, cso: h.allocated_cso }).sort();
        const current = this.hearings.map(h => <any>{ id: h.hearingId, cso: h.allocatedOfficerUsername }).sort();

        const stringMatch = JSON.stringify(original) === JSON.stringify(current);
        return !stringMatch;
    }

    get areAllChecked(): boolean {
        return this.hearings.length > 0 && this.hearings.every(h => h.checked);
    }

    assignCsoToSelectedHearings(csoUsername: string, csoId: string): void {
        this.hearings.forEach(h => {
            if (h.checked) {
                h.updateAssignedCso(csoUsername, csoId);
            }
        });
        this.updateConcurrency();
    }

    checkHearing(hearingId: string) {
        this.hearings.find(x => x.hearingId === hearingId)?.setChecked(true);
    }

    uncheckHearingAndRevert(hearingId: string) {
        // reverting to original hearing defaults to unchecked
        this.revertHearing(hearingId);
        this.updateConcurrency();
    }

    checkAllHearings(): void {
        this.hearings.forEach(h => h.setChecked(true));
    }

    uncheckAllHearingsAndRevert(): void {
        this.hearings.forEach(h => this.uncheckHearingAndRevert(h.hearingId));
    }

    revertHearing(hearingId: string): void {
        const index = this.hearings.findIndex(h => h.hearingId === hearingId);
        const originalHearing = this.originalState.find(h => h.hearing_id === hearingId);
        this.hearings[index] = new AllocateHearingItemModel(
            originalHearing.hearing_id,
            originalHearing.scheduled_date_time,
            originalHearing.duration,
            originalHearing.case_number,
            originalHearing.case_type,
            originalHearing.allocated_cso,
            originalHearing.has_work_hours_clash,
            originalHearing.concurrent_hearings_count,
            false
        );
    }

    /**
     * Update the original state field with the newly updated hearings
     */
    updateHearings(updatedHearings: AllocationHearingsResponse[]): void {
        updatedHearings.forEach(updatedHearing => {
            const index = this.originalState.findIndex(x => x.hearing_id === updatedHearing.hearing_id);
            this.originalState[index] = updatedHearing;
        });

        this.hearings = this.originalState.map(
            val =>
                new AllocateHearingItemModel(
                    val.hearing_id,
                    val.scheduled_date_time,
                    val.duration,
                    val.case_number,
                    val.case_type,
                    val.allocated_cso,
                    false
                )
        );
    }

    // compare two hearings - consider them concurrent if:
    // (a) the have the same scheduled start time
    // (b) a starts after b, but b's end time is past a's start time
    // (c) a starts before b, but a's end time is past b's start time
    isConcurrent(a: AllocateHearingItemModel, b: AllocateHearingItemModel): boolean {
        return (
            a.hasSameScheduledDateTime(b) ||
            (a.isAfter(b) && b.endDateTime().valueOf() > a.scheduledDateTime.valueOf()) ||
            (a.isBefore(b) && a.endDateTime().valueOf() > b.scheduledDateTime.valueOf())
        );
    }

    updateConcurrency() {
        const users = this.hearings.map(h => h.allocatedOfficerUsername).filter(x => !!x && x !== 'Not Allocated');
        const uniqueUsers = users.filter((item, pos) => users.indexOf(item) === pos);
        const usersConcurrentHearingsCounts = uniqueUsers.map(username => {
            const hearingsForUser = this.hearings.filter(
                hearing => hearing.allocatedOfficerUsername && hearing.allocatedOfficerUsername === username
            );

            let concurrentHearings = 0;

            if (hearingsForUser.length > 1) {
                hearingsForUser.forEach(hearing => {
                    const otherHearings = hearingsForUser.filter(x => x.hearingId !== hearing.hearingId);

                    const hasOverlappingHearings =
                        otherHearings.filter(otherHearing => this.isConcurrent(hearing, otherHearing)).length > 0;

                    if (hasOverlappingHearings) {
                        concurrentHearings++;
                    }
                });
            }
            return { username, concurrentHearings };
        });

        this.hearings.forEach(hearingModel => {
            if (hearingModel.allocatedOfficerUsername && hearingModel.allocatedOfficerUsername !== 'Not Allocated') {
                hearingModel.concurrentHearingsCount = usersConcurrentHearingsCounts.find(
                    x => x.username === hearingModel.allocatedOfficerUsername
                ).concurrentHearings;
            }
        });
    }
}
