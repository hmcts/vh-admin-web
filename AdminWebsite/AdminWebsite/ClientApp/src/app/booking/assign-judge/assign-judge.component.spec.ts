import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { CancelPopupComponent } from '../../popups/cancel-popup/cancel-popup.component';
import { DiscardConfirmPopupComponent } from '../../popups/discard-confirm-popup/discard-confirm-popup.component';
import { BookingService } from '../../services/booking.service';
import { ClientSettingsResponse } from '../../services/clients/api-client';
import { Logger } from '../../services/logger';
import { RecordingGuardService } from '../../services/recording-guard.service';
import { VideoHearingsService } from '../../services/video-hearings.service';
import { SharedModule } from '../../shared/shared.module';
import { MockValues } from '../../testing/data/test-objects';
import { BreadcrumbStubComponent } from '../../testing/stubs/breadcrumb-stub';
import { ParticipantsListStubComponent } from '../../testing/stubs/participant-list-stub';
import { JudgeDataService } from '../services/judge-data.service';
import { AssignJudgeComponent } from './assign-judge.component';
import { OtherInformationModel } from '../../common/model/other-information.model';
import { EmailValidationService } from 'src/app/booking/services/email-validation.service';
import { ConfigService } from '../../services/config.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { SearchEmailComponent } from '../search-email/search-email.component';
import { MockComponent } from 'ng-mocks';
import { Constants } from 'src/app/common/constants';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { VHParticipant } from 'src/app/common/model/vh-participant';
import { HearingRoles } from 'src/app/common/model/hearing-roles.model';

function initHearingRequest(): VHBooking {
    const participants: VHParticipant[] = [];
    const p1 = new VHParticipant();
    p1.displayName = 'display name1';
    p1.email = 'test1@hmcts.net';
    p1.contactEmail = 'test1@hmcts.net';
    p1.firstName = 'first';
    p1.lastName = 'last';
    p1.title = 'Mr.';
    p1.username = 'test1@hmcts.net';
    p1.hearingRoleName = 'Judge';

    const p2 = new VHParticipant();
    p2.displayName = 'display name2';
    p2.email = 'test2@hmcts.net';
    p2.contactEmail = 'test2@hmcts.net';
    p2.firstName = 'first2';
    p2.lastName = 'last2';
    p2.title = 'Mr.';
    p2.username = 'test2@hmcts.net';
    p2.hearingRoleName = 'Applicant';

    participants.push(p1);
    participants.push(p2);

    const newHearing = new VHBooking();
    newHearing.participants = participants;

    newHearing.hearingVenueId = -1;
    newHearing.scheduledDateTime = null;
    newHearing.scheduledDuration = 0;
    newHearing.audioRecordingRequired = true;

    return newHearing;
}

let component: AssignJudgeComponent;
let fixture: ComponentFixture<AssignJudgeComponent>;

let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
let judgeDataServiceSpy: jasmine.SpyObj<JudgeDataService>;
let routerSpy: jasmine.SpyObj<Router>;
let bookingServiseSpy: jasmine.SpyObj<BookingService>;
let loggerSpy: jasmine.SpyObj<Logger>;
let emailValidationServiceSpy: jasmine.SpyObj<EmailValidationService>;
const configSettings = new ClientSettingsResponse();
const staffMemberRole = Constants.HearingRoles.StaffMember;
configSettings.test_username_stem = '@hmcts.net';
let configServiceSpy: jasmine.SpyObj<ConfigService>;

describe('AssignJudgeComponent', () => {
    beforeEach(waitForAsync(() => {
        const newHearing = initHearingRequest();
        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
        emailValidationServiceSpy = jasmine.createSpyObj<EmailValidationService>('EmailValidationService', [
            'hasCourtroomAccountPattern',
            'validateEmail'
        ]);
        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
            'getCurrentRequest',
            'updateHearingRequest',
            'cancelRequest',
            'setBookingHasChanged',
            'unsetBookingHasChanged',
            'canAddUser',
            'canAddJudge'
        ]);
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);
        emailValidationServiceSpy.validateEmail.and.returnValue(true);
        emailValidationServiceSpy.hasCourtroomAccountPattern.and.returnValue(true);

        bookingServiseSpy = jasmine.createSpyObj<BookingService>('BookingService', ['resetEditMode', 'isEditMode', 'removeEditMode']);

        judgeDataServiceSpy = jasmine.createSpyObj<JudgeDataService>('JudgeDataService', ['searchJudgesByEmail']);
        judgeDataServiceSpy.searchJudgesByEmail.and.returnValue(of(MockValues.Judges));
        configServiceSpy = jasmine.createSpyObj<ConfigService>('CongigService', ['getClientSettings']);
        configServiceSpy.getClientSettings.and.returnValue(of(configSettings));

        TestBed.configureTestingModule({
            imports: [SharedModule, RouterTestingModule],
            providers: [
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: JudgeDataService, useValue: judgeDataServiceSpy },
                { provide: EmailValidationService, useValue: emailValidationServiceSpy },
                { provide: ConfigService, useValue: configServiceSpy },
                {
                    provide: Router,
                    useValue: {
                        url: '/summary',
                        navigate: jasmine.createSpy('navigate')
                    }
                },
                { provide: BookingService, useValue: bookingServiseSpy },
                { provide: Logger, useValue: loggerSpy },
                RecordingGuardService,
                {
                    provide: ActivatedRoute,
                    useValue: {
                        data: {
                            subscribe: (fn: (value) => void) =>
                                fn({
                                    some: ''
                                })
                        },
                        params: {
                            subscribe: (fn: (value) => void) =>
                                fn({
                                    some: 0
                                })
                        },
                        snapshot: {
                            data: { emailPattern: 'courtroom.test' },
                            url: [
                                {
                                    path: 'fake'
                                }
                            ]
                        }
                    }
                },
                { provide: ConfigService, useValue: configServiceSpy }
            ],
            declarations: [
                AssignJudgeComponent,
                MockComponent(SearchEmailComponent),
                BreadcrumbStubComponent,
                CancelPopupComponent,
                ParticipantsListStubComponent,
                DiscardConfirmPopupComponent
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AssignJudgeComponent);

        /* tslint:disable */
        routerSpy = TestBed.get(Router);
        /* tslint:enable */
        component = fixture.componentInstance;
        component.showStaffMemberFeature = true;
        fixture.detectChanges();
    }));

    describe('ngOnit beforeEach legacy tests', () => {
        beforeEach(waitForAsync(() => {
            component.ngOnInit();
        }));

        it('should fail validation if a judge is not selected', () => {
            component.cancelAssignJudge();
            component.saveJudge();
            expect(component.form.valid).toBeFalsy();
        });
        it('should initialize form and create judgeDisplayName control', () => {
            component.ngOnInit();
            expect(component.judgeDisplayNameFld).toBeTruthy();
            expect(component.judgeDisplayNameFld.updateOn).toBe('blur');
        });

        it('should initialize form and create judgeDisplayName control', () => {
            const existingStaffMember = new VHParticipant({
                hearingRoleName: staffMemberRole
            });

            const savedHearing = initHearingRequest();
            savedHearing.participants.push(existingStaffMember);

            videoHearingsServiceSpy.getCurrentRequest.and.returnValue(savedHearing);

            component.ngOnInit();

            expect(component.showAddStaffMemberFld.value).toBe(true);
        });

        it('judge display name field validity required', () => {
            component.form.controls['judgeDisplayNameFld'].setValue('');
            const judge_display_name = component.form.controls['judgeDisplayNameFld'];
            const errors = judge_display_name.errors || {};
            expect(errors['required']).toBeTruthy();
        });
        it('judge display name field validity pattern', () => {
            component.form.controls['judgeDisplayNameFld'].setValue('%');
            const judge_display_name = component.form.controls['judgeDisplayNameFld'];
            const errors = judge_display_name.errors || {};
            expect(errors['pattern']).toBeTruthy();
        });
        it('should fail validation if a judge display name is not entered', () => {
            component.ngOnInit();
            expect(component.judgeDisplayNameFld).toBeTruthy();
            expect(component.judgeDisplayNameFld.validator).toBeTruthy();
            component.judgeDisplayNameFld.setValue('');
            expect(component.form.valid).toBeFalsy();
        });
        it('should succeeded validation if a judge display name is entered', () => {
            component.ngOnInit();
            component.judgeDisplayNameFld.setValue('judge name');
            expect(component.judgeDisplayNameInvalid).toBeFalsy();
        });
        it('should not succeeded validation if a judge display name' + 'is entered with not allowed characters', () => {
            component.ngOnInit();
            component.judgeDisplayNameFld.setValue('%');
            component.failedSubmission = true;
            expect(component.judgeDisplayNameInvalid).toBeTruthy();
        });
        it('should return judgeDisplayNameInvalid is false if form is valid', () => {
            component.ngOnInit();
            component.judgeDisplayNameFld.setValue('a');
            component.judgeDisplayNameFld.markAsUntouched();
            component.judgeDisplayNameFld.markAsPristine();
            component.failedSubmission = false;
            expect(component.judgeDisplayNameInvalid).toBeFalsy();
        });

        it('should get current booking and judge details', () => {
            videoHearingsServiceSpy.canAddJudge.and.returnValue(true);
            spyOn(component, 'updateJudge');

            component.ngOnInit();
            expect(component.failedSubmission).toBeFalsy();
            expect(videoHearingsServiceSpy.getCurrentRequest).toHaveBeenCalled();

            expect(component.updateJudge).toHaveBeenCalledTimes(1);
        });
        it('should hide cancel and discard pop up confirmation', () => {
            component.attemptingCancellation = true;
            component.attemptingDiscardChanges = true;
            fixture.detectChanges();
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
            fixture.detectChanges();
            component.cancelAssignJudge();
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

        it('should sanitize display name of the judge if it was entered', () => {
            const displayNameSanitized = 'DisplayNameSanitized';

            component.judgeDisplayNameFld.setValue('<script>' + displayNameSanitized + '</script>');
            component.changeDisplayName();
            expect(component.judgeDisplayNameFld.value).toBe(displayNameSanitized);
            expect(component.judge.displayName).toBe(displayNameSanitized);
            expect(component.hearing.participants.find(x => x.isJudge).displayName).toBe(displayNameSanitized);
        });

        it('should unsubscribe all subcriptions on destroy component', () => {
            component.ngOnDestroy();
            expect(component.$subscriptions[0].closed).toBeTruthy();
            expect(component.$subscriptions[1].closed).toBeTruthy();
        });
        it('should navigate if judge is saved', () => {
            const savedHearing = initHearingRequest();
            expect(savedHearing.participants.length > 0).toBe(true);
            videoHearingsServiceSpy.getCurrentRequest.calls.reset();
            component.canNavigate = true;
            videoHearingsServiceSpy.getCurrentRequest.and.returnValue(savedHearing);
            expect(component.canNavigateNext).toBe(true);
        });
        it('should not navigate if judge is not saved', () => {
            const savedHearing = initHearingRequest();
            savedHearing.participants = [];
            videoHearingsServiceSpy.getCurrentRequest.calls.reset();
            component.canNavigate = true;
            videoHearingsServiceSpy.getCurrentRequest.and.returnValue(savedHearing);
            expect(component.canNavigateNext).toBe(false);
        });
        it('should change email address when entered in judge email input', () => {
            component.judgeEmailFld.setValue('judge@judges.com');
            component.changeEmail();
            expect(component.hearing.participants[0].email).toBe('test1@hmcts.net');
        });
        it('should display error when email address is not valid', () => {
            component.ngOnInit();
            component.judgeEmailFld.setValue('judge@');
            component.failedSubmission = true;
            expect(component.judgeEmailInvalid).toBeTruthy();
        });
        it('should change telephone number when entered in judge telephone input', () => {
            const judgePhone = '01234567890';
            component.judgePhoneFld.setValue(judgePhone);
            component.changeTelephone();
            const otherInformationDetails = OtherInformationModel.init(component.hearing.otherInformation);
            expect(otherInformationDetails.JudgePhone).toBe(judgePhone);
        });
        it('should display error when telephone address is not valid', () => {
            component.ngOnInit();
            component.judgePhoneFld.setValue('+123456ABCD');
            component.failedSubmission = true;
            expect(component.judgePhoneInvalid).toBeTruthy();
        });
    });

    const judge = new VHParticipant();
    judge.username = 'JudgeUserName';
    judge.email = 'JudgeEmail';
    judge.displayName = 'JudgeDisplayName';
    judge.phone = 'JudgePhone';
    judge.isCourtroomAccount = true;

    const alternateJudge = new VHParticipant();
    alternateJudge.username = 'AlternateJudgeUserName';
    alternateJudge.email = 'AlternateJudgeEmail';
    alternateJudge.displayName = 'AlternateJudgeDisplayName';
    alternateJudge.phone = 'AlternateJudgePhone';
    alternateJudge.hearingRoleName = Constants.HearingRoles.Judge;

    const initialJudgeDisplayNameFld = 'InitialJudgeDisplayNameFld';
    const initialJudgeEmailFld = 'InitialJudgeEmailFld';
    const initialJudgePhoneFld = 'InitialJudgePhoneFld';

    const otherInformationDetailsJudgeEmail = 'OtherInformationDetailsJudgeEmail';
    const otherInformationDetailsJudgePhone = 'OtherInformationDetailsJudgePhone';

    describe('saveJudgeAndStaffMember', () => {
        let testJudge: VHParticipant;
        beforeEach(() => {
            // setup judge so that isJudgeSelected returns true
            testJudge = Object.assign({}, judge);
            testJudge.email = 'saveJudgeAndStaffMember@test.com';
            component.isJudgeParticipantError = false;
            component.failedSubmission = false;
            component.judge = testJudge;
        });

        it('should set correct validation errors if judge is null', () => {
            component.judge = null;

            component.saveJudge();

            expect(component.isJudgeParticipantError).toBe(false);
            expect(component.failedSubmission).toBe(true);
            expect(component.isJudgeSelected).toBe(false);
        });

        it('should set correct validation errors if email is null', () => {
            component.judge.email = null;

            component.saveJudge();

            expect(component.isJudgeParticipantError).toBe(false);
            expect(component.failedSubmission).toBe(true);
            expect(component.isJudgeSelected).toBe(false);
        });

        it('should set correct validation errors if display name is null', () => {
            component.judge.displayName = null;

            component.saveJudge();
            expect(component.isJudgeParticipantError).toBe(false);
            expect(component.failedSubmission).toBe(true);
            expect(component.isJudgeSelected).toBe(true);
        });

        it('should set correct validation errors if display name is null', () => {
            component.judge.displayName = null;

            component.saveJudge();
            expect(component.isJudgeParticipantError).toBe(false);
            expect(component.failedSubmission).toBe(true);
            expect(component.isJudgeSelected).toBe(true);
        });

        it('should set correct validation errors if cannot add judge', () => {
            videoHearingsServiceSpy.canAddJudge.and.returnValue(false);

            component.saveJudge();

            expect(component.isJudgeParticipantError).toBe(true);
            expect(component.failedSubmission).toBe(true);
            expect(component.isJudgeSelected).toBe(true);
        });

        it('should set correct validation errors if can add judge but form is invalid', () => {
            videoHearingsServiceSpy.canAddJudge.and.returnValue(true);
            component.form.setErrors({ incorrect: true });
            component.saveJudge();

            expect(component.isJudgeParticipantError).toBe(false);
            expect(component.failedSubmission).toBe(true);
            expect(component.isJudgeSelected).toBe(true);
        });

        it('should set correct validation errors if can add judge but email is invalid', () => {
            videoHearingsServiceSpy.canAddJudge.and.returnValue(true);
            component.isValidEmail = false;
            component.saveJudge();

            expect(component.isJudgeParticipantError).toBe(false);
            expect(component.failedSubmission).toBe(true);
            expect(component.isJudgeSelected).toBe(true);
        });

        it('should update hearing if valid', () => {
            videoHearingsServiceSpy.canAddJudge.and.returnValue(true);

            spyOn(component, 'changeDisplayName');
            spyOn(component, 'changeEmail');
            spyOn(component, 'changeTelephone');

            component.saveJudge();

            expect(component.isJudgeParticipantError).toBe(false);
            expect(component.failedSubmission).toBe(false);
            expect(component.isJudgeSelected).toBe(true);

            expect(component.changeDisplayName).toHaveBeenCalledTimes(1);
            expect(component.changeEmail).toHaveBeenCalledTimes(1);
            expect(component.changeTelephone).toHaveBeenCalledTimes(1);

            expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalledWith(component.hearing);
            expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalledTimes(1);
        });

        describe('when hearing is valid', () => {
            let routeExpected;

            beforeEach(() => {
                videoHearingsServiceSpy.canAddJudge.and.returnValue(true);

                spyOn(component, 'changeDisplayName');
                spyOn(component, 'changeEmail');
                spyOn(component, 'changeTelephone');
            });

            afterEach(() => {
                component.saveJudge();
                expect(component.isJudgeParticipantError).toBe(false);
                expect(component.failedSubmission).toBe(false);
                expect(component.isJudgeSelected).toBe(true);

                expect(component.changeDisplayName).toHaveBeenCalledTimes(1);
                expect(component.changeEmail).toHaveBeenCalledTimes(1);
                expect(component.changeTelephone).toHaveBeenCalledTimes(1);

                expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalledWith(component.hearing);
                expect(videoHearingsServiceSpy.updateHearingRequest).toHaveBeenCalledTimes(1);

                expect(routerSpy.navigate).toHaveBeenCalledWith(routeExpected);
            });

            it('should update hearing and navigate to summary page if edit mode is active', () => {
                component.editMode = true;
                routeExpected = [PageUrls.Summary];
            });

            it('should update hearing and navigate to add participants page if edit mode is not active', () => {
                component.editMode = false;
                routeExpected = [PageUrls.AddParticipants];
            });
        });
    });

    describe('updateJudge', () => {
        beforeEach(() => {
            component.hearing = new VHBooking();
            component.canNavigate = null;

            component.judgeDisplayNameFld.setValue(initialJudgeDisplayNameFld);
            component.judgeEmailFld.setValue(initialJudgeEmailFld);
            component.judgePhoneFld.setValue(initialJudgePhoneFld);

            component.otherInformationDetails = new OtherInformationModel();

            component.otherInformationDetails.JudgeEmail = otherInformationDetailsJudgeEmail;
            component.otherInformationDetails.JudgePhone = otherInformationDetailsJudgePhone;
        });

        describe('when judge is not null', () => {
            let canAddJudgeCalledCountBefore = 0;
            beforeEach(() => {
                canAddJudgeCalledCountBefore = videoHearingsServiceSpy.canAddJudge.calls.count();
            });

            it('should not attempt to add if is existing judge', () => {
                judge.hearingRoleName = HearingRoles.JUDGE;
                component.hearing.participants.unshift(judge);
                component.updateJudge(judge);
                expect(videoHearingsServiceSpy.canAddJudge).toHaveBeenCalledTimes(canAddJudgeCalledCountBefore);
            });

            it('should set validation error to true if judge account can not be added', () => {
                component.isJudgeParticipantError = false;

                videoHearingsServiceSpy.canAddJudge.and.returnValue(false);
                component.updateJudge(judge);

                expect(videoHearingsServiceSpy.canAddJudge).toHaveBeenCalledWith(judge.username);
                expect(component.isJudgeParticipantError).toBe(true);
                expect(component.canNavigate).toBe(false);
            });

            describe('when judge account can be added', () => {
                beforeEach(() => {
                    const updatedJudgeDisplayName = 'UpdatedJudgeDisplayName';
                    videoHearingsServiceSpy.canAddJudge.and.returnValue(true);
                    component.judge.displayName = updatedJudgeDisplayName;
                });

                it('should add judge account when none present', () => {
                    // intentionally left empty
                });

                it('should update judge account when one previously present', () => {
                    component.hearing.participants.unshift(alternateJudge);
                });

                afterEach(() => {
                    component.updateJudge(judge);
                    expect(videoHearingsServiceSpy.canAddJudge).toHaveBeenCalledWith(judge.username);
                    const updatedJudges = component.hearing.participants.filter(participant => participant.isJudge);

                    expect(updatedJudges.length).toBe(1);
                    expect(component.courtAccountJudgeEmail).toEqual(judge.username);
                    expect(component.judgeDisplayNameFld.value).toEqual(judge.displayName);
                    expect(updatedJudges[0]).toEqual(judge);
                    expect(updatedJudges[0].hearingRoleCode).toBe(Constants.HearingRoleCodes.Judge);

                    expect(component.canNavigate).toBe(true);
                    expect(component.isJudgeParticipantError).toBe(false);
                });
            });
            afterEach(() => {
                expect(component.judgeDisplayNameFld.value).toEqual(judge.displayName);
                expect(component.judgeEmailFld.value).toEqual(otherInformationDetailsJudgeEmail);
                expect(component.judgePhoneFld.value).toEqual(otherInformationDetailsJudgePhone);
            });
        });

        it('should remove judge if passed null', () => {
            component.hearing.participants.unshift(alternateJudge);
            component.updateJudge(null);

            const updatedJudges = component.hearing.participants.filter(participant => participant.isJudge);
            expect(updatedJudges.length).toBe(0);

            expect(component.isJudgeParticipantError).toBe(false);
            expect(component.judgeDisplayNameFld.value).toEqual('');
            expect(component.judgeEmailFld.value).toEqual('');
            expect(component.judgePhoneFld.value).toEqual('');
            expect(component.canNavigate).toBe(false);
        });
    });
});
