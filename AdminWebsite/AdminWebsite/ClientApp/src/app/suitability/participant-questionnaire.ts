export class ParticipantQuestionnaire {
    readonly displayName: string;
    readonly caseNumber: string;
    readonly caseName: string;
    readonly hearingId: string;
    readonly participantId: string;

    readonly answers: SuitabilityAnswer[];

    constructor(data: ParticipantQuestionnaire) {
        this.displayName = data.displayName;
        this.caseNumber = data.caseNumber;
        this.caseName = data.caseName;
        this.hearingId = data.hearingId;
        this.participantId = data.participantId;
        this.answers = data.answers;
    }
}

export class SuitabilityAnswer {
    readonly answer: string;
    readonly notes: string;
    readonly key: string;

    constructor(answer: SuitabilityAnswer) {
        this.answer = answer.answer;
        this.notes = answer.notes;
        this.key = answer.key;
    }
}