import { Injectable } from '@angular/core';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { JudgeAccountType, JudgeResponse, PersonResponse } from 'src/app/services/clients/api-client';

@Injectable({
  providedIn: 'root'
})
export class ParticipantMapperService {

  constructor() { }


  mapPersonResponseToParticipantModel(p: PersonResponse): ParticipantModel {
    let participant: ParticipantModel;
    if (p) {
        participant = new ParticipantModel();
        participant.id = p.id;
        participant.title = p.title;
        participant.first_name = p.first_name;
        participant.middle_names = p.middle_names;
        participant.last_name = p.last_name;
        participant.username = p.username;
        participant.email = p.contact_email ?? p.username;
        participant.phone = p.telephone_number;
        participant.representee = '';
        participant.company = p.organisation;
    }

    return participant;
}

mapJudgeResponseToParticipantModel(judge: JudgeResponse): ParticipantModel {
    let participant: ParticipantModel;
    if (judge) {
        participant = new ParticipantModel();
        participant.first_name = judge.first_name;
        participant.last_name = judge.last_name;
        participant.username = judge.email;
        participant.email = judge.email;
        participant.display_name = judge.display_name;
        participant.is_courtroom_account = judge.account_type === JudgeAccountType.Courtroom;
    }
    return participant;
}
}
