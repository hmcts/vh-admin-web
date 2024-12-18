import { VideoSupplier } from 'src/app/services/clients/api-client';
import { CaseModel } from './case.model';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';
import { EndpointModel } from './endpoint.model';
import { LinkedParticipantModel } from './linked-participant.model';
import { mapCaseNameAndNumberToCaseModel, mapJudgeNameToJudge } from './api-contract-to-client-model-mappers';
import { FormatShortDuration } from '../formatters/format-short-duration';
import { VHParticipant } from './vh-participant';

export interface VHBooking {
    hearing_id?: string;
    scheduled_date_time?: Date;
    scheduled_duration?: number;
    case?: CaseModel;
    participants?: VHParticipant[];
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
    judge?: JudicialMemberDto;
    isLastDayOfMultiDayHearing?: boolean;
    groupId?: string;
    confirmedBy?: string;
    confirmedDate?: Date;
    cancelReason?: string;
    courtRoomAccount?: string;
    allocatedTo?: string;
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

// TODO this is primarily used to enforce required properties
// Should we consolidate this with createVHBooking
// Or make them non-optional properties in VHBooking
export function createVHBookingFromDetails(
    hearingId: string,
    startTime: Date,
    duration: number,
    hearingCaseNumber: string,
    hearingCaseName: string,
    judgeName: string,
    courtRoom: string,
    courtAddress: string,
    createdBy: string,
    createdDate: Date,
    lastEditBy: string,
    lastEditDate: Date,
    confirmedBy: string,
    confirmedDate: Date,
    status: string,
    audioRecordingRequired: boolean,
    cancelReason: string,
    caseType: string,
    courtRoomAccount: string,
    telephoneConferenceId: string
): VHBooking {
    const booking = createVHBooking();
    booking.hearing_id = hearingId;
    booking.scheduled_date_time = startTime;
    booking.scheduled_duration = duration;
    booking.case = mapCaseNameAndNumberToCaseModel(hearingCaseName, hearingCaseNumber);
    booking.judge = mapJudgeNameToJudge(judgeName);
    booking.court_room = courtRoom;
    booking.court_name = courtAddress;
    booking.created_by = createdBy;
    booking.created_date = createdDate;
    booking.updated_by = lastEditBy;
    booking.updated_date = lastEditDate;
    booking.confirmedBy = confirmedBy;
    booking.confirmedDate = confirmedDate;
    booking.status = status;
    booking.audio_recording_required = audioRecordingRequired;
    booking.cancelReason = cancelReason;
    booking.case_type = caseType;
    booking.courtRoomAccount = courtRoomAccount;
    booking.telephone_conference_id = telephoneConferenceId;
    return booking;
}

export function durationInHoursAndMinutes(booking: VHBooking) {
    return FormatShortDuration(booking.scheduled_duration);
}

export function isCancelled(booking: VHBooking): boolean {
    return booking.status === 'Cancelled';
}

export function isCreated(booking: VHBooking): boolean {
    return booking.status === 'Created';
}

export function hasBookingConfirmationFailed(booking: VHBooking): boolean {
    return booking.status === 'Failed';
}

export function hasConfirmationWithNoJudge(booking: VHBooking): boolean {
    return booking.status === 'ConfirmedWithoutJudge';
}
