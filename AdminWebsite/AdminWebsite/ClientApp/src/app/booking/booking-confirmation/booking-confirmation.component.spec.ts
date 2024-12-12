import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { LongDatetimePipe } from '../../shared/directives/date-time.pipe';
import { Logger } from '../../services/logger';
import { BookingConfirmationComponent } from './booking-confirmation.component';
import { BookingStatus, HearingDetailsResponse } from 'src/app/services/clients/api-client';
import { ResponseTestData } from 'src/app/testing/data/response-test-data';

describe('BookingConfirmationComponent', () => {
    let component: BookingConfirmationComponent;
    let fixture: ComponentFixture<BookingConfirmationComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let loggerSpy: jasmine.SpyObj<Logger>;
    let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
    // const newHearing: HearingDetailsResponse = initHearingRequest();
    const newHearing: HearingDetailsResponse = ResponseTestData.getHearingResponseTestData();

    beforeEach(waitForAsync(() => {
        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
            'getCurrentRequest',
            'updateHearingRequest',
            'getHearingById',
            'cancelRequest'
        ]);
        videoHearingsServiceSpy.getHearingById.and.returnValue(of(newHearing));

        TestBed.configureTestingModule({
            declarations: [BookingConfirmationComponent, LongDatetimePipe],
            imports: [RouterTestingModule],
            providers: [
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: Logger, useValue: loggerSpy },
                { provide: Router, useValue: routerSpy }
            ]
        }).compileComponents();
    }));

    describe('standard', () => {
        beforeEach(() => {
            fixture = TestBed.createComponent(BookingConfirmationComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should display the new hearing information', () => {
            component.ngOnInit();
            component.retrieveSavedHearing();
            expect(component.caseNumber).toEqual(newHearing.cases[0].number);
            expect(component.caseName).toEqual(newHearing.cases[0].name);
            expect(component.hearingDate).toEqual(newHearing.scheduled_date_time);
            expect(component.retrievedHearingResolver).toBeTruthy();
        });
        it('should navigate to book another hearing', () => {
            component.bookAnotherHearing();
            expect(videoHearingsServiceSpy.cancelRequest).toHaveBeenCalled();
            expect(routerSpy.navigate).toHaveBeenCalled();
        });
        it('should navigate to dashboard', () => {
            component.returnToDashboard();
            expect(videoHearingsServiceSpy.cancelRequest).toHaveBeenCalled();
            expect(routerSpy.navigate).toHaveBeenCalled();
        });
        it('should navigate to booking details', () => {
            component.viewBookingDetails();
            expect(routerSpy.navigate).toHaveBeenCalled();
        });
    });

    describe('bookingConfirmedSuccessfully', () => {
        it('should return true, when booking successful', () => {
            // arrange: set spy to return Failed status hearing
            newHearing.status = BookingStatus.Booked;
            videoHearingsServiceSpy.getHearingById.and.returnValue(of(newHearing));
            TestBed.overrideProvider(VideoHearingsService, { useValue: videoHearingsServiceSpy });
            TestBed.compileComponents();
            fixture = TestBed.createComponent(BookingConfirmationComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            // act
            component.ngOnInit();
            component.retrieveSavedHearing();
            // assert
            expect(component.bookingConfirmedSuccessfully).toBe(true);
        });
        it('should return true, when booking successful but without a judge', () => {
            // arrange: set spy to return Failed status hearing
            newHearing.status = BookingStatus.BookedWithoutJudge;
            videoHearingsServiceSpy.getHearingById.and.returnValue(of(newHearing));
            TestBed.overrideProvider(VideoHearingsService, { useValue: videoHearingsServiceSpy });
            TestBed.compileComponents();
            fixture = TestBed.createComponent(BookingConfirmationComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            // act
            component.ngOnInit();
            component.retrieveSavedHearing();
            // assert
            expect(component.bookingConfirmedSuccessfully).toBe(true);
        });
        it('should return false, when booking unsuccessful', () => {
            // arrange: set spy to return Failed status hearing
            newHearing.status = BookingStatus.Failed;
            videoHearingsServiceSpy.getHearingById.and.returnValue(of(newHearing));
            TestBed.overrideProvider(VideoHearingsService, { useValue: videoHearingsServiceSpy });
            TestBed.compileComponents();
            fixture = TestBed.createComponent(BookingConfirmationComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            // act
            component.ngOnInit();
            component.retrieveSavedHearing();
            // assert
            expect(component.bookingConfirmedSuccessfully).toEqual(false);
        });
    });
});
