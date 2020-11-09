import { ParticipantQuestionnaire, SuitabilityAnswerGroup } from '../participant-questionnaire';
import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-answer-list-entry',
    templateUrl: './answer-list-entry.component.html',
    styleUrls: ['./answer-list-entry.component.css']
})
export class AnswerListEntryComponent implements OnInit {
    @Input() questionnaire: ParticipantQuestionnaire;

    expanded = false;

    constructor() {}

    ngOnInit() {}

    toggle() {
        this.expanded = !this.expanded;
    }

    get isRepresentative(): boolean {
        return this.questionnaire.representee && this.questionnaire.representee.length > 0;
    }

    get answers(): SuitabilityAnswerGroup[] {
        if (this.isRepresentative) {
            return this.questionnaire.answers;
        } else {
            return this.filterAnswers();
        }
    }

    filterAnswers(): SuitabilityAnswerGroup[] {
        const groupFiltered: SuitabilityAnswerGroup[] = [];
        this.questionnaire.answers.forEach(group => {
            const answerFiltered = group.answers.filter(x => x.answer !== 'Not answered' && x.answer !== 'N/A');
            if (answerFiltered && answerFiltered.length > 0) {
                groupFiltered.push(new SuitabilityAnswerGroup({ title: group.title, answers: answerFiltered }));
            }
        });
        return groupFiltered;
    }
}
