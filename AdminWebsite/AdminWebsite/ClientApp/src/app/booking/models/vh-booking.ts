import { LinkedParticipantType, VideoSupplier } from 'src/app/services/clients/api-client';

export interface VHBooking {
    hearingId?: string;
    scheduledDateTime?: Date;
    scheduledDuration?: number;
    case?: VHCase;
    participants?: VHParticipant[];
    judiciaryParticipants?: VHJudiciaryParticipant[];
    createdBy?: string;
    caseType?: string;
    caseTypeServiceId?: string;
    otherInformation?: string;
    courtRoom?: string;
    hearingVenueId?: number;
    caseTypeId?: number;
    //courtId?: number; // doesn't seem to be used outside of tests
    courtName?: string;
    courtCode?: string;
    createdDate?: Date;
    updatedBy?: string;
    updatedDate: Date;
    status?: string;
    audioRecordingRequired?: boolean;
    endpoints?: VHEndpoint[];
    isMultiDayEdit?: boolean;
    endHearingDateTime?: Date;
    telephoneConferenceId?: string;
    linkedParticipants?: VHLinkedParticipant[];
    hearingDates?: Date[];
    isConfirmed?: boolean;
    isMultiDay?: boolean;
    multiDayHearingLastDayScheduledDateTime?: Date;
    hearingsInGroup?: VHBooking[];
    originalScheduledDateTime?: Date;
    supplier: VideoSupplier;
}

export interface VHCase {
    number?: string;
    name?: string;
    isLeadCase?: boolean;
}

export interface VHParticipant {
    id?: string;
    externalReferenceId?: string;
    title?: string;
    firstName?: string;
    lastName?: string;
    middleNames?: string;
    displayName?: string;
    username?: string;
    email?: string;
    hearingRoleName?: string;
    hearingRoleCode?: string;
    phone?: string;
    representee?: string;
    company?: string;
    isJudge?: boolean;
    isExistPerson?: boolean;
    interpreterFor?: string;
    linkedParticipants?: VHLinkedParticipant[];
    interpreteeName?: string;
    isInterpretee?: boolean;
    userRoleName?: string;
    isCourtroomAccount?: boolean;
    addedDuringHearing?: boolean;
    isStaffMember?: boolean;
    contactEmail?: string;
    isJudiciaryMember?: boolean;
    interpretationLanguage: VHInterpreterSelected;
    screening?: VHScreening;
}

export interface VHLinkedParticipant {
    id?: string;
    participantId?: string;
    participantEmail?: string;
    linkedParticipantId?: string;
    linkedParticipantEmail?: string;
    linkType?: LinkedParticipantType;
}

export interface VHJudiciaryParticipant {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    telephone: string;
    personalCode: string;
    isGeneric: boolean;
    roleCode?: VHJudicaryRoleCode;
    displayName: string;
    optionalContactNumber: string;
    optionalContactEmail: string;
    interpretationLanguage: VHInterpreterSelected;
}

export type VHJudicaryRoleCode = 'Judge' | 'PanelMember';

export interface VHEndpoint {
    externalReferenceId: string;
    id?: string;
    displayName?: string;
    sip?: string;
    pin?: string;
    /**
     * Defence advocate email address, not their ID
     */
    defenceAdvocate?: string;
    username?: string;
    contactEmail?: string;
    interpretationLanguage: VHInterpreterSelected;
    screening?: VHScreening;
}

export interface VHVenue {
    id: number;
    name: string;
    code: string;
}

export interface VHInterpreterSelected {
    interpreterRequired: boolean;
    signLanguageCode?: string;
    signLanguageDescription?: string;
    spokenLanguageCode?: string;
    spokenLanguageCodeDescription?: string;
}

export interface VHScreening {
    measureType: ScreeningType;
    protectFrom: VHProtectFrom[];
}

export type ScreeningType = 'All' | 'Specific';

export interface VHProtectFrom {
    externalReferenceId: string;
}
