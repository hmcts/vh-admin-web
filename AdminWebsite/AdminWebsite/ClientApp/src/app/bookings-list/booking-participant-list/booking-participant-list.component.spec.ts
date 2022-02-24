import { Component, DebugElement, Input } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';
import { BookingParticipantListComponent } from './booking-participant-list.component';
import { HearingRoles } from '../../common/model/hearing-roles.model';
import { LinkedParticipant } from '../../services/clients/api-client';

@Component({
    selector: 'app-booking-participant-details',
    template: ''
})
class ParticipantDetailsMockComponent {
    @Input() participant: ParticipantDetailsModel = null;

    @Input() vh_officer_admin: boolean;
}

describe('BookingParticipantListComponent', () => {
    let component: BookingParticipantListComponent;
    let fixture: ComponentFixture<BookingParticipantListComponent>;
    let debugElement: DebugElement;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [BookingParticipantListComponent, ParticipantDetailsMockComponent],
                imports: [RouterTestingModule]
            }).compileComponents();
        })
    );

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
            'Mrs',
            'Alan',
            'Brake',
            'Citizen',
            'email.p1@hmcts.net',
            'email1@hmcts.net',
            'Respondent',
            'Litigant in person',
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
            'Mrs',
            'Alan',
            'Brake',
            'Judge',
            'email.p1@hmcts.net',
            'email1@hmcts.net',
            'Judge',
            'Judge',
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
                    isJudge: p.isJudge ?? false,
                    HearingRoleName: p.HearingRoleName,
                    CaseRoleName: p.CaseRoleName,
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
                    showCaseRole(): boolean {
                        return false;
                    }
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
                CaseRoleName: 'Appellant',
                HearingRoleName: 'Litigant in Person',
                FirstName: 'C',
                LinkedParticipants: linked_participantList1,
                Interpretee: 'interpretee'
            },
            { CaseRoleName: 'None', HearingRoleName: 'Interpreter', FirstName: 'A', LinkedParticipants: linked_participantList2 },
            { isJudge: true, CaseRoleName: null, HearingRoleName: 'Judge', FirstName: 'L' },
            { CaseRoleName: 'Winger', HearingRoleName: 'None', FirstName: 'K' },
            { CaseRoleName: 'None', HearingRoleName: 'Winger', FirstName: 'J' },
            { CaseRoleName: null, HearingRoleName: 'Staff Member', FirstName: 'I' },
            { CaseRoleName: 'None', HearingRoleName: 'Panel Member', FirstName: 'H' },
            { CaseRoleName: 'None', HearingRoleName: 'Observer', FirstName: 'G' },
            { CaseRoleName: 'Appellant', HearingRoleName: 'Litigant in Person', FirstName: 'F' },
            { CaseRoleName: 'None', HearingRoleName: 'Litigant in Person', FirstName: 'E' },
            { CaseRoleName: 'Appellant', HearingRoleName: 'Litigant in Person', FirstName: 'D' },
            { CaseRoleName: 'None', HearingRoleName: 'Litigant in Person', FirstName: 'B' },
            { CaseRoleName: 'Appellant', HearingRoleName: 'Litigant in Person', FirstName: 'A' },
            { CaseRoleName: 'Observer', HearingRoleName: 'new observer type', FirstName: 'M' }
        ];
        component.participants = parseTestInput(participantsInputArray);
        // expected output
        const expectedOutput = [
            { CaseRoleName: null, HearingRoleName: 'Judge', FirstName: 'L' },
            { CaseRoleName: 'None', HearingRoleName: 'Panel Member', FirstName: 'H' },
            { CaseRoleName: 'None', HearingRoleName: 'Winger', FirstName: 'J' },
            { CaseRoleName: 'Winger', HearingRoleName: 'None', FirstName: 'K' },
            { CaseRoleName: null, HearingRoleName: 'Staff Member', FirstName: 'I' },
            { CaseRoleName: 'Appellant', HearingRoleName: 'Litigant in Person', FirstName: 'A' },
            { CaseRoleName: 'Appellant', HearingRoleName: 'Litigant in Person', FirstName: 'C' },
            { CaseRoleName: 'None', HearingRoleName: 'Interpreter', FirstName: 'A' },
            { CaseRoleName: 'Appellant', HearingRoleName: 'Litigant in Person', FirstName: 'D' },
            { CaseRoleName: 'Appellant', HearingRoleName: 'Litigant in Person', FirstName: 'F' },
            { CaseRoleName: 'None', HearingRoleName: 'Litigant in Person', FirstName: 'B' },
            { CaseRoleName: 'None', HearingRoleName: 'Litigant in Person', FirstName: 'E' },
            { CaseRoleName: 'None', HearingRoleName: 'Observer', FirstName: 'G' },
            { CaseRoleName: 'Observer', HearingRoleName: 'new observer type', FirstName: 'M' }
        ];

        for (let i = 0; i < expectedOutput.length; i++) {
            expect(component.sortedParticipants[i].FirstName).toEqual(expectedOutput[i].FirstName);
            expect(component.sortedParticipants[i].CaseRoleName).toEqual(expectedOutput[i].CaseRoleName);
            expect(component.sortedParticipants[i].HearingRoleName).toEqual(expectedOutput[i].HearingRoleName);
        }
        done();
    });
});
