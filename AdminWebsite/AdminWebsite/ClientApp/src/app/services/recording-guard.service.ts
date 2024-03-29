import { Injectable } from '@angular/core';
import { ParticipantModel } from '../common/model/participant.model';

@Injectable({
    providedIn: 'root'
})
export class RecordingGuardService {
    excludedCaseTypes: string[] = ['Court of Appeal Criminal Division', 'Crime Crown Court'];
    mandatoryRecordingRoles: string[] = ['Interpreter'];
    mandatoryRecordingRoleCodes: string[] = ['INTP'];

    switchOffRecording(caseType: string): boolean {
        return this.excludedCaseTypes.indexOf(caseType) > -1;
    }

    mandatoryRecordingForHearingRole(participants: ParticipantModel[]) {
        return (
            participants.some(pat => this.mandatoryRecordingRoles.includes(pat.hearing_role_name?.trim())) ||
            participants.some(pat => this.mandatoryRecordingRoleCodes.includes(pat.hearing_role_code?.trim()))
        );
    }
}
