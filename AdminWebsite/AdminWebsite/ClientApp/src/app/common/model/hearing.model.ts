import { CaseModel } from './case.model';
import { ParticipantModel } from './participant.model';

export class HearingModel {

  constructor() {
    this.cases = [];
    this.feeds = [];
    this.case_type_id = -1;
    this.case_type_name = '';
    this.hearing_type_id = -1;
    this.hearing_type_name = '';

    this.scheduled_duration = 0;
    this.court_name = '';
    this.court_room = '';

    this.participants = [];

    this.other_information = '';
  }

  cases?: CaseModel[] | undefined;
  case_type_id?: number | undefined;
  case_type_name?: string | undefined;
  hearing_type_id?: number | undefined;
  hearing_type_name?: string | undefined;

  scheduled_date_time?: Date | undefined;
  scheduled_duration?: number | undefined;

  court_id?: number | undefined;
  court_name?: string | undefined;
  court_room?: string | undefined;

  participants?: ParticipantModel[] | undefined;

  other_information?: string | undefined;

  created_by?: string | undefined;
  feeds?: FeedModel[] | undefined;
}

export class FeedModel {
  constructor(location: string) {
    this.location = location;
    this.participants = [];
  }
  location?: string | undefined;
  participants?: ParticipantModel[] | undefined;
}
