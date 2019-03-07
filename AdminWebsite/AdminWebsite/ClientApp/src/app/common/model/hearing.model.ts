import { CaseModel } from './case.model';
import { ParticipantModel } from './participant.model';

export class HearingModel {

  constructor() {
    this.cases = [];
    this.feeds = [];
    this.court_id = -1;
    this.hearing_type_id = -1;
    this.hearing_medium_id = -1;
    this.scheduled_duration = 0;
  }
  scheduled_date_time?: Date | undefined;
  scheduled_duration?: number | undefined;
  hearing_type_id?: number | undefined;
  hearing_medium_id?: number | undefined;
  court_id?: number | undefined;
  cases?: CaseModel[] | undefined;
  feeds?: FeedModel[] | undefined;
  created_by?: string | undefined;

  other_information?: string | undefined;
  court_room?: string | undefined;
}

export class FeedModel {
  constructor(location: string) {
    this.location = location;
    this.participants = [];
  }
  location?: string | undefined;
  participants?: ParticipantModel[] | undefined;
  }


