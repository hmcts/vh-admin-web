import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { CaseModel } from 'src/app/common/model/case.model';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { LongDatetimePipe } from '../../../app/shared/directives/date-time.pipe';
import { Logger } from '../../services/logger';
import { BookingConfirmationComponent } from './booking-confirmation.component';

function initHearingRequest(): HearingModel {
    const participants: ParticipantModel[] = [];
    const p1 = new ParticipantModel();
    p1.display_name = 'display name1';
    p1.email = 'test1@hmcts.net';
    p1.first_name = 'first';
    p1.last_name = 'last';
    p1.is_judge = true;
    p1.title = 'Mr.';

    const p2 = new ParticipantModel();
    p2.display_name = 'display name2';
    p2.email = 'test2@hmcts.net';
    p2.first_name = 'first2';
    p2.last_name = 'last2';
    p2.is_judge = true;
    p2.title = 'Mr.';

    const p3 = new ParticipantModel();
    p3.display_name = 'display name3';
    p3.email = 'test3@hmcts.net';
    p3.first_name = 'first3';
    p3.last_name = 'last3';
    p3.is_judge = true;
    p3.title = 'Mr.';

    const p4 = new ParticipantModel();
    p4.display_name = 'display name3';
    p4.email = 'test3@hmcts.net';
    p4.first_name = 'first3';
    p4.last_name = 'last3';
    p4.is_judge = true;
    p4.title = 'Mr.';

    participants.push(p1);
    participants.push(p2);
    participants.push(p3);
    participants.push(p4);

    const cases: CaseModel[] = [];
    const newcase = new CaseModel();
    newcase.number = 'TX/12345/2019';
    newcase.name = 'BBC vs HMRC';
    newcase.isLeadCase = false;
    cases.push(newcase);

    const newHearing = new HearingModel();
    newHearing.cases = cases;
    newHearing.participants = participants;

    const today = new Date();
    today.setHours(14, 30);

    newHearing.hearing_type_id = -1;
    newHearing.hearing_venue_id = -1;
    newHearing.scheduled_date_time = today;
    newHearing.scheduled_duration = 0;

    return newHearing;
}
describe('BookingConfirmationComponent', () => {
    let component: BookingConfirmationComponent;
    let fixture: ComponentFixture<BookingConfirmationComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let loggerSpy: jasmine.SpyObj<Logger>;
    let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
    const newHearing = initHearingRequest();

    beforeEach(
        waitForAsync(() => {
            loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
            routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
            videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
                'getHearingTypes',
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
        })
    );

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
    it('should unsibscribe subcription on destroy', () => {
        component.ngOnDestroy();
        expect(component.$hearingSubscription.closed).toBe(true);
    });
});
