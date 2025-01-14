import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { ParticipantItemComponent } from './participant-item.component';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { Constants } from 'src/app/common/constants';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { VideoSupplier } from 'src/app/services/clients/api-client';
import { VHParticipant } from 'src/app/common/model/vh-participant';
import { VHBooking } from 'src/app/common/model/vh-booking';

const router = {
    navigate: jasmine.createSpy('navigate'),
    url: '/summary'
};

const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
let bookingServiceSpy: jasmine.SpyObj<BookingService>;
let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
describe('ParticipantItemComponent', () => {
    let component: ParticipantItemComponent;
    let fixture: ComponentFixture<ParticipantItemComponent>;
    let debugElement: DebugElement;

    bookingServiceSpy = jasmine.createSpyObj<BookingService>('BookingService', ['setEditMode', 'setParticipantEmail']);
    const participant = new VHParticipant({
        title: 'Mrs',
        firstName: 'Sam',
        isJudiciaryMember: false
    });

    beforeEach(waitForAsync(() => {
        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>(['isConferenceClosed', 'isHearingAboutToStart']);

        TestBed.configureTestingModule({
            declarations: [ParticipantItemComponent],
            providers: [
                { provide: Router, useValue: router },
                { provide: Logger, useValue: loggerSpy },
                { provide: BookingService, useValue: bookingServiceSpy },
                { provide: Router, useValue: router },
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy }
            ],
            imports: [RouterTestingModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantItemComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;
        component.hearing = new VHBooking({
            updatedDate: new Date(),
            otherInformation: '|JudgeEmail|James.Doe@hmcts.net|JudgePhone|123456789',
            supplier: VideoSupplier.Vodafone
        });

        fixture.detectChanges();
    });

    it('should create participants list component', () => {
        expect(component).toBeTruthy();
    });

    it('should edit judge details', () => {
        component.editJudge();
        fixture.detectChanges();
        expect(bookingServiceSpy.setEditMode).toHaveBeenCalled();
    });

    it('should edit participant details', () => {
        component.isSummaryPage = true;
        component.participant = new VHParticipant({
            representee: 'rep',
            isExistPerson: false,
            isJudiciaryMember: false,
            interpretation_language: undefined
        });
        const pat = new VHParticipant({
            email: 'email@hmcts.net',
            isExistPerson: false,
            isJudiciaryMember: false,
            interpretation_language: undefined
        });
        component.editParticipant(pat);
        fixture.detectChanges();
        expect(bookingServiceSpy.setEditMode).toHaveBeenCalled();
        expect(bookingServiceSpy.setParticipantEmail).toHaveBeenCalledWith(pat.email);
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.AddParticipants]);
    });

    it('should edit judicial office holder details', () => {
        component.isSummaryPage = true;
        component.participant = new VHParticipant({
            representee: 'rep',
            hearingRoleName: Constants.HearingRoles.Judge,
            isExistPerson: false,
            isJudiciaryMember: true,
            interpretation_language: undefined
        });
        const pat = new VHParticipant({
            email: 'email@hmcts.net',
            isExistPerson: false,
            hearingRoleName: Constants.HearingRoles.Judge,
            isJudiciaryMember: true,
            interpretation_language: undefined
        });
        component.editParticipant(pat);
        fixture.detectChanges();
        expect(bookingServiceSpy.setEditMode).toHaveBeenCalled();
        expect(bookingServiceSpy.setParticipantEmail).toHaveBeenCalledWith(pat.email);
        expect(router.navigate).toHaveBeenCalledWith([PageUrls.AddJudicialOfficeHolders]);
    });

    it('should emit edit event for non-summary page', () => {
        component.isSummaryPage = false;
        const pat = new VHParticipant({
            email: 'email@hmcts.net',
            isExistPerson: false,
            isJudiciaryMember: false,
            interpretation_language: undefined
        });
        spyOn(component.edit, 'emit');
        component.editParticipant(pat);
        fixture.detectChanges();
        expect(component.edit.emit).toHaveBeenCalledWith(pat);
    });

    it('should return true if participant has a representative', () => {
        component.participant = new VHParticipant({
            representee: 'rep',
            isExistPerson: false,
            isJudiciaryMember: false,
            interpretation_language: undefined
        });
        fixture.detectChanges();
        expect(component.isRepresentative).toBeTruthy();
    });

    it('should return true if participant is a judge', () => {
        participant.hearingRoleName = Constants.HearingRoles.Judge;
        participant.isExistPerson = true;
        component.participant = participant;
        fixture.detectChanges();
        expect(component.isJudge).toBeTruthy();
    });

    it('should return true if participant is a staff member', () => {
        participant.hearingRoleName = Constants.HearingRoles.StaffMember;
        component.participant = participant;
        fixture.detectChanges();
        expect(component.isStaffMember).toBeTruthy();
    });

    it('should return false if participant is not a staff member', () => {
        participant.hearingRoleName = Constants.HearingRoles.PanelMember;
        component.participant = participant;
        fixture.detectChanges();
        expect(component.isStaffMember).toBeFalsy();
    });

    it('should return true if participant is an observer', () => {
        component.participant = new VHParticipant({
            hearingRoleName: 'Observer',
            isExistPerson: false,
            isJudiciaryMember: false,
            interpretation_language: undefined
        });
        fixture.detectChanges();
        expect(component.isObserverOrPanelMember).toBeTruthy();
    });

    it('should return true if participant is a panel member', () => {
        component.participant = new VHParticipant({
            hearingRoleName: 'Panel Member',
            isExistPerson: false,
            isJudiciaryMember: false,
            interpretation_language: undefined
        });
        fixture.detectChanges();
        expect(component.isObserverOrPanelMember).toBeTruthy();
    });
    it('should get judge email', () => {
        component.participant = new VHParticipant({
            hearingRoleName: 'Judge',
            isExistPerson: false,
            isJudiciaryMember: false,
            interpretation_language: undefined
        });
        const email = component.getJudgeEmail();
        expect(email).toBe('James.Doe@hmcts.net');
    });
    it('should get judge phone', () => {
        component.participant = new VHParticipant({
            hearingRoleName: 'Judge',
            isExistPerson: false,
            isJudiciaryMember: false,
            interpretation_language: undefined
        });
        const phone = component.getJudgePhone(component.participant);
        expect(phone).toBe('123456789');
    });

    it('should return true if participant is an interpreter', () => {
        component.participant = new VHParticipant({
            hearingRoleName: 'Interpreter',
            isExistPerson: false,
            interpretation_language: undefined
        });
        fixture.detectChanges();
        expect(component.isInterpreter).toBeTruthy();
    });

    it('should not be able to edit judge if canEdit is false', () => {
        component.canEdit = false;
        expect(component.canEditJudge()).toBe(false);
    });
    it('should not be able to edit judge if canEdit is true and hearing is closed', () => {
        component.canEdit = true;
        videoHearingsServiceSpy.isConferenceClosed.and.returnValue(true);
        expect(component.canEditJudge()).toBe(false);
    });
    it('should not be able to edit judge if canEdit is true, hearing is open, hearing is about to start', () => {
        component.canEdit = true;
        videoHearingsServiceSpy.isConferenceClosed.and.returnValue(false);
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(true);
        expect(component.canEditJudge()).toBe(false);
    });
    it('should be able to edit judge if canEdit is true, hearing is open and hearing is not about to start', () => {
        component.canEdit = true;
        videoHearingsServiceSpy.isConferenceClosed.and.returnValue(false);
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
        expect(component.canEditJudge()).toBe(true);
    });
});
