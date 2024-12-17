import { VideoSupplier } from 'src/app/services/clients/api-client';
import { CaseModel } from './case.model';
import { ParticipantModel } from './participant.model';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';
import { EndpointModel } from './endpoint.model';
import { LinkedParticipantModel } from './linked-participant.model';
import { FormatShortDuration } from '../formatters/format-short-duration';
import { Constants } from '../constants';

export class VHBooking {
    constructor(
        hearingId?: string,
        startTime?: Date,
        duration?: number,
        hearingCaseNumber?: string,
        hearingCaseName?: string,
        judgeName?: string,
        courtRoom?: string,
        courtAddress?: string,
        createdBy?: string,
        createdDate?: Date,
        lastEditBy?: string,
        lastEditDate?: Date,
        confirmedBy?: string,
        confirmedDate?: Date,
        status?: string,
        audioRecordingRequired?: boolean,
        cancelReason?: string,
        caseType?: string,
        courtRoomAccount?: string,
        telephoneConferenceId?: string
    ) {
        this.hearing_id = hearingId || '';
        this.scheduled_date_time = startTime;
        this.scheduled_duration = duration || 0;
        this.case = new CaseModel(hearingCaseName, hearingCaseNumber);
        this.court_room = courtRoom;
        this.court_name = courtAddress;
        this.created_by = createdBy;
        this.created_date = createdDate;
        this.updated_by = lastEditBy;
        this.updated_date = lastEditDate;
        this.confirmedBy = confirmedBy;
        this.confirmedDate = confirmedDate;
        this.status = status;
        this.audio_recording_required = audioRecordingRequired;
        this.cancelReason = cancelReason;
        this.case_type = caseType;
        this.courtRoomAccount = courtRoomAccount;
        this.telephone_conference_id = telephoneConferenceId;
        this.participants = [];
        this.judiciaryParticipants = [];

        if (judgeName) {
            this.assignJudge(judgeName);
        }

        this.endpoints = [],
        this.linked_participants = [],
        this.hearing_dates = [],
        this.updated_date = new Date(),
        this.supplier = VideoSupplier.Vodafone
        this.groupId = null;
    }

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
    multiDayHearingLastDayScheduledDateTime?: Date;
    hearingsInGroup?: VHBooking[];
    originalScheduledDateTime?: Date;
    supplier: VideoSupplier;
    groupId?: string;
    confirmedBy?: string;
    confirmedDate?: Date;
    cancelReason?: string;
    courtRoomAccount?: string;
    allocatedTo?: string;

    get durationInHoursAndMinutes(): string {
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

    get isMultiDay(): boolean {
        return this.groupId !== null;
    }

    get isLastDayOfMultiDayHearing(): boolean {
        return this.scheduled_date_time.getTime() === this.multiDayHearingLastDayScheduledDateTime?.getTime();
    }

    get judge(): JudicialMemberDto {
        return this.judiciaryParticipants?.find(x => x.roleCode === Constants.Judge) || null;
    }

    assignJudge(displayName: string) {
        const judge = JudicialMemberDto.judgeWithDisplayName(displayName);
        this.judiciaryParticipants = this.judiciaryParticipants.filter(x => x.roleCode !== Constants.Judge);
        this.judiciaryParticipants.push(judge);
    }
}