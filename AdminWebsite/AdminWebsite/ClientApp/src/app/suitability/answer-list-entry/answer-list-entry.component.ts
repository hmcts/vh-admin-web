import { ParticipantQuestionnaire, SuitabilityAnswer } from './../participant-questionnaire';
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

  get caseName(): string {
    return this.questionnaire.caseName;
  }

  get answers(): SuitabilityAnswer[] {
    return this.questionnaire.answers;
  }
}
