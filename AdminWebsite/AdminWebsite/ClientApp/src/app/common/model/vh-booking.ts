import { VideoSupplier } from 'src/app/services/clients/api-client';
import { CaseModel } from './case.model';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';
import { EndpointModel } from './endpoint.model';
import { LinkedParticipantModel } from './linked-participant.model';
import { FormatShortDuration } from '../formatters/format-short-duration';
import { VHParticipant } from './vh-participant';
import { cloneWithGetters } from '../helpers/clone-with-getters';
import { Constants } from '../constants';

export class VHBooking {
    hearingId?: string;
    scheduledDateTime?: Date;
    scheduledDuration?: number;
    case?: CaseModel;
    participants?: VHParticipant[] = [];
    judiciaryParticipants?: JudicialMemberDto[] = [];
    createdBy?: string;
    caseType?: string;
    caseTypeServiceId?: string;
    otherInformation?: string;
    courtRoom?: string;
    hearingVenueId?: number;
    caseTypeId?: number;
    courtName?: string;
    courtCode?: string;
    createdDate?: Date;
    updatedBy?: string;
    updatedDate: Date;
    status?: string;
    audioRecordingRequired?: boolean;
    endpoints?: EndpointModel[] = [];
    isMultiDayEdit?: boolean;
    endHearingDateTime?: Date;
    telephoneConferenceId?: string;
    linkedParticipants?: LinkedParticipantModel[] = [];
    hearingDates?: Date[];
    isConfirmed?: boolean;
    isMultiDay?: boolean;
    multiDayHearingLastDayScheduledDateTime?: Date;
    hearingsInGroup?: VHBooking[] = [];
    originalScheduledDateTime?: Date;
    supplier: VideoSupplier;
    isLastDayOfMultiDayHearing?: boolean;
    groupId?: string;
    confirmedBy?: string;
    confirmedDate?: Date;
    courtRoomAccount?: string;
    allocatedTo?: string;

    constructor(init?: Partial<VHBooking>) {
        Object.assign(this, init);

        this.hearingId = init?.hearingId ?? '';
        this.scheduledDuration = init?.scheduledDuration ?? 0;
        if (init?.participants) {
            this.participants = init.participants.map(p => new VHParticipant(p));
        }
        if (init?.judiciaryParticipants) {
            this.judiciaryParticipants = init.judiciaryParticipants.map(jp => JudicialMemberDto.fromPartial(jp));
        }
        this.endpoints = init?.endpoints ?? [];
        this.linkedParticipants = init?.linkedParticipants ?? [];
        this.hearingDates = init?.hearingDates ?? [];
        this.updatedDate = init?.updatedDate ?? new Date();
        this.supplier = init?.supplier ?? VideoSupplier.Vodafone;
    }

    get durationInHoursAndMinutes() {
        return FormatShortDuration(this.scheduledDuration);
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

    // Kept in from the migration to the consolidated models. Can replace with calls to the constructor in time
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
        caseType: string,
        courtRoomAccount: string,
        telephoneConferenceId: string
    ) {
        return new VHBooking({
            hearingId: hearingId,
            scheduledDateTime: startTime,
            scheduledDuration: duration,
            case: new CaseModel(hearingCaseName, hearingCaseNumber),
            judiciaryParticipants: [new JudicialMemberDto(null, null, null, null, null, null, false, judgeName)],
            courtRoom: courtRoom,
            courtName: courtAddress,
            createdBy: createdBy,
            createdDate: createdDate,
            updatedBy: lastEditBy,
            updatedDate: lastEditDate,
            confirmedBy: confirmedBy,
            confirmedDate: confirmedDate,
            status: status,
            audioRecordingRequired: audioRecordingRequired,
            caseType: caseType,
            courtRoomAccount: courtRoomAccount,
            telephoneConferenceId: telephoneConferenceId
        });
    }

    clone(): this {
        return cloneWithGetters(this);
    }

    get hearingDuration(): string {
        return `listed for ${FormatShortDuration(this.scheduledDuration)}`;
    }

    get courtRoomAddress(): string {
        const courtRoomText = this.courtRoom ? ', ' + this.courtRoom : '';
        return `${this.courtName}${courtRoomText}`;
    }

    get audioChoice(): string {
        return this.audioRecordingRequired ? 'Yes' : 'No';
    }

    get judge(): JudicialMemberDto {
        const judge = this.judiciaryParticipants?.find(x => x.roleCode === Constants.Judge);
        if (judge) {
            return judge;
        }
        return null;
    }
}
