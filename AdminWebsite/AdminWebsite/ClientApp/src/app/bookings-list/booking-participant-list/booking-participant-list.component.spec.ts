import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';
import { BookingParticipantListComponent } from './booking-participant-list.component';
import { HearingRoleCodes, HearingRoles } from '../../common/model/hearing-roles.model';
import { LinkedParticipant } from '../../services/clients/api-client';
import { ParticipantDetailsComponent } from '../participant-details/participant-details.component';
import { JudiciaryParticipantDetailsModel } from 'src/app/common/model/judiciary-participant-details.model';

describe('BookingParticipantListComponent', () => {
    let component: BookingParticipantListComponent;
    let fixture: ComponentFixture<BookingParticipantListComponent>;
    let debugElement: DebugElement;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [BookingParticipantListComponent, ParticipantDetailsComponent],
            imports: [RouterTestingModule]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BookingParticipantListComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;
        fixture.detectChanges();
    });

    it('should create component', () => {
        expect(component).toBeTruthy();
    });

    it('should display participants list', done => {
        const pr1 = new ParticipantDetailsModel(
            '1',
            'externalRefId',
            'Mrs',
            'Alan',
            'Brake',
            'Citizen',
            'email.p1@hmcts.net',
            'email1@hmcts.net',
            'Litigant in person',
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
        const participantsList: Array<ParticipantDetailsModel> = [];
        participantsList.push(pr1);
        participantsList.push(pr1);
        participantsList.push(pr1);

        component.participants = participantsList;

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            const divElementRole = debugElement.queryAll(By.css('.participant-detail'));
            expect(divElementRole.length).toBeGreaterThan(0);
            expect(divElementRole.length).toBe(3);
            done();
        });
    });

    it('should display judges list', done => {
        const pr1 = new ParticipantDetailsModel(
            '1',
            'externalRefId',
            'Mrs',
            'Alan',
            'Brake',
            'Judge',
            'email.p1@hmcts.net',
            'email1@hmcts.net',
            'Judge',
            null,
            'Alan Brake',
            '',
            'ABC Solicitors',
            'Respondent',
            '12345678',
            'interpretee',
            false,
            null
        );
        const participantsList: Array<ParticipantDetailsModel> = [];
        participantsList.push(pr1);
        participantsList.push(pr1);

        component.judges = participantsList;

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            const divElementRole = debugElement.queryAll(By.css('.judge-detail'));
            expect(divElementRole.length).toBeGreaterThan(0);
            expect(divElementRole.length).toBe(2);
            done();
        });
    });

    it('should produce a sorted list with specific hierarchy and grouping', done => {
        // setup
        function parseTestInput(inputParticipants) {
            const participantsArray: ParticipantDetailsModel[] = [];
            inputParticipants.forEach((p, i) => {
                participantsArray.push({
                    FirstName: p.FirstName,
                    ExternalReferenceId: p.ExternalReferenceId ?? undefined,
                    isJudge: p.isJudge ?? false,
                    HearingRoleCode: p.HearingRoleCode,
                    HearingRoleName: p.HearingRoleName,
                    LinkedParticipants: p.LinkedParticipants ?? null,
                    ParticipantId: `${i + 1}`,
                    Company: '',
                    DisplayName: '',
                    Email: '',
                    Flag: false,
                    IndexInList: 0,
                    IsInterpretee: false,
                    Interpretee: p.Interpretee,
                    LastName: '',
                    MiddleNames: '',
                    Phone: '',
                    Representee: '',
                    Title: '',
                    UserName: '',
                    UserRoleName: '',
                    get fullName(): string {
                        return '';
                    },
                    get isInterpretee(): boolean {
                        return false;
                    },
                    get isInterpreter(): boolean {
                        return this.HearingRoleName && this.HearingRoleName.toLowerCase().trim() === HearingRoles.INTERPRETER;
                    },
                    get isRepOrInterpreter(): boolean {
                        return false;
                    },
                    get isRepresenting(): boolean {
                        return undefined;
                    },
                    InterpretationLanguage: null,
                    Screening: null
                });
            });
            return participantsArray;
        }
        // input
        const linked_participantList1: LinkedParticipant[] = [];
        const linked_interpretee = new LinkedParticipant();
        linked_interpretee.linked_id = '2';
        linked_participantList1.push(linked_interpretee);

        const linked_participantList2: LinkedParticipant[] = [];
        const linked_interpreter = new LinkedParticipant();
        linked_interpreter.linked_id = '1';
        linked_participantList2.push(linked_interpreter);

        const participantsInputArray = [
            {
                HearingRoleName: 'Litigant in Person',
                FirstName: 'C',
                LinkedParticipants: linked_participantList1,
                Interpretee: 'interpretee'
            },
            { HearingRoleName: 'Interpreter', FirstName: 'A', LinkedParticipants: linked_participantList2 },
            { isJudge: true, HearingRoleName: 'Judge', FirstName: 'L' },
            { HearingRoleName: 'Winger', FirstName: 'J' },
            { HearingRoleName: 'Staff Member', FirstName: 'I' },
            { HearingRoleName: 'Panel Member', FirstName: 'H' },
            { HearingRoleName: 'Observer', FirstName: 'G' },
            { HearingRoleName: 'Litigant in Person', FirstName: 'F' },
            { HearingRoleName: 'Litigant in Person', FirstName: 'E' },
            { HearingRoleName: 'Litigant in Person', FirstName: 'D' },
            { HearingRoleName: 'Litigant in Person', FirstName: 'B' },
            { HearingRoleName: 'Litigant in Person', FirstName: 'A' },
            { HearingRoleName: 'Other role', FirstName: 'M' }
        ];
        component.participants = parseTestInput(participantsInputArray);
        // expected output
        const expectedOutput = [
            { HearingRoleName: 'Judge', FirstName: 'L' },
            { HearingRoleName: 'Panel Member', FirstName: 'H' },
            { HearingRoleName: 'Winger', FirstName: 'J' },
            { HearingRoleName: 'Staff Member', FirstName: 'I' },
            { HearingRoleName: 'Litigant in Person', FirstName: 'A' },
            { HearingRoleName: 'Litigant in Person', FirstName: 'B' },
            { HearingRoleName: 'Litigant in Person', FirstName: 'C' },
            { HearingRoleName: 'Interpreter', FirstName: 'A' },
            { HearingRoleName: 'Litigant in Person', FirstName: 'D' },
            { HearingRoleName: 'Litigant in Person', FirstName: 'E' },
            { HearingRoleName: 'Litigant in Person', FirstName: 'F' },
            { HearingRoleName: 'Other role', FirstName: 'M' },
            { HearingRoleName: 'Observer', FirstName: 'G' }
        ];

        for (let i = 0; i < expectedOutput.length; i++) {
            expect(component.sortedParticipants[i].FirstName).toEqual(expectedOutput[i].FirstName);
            expect(component.sortedParticipants[i].HearingRoleName).toEqual(expectedOutput[i].HearingRoleName);
        }
        done();
    });

    it('should sort judiciary participants and members', () => {
        const jp1 = new JudiciaryParticipantDetailsModel(
            'Mrs',
            'Alan',
            'Brake',
            'Judge',
            'email.p1@hmcts.net',
            'email1@hmcts.net',
            'Judge',
            'Judge',
            'Alan Brake'
        );
        const jp2 = new JudiciaryParticipantDetailsModel(
            'Mr',
            'John',
            'Doe',
            'Winger',
            'email.p2@hmcts.net',
            'email2@hmcts.net',
            'Winger',
            'PanelMember',
            'John Doe'
        );
        const jp3 = new JudiciaryParticipantDetailsModel(
            'Ms',
            'Jane',
            'Doe',
            'Panel Member',
            'email.p3@hmcts.net',
            'email3@hmcts.net',
            'Panel Member',
            'PanelMember',
            'Jane Doe'
        );

        component.judiciaryParticipants = [jp1, jp2, jp3];

        expect(component.sortedJudiciaryMembers.length).toEqual(3);
        expect(component.sortedJudiciaryMembers[0]).toEqual(jp1);
        expect(component.sortedJudiciaryMembers[1]).toEqual(jp3);
        expect(component.sortedJudiciaryMembers[2]).toEqual(jp2);
    });
});
