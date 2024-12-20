import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { LinkedParticipantModel, LinkedParticipantType } from 'src/app/common/model/linked-participant.model';
import { Logger } from 'src/app/services/logger';
import { ParticipantListComponent } from './participant-list.component';
import { ParticipantItemComponent } from '../item/participant-item.component';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { JudicialMemberDto } from '../../judicial-office-holders/models/add-judicial-member.model';
import { HearingRoleCodes } from 'src/app/common/model/hearing-roles.model';
import { FeatureFlags, LaunchDarklyService } from '../../../services/launch-darkly.service';
import { of } from 'rxjs';
import { InterpreterSelectedDto } from '../../interpreter-form/interpreter-selected.model';
import { VideoSupplier } from 'src/app/services/clients/api-client';
import { VHParticipant } from 'src/app/common/model/vh-participant';
import { mapJudicialMemberDtoToVHParticipant } from 'src/app/common/model/api-contract-to-client-model-mappers';
import { VHBooking } from 'src/app/common/model/vh-booking';

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

    const pat1 = new VHParticipant();
    pat1.title = 'Mrs';
    pat1.firstName = 'Sam';
    pat1.displayName = 'Sam';
    pat1.addedDuringHearing = false;
    pat1.hearingRoleCode = HearingRoleCodes.Applicant;
    const pat2 = new VHParticipant();
    pat2.title = 'Mr';
    pat2.firstName = 'John';
    pat2.displayName = 'Doe';
    pat2.addedDuringHearing = false;
    pat2.hearingRoleCode = HearingRoleCodes.Applicant;

    const participants: any[] = [pat1, pat2];
    const ldServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);

    beforeEach(waitForAsync(() => {
        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>(['isConferenceClosed', 'isHearingAboutToStart']);
        ldServiceSpy.getFlag.withArgs(FeatureFlags.interpreterEnhancements).and.returnValue(of(false));
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
        component.hearing = new VHBooking({ updatedDate: new Date(), supplier: VideoSupplier.Kinly });
        fixture.detectChanges();
    });

    describe('ngDoCheck - sorting participants on change', () => {
        it('should call sortParticipants when participant list changes', () => {
            const sortSpy = spyOn(component, 'sortParticipants');
            component.hearing.participants = [
                new VHParticipant({ displayName: 'B', interpretation_language: undefined }),
                new VHParticipant({ displayName: 'A', interpretation_language: undefined }),
                new VHParticipant({ displayName: 'C', interpretation_language: undefined })
            ];
            component.sortedParticipants = [
                new VHParticipant({ displayName: 'A', interpretation_language: undefined }),
                new VHParticipant({ displayName: 'B', interpretation_language: undefined })
            ];
            component.ngDoCheck();
            expect(sortSpy).toHaveBeenCalled();
        });

        it('should not call sortParticipants when participant list does not change', () => {
            const sortSpy = spyOn(component, 'sortParticipants');
            component.hearing.participants = [
                new VHParticipant({ displayName: 'A', interpretation_language: undefined, externalReferenceId: '1' }),
                new VHParticipant({ displayName: 'B', interpretation_language: undefined, externalReferenceId: '2' })
            ];
            component.sortedParticipants = [
                new VHParticipant({ displayName: 'A', interpretation_language: undefined, externalReferenceId: '1' }),
                new VHParticipant({ displayName: 'B', interpretation_language: undefined, externalReferenceId: '2' })
            ];
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
            expect(component.sortedJudiciaryMembers[0].hearingRoleCode).toEqual('Judge');
            expect(component.sortedJudiciaryMembers[1].hearingRoleCode).toEqual('PanelMember');
            expect(component.sortedJudiciaryMembers[1].displayName).toEqual(johPm1.displayName);
            expect(component.sortedJudiciaryMembers[2].hearingRoleCode).toEqual('PanelMember');
            expect(component.sortedJudiciaryMembers[2].displayName).toEqual(johPm2.displayName);
        });

        it('should call sortJudiciaryMembers when interpreter language changes', () => {
            // arrange
            const oldInterpreterLanguage: InterpreterSelectedDto = {
                spokenLanguageCode: 'fr',
                interpreterRequired: true
            };
            const newInterpreterLanguage: InterpreterSelectedDto = {
                spokenLanguageCode: 'spa',
                interpreterRequired: true
            };
            const joh = new JudicialMemberDto('Test PM 1', 'User PM 1', 'Test User PM 1', 'testpm1@test.com', '1234567890', '2345', false);
            joh.roleCode = 'PanelMember';
            const existingJoh = mapJudicialMemberDtoToVHParticipant(joh, false);
            existingJoh.interpretation_language = oldInterpreterLanguage;
            const updatedJoh = joh.clone();
            updatedJoh.interpretationLanguage = newInterpreterLanguage;

            component.sortedJudiciaryMembers = [existingJoh];
            component.hearing.judiciaryParticipants = [updatedJoh];

            // act
            component.ngDoCheck();

            // assert
            expect(component.sortedJudiciaryMembers[0].interpretation_language.spokenLanguageCode).toEqual(
                newInterpreterLanguage.spokenLanguageCode
            );
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
            expect(component.sortedJudiciaryMembers[0].hearingRoleCode).toEqual('Judge');
            expect(component.sortedJudiciaryMembers[1].hearingRoleCode).toEqual('PanelMember');
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
            component.removeParticipant(
                new VHParticipant({
                    email: 'email@hmcts.net',
                    isExistPerson: false,
                    interpretation_language: undefined
                })
            );
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
            expect(component.sortedJudiciaryMembers[0].hearingRoleCode).toEqual('Judge');
            expect(component.sortedJudiciaryMembers[1].hearingRoleCode).toEqual('PanelMember');
        });

        it('should sort judiciary members with Judge at the beginning even if Judge is last in the original list', () => {
            component.hearing.judiciaryParticipants = [judge, panelMember];
            component.sortJudiciaryMembers();
            expect(component.sortedJudiciaryMembers[0].hearingRoleCode).toEqual('Judge');
            expect(component.sortedJudiciaryMembers[1].hearingRoleCode).toEqual('PanelMember');
        });

        it('should not change the order if all judiciary members are Judges', () => {
            component.hearing.judiciaryParticipants = [judge, judge];
            component.sortJudiciaryMembers();
            expect(component.sortedJudiciaryMembers[0].hearingRoleCode).toEqual('Judge');
            expect(component.sortedJudiciaryMembers[1].hearingRoleCode).toEqual('Judge');
        });

        it('should not change the order if there are no Judges', () => {
            component.hearing.judiciaryParticipants = [panelMember, panelMember];
            component.sortJudiciaryMembers();
            expect(component.sortedJudiciaryMembers[0].hearingRoleCode).toEqual('PanelMember');
            expect(component.sortedJudiciaryMembers[1].hearingRoleCode).toEqual('PanelMember');
        });
    });
});

describe('ParticipantListComponent-SortParticipants', () => {
    let component: ParticipantListComponent;
    let fixture: ComponentFixture<ParticipantListComponent>;
    let debugElement: DebugElement;

    beforeEach(waitForAsync(() => {
        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>(['isConferenceClosed', 'isHearingAboutToStart']);
        const ldServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        ldServiceSpy.getFlag.withArgs(FeatureFlags.interpreterEnhancements).and.returnValue(of(false));

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
        component.hearing = new VHBooking({ updatedDate: new Date(), supplier: VideoSupplier.Kinly });
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
            component.hearing.participants.push(
                new VHParticipant({
                    isExistPerson: true,
                    hearingRoleName: p.hearing_role_name,
                    displayName: p.display_name,
                    linkedParticipants: p.linked_participant,
                    id: `${i + 1}`,
                    isCourtroomAccount: false,
                    interpretation_language: undefined
                })
            );
        });

        component.ngOnInit();

        expect(component.sortedParticipants.length).toBe(11);
        expect(component.sortedParticipants.filter(p => p.hearingRoleName === 'Judge').length).toBe(2);
        expect(component.sortedParticipants.filter(p => p.hearingRoleName === 'Winger').length).toBe(2);
        expect(component.sortedParticipants.filter(p => p.hearingRoleName === 'Staff Member').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearingRoleName === 'Panel Member').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearingRoleName === 'Observer').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearingRoleName === 'Litigant in Person').length).toBe(3);
        expect(component.sortedParticipants.filter(p => p.hearingRoleName === 'Interpreter').length).toBe(1);
    });

    it('should produce a sorted list with specific hierarchy and grouping', () => {
        const participantsArr = [
            { hearing_role_name: 'None', first_name: 'K', external_ref_id: '1' },
            { hearing_role_name: 'Winger', first_name: 'J', external_ref_id: '2' },
            { hearing_role_name: 'Staff Member', first_name: 'I', external_ref_id: '3' },
            { hearing_role_name: 'Panel Member', first_name: 'H', external_ref_id: '4' },
            { hearing_role_name: 'Observer', first_name: 'G', external_ref_id: '5' },
            {
                hearing_role_name: 'Litigant in Person',
                first_name: 'F',
                external_ref_id: '6'
            },
            { hearing_role_name: 'Litigant in Person', first_name: 'E', external_ref_id: '7' },
            {
                hearing_role_name: 'Litigant in Person',
                first_name: 'D',
                external_ref_id: '8'
            },
            {
                email: 'interpretees@email.co.uk',
                hearing_role_name: 'Litigant in Person',
                first_name: 'C',
                external_ref_id: '9'
            },
            { hearing_role_name: 'Litigant in Person', first_name: 'B', external_ref_id: '10' },
            {
                hearing_role_name: 'Litigant in Person',
                first_name: 'A',
                external_ref_id: '11'
            },
            {
                hearing_role_name: 'Interpreter',
                first_name: 'A',
                interpreterFor: 'interpretees@email.co.uk',
                external_ref_id: '12'
            }
        ];

        if (!component.hearing.participants) {
            component.hearing.participants = [];
        }
        participantsArr.forEach((p, i) => {
            component.hearing.participants.push(
                new VHParticipant({
                    hearingRoleName: p.hearing_role_name,
                    firstName: p.first_name,
                    email: p.email,
                    interpreterFor: p.interpreterFor,
                    interpretation_language: undefined,
                    externalReferenceId: p.external_ref_id
                })
            );
        });

        component.ngOnInit();

        const expectedResult: VHParticipant[] = [];
        expectedResult.push(
            new VHParticipant({
                email: undefined,
                hearingRoleName: 'Panel Member',
                firstName: 'H',
                interpreterFor: undefined,
                interpretation_language: undefined,
                externalReferenceId: '4'
            })
        );
        expectedResult.push(
            new VHParticipant({
                email: undefined,
                hearingRoleName: 'Winger',
                firstName: 'J',
                interpreterFor: undefined,
                interpretation_language: undefined,
                externalReferenceId: '2'
            })
        );

        expectedResult.push(
            new VHParticipant({
                email: undefined,
                hearingRoleName: 'Staff Member',
                firstName: 'I',
                interpreterFor: undefined,
                interpretation_language: undefined,
                externalReferenceId: '3'
            })
        );

        expectedResult.push(
            new VHParticipant({
                email: undefined,
                hearingRoleName: 'Litigant in Person',
                firstName: 'A',
                interpreterFor: undefined,
                interpretation_language: undefined,
                externalReferenceId: '11'
            })
        );

        expectedResult.push(
            new VHParticipant({
                email: undefined,
                hearingRoleName: 'Litigant in Person',
                firstName: 'B',
                interpreterFor: undefined,
                interpretation_language: undefined,
                externalReferenceId: '10'
            })
        );

        expectedResult.push(
            new VHParticipant({
                email: 'interpretees@email.co.uk',
                hearingRoleName: 'Litigant in Person',
                firstName: 'C',
                isInterpretee: true,
                interpreterFor: undefined,
                interpretation_language: undefined,
                externalReferenceId: '9'
            })
        );
        expectedResult.push(
            new VHParticipant({
                email: undefined,
                hearingRoleName: 'Interpreter',
                firstName: 'A',
                interpreterFor: 'interpretees@email.co.uk',
                interpreteeName: undefined,
                interpretation_language: undefined,
                externalReferenceId: '12'
            })
        );

        expectedResult.push(
            new VHParticipant({
                email: undefined,
                hearingRoleName: 'Litigant in Person',
                firstName: 'D',
                interpreterFor: undefined,
                interpretation_language: undefined,
                externalReferenceId: '8'
            })
        );

        expectedResult.push(
            new VHParticipant({
                email: undefined,
                hearingRoleName: 'Litigant in Person',
                firstName: 'E',
                interpreterFor: undefined,
                interpretation_language: undefined,
                externalReferenceId: '7'
            })
        );
        expectedResult.push(
            new VHParticipant({
                email: undefined,
                hearingRoleName: 'Litigant in Person',
                firstName: 'F',
                interpreterFor: undefined,
                interpretation_language: undefined,
                externalReferenceId: '6'
            })
        );
        expectedResult.push(
            new VHParticipant({
                email: undefined,
                hearingRoleName: 'None',
                firstName: 'K',
                interpreterFor: undefined,
                interpretation_language: undefined,
                externalReferenceId: '1'
            })
        );
        expectedResult.push(
            new VHParticipant({
                email: undefined,
                hearingRoleName: 'Observer',
                firstName: 'G',
                interpreterFor: undefined,
                interpretation_language: undefined,
                externalReferenceId: '5'
            })
        );

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
            new VHParticipant({
                hearingRoleName: 'Judge',
                displayName: 'Judge1',
                linkedParticipants: null,
                interpretation_language: undefined
            }),
            new VHParticipant({
                hearingRoleName: 'Judge',
                displayName: 'Judge2',
                linkedParticipants: null,
                interpretation_language: undefined
            }),
            new VHParticipant({
                hearingRoleName: 'Winger',
                displayName: 'Winger1',
                linkedParticipants: null,
                interpretation_language: undefined
            }),
            new VHParticipant({
                hearingRoleName: 'Winger',
                displayName: 'Winger2',
                linkedParticipants: null,
                interpretation_language: undefined
            }),
            new VHParticipant({
                hearingRoleName: 'Staff Member',
                displayName: 'Staff Member',
                linkedParticipants: null,
                interpretation_language: undefined
            }),
            new VHParticipant({
                hearingRoleName: 'Panel Member',
                displayName: 'Panel Member',
                linkedParticipants: null,
                interpretation_language: undefined
            }),
            new VHParticipant({
                hearingRoleName: 'Observer',
                displayName: 'Observer',
                linkedParticipants: null,
                interpretation_language: undefined
            }),
            new VHParticipant({
                hearingRoleName: 'Litigant in Person',
                displayName: 'Litigant in Person1',
                linkedParticipants: linked_participantList1,
                id: '7',
                interpretation_language: undefined
            }),
            new VHParticipant({
                hearingRoleName: 'Litigant in Person',
                displayName: 'Litigant in Person2',
                linkedParticipants: null,
                interpretation_language: undefined
            }),
            new VHParticipant({
                hearingRoleName: 'Litigant in Person',
                displayName: 'Litigant in Person3',
                linkedParticipants: null,
                interpretation_language: undefined
            }),
            new VHParticipant({
                hearingRoleName: 'Interpreter',
                displayName: 'Interpreter1',
                linkedParticipants: linked_participantList,
                id: '9',
                interpretation_language: undefined
            })
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
            component.hearing.participants.push(
                new VHParticipant({
                    hearingRoleName: 'Winger',
                    displayName: 'Winger3',
                    interpretation_language: undefined
                })
            );
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
            component.hearing.participants.push(
                new VHParticipant({
                    isExistPerson: true,
                    hearingRoleName: p.hearing_role_name,
                    displayName: p.display_name,
                    interpreterFor: p.interpreterFor,
                    email: p.email,
                    id: `${i + 1},`,
                    isCourtroomAccount: false,
                    interpretation_language: undefined
                })
            );
        });
        component.ngOnInit();

        expect(component.sortedParticipants.length).toBe(3);
        expect(component.sortedParticipants.filter(p => p.hearingRoleName === 'Judge').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearingRoleName === 'Litigant in Person').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearingRoleName === 'Interpreter').length).toBe(1);
    });
});
