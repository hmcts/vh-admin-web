import { QuestionnaireResponses } from './../services/questionnaire.service';
import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ParticipantQuestionnaire } from '../participant-questionnaire';
import { QuestionnaireService } from '../services/questionnaire.service';

@Component({
  selector: 'app-answers-list',
  templateUrl: './answers-list.component.html',
  styleUrls: ['./answers-list.component.css']
})
export class AnswersListComponent implements OnInit {

  loaded = false;
  hasMore = false;
  answers = new Array<ParticipantQuestionnaire>();

  constructor(private location: Location, private questionnaireService: QuestionnaireService) { }

  ngOnInit() {
    this.questionnaireService.loadNext()
      .then((responses: QuestionnaireResponses) => {
        this.answers.push(...responses.items);
        this.loaded = true;
        this.hasMore = responses.hasMore;
      });
  }

  loadNext() {
    console.log('load next called');
    if (!this.hasMore) {
      console.log('no more items, skipping');
      return;
    }

    this.questionnaireService.loadNext()
      .then((responses: QuestionnaireResponses) => {
        this.answers.push(...responses.items);
        this.hasMore = responses.hasMore;
      });
  }

  back() {
    this.location.back();
  }
}
