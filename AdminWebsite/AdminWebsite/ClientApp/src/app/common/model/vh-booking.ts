import { VideoSupplier } from 'src/app/services/clients/api-client';
import { CaseModel } from './case.model';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';
import { EndpointModel } from './endpoint.model';
import { LinkedParticipantModel } from './linked-participant.model';
import { FormatShortDuration } from '../formatters/format-short-duration';
import { VHParticipant } from './vh-participant';
import { cloneWithGetters } from '../helpers/clone-with-getters';

export class VHBooking {
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

    constructor(init?: Partial<VHBooking>) {
        Object.assign(this, init);

        this.hearing_id = init.hearing_id ?? '';
        this.scheduled_duration = init.scheduled_duration ?? 0;
        this.participants = init.participants ?? [];
        this.judiciaryParticipants = init.judiciaryParticipants ?? [];
        this.endpoints = init.endpoints ?? [];
        this.linked_participants = init.linked_participants ?? [];
        this.hearing_dates = init.hearing_dates ?? [];
        this.updated_date = init.updated_date ?? new Date();
        this.supplier = init.supplier ?? VideoSupplier.Vodafone
    }

    get durationInHoursAndMinutes() {
        return FormatShortDuration(this.scheduled_duration);
    }
    
    get isCancelled(): boolean {
        return this.status === 'Cancelled';
    }
    
    get isCreated(): boolean {
        return this.status === 'Created';
    }
    
    get hasBookingConfirmationFailed(): boolean {
        return this.status === 'Failed';
    }
    
    get hasConfirmationWithNoJudge(): boolean {
        return this.status === 'ConfirmedWithoutJudge';
    }

    static createForDetails(
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
    ) {
        return new VHBooking({
            hearing_id: hearingId,
            scheduled_date_time: startTime,
            scheduled_duration: duration,
            case: new CaseModel(hearingCaseName, hearingCaseNumber),
            judge: new JudicialMemberDto(null, null, null, null, null, null, false, judgeName),
            court_room: courtRoom,
            court_name: courtAddress,
            created_by: createdBy,
            created_date: createdDate,
            updated_by: lastEditBy,
            updated_date: lastEditDate,
            confirmedBy: confirmedBy,
            confirmedDate: confirmedDate,
            status: status,
            audio_recording_required: audioRecordingRequired,
            cancelReason: cancelReason,
            case_type: caseType,
            courtRoomAccount: courtRoomAccount,
            telephone_conference_id: telephoneConferenceId
        });
    }

    clone(): this {
        return cloneWithGetters(this);
    }
}
