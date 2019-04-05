import { Injectable } from '@angular/core';
import { BHClient, JudgeResponse } from 'src/app/services/clients/api-client';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class JudgeDataService {

    constructor(private bhClient: BHClient) { }

    getJudges(): Observable<JudgeResponse[]> {
        return this.bhClient.getJudges();
    }
}
