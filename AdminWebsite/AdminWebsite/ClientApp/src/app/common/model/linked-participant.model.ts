export class LinkedParticipantModel {
    id?: string | undefined;
    participantId?: string | undefined;
    participantEmail?: string | undefined;
    linkedParticipantId?: string | undefined;
    linkedParticipantEmail?: string | undefined;
    linkType?: LinkedParticipantType;
}

export enum LinkedParticipantType {
    Interpreter,
    Interpretee
}
