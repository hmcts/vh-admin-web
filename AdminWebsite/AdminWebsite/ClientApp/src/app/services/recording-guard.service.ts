import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class RecordingGuardService {
    excludedCaseTypes: string[] = ['Court of Appeal Criminal Division'];

    switchOffRecording(caseType: string): boolean {
        return this.excludedCaseTypes.indexOf(caseType) > -1;
    }
}
