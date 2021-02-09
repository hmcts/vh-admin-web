import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Logger } from 'src/app/services/logger';
import { HearingModel } from '../../common/model/hearing.model';
import { DiscardConfirmPopupComponent } from '../../popups/discard-confirm-popup/discard-confirm-popup.component';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { SharedModule } from '../../shared/shared.module';
import { CancelPopupStubComponent } from '../../testing/stubs/cancel-popup-stub';
import { ConfirmationPopupStubComponent } from '../../testing/stubs/confirmation-popup-stub';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { OtherInformationComponent } from './other-information.component';
import { ParticipantModel } from '../../common/model/participant.model';

let routerSpy: jasmine.SpyObj<Router>;
let otherInformation: AbstractControl;
let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;

const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
const interpreter: ParticipantModel = {
    hearing_role_name: 'Interpreter ',
    is_judge: false,
    is_exist_person: false
};
const notInterpreter: ParticipantModel = {
    hearing_role_name: 'Not Interpreter ',
    is_judge: false,
    is_exist_person: false
};

describe('OtherInformationComponent', () => {
    let component: OtherInformationComponent;
    let fixture: ComponentFixture<OtherInformationComponent>;
    videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
        'getCurrentRequest',
        'cancelRequest',
        'updateHearingRequest',
        'setBookingHasChanged'
    ]);

    beforeEach(
        waitForAsync(() => {
            routerSpy = jasmine.createSpyObj('Router', ['navigate']);

            TestBed.configureTestingModule({
                imports: [RouterTestingModule, SharedModule],
                providers: [
                    { provide: Router, useValue: routerSpy },
                    { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                    { provide: Logger, useValue: loggerSpy }
                ],
                declarations: [
                    OtherInformationComponent,
                    BreadcrumbComponent,
                    CancelPopupStubComponent,
                    ConfirmationPopupStubComponent,
                    DiscardConfirmPopupComponent
                ]
            }).compileComponents();
            videoHearingsServiceSpy.getCurrentRequest.and.returnValue({
                participants: [],
                other_information: 'some text'
            });
        })
    );
    beforeEach(() => {
        fixture = TestBed.createComponent(OtherInformationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        otherInformation = component.form.controls['otherInformation'];
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should set initial values for field', () => {
        component.ngOnInit();
        expect(otherInformation.value).toBe('some text');
        expect(component.otherInformationText).toBe('some text');
    });
    it('if press next button should save other information in storage and navigate to summary page.', () => {
        component.ngOnInit();
        component.next();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/summary']);
        expect(videoHearingsServiceSpy.getCurrentRequest).toHaveBeenCalled();
        expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalled();
    });
    it('should validate otherInformation field and return invalid as it has not permitted characters', () => {
        component.form.controls['otherInformation'].setValue('%');
        component.form.controls['otherInformation'].markAsDirty();

        expect(component.otherInformationInvalid).toBe(true);
    });
    it('should validate otherInformation field and return valid', () => {
        component.form.controls['otherInformation'].setValue('a');
        expect(component.otherInformationInvalid).toBe(false);
    });
    it('if press cancel button should remove other information from storage and navigate to dashboard page.', () => {
        component.ngOnInit();
        component.cancelBooking();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
        expect(videoHearingsServiceSpy.cancelRequest).toHaveBeenCalled();
    });
    it('should hide cancel and discard pop up confirmation', () => {
        component.continueBooking();
        expect(component.attemptingCancellation).toBeFalsy();
        expect(component.attemptingDiscardChanges).toBeFalsy();
    });
    it('should show discard pop up confirmation', () => {
        component.editMode = true;
        component.form.markAsDirty();
        fixture.detectChanges();
        component.confirmCancelBooking();
        expect(component.attemptingDiscardChanges).toBeTruthy();
    });
    it('should navigate to summary page if no changes', () => {
        component.editMode = true;
        component.form.markAsPristine();
        fixture.detectChanges();
        component.confirmCancelBooking();
        expect(routerSpy.navigate).toHaveBeenCalled();
    });
    it('should show cancel booking confirmation pop up', () => {
        component.editMode = false;
        fixture.detectChanges();
        component.confirmCancelBooking();
        expect(component.attemptingCancellation).toBeTruthy();
    });
    it('should cancel booking, hide pop up and navigate to dashboard', () => {
        component.cancelBooking();
        expect(component.attemptingCancellation).toBeFalsy();
        expect(videoHearingsServiceSpy.cancelRequest).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalled();
    });
    it('should cancel current changes, hide pop up and navigate to summary', () => {
        fixture.detectChanges();
        component.cancelChanges();
        expect(component.attemptingDiscardChanges).toBeFalsy();
        expect(routerSpy.navigate).toHaveBeenCalled();
    });
    it('should sanitize text for other information', () => {
        component.form.controls['otherInformation'].setValue('<script>text</script>');
        component.otherInformationOnBlur();
        expect(component.form.controls['otherInformation'].value).toBe('text');
    });
    it('should set audio recording to true by default', () => {
        component.hearing = null;
        component.ngOnInit();
        expect(component.audioChoice.value).toBe(true);
    });
    it('should set audio recording to false and update hearing model', () => {
        component.ngOnInit();
        component.audioChoice.setValue(false);
        fixture.detectChanges();
        component.next();
        expect(component.hearing.audio_recording_required).toBe(false);
    });
    it('should not be allowed to set audio recording options for case type CACD to recording', () => {
        component.hearing.case_type = 'Court of Appeal Criminal Division';
        component.ngOnInit();
        fixture.autoDetectChanges();
        expect(component.switchOffRecording).toBe(true);
        expect(component.hearing.audio_recording_required).toBe(false);
    });
    it('should be allowed to set audio recording options for case type', () => {
        component.hearing.case_type = 'Rents';
        component.ngOnInit();
        fixture.autoDetectChanges();
        expect(component.switchOffRecording).toBe(false);
    });
    it('should not be allowed to set audio recording options when hearing has an interpreter', () => {
        component.hearing.case_type = 'Rents';
        component.hearing.participants.push(interpreter);
        component.ngOnInit();
        fixture.autoDetectChanges();
        expect(component.interpreterPresent).toBe(true);
        expect(component.hearing.audio_recording_required).toBe(true);
        expect(component.form.controls['audioChoice'].value).toBe(true);
    });
    it('should be allowed to set audio recording options when hearing does not have an interpreter', () => {
        component.hearing.participants.push(notInterpreter);
        component.ngOnInit();
        fixture.autoDetectChanges();
        expect(component.interpreterPresent).toBe(false);
    });
});
