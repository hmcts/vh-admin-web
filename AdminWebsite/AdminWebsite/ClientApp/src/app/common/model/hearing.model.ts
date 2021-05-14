import { CaseModel } from './case.model';
import { ParticipantModel } from './participant.model';
import { EndpointModel } from './endpoint.model';
import { LinkedParticipantModel } from './linked-participant.model';

export class HearingModel {
    constructor() {
        this.cases = [];
        this.participants = [];
        this.scheduled_duration = 0;
        this.endpoints = [];
        this.linked_participants = [];
    }
    hearing_id?: string | undefined;
    scheduled_date_time?: Date | undefined;
    scheduled_duration?: number | undefined;
    hearing_type_id?: number | undefined;
    cases?: CaseModel[] | undefined;
    participants?: ParticipantModel[] | undefined;
    created_by?: string | undefined;
    case_type?: string | undefined;
    other_information?: string | undefined;
    judge_email?: string | undefined;
    judge_phone?: string | undefined;
    court_room?: string | undefined;
    hearing_venue_id?: number | undefined;
    case_type_id?: number | undefined;
    hearing_type_name?: string | undefined;
    court_id?: number | undefined;
    court_name?: string | undefined;
    created_date?: Date | undefined;
    updated_by?: string | undefined;
    updated_date: Date | undefined;
    status?: string | undefined;
    questionnaire_not_required: boolean;
    audio_recording_required?: boolean;
    endpoints?: EndpointModel[] | undefined;
    multiDays?: boolean | undefined;
    end_hearing_date_time?: Date | undefined;
    telephone_conference_id?: string | undefined;
    linked_participants?: LinkedParticipantModel[] | undefined;
    isConfirmed?: boolean;
}
