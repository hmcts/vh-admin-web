import { Injectable } from '@angular/core';
import { HearingModel } from '../../common/model/hearing.model';
import { ParticipantModel } from '../../common/model/participant.model';
import { PartyModel } from '../../common/model/party.model';
import { CaseAndHearingRolesResponse, HearingRoleResponse } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { HearingRoleModel } from '../../common/model/hearing-role.model';

@Injectable({
    providedIn: 'root'
})
export class ParticipantService {
    private readonly loggerPrefix = '[ParticipantService] -';
    constructor(private logger: Logger) {}

    mapParticipantsRoles(caseRoles: CaseAndHearingRolesResponse[]) {
        const participantRoles = caseRoles.map(s => {
            const item = new PartyModel(s.name);
            item.hearingRoles = s.hearing_roles.map(x => new HearingRoleModel(x.name, x.user_role));
            return item;
        });
        return participantRoles;
    }

    mapParticipantHearingRoles(hearingRoles: HearingRoleResponse[]) {
        const participantRoles = hearingRoles.map(x => new HearingRoleModel(x.name, x.user_role, x.code));
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
            hearing.participants = [...hearing.participants];
        }
    }
}
