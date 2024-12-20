import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { ParticipantDetailsComponent } from './participant-details.component';
import { HearingRoleCodes, HearingRoles } from '../../common/model/hearing-roles.model';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { VHParticipant } from 'src/app/common/model/vh-participant';

describe('ParticipantDetailsComponent', () => {
    let component: ParticipantDetailsComponent;
    let fixture: ComponentFixture<ParticipantDetailsComponent>;
    let debugElement: DebugElement;
    let hearing: VHBooking = null;
    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ParticipantDetailsComponent],
            imports: [RouterTestingModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantDetailsComponent);
        hearing = VHBooking.createForDetails(
            '1',
            new Date('2019-10-22 13:58:40.3730067'),
            120,
            'XX3456234565',
            'Smith vs Donner',
            'JadgeGreen',
            '33A',
            'Coronation Street',
            'Jhon Smith',
            new Date('2018-10-22 13:58:40.3730067'),
            'Roy Ben',
            new Date('2018-10-22 13:58:40.3730067'),
            null,
            null,
            'Booked',
            true,
            'Financial Remedy',
            'judge.green@hmcts.net',
            '1234567'
        );
        hearing.otherInformation = '|JudgeEmail|judge@hmcts.net|JudgePhone|123456789|OtherInformation|info';
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;
    });

    it('should display participant details', () => {
        const pr = VHParticipant.createForDetails(
            '1',
            'externalRefId',
            'Mrs',
            'Alan',
            'Brake',
            'Citizen',
            'email.p1@hmcts.net',
            'email@hmcts.net',
            'Respondent LIP',
            HearingRoleCodes.Respondent,
            'Alan Brake',
            '',
            'ABC Solicitors',
            'Respondent',
            '12345678',
            'interpretee',
            false,
            null
        );
        component.participant = pr;

        fixture.detectChanges();
        const divElementRole = debugElement.queryAll(By.css(`#participant-${pr.id}-hearing-role-name`));
        expect(divElementRole.length).toBeGreaterThan(0);
        expect(divElementRole.length).toBe(1);
        const el = divElementRole[0].nativeElement as HTMLElement;
        expect(el.innerHTML).toContain('Respondent');
    });

    it('should get judge email from hearing', () => {
        component.hearing = hearing;

        const email = component.judgeEmail;
        expect(email).toBe('judge@hmcts.net');
    });

    it('should get judge phone from hearing', () => {
        component.hearing = hearing;

        const phone = component.judgePhone;
        expect(phone).toBe('123456789');
    });

    it('should be able to know whether participant is judge', () => {
        const pr = VHParticipant.createForDetails(
            '1',
            'externalRefId',
            'Mr',
            'Alex',
            'Super',
            'Judge',
            'judge@hmcts.net',
            'email@hmcts.net',
            'Judge',
            null,
            'Judge',
            '',
            'ABC Solicitors',
            'Judge',
            '12345678',
            'N/A',
            false,
            null
        );
        pr.hearingRoleName = HearingRoles.JUDGE;

        component.participant = pr;
        component.hearing = hearing;
        fixture.detectChanges();
        expect(component.participant.isJudge).toBe(true);
    });
});
