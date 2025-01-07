import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { BookingParticipantListComponent } from './booking-participant-list.component';
import { HearingRoleCodes } from '../../common/model/hearing-roles.model';
import { ParticipantDetailsComponent } from '../participant-details/participant-details.component';
import { VHParticipant } from 'src/app/common/model/vh-participant';
import { LinkedParticipantModel } from 'src/app/common/model/linked-participant.model';
import { JudicialMemberDto } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';

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
        const pr1 = VHParticipant.createForDetails(
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
        const participantsList: Array<VHParticipant> = [];
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
        const judge = new JudicialMemberDto(
            'Alan',
            'Brake',
            'Alan Brake',
            'email1@hmcts.net',
            '12345678',
            'Alan.Brake',
            false,
            'Alan Brake'
        );
        judge.roleCode = 'Judge';
        component.judiciaryParticipants = [judge];

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            const divElementRole = debugElement.queryAll(By.css('.judge-detail'));
            expect(divElementRole.length).toBeGreaterThan(0);
            expect(divElementRole.length).toBe(1);
            done();
        });
    });

    it('should produce a sorted list with specific hierarchy and grouping', done => {
        // setup
        function parseTestInput(inputParticipants) {
            const participantsArray: VHParticipant[] = [];
            inputParticipants.forEach((p, i) => {
                participantsArray.push(
                    new VHParticipant({
                        firstName: p.FirstName,
                        externalReferenceId: p.ExternalReferenceId ?? undefined,
                        hearingRoleCode: p.HearingRoleCode,
                        hearingRoleName: p.HearingRoleName,
                        linkedParticipants: p.LinkedParticipants ?? null,
                        id: `${i + 1}`,
                        company: '',
                        displayName: '',
                        email: '',
                        interpreteeName: p.Interpretee,
                        lastName: '',
                        middleNames: '',
                        phone: '',
                        representee: '',
                        title: '',
                        username: '',
                        userRoleName: '',
                        isInterpretee: false,
                        interpretation_language: null,
                        screening: null
                    })
                );
            });
            return participantsArray;
        }
        // input
        const linked_participantList1: LinkedParticipantModel[] = [];
        const linked_interpretee = new LinkedParticipantModel();
        linked_interpretee.linkedParticipantId = '2';
        linked_participantList1.push(linked_interpretee);

        const linked_participantList2: LinkedParticipantModel[] = [];
        const linked_interpreter = new LinkedParticipantModel();
        linked_interpreter.linkedParticipantId = '1';
        linked_participantList2.push(linked_interpreter);

        const participantsInputArray = [
            {
                HearingRoleName: 'Litigant in Person',
                FirstName: 'C',
                LinkedParticipants: linked_participantList1,
                Interpretee: 'interpretee'
            },
            { HearingRoleName: 'Interpreter', FirstName: 'A', LinkedParticipants: linked_participantList2 },
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
            expect(component.sortedParticipants[i].firstName).toEqual(expectedOutput[i].FirstName);
            expect(component.sortedParticipants[i].hearingRoleName).toEqual(expectedOutput[i].HearingRoleName);
        }
        done();
    });

    it('should sort judiciary participants and members', () => {
        const jp1 = new JudicialMemberDto('Alan', 'Brake', 'Alan Brake', 'email.p1@hmcts.net', '123', 'Alan.Brake', false, 'Alan Brake');
        jp1.roleCode = 'Judge';

        const jp2 = new JudicialMemberDto('John', 'Doe', 'John Doe', 'email.p2@hmcts.net', '123', 'John.Doe', false, 'John Doe');
        jp2.roleCode = 'PanelMember';

        const jp3 = new JudicialMemberDto('Jane', 'Doe', 'Jane Doe', 'email.p3@hmcts.net', '123', 'Jane.Doe', false, 'Jane Doe');
        jp3.roleCode = 'PanelMember';

        component.judiciaryParticipants = [jp1, jp2, jp3];

        expect(component.sortedJudiciaryMembers.length).toEqual(3);
        expect(component.sortedJudiciaryMembers[0]).toEqual(jp1);
        expect(component.sortedJudiciaryMembers[1]).toEqual(jp3);
        expect(component.sortedJudiciaryMembers[2]).toEqual(jp2);
    });
});
