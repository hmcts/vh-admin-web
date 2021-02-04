import { Injectable } from '@angular/core';
import { ParticipantModel } from '../common/model/participant.model';

@Injectable({
    providedIn: 'root'
})
export class RecordingGuardService {
    excludedCaseTypes: string[] = ['Court of Appeal Criminal Division'];
    mandatoryRecordingRoles: string[] = ['Interpreter'];

    switchOffRecording(caseType: string): boolean {
        return this.excludedCaseTypes.indexOf(caseType) > -1;
    }

    mandatoryRecordingForHearingRole(participants: ParticipantModel[]) {
        return participants.some(pat => this.mandatoryRecordingRoles.includes(pat.hearing_role_name.trim()));
    }
}
