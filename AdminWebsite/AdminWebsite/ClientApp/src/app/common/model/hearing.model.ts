import { CaseModel } from './case.model';
import { ParticipantModel } from './participant.model';
import { EndpointModel } from './endpoint.model';
import { LinkedParticipantModel } from './linked-participant.model';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';

export class HearingModel {
    constructor() {
        this.cases = [];
        this.participants = [];
        this.scheduled_duration = 0;
        this.endpoints = [];
        this.linked_participants = [];
        this.hearing_dates = [];
        this.hearing_id = '';
        this.judiciaryParticipants = [];
    }
    hearing_id?: string;
    scheduled_date_time?: Date;
    scheduled_duration?: number;
    hearing_type_id?: number;
    cases?: CaseModel[];
    participants?: ParticipantModel[];
    judiciaryParticipants?: JudicialMemberDto[];
    created_by?: string;
    case_type?: string;
    case_type_service_id?: string;
    other_information?: string;
    judge_email?: string;
    judge_phone?: string;
    court_room?: string;
    hearing_venue_id?: number;
    case_type_id?: number;
    hearing_type_name?: string;
    hearing_type_code?: string;
    court_id?: number;
    court_name?: string;
    court_code?: string;
    created_date?: Date;
    updated_by?: string;
    updated_date: Date;
    status?: string;
    audio_recording_required?: boolean;
    endpoints?: EndpointModel[];
    isMultiDayEdit?: boolean;
    end_hearing_date_time?: Date;
    telephone_conference_id?: string;
    linked_participants?: LinkedParticipantModel[];
    hearing_dates?: Date[];
    isConfirmed?: boolean;
    isMultiDay?: boolean;
    multiDayHearingLastDayScheduledDateTime?: Date;
    hearingsInGroup?: HearingModel[];
    originalScheduledDateTime?: Date;
}
