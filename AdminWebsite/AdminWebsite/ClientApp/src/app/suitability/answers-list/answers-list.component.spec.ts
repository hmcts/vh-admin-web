import { AnswerListEntryComponent } from './../answer-list-entry/answer-list-entry.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';

import { AnswersListComponent } from './answers-list.component';
import { QuestionnaireService } from '../services/questionnaire.service';

describe('AnswersListComponent', () => {
  let component: AnswersListComponent;
  let fixture: ComponentFixture<AnswersListComponent>;
  let location: jasmine.SpyObj<Location>;
  let service: jasmine.SpyObj<QuestionnaireService>;

  beforeEach(async(() => {
    location = jasmine.createSpyObj<Location>(['back']);
    service = jasmine.createSpyObj<QuestionnaireService>(['loadNext']);
    service.loadNext.and.returnValue(Promise.resolve([]));

    TestBed.configureTestingModule({
      declarations: [ AnswersListComponent, AnswerListEntryComponent ],
      providers: [
        { provide: Location, useValue: location },
        { provide: QuestionnaireService, useValue: service }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnswersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
