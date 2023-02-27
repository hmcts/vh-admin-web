import { AllocationHearingsResponse } from '../../../services/clients/api-client';
/**
 * Represent each row to display for hearing allocation
 */
export class AllocateHearingItemModel {
    public allocatedOfficerId: string;
    public hasChanged = false;

    constructor(
        public hearingId: string,
        public hearingDate: Date,
        public startTime: string,
        public duration: number,
        public caseNumber: string,
        public caseType: string,
        public allocatedOfficerUsername?: string,
        public hasWorkHoursClash?: boolean,
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
                    val.hearing_date,
                    val.start_time,
                    val.duration,
                    val.case_number,
                    val.case_type,
                    val.allocated_cso,
                    val.has_work_hours_clash,
                    val.has_non_availability_clash
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
    }

    checkHearing(hearingId: string) {
        this.hearings.find(x => x.hearingId === hearingId)?.setChecked(true);
    }

    uncheckHearingAndRevert(hearingId: string) {
        // reverting to original hearing defaults to unchecked
        this.revertHearing(hearingId);
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
            originalHearing.hearing_date,
            originalHearing.start_time,
            originalHearing.duration,
            originalHearing.case_number,
            originalHearing.case_type,
            originalHearing.allocated_cso,
            originalHearing.has_work_hours_clash,
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
                    val.hearing_date,
                    val.start_time,
                    val.duration,
                    val.case_number,
                    val.case_type,
                    val.allocated_cso,
                    false
                )
        );
    }
}
