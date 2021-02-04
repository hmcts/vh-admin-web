import { Injectable } from '@angular/core';
import { ParticipantModel } from '../common/model/participant.model';

@Injectable({
    providedIn: 'root'
})
export class RecordingGuardService {
    excludedCaseTypes: string[] = ['Court of Appeal Criminal Division'];

    switchOffRecording(caseType: string): boolean {
        return this.excludedCaseTypes.indexOf(caseType) > -1;
    }

    mandatoryRecordingWithInterpreter(participants: ParticipantModel[])
    {
        return participants.some(pat => pat.hearing_role_name.trim()==="Interpreter")
    }
}
