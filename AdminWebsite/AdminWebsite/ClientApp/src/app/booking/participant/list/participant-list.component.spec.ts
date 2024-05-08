import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { LinkedParticipantModel, LinkedParticipantType } from 'src/app/common/model/linked-participant.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { Logger } from 'src/app/services/logger';
import { ParticipantListComponent } from './participant-list.component';
import { ParticipantItemComponent } from '../item/participant-item.component';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { JudicialMemberDto } from '../../judicial-office-holders/models/add-judicial-member.model';
import { HearingRoleCodes } from 'src/app/common/model/hearing-roles.model';
import { LaunchDarklyService } from '../../../services/launch-darkly.service';
import { of } from 'rxjs';

const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
const router = {
    navigate: jasmine.createSpy('navigate'),
    url: '/summary'
};
let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;

describe('ParticipantListComponent', () => {
    let component: ParticipantListComponent;
    let fixture: ComponentFixture<ParticipantListComponent>;
    let debugElement: DebugElement;

    const pat1 = new ParticipantModel();
    pat1.title = 'Mrs';
    pat1.first_name = 'Sam';
    pat1.display_name = 'Sam';
    pat1.addedDuringHearing = false;
    pat1.hearing_role_code = HearingRoleCodes.Applicant;
    const pat2 = new ParticipantModel();
    pat2.title = 'Mr';
    pat2.first_name = 'John';
    pat2.display_name = 'Doe';
    pat2.addedDuringHearing = false;
    pat2.hearing_role_code = HearingRoleCodes.Applicant;

    const participants: any[] = [pat1, pat2];
    const ldServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);

    beforeEach(waitForAsync(() => {
        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>(['isConferenceClosed', 'isHearingAboutToStart']);
        ldServiceSpy.getFlag.and.returnValue(of(true));
        TestBed.configureTestingModule({
            declarations: [ParticipantListComponent, ParticipantItemComponent],
            providers: [
                { provide: Logger, useValue: loggerSpy },
                { provide: Router, useValue: router },
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: LaunchDarklyService, useValue: ldServiceSpy }
            ],
            imports: [RouterTestingModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantListComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;
        component.hearing = { updated_date: new Date() };
        fixture.detectChanges();
    });

    describe('ngDoCheck - sorting participants on change', () => {
        it('should call sortParticipants when participant list changes', () => {
            const sortSpy = spyOn(component, 'sortParticipants');
            component.hearing.participants = [{ display_name: 'B' }, { display_name: 'A' }, { display_name: 'C' }];
            component.sortedParticipants = [{ display_name: 'A' }, { display_name: 'B' }];
            component.ngDoCheck();
            expect(sortSpy).toHaveBeenCalled();
        });

        it('should not call sortParticipants when participant list does not change', () => {
            const sortSpy = spyOn(component, 'sortParticipants');
            component.hearing.participants = [{ display_name: 'A' }, { display_name: 'B' }];
            component.sortedParticipants = [{ display_name: 'A' }, { display_name: 'B' }];
            component.ngDoCheck();
            expect(sortSpy).not.toHaveBeenCalled();
        });

        it('should call sortJudiciaryMembers when judiciary participant list changes and participants have different display name', () => {
            const johJudge = new JudicialMemberDto('Test', 'User', 'Test User', 'testjudge@test.com', '1234567890', '1234', false);
            johJudge.roleCode = 'Judge';
            johJudge.displayName = 'Judge Test User';

            const johPm1 = new JudicialMemberDto(
                'Test PM 1',
                'User PM 1',
                'Test User PM 1',
                'testpm1@test.com',
                '1234567890',
                '2345',
                false
            );
            johPm1.displayName = 'Test User 1';
            johPm1.roleCode = 'PanelMember';
            const johPm2 = new JudicialMemberDto('Test PM 2', 'User PM 2', 'Test User PM 2', 'testpm2test.com', '123456098', '3456', false);
            johPm2.displayName = 'Test User 2';
            johPm2.roleCode = 'PanelMember';
            component.hearing.judiciaryParticipants = [johPm2, johJudge, johPm1];
            component.sortedJudiciaryMembers = [];
            component.ngDoCheck();
            expect(component.sortedJudiciaryMembers[0].hearing_role_code).toEqual('Judge');
            expect(component.sortedJudiciaryMembers[1].hearing_role_code).toEqual('PanelMember');
            expect(component.sortedJudiciaryMembers[1].display_name).toEqual(johPm1.displayName);
            expect(component.sortedJudiciaryMembers[2].hearing_role_code).toEqual('PanelMember');
            expect(component.sortedJudiciaryMembers[2].display_name).toEqual(johPm2.displayName);
        });

        it('should call sortJudiciaryMembers once for multiple ngDoChecks when judiciary participant list changes and participants have same display name', () => {
            // When calling ngDoCheck multiple times, it should only attempt to sort the judiciary members on the first call. For subsequent calls
            // it should detect that there are no changes and therefore not attempt to sort again.
            // In the real application, attempting to sort more than once will lead to infinite ngDoChecks

            const displayName = 'Display Name';
            const johJudge = new JudicialMemberDto('Test', 'User', 'Test User', 'testjudge@test.com', '1234567890', '1234', false);
            johJudge.roleCode = 'Judge';
            johJudge.displayName = displayName;

            const johPm1 = new JudicialMemberDto(
                'Test PM 1',
                'User PM 1',
                'Test User PM 1',
                'testpm1@test.com',
                '1234567890',
                '2345',
                false
            );
            johPm1.displayName = displayName;
            johPm1.roleCode = 'PanelMember';
            component.hearing.judiciaryParticipants = [johPm1, johJudge];
            component.sortedJudiciaryMembers = [];

            let sortJudiciaryMembersCalled = false;

            spyOn(component, 'sortJoh').and.callFake(() => {
                sortJudiciaryMembersCalled = true;
                component.sortJudiciaryMembers();
            });

            component.ngDoCheck();
            expect(sortJudiciaryMembersCalled).toBe(true);

            sortJudiciaryMembersCalled = false;
            component.ngDoCheck();
            component.ngDoCheck();

            expect(sortJudiciaryMembersCalled).toBe(false);
            expect(component.sortedJudiciaryMembers[0].hearing_role_code).toEqual('Judge');
            expect(component.sortedJudiciaryMembers[1].hearing_role_code).toEqual('PanelMember');
        });
    });

    it('should create participants list component', () => {
        expect(component).toBeTruthy();
    });

    it('should display participants', fakeAsync(() => {
        component.sortedParticipants = [];

        component.ngOnInit();

        tick();
        component.hearing.participants = participants;
        fixture.detectChanges();
        tick();
        const elementArray = debugElement.queryAll(By.css('app-participant-item'));
        expect(elementArray.length).toBeGreaterThan(0);
        expect(elementArray.length).toBe(2);
    }));

    describe('Edit rules', () => {
        it('should emit on remove', () => {
            spyOn(component.$selectedForRemove, 'emit');
            component.removeParticipant({ email: 'email@hmcts.net', is_exist_person: false, is_judge: false });
            expect(component.$selectedForRemove.emit).toHaveBeenCalled();
        });
        it('should not be able to edit participant if canEdit is false', () => {
            component.canEdit = false;
            expect(component.canEditParticipant(pat1)).toBe(false);
        });
        it('should not be able to edit participant if canEdit is true and hearing is closed', () => {
            component.canEdit = true;
            videoHearingsServiceSpy.isConferenceClosed.and.returnValue(true);
            expect(component.canEditParticipant(pat1)).toBe(false);
        });
        it('should not be able to edit participant if canEdit is true, hearing is open, hearing is about to start and addedDuringHearing is false', () => {
            component.canEdit = true;
            videoHearingsServiceSpy.isConferenceClosed.and.returnValue(false);
            videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(true);
            pat1.addedDuringHearing = false;
            expect(component.canEditParticipant(pat1)).toBe(false);
        });
        it('should be able to edit participant if canEdit is true, hearing is open and about to start & addedDuringHearing is true', () => {
            component.canEdit = true;
            videoHearingsServiceSpy.isConferenceClosed.and.returnValue(false);
            videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(true);
            pat1.addedDuringHearing = true;
            expect(component.canEditParticipant(pat1)).toBe(true);
        });
        it('should be able to edit participant if canEdit is true, hearing is open and hearing is not about to start', () => {
            component.canEdit = true;
            videoHearingsServiceSpy.isConferenceClosed.and.returnValue(false);
            videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(false);
            expect(component.canEditParticipant(pat1)).toBe(true);
        });
    });

    describe('sortJudiciaryMembers', () => {
        let judge: JudicialMemberDto;
        let panelMember: JudicialMemberDto;

        beforeEach(() => {
            judge = new JudicialMemberDto('Judge', 'Fudge', 'Judge Fudge', 'judge@test.com', '1234567890', '1234', false);
            judge.roleCode = 'Judge';
            judge.displayName = 'Judge Fudge';

            panelMember = new JudicialMemberDto('John', 'Doe', 'John Doe', 'pm@test.com', '2345678901', '2345', false);
            panelMember.roleCode = 'PanelMember';
            panelMember.displayName = 'PM Doe';
        });

        it('should not sort if hearing.judiciaryParticipants is not defined', () => {
            component.hearing.judiciaryParticipants = undefined;
            component.sortJudiciaryMembers();
            expect(component.sortedJudiciaryMembers).toEqual([]);
        });

        it('should sort judiciary members with Judge at the beginning', () => {
            component.hearing.judiciaryParticipants = [panelMember, judge];
            component.sortJudiciaryMembers();
            expect(component.sortedJudiciaryMembers[0].hearing_role_code).toEqual('Judge');
            expect(component.sortedJudiciaryMembers[1].hearing_role_code).toEqual('PanelMember');
        });

        it('should sort judiciary members with Judge at the beginning even if Judge is last in the original list', () => {
            component.hearing.judiciaryParticipants = [judge, panelMember];
            component.sortJudiciaryMembers();
            expect(component.sortedJudiciaryMembers[0].hearing_role_code).toEqual('Judge');
            expect(component.sortedJudiciaryMembers[1].hearing_role_code).toEqual('PanelMember');
        });

        it('should not change the order if all judiciary members are Judges', () => {
            component.hearing.judiciaryParticipants = [judge, judge];
            component.sortJudiciaryMembers();
            expect(component.sortedJudiciaryMembers[0].hearing_role_code).toEqual('Judge');
            expect(component.sortedJudiciaryMembers[1].hearing_role_code).toEqual('Judge');
        });

        it('should not change the order if there are no Judges', () => {
            component.hearing.judiciaryParticipants = [panelMember, panelMember];
            component.sortJudiciaryMembers();
            expect(component.sortedJudiciaryMembers[0].hearing_role_code).toEqual('PanelMember');
            expect(component.sortedJudiciaryMembers[1].hearing_role_code).toEqual('PanelMember');
        });
    });
});

describe('ParticipantListComponent-SortParticipants', () => {
    let component: ParticipantListComponent;
    let fixture: ComponentFixture<ParticipantListComponent>;
    let debugElement: DebugElement;

    beforeEach(waitForAsync(() => {
        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>(['isConferenceClosed', 'isHearingAboutToStart']);
        TestBed.configureTestingModule({
            declarations: [ParticipantListComponent, ParticipantItemComponent],
            providers: [
                { provide: Logger, useValue: loggerSpy },
                { provide: Router, useValue: router },
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy }
            ],
            imports: [RouterTestingModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantListComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;
        component.hearing = { updated_date: new Date() };
        fixture.detectChanges();
    });
    it('should produce a sorted list with no duplicates', () => {
        const linked_participantList: LinkedParticipantModel[] = [];
        const linked_participant = new LinkedParticipantModel();
        linked_participant.linkType = LinkedParticipantType.Interpreter;
        linked_participant.linkedParticipantId = '7';
        linked_participantList.push(linked_participant);

        const linked_participantList1: LinkedParticipantModel[] = [];
        const linked_participant1 = new LinkedParticipantModel();
        linked_participant1.linkType = LinkedParticipantType.Interpreter;
        linked_participant1.linkedParticipantId = '9';
        linked_participantList1.push(linked_participant1);

        const participantsArr = [
            { is_judge: true, hearing_role_name: 'Judge', display_name: 'Judge1', linked_participant: null },
            { is_judge: true, hearing_role_name: 'Judge', display_name: 'Judge2', linked_participant: null },
            { is_judge: false, hearing_role_name: 'Winger', display_name: 'Winger1', linked_participant: null },
            { is_judge: false, hearing_role_name: 'Winger', display_name: 'Winger2', linked_participant: null },
            { is_judge: false, hearing_role_name: 'Staff Member', display_name: 'Staff Member', linked_participant: null },
            { is_judge: false, hearing_role_name: 'Panel Member', display_name: 'Panel Member', linked_participant: null },
            { is_judge: false, hearing_role_name: 'Observer', display_name: 'Observer', linked_participant: null },
            {
                is_judge: false,
                hearing_role_name: 'Litigant in Person',
                display_name: 'Litigant in Person1',
                linked_participant: linked_participantList1
            },
            { is_judge: false, hearing_role_name: 'Litigant in Person', display_name: 'Litigant in Person2', linked_participant: null },
            { is_judge: false, hearing_role_name: 'Litigant in Person', display_name: 'Litigant in Person3', linked_participant: null },
            { is_judge: false, hearing_role_name: 'Interpreter', display_name: 'Interpreter1', linked_participant: linked_participantList }
        ];

        if (!component.hearing.participants) {
            component.hearing.participants = [];
        }
        participantsArr.forEach((p, i) => {
            component.hearing.participants.push({
                is_exist_person: true,
                is_judge: p.is_judge,
                hearing_role_name: p.hearing_role_name,
                display_name: p.display_name,
                linked_participants: p.linked_participant,
                id: `${i + 1}`,
                is_courtroom_account: false
            });
        });

        component.ngOnInit();

        expect(component.sortedParticipants.length).toBe(11);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Judge').length).toBe(2);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Winger').length).toBe(2);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Staff Member').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Panel Member').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Observer').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Litigant in Person').length).toBe(3);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Interpreter').length).toBe(1);
    });

    it('should produce a sorted list with specific hierarchy and grouping', () => {
        const participantsArr = [
            { is_judge: true, case_role_name: null, hearing_role_name: 'Judge', first_name: 'L' },
            { is_judge: false, case_role_name: 'Winger', hearing_role_name: 'None', first_name: 'K' },
            { is_judge: false, case_role_name: 'None', hearing_role_name: 'Winger', first_name: 'J' },
            { is_judge: false, case_role_name: null, hearing_role_name: 'Staff Member', first_name: 'I' },
            { is_judge: false, case_role_name: 'None', hearing_role_name: 'Panel Member', first_name: 'H' },
            { is_judge: false, case_role_name: 'None', hearing_role_name: 'Observer', first_name: 'G' },
            {
                is_judge: false,
                case_role_name: 'Appellant',
                hearing_role_name: 'Litigant in Person',
                first_name: 'F'
            },
            { is_judge: false, case_role_name: 'None', hearing_role_name: 'Litigant in Person', first_name: 'E' },
            {
                is_judge: false,
                case_role_name: 'Appellant',
                hearing_role_name: 'Litigant in Person',
                first_name: 'D'
            },
            {
                is_judge: false,
                case_role_name: 'Appellant',
                email: 'interpretees@email.co.uk',
                hearing_role_name: 'Litigant in Person',
                first_name: 'C'
            },
            { is_judge: false, case_role_name: 'None', hearing_role_name: 'Litigant in Person', first_name: 'B' },
            {
                is_judge: false,
                case_role_name: 'Appellant',
                hearing_role_name: 'Litigant in Person',
                first_name: 'A'
            },
            {
                is_judge: false,
                case_role_name: 'None',
                hearing_role_name: 'Interpreter',
                first_name: 'A',
                interpreterFor: 'interpretees@email.co.uk'
            },
            { is_judge: false, case_role_name: 'Observer', hearing_role_name: 'new observer type', first_name: 'M' }
        ];

        if (!component.hearing.participants) {
            component.hearing.participants = [];
        }
        participantsArr.forEach((p, i) => {
            component.hearing.participants.push({
                is_judge: p.is_judge,
                hearing_role_name: p.hearing_role_name,
                first_name: p.first_name,
                case_role_name: p.case_role_name,
                email: p.email,
                interpreterFor: p.interpreterFor
            });
        });

        component.ngOnInit();

        const expectedResult: ParticipantModel[] = [];
        expectedResult.push({
            is_judge: true,
            case_role_name: null,
            email: undefined,
            hearing_role_name: 'Judge',
            first_name: 'L',
            interpreterFor: undefined
        });
        expectedResult.push({
            is_judge: false,
            case_role_name: 'None',
            email: undefined,
            hearing_role_name: 'Panel Member',
            first_name: 'H',
            interpreterFor: undefined
        });
        expectedResult.push({
            is_judge: false,
            case_role_name: 'None',
            email: undefined,
            hearing_role_name: 'Winger',
            first_name: 'J',
            interpreterFor: undefined
        });
        expectedResult.push({
            is_judge: false,
            case_role_name: 'Winger',
            email: undefined,
            hearing_role_name: 'None',
            first_name: 'K',
            interpreterFor: undefined
        });
        expectedResult.push({
            is_judge: false,
            case_role_name: null,
            email: undefined,
            hearing_role_name: 'Staff Member',
            first_name: 'I',
            interpreterFor: undefined
        });
        expectedResult.push({
            is_judge: false,
            case_role_name: 'Appellant',
            email: undefined,
            hearing_role_name: 'Litigant in Person',
            first_name: 'A',
            interpreterFor: undefined
        });
        expectedResult.push({
            is_judge: false,
            case_role_name: 'Appellant',
            email: 'interpretees@email.co.uk',
            hearing_role_name: 'Litigant in Person',
            first_name: 'C',
            is_interpretee: true,
            interpreterFor: undefined
        });
        expectedResult.push({
            is_judge: false,
            case_role_name: 'None',
            email: undefined,
            hearing_role_name: 'Interpreter',
            first_name: 'A',
            interpreterFor: 'interpretees@email.co.uk',
            interpretee_name: undefined
        });
        expectedResult.push({
            is_judge: false,
            case_role_name: 'Appellant',
            email: undefined,
            hearing_role_name: 'Litigant in Person',
            first_name: 'D',
            interpreterFor: undefined
        });
        expectedResult.push({
            is_judge: false,
            case_role_name: 'Appellant',
            email: undefined,
            hearing_role_name: 'Litigant in Person',
            first_name: 'F',
            interpreterFor: undefined
        });
        expectedResult.push({
            is_judge: false,
            case_role_name: 'None',
            email: undefined,
            hearing_role_name: 'Litigant in Person',
            first_name: 'B',
            interpreterFor: undefined
        });
        expectedResult.push({
            is_judge: false,
            case_role_name: 'None',
            email: undefined,
            hearing_role_name: 'Litigant in Person',
            first_name: 'E',
            interpreterFor: undefined
        });
        expectedResult.push({
            is_judge: false,
            case_role_name: 'None',
            email: undefined,
            hearing_role_name: 'Observer',
            first_name: 'G',
            interpreterFor: undefined
        });
        expectedResult.push({
            is_judge: false,
            case_role_name: 'Observer',
            email: undefined,
            hearing_role_name: 'new observer type',
            first_name: 'M',
            interpreterFor: undefined
        });

        for (let i = 0; i < expectedResult.length; i++) {
            expect(component.sortedParticipants[i]).toEqual(expectedResult[i]);
        }
    });

    describe('ngDoCheck', () => {
        const linked_participantList: LinkedParticipantModel[] = [];
        const linked_participant = new LinkedParticipantModel();
        linked_participant.linkType = LinkedParticipantType.Interpreter;
        linked_participant.linkedParticipantId = '7';
        linked_participantList.push(linked_participant);

        const linked_participantList1: LinkedParticipantModel[] = [];
        const linked_participant1 = new LinkedParticipantModel();
        linked_participant1.linkType = LinkedParticipantType.Interpreter;
        linked_participant1.linkedParticipantId = '9';
        linked_participantList1.push(linked_participant1);

        const participantsArr = [
            { is_judge: true, hearing_role_name: 'Judge', display_name: 'Judge1', linked_participants: null },
            { is_judge: true, hearing_role_name: 'Judge', display_name: 'Judge2', linked_participants: null },
            { is_judge: false, hearing_role_name: 'Winger', display_name: 'Winger1', linked_participants: null },
            { is_judge: false, hearing_role_name: 'Winger', display_name: 'Winger2', linked_participants: null },
            { is_judge: false, hearing_role_name: 'Staff Member', display_name: 'Staff Member', linked_participants: null },
            { is_judge: false, hearing_role_name: 'Panel Member', display_name: 'Panel Member', linked_participants: null },
            { is_judge: false, hearing_role_name: 'Observer', display_name: 'Observer', linked_participants: null },
            {
                is_judge: false,
                hearing_role_name: 'Litigant in Person',
                display_name: 'Litigant in Person1',
                linked_participants: linked_participantList1,
                id: '7'
            },
            { is_judge: false, hearing_role_name: 'Litigant in Person', display_name: 'Litigant in Person2', linked_participants: null },
            { is_judge: false, hearing_role_name: 'Litigant in Person', display_name: 'Litigant in Person3', linked_participants: null },
            {
                is_judge: false,
                hearing_role_name: 'Interpreter',
                display_name: 'Interpreter1',
                linked_participants: linked_participantList,
                id: '9'
            }
        ];

        beforeEach(() => {
            // Arrange
            component.hearing.participants = participantsArr.slice();
            component.sortedParticipants = participantsArr.slice();

            component.ngOnInit();

            spyOn(component, 'sortParticipants');
        });

        it('should detect participant added to hearing.participants', () => {
            // Act
            component.hearing.participants.push({ is_judge: false, hearing_role_name: 'Winger', display_name: 'Winger3' });
            component.ngDoCheck();

            // Assert
            expect(component.sortParticipants).toHaveBeenCalledTimes(1);
        });

        it('should detect participant removed from hearing.participants', () => {
            // Act
            component.hearing.participants.splice(2, 1);
            component.ngDoCheck();

            // Assert
            expect(component.sortParticipants).toHaveBeenCalledTimes(1);
        });

        it('should do nothing when no participant was added or removed from hearing.participants', () => {
            // Act
            component.ngDoCheck();

            // Assert
            expect(component.sortParticipants).not.toHaveBeenCalled();
        });
    });

    it('should produce a sorted list with no duplicates for a new interpreter', () => {
        const linked_participantList1: LinkedParticipantModel[] = [];
        const linked_participant1 = new LinkedParticipantModel();
        linked_participant1.linkType = LinkedParticipantType.Interpreter;
        linked_participant1.linkedParticipantId = '9';
        linked_participantList1.push(linked_participant1);
        const participantsArr = [
            { is_judge: true, hearing_role_name: 'Judge', display_name: 'Judge1', interpreterFor: '', email: 'judge@hmcts.net' },
            {
                is_judge: false,
                hearing_role_name: 'Litigant in Person',
                display_name: 'Litigant in Person1',
                interpreterFor: '',
                email: 'litigantperson1@hmcts.net'
            },
            {
                is_judge: false,
                hearing_role_name: 'Interpreter',
                display_name: 'Interpreter1',
                interpreterFor: 'litigantperson1@hmcts.net',
                email: 'interpreter@hmcts.net'
            }
        ];
        if (!component.hearing.participants) {
            component.hearing.participants = [];
        }
        participantsArr.forEach((p, i) => {
            component.hearing.participants.push({
                is_exist_person: true,
                is_judge: p.is_judge,
                hearing_role_name: p.hearing_role_name,
                display_name: p.display_name,
                interpreterFor: p.interpreterFor,
                email: p.email,
                id: `${i + 1},`,
                is_courtroom_account: false
            });
        });
        component.ngOnInit();

        expect(component.sortedParticipants.length).toBe(3);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Judge').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Litigant in Person').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Interpreter').length).toBe(1);
    });
});
