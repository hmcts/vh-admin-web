import { Injectable } from '@angular/core';
import { VHParticipant } from '../common/model/vh-participant';

@Injectable({
    providedIn: 'root'
})
export class RecordingGuardService {
    mandatoryRecordingRoles: string[] = ['Interpreter'];
    mandatoryRecordingRoleCodes: string[] = ['INTP'];

    mandatoryRecordingForHearingRole(participants: VHParticipant[]) {
        return (
            participants.some(pat => this.mandatoryRecordingRoles.includes(pat.hearingRoleName?.trim())) ||
            participants.some(pat => this.mandatoryRecordingRoleCodes.includes(pat.hearingRoleCode?.trim()))
        );
    }
}
