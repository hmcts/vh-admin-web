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

    private addHours(date: Date, hours: number): Date {
        date.setHours(date.getHours() + hours);
        return date;
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
                hearingsForUser.forEach((hearing, index) => {
                    const hearingScheduledDateTime = new Date(hearing.scheduledDateTime);

                    // get the next hearing, if there is one, or the previous hearing if there's not one
                    const nextHearing = hearingsForUser[index + 1];

                    if (nextHearing) {
                        // if there's a next hearing, see if the current hearing overlaps it
                        if (this.addHours(hearingScheduledDateTime, hearing.duration) > nextHearing.scheduledDateTime) {
                            concurrentHearings++;
                        }
                    } else {
                        const previousHearing = hearingsForUser[index - 1];
                        const previousHearingScheduledDateTime = new Date(previousHearing.scheduledDateTime);
                        // if there's a previous hearing, see if it overlaps the current one
                        if (this.addHours(previousHearingScheduledDateTime, previousHearing.duration) > hearing.scheduledDateTime) {
                            concurrentHearings++;
                        }
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
