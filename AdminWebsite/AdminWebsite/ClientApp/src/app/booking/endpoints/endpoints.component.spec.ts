import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { CancelPopupComponent } from 'src/app/popups/cancel-popup/cancel-popup.component';
import { DiscardConfirmPopupComponent } from 'src/app/popups/discard-confirm-popup/discard-confirm-popup.component';
import { BookingService } from 'src/app/services/booking.service';
import { ErrorService } from 'src/app/services/error.service';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { SharedModule } from 'src/app/shared/shared.module';
import { MockValues } from 'src/app/testing/data/test-objects';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { EndpointsComponent } from './endpoints.component';
import { LaunchDarklyService, FeatureFlags } from 'src/app/services/launch-darkly.service';
import { BreadcrumbStubComponent } from 'src/app/testing/stubs/breadcrumb-stub';

function initHearingRequest(): HearingModel {
    const newHearing = new HearingModel();
    newHearing.hearing_type_id = -1;
    newHearing.hearing_venue_id = -1;
    newHearing.scheduled_duration = 0;
    return newHearing;
}

let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
let routerSpy: jasmine.SpyObj<Router>;
const errorService: jasmine.SpyObj<ErrorService> = jasmine.createSpyObj('ErrorService', ['handleError']);
let bookingServiceSpy: jasmine.SpyObj<BookingService>;

describe('EndpointsComponent', () => {
    let component: EndpointsComponent;
    let fixture: ComponentFixture<EndpointsComponent>;
    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
    const newHearing = initHearingRequest();

    beforeEach(waitForAsync(() => {
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.eJudFeature).and.returnValue(of(true));

        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
            'getHearingTypes',
            'getCurrentRequest',
            'updateHearingRequest',
            'setBookingHasChanged',
            'cancelRequest',
            'isHearingAboutToStart'
        ]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);
        videoHearingsServiceSpy.getHearingTypes.and.returnValue(of(MockValues.HearingTypesList));
        bookingServiceSpy = jasmine.createSpyObj('BookingService', ['isEditMode', 'resetEditMode', 'removeEditMode']);

        TestBed.configureTestingModule({
            imports: [SharedModule, RouterTestingModule],
            providers: [
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: ErrorService, useValue: errorService },
                { provide: BookingService, useValue: bookingServiceSpy },
                { provide: Logger, useValue: loggerSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy },
                { provide: BreadcrumbComponent, useValue: BreadcrumbStubComponent }
            ],
            declarations: [EndpointsComponent, CancelPopupComponent, DiscardConfirmPopupComponent, BreadcrumbStubComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(EndpointsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should get booking data from storage', () => {
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.hearing).toBeTruthy();
    });
    it('should set return a form array', () => {
        component.ngOnInit();
        expect(component.endpoints).toBeTruthy();
    });
    it('should have multiple endpoints', () => {
        component.ngOnInit();
        component.endpoints.controls[0].get('displayName').setValue('100');
        component.addEndpoint();
        component.endpoints.controls[1].get('displayName').setValue('200');
        component.addEndpoint();
        expect(component.hasEndpoints).toBe(true);
    });
    it('should naviagate to the other information page when next clicked', () => {
        component.ngOnInit();
        component.saveEndpoints();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/other-information']);
    });
    it('should show a confirmation popup if cancel clicked in new mode', () => {
        bookingServiceSpy.isEditMode.and.returnValue(false);
        component.ngOnInit();
        component.cancelBooking();
        expect(component.attemptingCancellation).toBeTruthy();
    });
    it('should show a confirmation popup if cancel clicked in edit mode', () => {
        bookingServiceSpy.isEditMode.and.returnValue(true);
        component.ngOnInit();
        component.cancelBooking();
        expect(component.attemptingCancellation).toBeFalsy();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/summary']);
    });
    it('should show a confirmation popup if cancel clicked in edit mode with updates', () => {
        bookingServiceSpy.isEditMode.and.returnValue(true);
        component.ngOnInit();
        component.form.markAsTouched();
        component.cancelBooking();
        expect(component.attemptingDiscardChanges).toBeTruthy();
    });
    it('should close the confirmation popup and stay on page in new mode and continue booking clicked', () => {
        bookingServiceSpy.isEditMode.and.returnValue(false);
        component.attemptingCancellation = true;
        component.continueBooking();
        expect(component.attemptingCancellation).toBeFalsy();
    });
    it('should close the confirmation popup and navigate to dashboard in new mode and discard changes clicked', () => {
        bookingServiceSpy.isEditMode.and.returnValue(false);
        component.attemptingCancellation = true;
        component.cancelEndpoints();
        expect(component.attemptingCancellation).toBeFalsy();
        expect(videoHearingsServiceSpy.cancelRequest).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
    it('should close the confirmation popup and stay on page in edit mode and continue booking clicked', () => {
        bookingServiceSpy.isEditMode.and.returnValue(true);
        component.attemptingDiscardChanges = true;
        component.continueBooking();
        expect(component.attemptingDiscardChanges).toBeFalsy();
    });
    it('should close the confirmation popup and navigate to summary in edit mode and discard changes clicked', () => {
        bookingServiceSpy.isEditMode.and.returnValue(false);
        component.attemptingDiscardChanges = true;
        component.cancelChanges();
        expect(component.attemptingDiscardChanges).toBeFalsy();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/summary']);
    });
    it('it should validate display names on add another click and show error for duplicates', () => {
        component.ngOnInit();
        component.endpoints.controls[0].get('displayName').setValue('200');
        component.addEndpoint();
        component.endpoints.controls[1].get('displayName').setValue('200');
        component.addEndpoint();
        expect(component.duplicateDa).toBe(true);
        expect(component.failedValidation).toBe(true);
    });
    it('it should validate display names on next click and show error for duplicates', () => {
        component.ngOnInit();
        component.endpoints.controls[0].get('displayName').setValue('200');
        component.addEndpoint();
        component.endpoints.controls[1].get('displayName').setValue('200');
        component.saveEndpoints();
        expect(component.duplicateDa).toBe(true);
        expect(component.failedValidation).toBe(true);
    });
    it('it should validate display names on next click and navigate to other information page if validations pass', () => {
        component.ngOnInit();
        component.endpoints.controls[0].get('displayName').setValue('200');
        component.addEndpoint();
        component.endpoints.controls[1].get('displayName').setValue('201');
        component.saveEndpoints();
        expect(component.duplicateDa).toBe(false);
        expect(component.failedValidation).toBe(false);
        expect(component.hearing.endpoints[0].displayName).toBe('200');
        expect(component.hearing.endpoints[1].displayName).toBe('201');
        expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/other-information']);
    });
    it('it should validate defence advocate on next click and navigate to other information page for defence adv none', () => {
        component.ngOnInit();
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
        component.endpoints.controls[0].get('displayName').setValue('200');
        component.saveEndpoints();
        expect(component.duplicateDa).toBe(false);
        expect(component.failedValidation).toBe(false);
        expect(component.hearing.endpoints[0].displayName).toBe('200');
        expect(component.hearing.endpoints[0].defenceAdvocate).toBe('');
        expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/other-information']);
    });

    it('should return true for hearing about to start', () => {
        component.ngOnInit();
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(true);
        expect(component.isHearingAboutToStart).toBe(true);
    });

    it('it should validate fields on next click and navigate to other information page if validations pass', () => {
        component.ngOnInit();
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
        component.endpoints.controls[0].get('displayName').setValue('200');
        component.endpoints.controls[0].get('defenceAdvocate').setValue('username@hmcts.net');
        component.addEndpoint();
        component.endpoints.controls[1].get('displayName').setValue('201');
        component.endpoints.controls[1].get('defenceAdvocate').setValue('username1@hmcts.net');
        component.saveEndpoints();
        expect(component.duplicateDa).toBe(false);
        expect(component.failedValidation).toBe(false);
        expect(component.hearing.endpoints[0].displayName).toBe('200');
        expect(component.hearing.endpoints[0].defenceAdvocate).toBe('username@hmcts.net');
        expect(component.hearing.endpoints[1].displayName).toBe('201');
        expect(component.hearing.endpoints[1].defenceAdvocate).toBe('username1@hmcts.net');
        expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/other-information']);
    });

    it('it should filter  "Representative" user-types only as valid defenceAdvocates for JVM', () => {
        // arrange
        newHearing.participants = [
            { user_role_name: 'Representative', display_name: 'Counsel', hearing_role_name: 'Counsel', case_role_name: 'Appellant' },
            { user_role_name: 'Individual', display_name: 'Employer', hearing_role_name: 'Employer', case_role_name: 'Appellant' },
            { user_role_name: 'Representative', display_name: 'Solicitor', hearing_role_name: 'Solicitor', case_role_name: 'Appellant' },
            { user_role_name: 'Representative', display_name: 'Barrister', hearing_role_name: 'Barrister', case_role_name: 'Appellant' },
            {
                user_role_name: 'Representative',
                display_name: 'pro-bono representative',
                hearing_role_name: 'pro-bono representative',
                case_role_name: 'ELAAS'
            },
            {
                user_role_name: 'Representative',
                display_name: 'Representative',
                hearing_role_name: 'Representative',
                case_role_name: 'Appellant'
            },
            { user_role_name: 'Representative', display_name: 'Advocate1', hearing_role_name: 'Advocate', case_role_name: 'Appellant' },
            {
                user_role_name: 'Individual',
                display_name: 'Litigant in person',
                hearing_role_name: 'Litigant in person',
                case_role_name: 'Appellant'
            },
            { user_role_name: 'Representative', display_name: 'Advocate2', hearing_role_name: 'Advocate', case_role_name: 'Respondent' }
        ];
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);
        // act
        component.ngOnInit();
        // assert
        // Current implementation of populateDefenceAdvocates() inserts an empty record at position[0]
        expect(component.availableDefenceAdvocates[1].displayName).toBe('Counsel');
        expect(component.availableDefenceAdvocates[2].displayName).toBe('Solicitor');
        expect(component.availableDefenceAdvocates[3].displayName).toBe('Barrister');
        expect(component.availableDefenceAdvocates[4].displayName).toBe('pro-bono representative');
        expect(component.availableDefenceAdvocates[5].displayName).toBe('Representative');
        expect(component.availableDefenceAdvocates[6].displayName).toBe('Advocate1');
        expect(component.availableDefenceAdvocates[7].displayName).toBe('Advocate2');
    });

    it('it should validate form array on next click and navigate to summary page in edit mode', () => {
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
        bookingServiceSpy.isEditMode.and.returnValue(true);
        component.ngOnInit();
        const existinghearing = new HearingModel();
        existinghearing.case_type = 'Case type';
        const eps: EndpointModel[] = [];
        let ep = new EndpointModel();
        ep.displayName = 'displayname1';
        ep.defenceAdvocate = '12345';
        eps.push(ep);
        ep = new EndpointModel();
        ep.displayName = 'displayname1';
        ep.defenceAdvocate = '11223';
        existinghearing.endpoints = eps;

        component.hearing = existinghearing;

        component.endpoints.controls[0].get('displayName').setValue('new display name');
        component.endpoints.controls[0].get('defenceAdvocate').setValue('user@hmcts.net');
        component.saveEndpoints();
        expect(component.failedValidation).toBe(false);
        expect(component.hearing.endpoints[0].displayName).toBe('new display name');
        expect(component.hearing.endpoints[0].defenceAdvocate).toBe('user@hmcts.net');
        expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/summary']);
    });

    it('it should remove an endpoint from the endpoint array on remove click', () => {
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
        component.ngOnInit();
        component.endpoints.controls[0].get('displayName').setValue('200');
        component.endpoints.controls[0].get('defenceAdvocate').setValue('username@hmcts.net');
        component.addEndpoint();
        component.endpoints.controls[1].get('displayName').setValue('201');
        component.endpoints.controls[1].get('defenceAdvocate').setValue('username1@hmcts.net');
        component.addEndpoint();
        component.endpoints.controls[2].get('displayName').setValue('202');
        component.endpoints.controls[2].get('defenceAdvocate').setValue('username2@hmcts.net');

        component.removeEndpoint(1);
        component.saveEndpoints();
        expect(component.hearing.endpoints.length).toBe(2);
    });

    it('it should not remove an endpoint from the endpoint array on remove click when hearing is about to start', () => {
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(true);
        component.ngOnInit();

        for (let index = 0; index <= 2; index++) {
            component.addEndpoint();
            component.endpoints.controls[index].get('displayName').setValue(`20${index}`);
            component.endpoints.controls[index].get('defenceAdvocate').setValue(`username${index}@hmcts.net`);
        }

        component.removeEndpoint(1);
        component.saveEndpoints();
        expect(component.hearing.endpoints.length).toBe(3);
    });
    it('should map participant list to defence advocate model', () => {
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
        const participantModel = new ParticipantModel();
        participantModel.id = '1000';
        participantModel.email = 'username@hmcts.net';
        participantModel.display_name = 'display name';
        component.ngOnInit();
        const dA = component.mapParticipantsToDefenceAdvocateModel(participantModel);
        expect(dA).toBeTruthy();
        expect(dA.id).toBe('1000');
        expect(dA.contactEmail).toBe('username@hmcts.net');
        expect(dA.displayName).toBe('display name');
        expect(dA.isSelected).toBe(null);
    });
    it('should return the username from id', () => {
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
        const participantModel = new ParticipantModel();
        participantModel.id = '1000';
        participantModel.email = 'username@hmcts.net';
        participantModel.display_name = 'display name';
        component.hearing.participants.push(participantModel);
        component.ngOnInit();
        let result = component.getEmailFromId('1000');
        expect(result).toBe('username@hmcts.net');
        result = component.getEmailFromId('1001');
        expect(result).toBe('1001');
    });
    it('should unsubscribe all subcription on destroy', () => {
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
        component.ngOnDestroy();
        expect(component.$subscriptions[0].closed).toBe(true);
    });
});
