import { Injectable } from '@angular/core';
import { Constants } from '../common/constants';

const participantEmailKey = 'participantEmailKey';
const existingCaseTypeKey = 'selectedCaseType';
const bookingEditKey = 'bookingEditKey';

@Injectable({
    providedIn: 'root'
})
export class BookingService {
    constructor() {}

    setEditMode() {
        sessionStorage.setItem(bookingEditKey, bookingEditKey);
    }

    removeEditMode() {
        sessionStorage.removeItem(bookingEditKey);
    }

    resetEditMode() {
        sessionStorage.removeItem(bookingEditKey);
        sessionStorage.removeItem(existingCaseTypeKey);
    }

    isEditMode(): boolean {
        const editMode = sessionStorage.getItem(bookingEditKey);
        return editMode === bookingEditKey;
    }

    setParticipantEmail(participantEmail: string) {
        sessionStorage.setItem(participantEmailKey, participantEmail);
    }

    getParticipantEmail() {
        return sessionStorage.getItem(participantEmailKey);
    }

    removeParticipantEmail() {
        sessionStorage.removeItem(participantEmailKey);
    }

    isParticipantEmail(): boolean {
        const participantEmail = sessionStorage.getItem(participantEmailKey);
        return participantEmail && participantEmail.length > 0;
    }

    setExistingCaseType(selectedCaseType: string) {
        sessionStorage.setItem(existingCaseTypeKey, selectedCaseType);
    }

    removeExistingCaseType() {
        sessionStorage.removeItem(existingCaseTypeKey);
    }
}
