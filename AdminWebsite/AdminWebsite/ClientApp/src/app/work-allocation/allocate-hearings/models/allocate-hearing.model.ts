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

    private addDuration(date: Date, minutes: number): Date {
        const dateToCompare = new Date(date);
        dateToCompare.setMinutes(dateToCompare.getMinutes() + minutes);
        return dateToCompare;
    }

    updateConcurrency() {
        const users = this.hearings.map(h => h.allocatedOfficerUsername).filter(x => !!x && x !== 'Not Allocated');
        const uniqueUsers = users.filter((item, pos) => users.indexOf(item) === pos);
        const usersConcurrentHearingsCounts = uniqueUsers.map(username => {
            const hearingsForUser = this.hearings.filter(
                hearing => hearing.allocatedOfficerUsername && hearing.allocatedOfficerUsername === username
            );

            //let concurrentHearingsCount = 0;
            let concurrentHearings: AllocateHearingItemModel[] = [];

            if (hearingsForUser.length > 1) {
                // hearingsForUser.forEach((hearing, index) => {
                //     const hearingScheduledDateTime = new Date(hearing.scheduledDateTime);

                //     // get the next hearing, if there is one, or the previous hearing if there's not one
                //     const nextHearing = hearingsForUser[index + 1];

                //     if (nextHearing) {
                //         // if there's a next hearing, see if the current hearing overlaps it
                //         if (this.addDuration(hearingScheduledDateTime, hearing.duration) > nextHearing.scheduledDateTime) {
                //             concurrentHearings++;
                //         }
                //     } else {
                //         const previousHearing = hearingsForUser[index - 1];
                //         const previousHearingScheduledDateTime = new Date(previousHearing.scheduledDateTime);
                //         // if there's a previous hearing, see if it overlaps the current one
                //         if (this.addDuration(previousHearingScheduledDateTime, previousHearing.duration) > hearing.scheduledDateTime) {
                //             concurrentHearings++;
                //         }

                hearingsForUser.forEach(hearing => {
                    console.log(`6630 found hearing at ${hearing.scheduledDateTime.toTimeString()}`);
                    const otherHearings = hearingsForUser.filter(x => x.hearingId !== hearing.hearingId);

                    const overlapping = otherHearings.filter(otherHearing => this.isConcurrent(hearing, otherHearing));
                    console.log(`6630 found overlapping hearings`, overlapping);

                    // console.log(
                    //     `9630 ${hearing.scheduledDateTime.toTimeString()} overlapping with: `,
                    //     overlapping.map(x => x.scheduledDateTime.toTimeString())
                    // );

                    //concurrentHearings.push(...overlapping);

                    console.log(`9630 set concurrent hearings for ${hearing.scheduledDateTime.toTimeString()} to ${overlapping.length}`);
                    hearing.concurrentHearingsCount = overlapping.length;
                    // const hasOverlappingHearings = overlapping.length > 0;

                    // if (hasOverlappingHearings) {
                    //     concurrentHearingsCount++;
                    // }
                });
            }

            // console.log(
            //     `9630 concurrent hearings for ${username}: `,
            //     concurrentHearings.sort(this.sortHearingsByDate).map(x => x.scheduledDateTime?.toTimeString())
            // );

            // const reduced = concurrentHearings.reduce((acc, hearing, i) => {
            //     console.log(`9630 position is ${i} on hearingon ${hearing.scheduledDateTime}`);
            //     if (i + 1 < concurrentHearings.length) {
            //         const nextHearing = concurrentHearings[i + 1];
            //         if (hearing.endDateTime().valueOf() > nextHearing.scheduledDateTime.valueOf()) {
            //             acc.push(hearing);
            //         }
            //     }
            //     return acc;
            // }, []);

            concurrentHearings = concurrentHearings.filter((item, pos) => concurrentHearings.indexOf(item) === pos);

            console.log(`OVERLAP: concurrentHearings`, concurrentHearings);

            // const overlappingHearingsCounts = hearingsForUser
            //     .sort(this.sortHearingsByDate)
            //     .map(hearing => this.checkOverlaps(hearingsForUser, hearingsForUser.indexOf(hearing)));

            // console.log(`OVERLAP: COUNTS for ${username}`, overlappingHearingsCounts);
            // return { username, concurrentHearings: overlappingHearingsCounts.sort((a, b) => (a > b ? -1 : 1))[0] || 0 };
            return { username, concurrentHearings: concurrentHearings };
        });

        // this.hearings.forEach(hearingModel => {
        //     if (hearingModel.allocatedOfficerUsername && hearingModel.allocatedOfficerUsername !== 'Not Allocated') {
        //         hearingModel.concurrentHearingsCount = usersConcurrentHearingsCounts.find(
        //             x => x.username === hearingModel.allocatedOfficerUsername
        //         ).concurrentHearings;
        //     }
        // });
    }

    private checkOverlaps(hearings: AllocateHearingItemModel[], position: number = 0, groupSize: number = 1): number {
        console.warn('OVERLAP: checkOverlaps()');
        if (position + 1 < hearings.length) {
            const currentHearing = hearings[position];
            const nextHearing = hearings[position + 1];
            console.log('OVERLAP: CHECKING FOR', currentHearing.scheduledDateTime.toTimeString());
            if (
                currentHearing.endDateTime().valueOf() > nextHearing.scheduledDateTime.valueOf() ||
                currentHearing.hasSameScheduledDateTime(nextHearing)
            ) {
                console.log('OVERLAP: OVERLAPS WITH NEXT HEARING AT', nextHearing.scheduledDateTime.toTimeString());
                //groupSize++;
                groupSize += this.checkOverlaps(hearings, position + 1, groupSize);
            } else {
                console.log('OVERLAP: NO OVERLAP WITH NEXT HEARING AT', nextHearing.scheduledDateTime.toTimeString());
            }
        }
        console.log('OVERLAP: GROUP SIZE IS ', groupSize);
        return groupSize;
    }

    private sortHearingsByDate(a: AllocateHearingItemModel, b: AllocateHearingItemModel) {
        return a.scheduledDateTime.valueOf() > b.scheduledDateTime.valueOf() ? 1 : -1;
    }
}
