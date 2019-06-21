import { QuestionnaireResponses } from './../services/questionnaire.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { ParticipantQuestionnaire } from '../participant-questionnaire';
import { QuestionnaireService } from '../services/questionnaire.service';

@Component({
  selector: 'app-answers-list',
  templateUrl: './answers-list.component.html',
  styleUrls: ['./answers-list.component.css']
})
export class AnswersListComponent implements OnInit, OnDestroy {

  loaded = false;
  hasMore = true;
  answers = new Array<ParticipantQuestionnaire>();

  constructor(private location: Location,
    private questionnaireService: QuestionnaireService
  ) { }

  ngOnInit() {
    this.enableFullScreen(true);
    this.loadNext();
  }

  loadNext() {
    if (!this.hasMore) {
      return;
    }

    this.loaded = false;
    this.questionnaireService.loadNext()
      .then((responses: QuestionnaireResponses) => {
        this.answers.push(...responses.items);
        this.loaded = true;
        this.hasMore = responses.hasMore;
      });
  }

  back() {
    this.location.back();
  }

  enableFullScreen(fullScreen: boolean) {
    const mainContainer = document.getElementById('master-container');
    if (!mainContainer) {
      return;
    }

    if (fullScreen) {
      mainContainer.classList.add('fullscreen');
    } else {
      mainContainer.classList.remove('fullscreen');
    }
  }

  ngOnDestroy() {
    this.enableFullScreen(false);
  }
}
