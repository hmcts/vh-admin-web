import { VideoSupplier } from 'src/app/services/clients/api-client';
import { CaseModel } from './case.model';
import { ParticipantModel } from './participant.model';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';
import { EndpointModel } from './endpoint.model';
import { LinkedParticipantModel } from './linked-participant.model';

export interface VHBooking {
    hearing_id?: string;
    scheduled_date_time?: Date;
    scheduled_duration?: number;
    case?: CaseModel;
    participants?: ParticipantModel[];
    judiciaryParticipants?: JudicialMemberDto[];
    created_by?: string;
    case_type?: string;
    case_type_service_id?: string;
    other_information?: string;
    court_room?: string;
    hearing_venue_id?: number;
    case_type_id?: number;
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
    hearingsInGroup?: VHBooking[];
    originalScheduledDateTime?: Date;
    supplier: VideoSupplier;
}

export function createVHBooking(): VHBooking {
    return {
        hearing_id: '',
        scheduled_duration: 0,
        participants: [],
        judiciaryParticipants: [],
        endpoints: [],
        linked_participants: [],
        hearing_dates: [],
        updated_date: new Date(),
        supplier: VideoSupplier.Vodafone
    };
}
