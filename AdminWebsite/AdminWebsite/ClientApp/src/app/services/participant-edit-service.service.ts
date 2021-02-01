import { Injectable } from '@angular/core';
import { ParticipantEditResultModel } from '../common/model/participant-edit-result.model';
import { BHClient } from './clients/api-client';

@Injectable({ providedIn: 'root' })
export class ParticipantEditService {
    constructor(private bhClient: BHClient) {}

    async searchForUsername(username: string): Promise<ParticipantEditResultModel> {
        try {
            const person = await this.bhClient.getPersonForUpdateByContactEmail(username).toPromise();
            if (person) {
                return new ParticipantEditResultModel(person.id, `${person.first_name} ${person.last_name}`, person.username);
            } else {
                return null;
            }
        } catch {
            return null;
        }
    }
}
