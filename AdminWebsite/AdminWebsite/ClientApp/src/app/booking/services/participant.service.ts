import { Injectable } from '@angular/core';
import { ParticipantModel } from '../../common/model/participant.model';
import { HearingModel } from '../../common/model/hearing.model';
import { CaseAndHearingRolesResponse } from '../../services/clients/api-client';
import { PartyModel } from '../../common/model/party.model';

@Injectable({
  providedIn: 'root'
})
export class ParticipantService {

  constructor() { }

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
      throw new Error(`Cannot check for duplication on undefined email`);
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
      hearing.participants.splice(indexOfParticipant, 1);
    }
  }
}
