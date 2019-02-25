import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { BookingDetailsComponent } from './booking-details.component';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { BookingDetailsService } from '../../services/booking-details.service';
import { HearingResponse } from '../../services/clients/api-client';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';

import { of } from 'rxjs';

let component: BookingDetailsComponent;
let fixture: ComponentFixture<BookingDetailsComponent>;

@Component({
  selector: 'app-booking-participant-list',
  template: ''
})
class BookingParticipantListComponentMock {
  @Input()
  participants: Array<ParticipantDetailsModel> = [];

  @Input()
  judges: Array<ParticipantDetailsModel> = [];
}

@Component({
  selector: 'app-hearing-details',
  template: ''
})
class HearingDetailsComponentMock {
  @Input()
  hearing: BookingsDetailsModel
}


let hearingResponse = new HearingResponse();

class VideoHearingsServiceMock {
  getHearingById() {
    return of(hearingResponse)
  }
}

class BookingDetailsServiceMock {
  mapBooking(response) {
    return new BookingDetailsTestData().getBookingsDetailsModel();
  }
  mapBookingParticipants(response) {
    return new BookingDetailsTestData().getParticipants();
  }
}

describe('BookingDetailsComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        BookingDetailsComponent,
        BookingParticipantListComponentMock,
        HearingDetailsComponentMock
      ],
      imports: [HttpClientModule],
      providers: [{ provide: VideoHearingsService, useClass: VideoHearingsServiceMock },
      { provide: BookingDetailsService, useClass: BookingDetailsServiceMock }]
    }).compileComponents();
    fixture = TestBed.createComponent(BookingDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create component', (() => {
    expect(component).toBeTruthy();
  }))

  it('should get hearings details', (() => {
    component.ngOnInit();
    expect(component.hearing).toBeTruthy();
    expect(component.hearing.HearingId).toBe(44);
    expect(component.hearing.Duration).toBe(120);
    expect(component.hearing.HearingCaseNumber).toBe('XX3456234565');
  }))

  it('should get judge details', (() => {
    component.ngOnInit();
    expect(component.judges).toBeTruthy();
    expect(component.judges.length).toBe(1);
    expect(component.judges[0].Role).toBe('Judge');
    expect(component.judges[0].ParticipantId).toBe(1);
    expect(component.judges[0].FirstName).toBe('Alan');
  }))

  it('should get participants details', (() => {
    component.ngOnInit();
    expect(component.participants).toBeTruthy();
    expect(component.participants.length).toBe(2);
    expect(component.participants[0].Role).toBe('Citizen');
    expect(component.participants[0].ParticipantId).toBe(2);
  }))
});

export class BookingDetailsTestData {
  getBookingsDetailsModel() {
    return new BookingsDetailsModel(44, new Date('2019-11-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', '', '33A', 'Coronation Street',
      'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));
  }

  getParticipants() {
    let participants: Array<ParticipantDetailsModel> = [];
    let judges: Array<ParticipantDetailsModel> = [];
    let p1 = new ParticipantDetailsModel(1, 'Mrs', 'Alan', 'Brake', 'Judge', 'email.p1@email.com', 'email1@co.uk');
    let p2 = new ParticipantDetailsModel(2, 'Mrs', 'Roy', 'Bark', 'Citizen', 'email.p2@email.com', 'email2@co.uk');
    let p3 = new ParticipantDetailsModel(2, 'Mrs', 'Fill', 'Green', 'Professional', 'email.p3@email.com', 'email3@co.uk');
    participants.push(p2);
    participants.push(p3);
    judges.push(p1);
    return { judges: judges, participants: participants };
  }

}