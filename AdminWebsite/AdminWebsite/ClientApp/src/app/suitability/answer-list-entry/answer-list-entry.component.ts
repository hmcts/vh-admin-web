import { ParticipantQuestionnaire, SuitabilityAnswerGroup } from './../participant-questionnaire';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-answer-list-entry',
  templateUrl: './answer-list-entry.component.html',
  styleUrls: ['./answer-list-entry.component.css']
})
export class AnswerListEntryComponent implements OnInit {

  @Input()
  questionnaire: ParticipantQuestionnaire;

  expanded: boolean;

  constructor() { }

  ngOnInit() {
  }

  toggle() {
    this.expanded = !this.expanded;
  }

  get displayName(): string {
    return this.questionnaire.displayName;
  }

  get caseNumber(): string {
    return this.questionnaire.caseNumber;
  }

  get answers(): SuitabilityAnswerGroup[] {
    return this.questionnaire.answers;
  }
}
