export class LinkedParticipantModel {
    id?: string;
    participantId?: string;
    participantEmail?: string;
    linkedParticipantId?: string;
    linkedParticipantEmail?: string;
    linkType?: LinkedParticipantType;
}

export enum LinkedParticipantType {
    Interpreter = 'Interpreter'
}
