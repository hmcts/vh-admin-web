export class ParticipantQuestionnaire {
  readonly displayName: string;
  readonly caseNumber: string;
  readonly hearingRole: string;
  readonly representee: string;
  readonly participantId: string;
  readonly updatedAt: Date;


  readonly answers: SuitabilityAnswerGroup[];

  constructor(data: ParticipantQuestionnaire) {
    this.displayName = data.displayName;
    this.caseNumber = data.caseNumber;
    this.hearingRole = data.hearingRole;
    this.representee = data.representee;
    this.participantId = data.participantId;
    this.updatedAt = data.updatedAt;
    this.answers = data.answers;
  }

  get isRepresentative(): boolean {
    return this.representee && this.representee.length > 0;
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
