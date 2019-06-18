export class ParticipantQuestionnaire {
  readonly displayName: string;
  readonly caseNumber: string;
  readonly hearingRole: string;
  readonly hearingId: string;
  readonly representee: string;
  readonly participantId: string;
  readonly updated_at: Date;

  readonly answers: SuitabilityAnswerGroup[];

  constructor(data: ParticipantQuestionnaire) {
    this.displayName = data.displayName;
    this.caseNumber = data.caseNumber;
    this.hearingRole = data.hearingRole;
    this.representee = data.representee;
    this.hearingId = data.hearingId;
    this.participantId = data.participantId;
    this.updated_at = data.updated_at;
    this.answers = data.answers;
  }
}

export class SuitabilityAnswerGroup {
  readonly title: string;
  readonly answers: SuitabilityAnswer[];

  constructor(group: SuitabilityAnswerGroup) {
    this.title = group.title;
    this.answers = group.answers;
  }
}

export class SuitabilityAnswer {
  readonly answer: string;
  readonly notes: string;
  readonly question: string;

  constructor(answer: SuitabilityAnswer) {
    this.answer = answer.answer;
    this.notes = answer.notes;
    this.question = answer.question;
  }
}
