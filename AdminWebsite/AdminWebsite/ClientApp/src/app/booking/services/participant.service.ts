import { Injectable } from '@angular/core';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';
import { PartyModel } from '../../common/model/party.model';
import { CaseAndHearingRolesResponse } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';

@Injectable({
    providedIn: 'root'
})
export class ParticipantService {
    private readonly loggerPrefix = '[ParticipantService] -';
    constructor(private logger: Logger) {}

    mapParticipantsRoles(caseRoles: CaseAndHearingRolesResponse[]) {
        const participantRoles = caseRoles.map(s => {
            const item = new PartyModel(s.name);
            item.hearingRoles = s.hearing_roles;
            return item;
        });
        return participantRoles;
    }

    public checkDuplication(email: string, participants: ParticipantModel[]): boolean {
        if (!email) {
            const error = new Error(`Cannot check for duplication on undefined email`);
            this.logger.error(`${this.loggerPrefix} Cannot check for duplication on undefined email`, error);
            throw error;
        }
        let existParticipant = false;
        if (participants.length > 0) {
            const part = participants.find(s => s.email.toLowerCase() === email.toLowerCase());
            if (part) {
                existParticipant = true;
            }
        }
        return existParticipant;
    }

    public removeParticipant(hearing: HearingModel, email: string) {
        const indexOfParticipant = hearing.participants.findIndex(x => x.email.toLowerCase() === email.toLowerCase());
        if (indexOfParticipant > -1) {
            if (hearing.hearing_id && hearing.participants[indexOfParticipant].id) {
                const id = hearing.participants[indexOfParticipant].id;
                this.logger.info(`${this.loggerPrefix} Participant Id: ${id} is removed from hearing Id: ${hearing.hearing_id}`, {
                    hearing: hearing.hearing_id,
                    participant: id
                });
            }
            hearing.participants.splice(indexOfParticipant, 1);
        }
    }
}
