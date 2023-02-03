import { AllocationHearingsResponse } from '../../../services/clients/api-client';
/**
 * Represent each row to display for hearing allocation
 */
export class AllocateHearingItemModel {
    public allocatedOfficerId: string;

    constructor(public hearingId?: string, public allocatedOfficerUsername?: string, public checked: boolean = false) {}

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
        this.hearings = this.originalState.map(val => new AllocateHearingItemModel(val.hearing_id, val.allocated_cso, false));
    }

    get selectedHearingIds(): string[] {
        return this.hearings.filter(h => h.checked).map(s => s.hearingId);
    }

    get hasSelectedHearings(): boolean {
        return this.hearings.some(h => h.checked);
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

    revertHearing(hearingId: string) {
        const index = this.hearings.findIndex(h => h.hearingId === hearingId);
        const original = this.originalState.find(h => h.hearing_id === hearingId);
        this.hearings[index] = new AllocateHearingItemModel(original.hearing_id, original.allocated_cso, false);
        this.originalState.find(h => h.hearing_id === hearingId);
    }

    // updateCsoForHearing(hearingId: string, csoId: string, csoUsername: string): void {
    //     this.hearings.find(h => h.hearingId === hearingId)?.updateAssignedCso(csoUsername, csoId);
    // }

    updateHearings(updatedHearings: AllocationHearingsResponse[]) {
        updatedHearings.forEach(updatedHearing => {
            const index = this.originalState.findIndex(x => x.hearing_id === updatedHearing.hearing_id);
            this.originalState[index] = updatedHearing;
        });

        this.hearings = this.originalState.map(val => new AllocateHearingItemModel(val.hearing_id, val.allocated_cso, false));
    }
}
