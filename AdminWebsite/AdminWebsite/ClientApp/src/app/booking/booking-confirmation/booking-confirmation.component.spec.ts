import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { of } from 'rxjs';
import { HearingDetailsResponse } from '../../services/clients/api-client';

import { BookingConfirmationComponent } from './booking-confirmation.component';
import { Router } from '@angular/router';

describe('BookingConfirmationComponent', () => {
  let component: BookingConfirmationComponent;
  let fixture: ComponentFixture<BookingConfirmationComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let videoHearingServiceSpy: jasmine.SpyObj<VideoHearingsService>;

  beforeEach(async(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    videoHearingServiceSpy = jasmine.createSpyObj('videoHearingService', ['getHearingById']);

    TestBed.configureTestingModule({
      declarations: [BookingConfirmationComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: VideoHearingsService, useValue: videoHearingServiceSpy },
      ]
    })
      .compileComponents();
    videoHearingServiceSpy.getHearingById.and.returnValue(of(new HearingDetailsResponse()));
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookingConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
