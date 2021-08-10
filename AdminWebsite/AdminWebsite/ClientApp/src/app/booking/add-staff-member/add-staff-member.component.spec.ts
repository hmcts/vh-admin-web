import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { provide } from 'src/app/testing/helpers/jasmine.helpers';
import { AddParticipantBaseDirective } from '../add-participant-base/add-participant-base.component';

import { AddStaffMemberComponent } from './add-staff-member.component';

describe('AddStaffMemberComponent', () => {
  let component: AddStaffMemberComponent;
  let fixture: ComponentFixture<AddStaffMemberComponent>;

  let bookingServiceSpy: jasmine.SpyObj<BookingService>;
  let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let loggerSpy: jasmine.SpyObj<Logger>;

  
  beforeEach(
    waitForAsync(() => {
      bookingServiceSpy = jasmine.createSpyObj('BookingService', ['']);
      videoHearingsServiceSpy = jasmine.createSpyObj('VideoHearingsService', ['']);
      routerSpy = jasmine.createSpyObj('Router', ['']);
      loggerSpy = jasmine.createSpyObj('Logger', ['']);

      TestBed.configureTestingModule({
        declarations: [AddStaffMemberComponent],
        providers: [
          provide(BookingService, bookingServiceSpy),
          provide(Logger, loggerSpy),
          provide(Router, routerSpy),
          provide(VideoHearingsService, videoHearingsServiceSpy),
        ],
      })
        .compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(AddStaffMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('ngOnInit', () => {
    it('should initialise the form', () => {
      component.initialiseForm = spyOn(component, 'initialiseForm');

      component.ngOnInit();

      expect(component.initialiseForm).toHaveBeenCalledTimes(1);
    });
  });
});
