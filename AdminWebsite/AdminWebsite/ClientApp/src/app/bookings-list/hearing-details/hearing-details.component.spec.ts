import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

import { HearingDetailsComponent } from './hearing-details.component';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { LongDatetimePipe } from '../../../app/shared/directives/date-time.pipe';
import { ParticipantDetailsModel } from 'src/app/common/model/participant-details.model';


describe('HearingDetailsComponent', () => {

  let component: HearingDetailsComponent;
  let fixture: ComponentFixture<HearingDetailsComponent>;
  let debugElement: DebugElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HearingDetailsComponent, LongDatetimePipe],
      imports: [RouterTestingModule],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingDetailsComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;

    fixture.detectChanges();
  });

  it('should create component', (() => {
    expect(component).toBeTruthy();
  }));

  it('should display hearing details', (done => {
    const h1 = new BookingsDetailsModel('1', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'),
      null, null, 'Booked', false, true, 'reason1', 'Financial Remedy');

    component.hearing = h1;

    fixture.whenStable().then(
      () => {
        fixture.detectChanges();
        const divElementRole = debugElement.queryAll(By.css('#hearing-name'));
        expect(divElementRole.length).toBeGreaterThan(0);
        expect(divElementRole.length).toBe(1);
        const el = divElementRole[0].nativeElement as HTMLElement;
        expect(el.innerHTML).toContain('Smith vs Donner');
        done();
      }
    );
  }));

  it('it should display the participant and representee', () => {
    const participants: Array<ParticipantDetailsModel> = [];
    const participant = new ParticipantDetailsModel('123-123', 'Judge', 'Judge', 'last_name',
      'user_role_name', 'username', 'contact_email', 'case_role_name', 'hearing_role_name',
      'display_name', 'middle_names', 'organisation', 'reference', 'representee');
    participants.push(participant);
    component.participants = participants;
    const result = component.getParticipantInfo('123-123');
    expect(result).toBe('display_name, representing representee');
  });
});
