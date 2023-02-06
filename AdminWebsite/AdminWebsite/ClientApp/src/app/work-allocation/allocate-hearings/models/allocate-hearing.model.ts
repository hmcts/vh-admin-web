import { AllocationHearingsResponse } from '../../../services/clients/api-client';
/**
 * Represent each row to display for hearing allocation
 */
export class AllocateHearingItemModel {
    public allocatedOfficerId: string;

    constructor(
        public hearingId: string,
        public hearingDate: Date,
        public startTime: string,
        public duration: number,
        public caseNumber: string,
        public caseType: string,
        public allocatedOfficerUsername?: string,
        public checked: boolean = false
    ) {}

    setChecked(isChecked: boolean) {
        this.checked = isChecked;
    }

    updateAssignedCso(username: string, id: string) {
        this.allocatedOfficerUsername = username;
        this.allocatedOfficerId = id;
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
        const match = arraysEqual(original, current);
        return !stringMatch;
    }

    get areAllChecked(): boolean {
        return this.hearings.every(h => h.checked);
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

export function arraysEqual(a, b): boolean {
    if (a === b) {
        return true;
    }
    if (a == null || b == null) {
        return false;
    }
    if (a.length !== b.length) {
        return false;
    }

    /**
     * If you don't care about the order of the elements inside the array, you should sort both arrays here.
     * Please note that calling sort on an array will modify that array.
     * You might want to clone your array first.
     */
    for (let i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}
