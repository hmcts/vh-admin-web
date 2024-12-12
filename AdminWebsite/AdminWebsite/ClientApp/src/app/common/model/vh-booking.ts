import { LinkedParticipantType, VideoSupplier } from 'src/app/services/clients/api-client';

export interface VHBooking {
    hearing_id?: string;
    scheduled_date_time?: Date;
    scheduled_duration?: number;
    case?: VHCase;
    participants?: VHParticipant[];
    judiciaryParticipants?: VHJudiciaryParticipant[];
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
    endpoints?: VHEndpoint[];
    isMultiDayEdit?: boolean;
    end_hearing_date_time?: Date;
    telephone_conference_id?: string;
    linked_participants?: VHLinkedParticipant[];
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

export interface VHCase {
    number?: string;
    name?: string;
    isLeadCase?: boolean;
}

export interface VHParticipant {
    id?: string;
    externalReferenceId?: string;
    title?: string;
    first_name?: string;
    last_name?: string;
    middle_names?: string;
    display_name?: string;
    username?: string;
    email?: string;
    hearing_role_name?: string;
    hearing_role_code?: string;
    phone?: string;
    representee?: string;
    company?: string;
    is_judge?: boolean;
    is_exist_person?: boolean;
    interpreterFor?: string;
    linked_participants?: VHLinkedParticipant[];
    interpretee_name?: string;
    is_interpretee?: boolean;
    user_role_name?: string;
    is_courtroom_account?: boolean;
    addedDuringHearing?: boolean;
    is_staff_member?: boolean;
    contact_email?: string;
    isJudiciaryMember?: boolean;
    interpretation_language: VHInterpreterSelected;
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
