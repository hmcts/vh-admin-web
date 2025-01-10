import { Injectable } from '@angular/core';
import { ParticipantEditResultModel } from '../common/model/participant-edit-result.model';
import { BHClient, BookHearingException, UpdateAccountDetailsRequest } from './clients/api-client';
import { Logger } from './logger';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ParticipantEditService {
    participant: ParticipantEditResultModel;
    constructor(
        private readonly bhClient: BHClient,
        private readonly logger: Logger
    ) {}

    async searchForPerson(contactEmail: string): Promise<ParticipantEditResultModel> {
        try {
            const person = await lastValueFrom(this.bhClient.getPersonForUpdateByContactEmail(contactEmail));
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
        } catch (error) {
            this.logger.error(`Failed to find person ${contactEmail}. ${error.response}`, error);
            if (BookHearingException.isBookHearingException(error)) {
                throw error;
            }
            return null;
        }
    }

    assignParticipantToEdit(participant: ParticipantEditResultModel): void {
        this.participant = participant;
    }

    retrieveParticipantToEdit(): ParticipantEditResultModel {
        return this.participant;
    }

    updateParticipantName(personId: string, currentUsername: string, firstName: string, lastName: string): Promise<void> {
        const request = new UpdateAccountDetailsRequest({
            current_username: currentUsername,
            first_name: firstName,
            last_name: lastName
        });
        return lastValueFrom(this.bhClient.updatePersonDetails(personId, request));
    }
}
