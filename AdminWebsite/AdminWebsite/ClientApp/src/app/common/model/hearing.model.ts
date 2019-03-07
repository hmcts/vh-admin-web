import { CaseModel } from './case.model';
import { ParticipantModel } from './participant.model';

export class HearingModel {

  constructor() {
    this.cases = [];
    this.participants = [];
    this.scheduled_duration = 0;
  }
  scheduled_date_time?: Date | undefined;
  scheduled_duration?: number | undefined;
  hearing_type_name?: string | undefined;
  cases?: CaseModel[] | undefined;
  participants?: ParticipantModel[] | undefined;
  created_by?: string | undefined;
  case_type?: string | undefined;
  other_information?: string | undefined;
  court_room?: string | undefined;
  hearing_venue_name?: string | undefined;
}

