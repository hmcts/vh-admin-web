import { Injectable } from '@angular/core';
import { ParticipantEditResultModel } from '../common/model/participant-edit-result.model';
import { BHClient, UpdateAccountDetailsRequest } from './clients/api-client';

@Injectable({ providedIn: 'root' })
export class ParticipantEditService {
    participant: ParticipantEditResultModel;
    constructor(private bhClient: BHClient) {}

    async searchForUsername(username: string): Promise<ParticipantEditResultModel> {
        try {
            const person = await this.bhClient.getPersonForUpdateByContactEmail(username).toPromise();
            if (person) {
                return new ParticipantEditResultModel(
                    person.id,
                    `${person.first_name} ${person.last_name}`,
                    person.first_name,
                    person.last_name,
                    person.username
                );
            } else {
                return null;
            }
        } catch {
            return null;
        }
    }

    assignParticipantToEdit(participant: ParticipantEditResultModel): void {
        this.participant = participant;
    }

    updateParticipantName(personId: string, currentUsername: string, firstName: string, lastName: string): Promise<void> {
        const request = new UpdateAccountDetailsRequest({
            current_username: currentUsername,
            first_name: firstName,
            last_name: lastName
        });
        return this.bhClient.updatePersonDetails(personId, request).toPromise();
    }
}
