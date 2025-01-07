import { Injectable } from '@angular/core';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { HearingRoleResponse } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { HearingRoleModel } from '../../common/model/hearing-role.model';
import { VHParticipant } from 'src/app/common/model/vh-participant';

@Injectable({
    providedIn: 'root'
})
export class ParticipantService {
    private readonly loggerPrefix = '[ParticipantService] -';
    constructor(private readonly logger: Logger) {}

    mapParticipantHearingRoles(hearingRoles: HearingRoleResponse[]) {
        return hearingRoles.map(x => new HearingRoleModel(x.name, x.user_role, x.code));
    }

    public checkDuplication(email: string, participants: VHParticipant[]): boolean {
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

    public removeParticipant(hearing: VHBooking, email: string) {
        const indexOfParticipant = hearing.participants.findIndex(x => x.email.toLowerCase() === email.toLowerCase());
        if (indexOfParticipant > -1) {
            if (hearing.hearingId && hearing.participants[indexOfParticipant].id) {
                const id = hearing.participants[indexOfParticipant].id;
                this.logger.info(`${this.loggerPrefix} Participant Id: ${id} is removed from hearing Id: ${hearing.hearingId}`, {
                    hearing: hearing.hearingId,
                    participant: id
                });
            }
            hearing.participants.splice(indexOfParticipant, 1);
            hearing.participants = [...hearing.participants];
        }
    }
}
