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
                providers: [
                    { provide: VideoHearingsService, useValue: videoHearingServiceSpy },
                    { provide: BookingService, useValue: bookingServiceSpy }
                ],
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(BookingEditComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;

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
    it('should be able to edit when conference is not about to start and is open', () => {
        videoHearingServiceSpy.isHearingAboutToStart.and.returnValue(false);
        videoHearingServiceSpy.isConferenceClosed.and.returnValue(false);
        expect(component.canEdit).toBe(true);
    });
    it('should not be able to edit when conference is about to start and is open', () => {
        videoHearingServiceSpy.isHearingAboutToStart.and.returnValue(true);
        videoHearingServiceSpy.isConferenceClosed.and.returnValue(false);
        expect(component.canEdit).toBe(false);
    });
    it('should not able to edit when conference is not about to start and is closed', () => {
        videoHearingServiceSpy.isHearingAboutToStart.and.returnValue(false);
        videoHearingServiceSpy.isConferenceClosed.and.returnValue(true);
        expect(component.canEdit).toBe(false);
    });
    it('should not able to edit when conference is about to start and is closed', () => {
        videoHearingServiceSpy.isHearingAboutToStart.and.returnValue(true);
        videoHearingServiceSpy.isConferenceClosed.and.returnValue(true);
        expect(component.canEdit).toBe(false);
    });
});
