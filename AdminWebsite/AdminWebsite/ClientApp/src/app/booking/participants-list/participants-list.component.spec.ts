import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ParticipantModel } from '../../common/model/participant.model';
import { ParticipantsListComponent } from './participants-list.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('ParticipantsListComponent', () => {
  let component: ParticipantsListComponent;
  let fixture: ComponentFixture<ParticipantsListComponent>;
  let debugElement: DebugElement;

  const pat1 = new ParticipantModel();
  pat1.title = 'Mrs';
  pat1.first_name = 'Sam';
  const participants: ParticipantModel[] = [
    pat1, pat1
  ];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ParticipantsListComponent],
      imports: [RouterTestingModule],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantsListComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;

    fixture.detectChanges();
  });

  it('should create participants list component', () => {
    expect(component).toBeTruthy();
  });
  it('should display participants and elements of class vhlink should be found', (done) => {
    component.participants = participants;
    fixture.whenStable().then(
      () => {
        fixture.detectChanges();
        const elementArray = debugElement.queryAll(By.css('.vhlink'));
        expect(elementArray.length).toBeGreaterThan(0);
        expect(elementArray.length).toBe(4);
        done();
      }
    );
  });
});
