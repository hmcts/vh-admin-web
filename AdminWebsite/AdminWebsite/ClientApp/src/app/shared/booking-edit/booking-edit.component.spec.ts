import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BookingsHearingResponse } from 'src/app/services/clients/api-client';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { BookingService } from '../../services/booking.service';
import { BookingEditComponent } from './booking-edit.component';

describe('BookingEditComponent', () => {
    let component: BookingEditComponent;
    let fixture: ComponentFixture<BookingEditComponent>;
    let debugElement: DebugElement;
    let videoHearingServiceSpy: jasmine.SpyObj<VideoHearingsService>;
    let bookingServiceSpy: jasmine.SpyObj<BookingService>;

    videoHearingServiceSpy = jasmine.createSpyObj('VideoHearingService', [
        'isConferenceClosed',
        'isHearingAboutToStart'
    ]);

    bookingServiceSpy = jasmine.createSpyObj('BookingService', [
        'setEditMode'
    ]);

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [RouterTestingModule],
                declarations: [BookingEditComponent],
                providers: [BookingService]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(BookingEditComponent);
        debugElement = fixture.debugElement;
        component = new BookingEditComponent(
            bookingServiceSpy,
            videoHearingServiceSpy
        );

        fixture.detectChanges();
    });

    it('should create booking edit component', () => {
        expect(component).toBeTruthy();
    });
    it('should get the default url to edited page', () => {
        expect(component.editLink).toEqual('/');
    });
    it('should get the url to edited page', () => {
        component.editLink = 'summary';
        expect(component.editLink).toEqual('/summary');
    });
    // fit('should be able to edit when conference is open and not within 30 minutes of starting', () => {
    //     const futureDate = new Date();
    //     futureDate.setHours(futureDate.getHours() + 1);
    //     debugger;
    //     const test1 = !videoHearingServiceSpy.isConferenceClosed;
    //     const test2 = !videoHearingServiceSpy.isHearingAboutToStart;
    //     spyOn(videoHearingServiceSpy, "isConferenceClosed").and.returnValue(true);
    //     spyOn(videoHearingServiceSpy, "isHearingAboutToStart").and.returnValue(true);
    //     expect(test3).toBeTruthy();
    // });
    // it('should show edit & cancel button if 30min or more remain to start of hearing', fakeAsync(() => {
    //     component.ngOnInit();
    //     tick(1000);
    //     const futureDate = new Date();
    //     futureDate.setHours(futureDate.getHours() + 1);
    //     component.booking.scheduled_date_time = futureDate;
    //     const timeframe = component.canCancelHearing && component.canEditHearing;
    //     expect(timeframe).toBe(true);
    //     discardPeriodicTasks();
    // }));
});
