import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { LinkedParticipantModel, LinkedParticipantType } from 'src/app/common/model/linked-participant.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { Logger } from 'src/app/services/logger';
import { ParticipantItemComponent } from '../item/participant-item.component';
import { ParticipantListComponent } from './participant-list.component';

const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
const router = {
    navigate: jasmine.createSpy('navigate'),
    url: '/summary'
};

describe('ParticipantListComponent', () => {
    let component: ParticipantListComponent;
    let fixture: ComponentFixture<ParticipantListComponent>;
    let debugElement: DebugElement;
    const pat1 = new ParticipantModel();
    pat1.title = 'Mrs';
    pat1.first_name = 'Sam';
    const participants: any[] = [pat1, pat1];

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [ParticipantListComponent],
                providers: [
                    { provide: Logger, useValue: loggerSpy },
                    { provide: Router, useValue: router }
                ],
                imports: [RouterTestingModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantListComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;

        fixture.detectChanges();
    });

    it('should create participants list component', () => {
        expect(component).toBeTruthy();
    });

    it('should display participants', done => {
        component.participants = participants;
        component.ngOnInit();
        fixture.whenStable().then(() => {
            fixture.detectChanges();
            const elementArray = debugElement.queryAll(By.css('app-participant-item'));
            expect(elementArray.length).toBeGreaterThan(0);
            expect(elementArray.length).toBe(2);
            done();
        });
    });
    it('previous url summary', () => {
        component.ngOnInit();
        expect(component.isSummaryPage).toBeTruthy();
        expect(component.isEditRemoveVisible).toBeTruthy();
    });
    it('should emit on remove', () => {
        spyOn(component.$selectedForRemove, 'emit');
        component.removeParticipant({ email: 'email@hmcts.net', is_exist_person: false, is_judge: false });
        expect(component.$selectedForRemove.emit).toHaveBeenCalled();
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

        participantsArr.forEach((p, i) => {
            component.participants.push({
                is_exist_person: true,
                is_judge: p.is_judge,
                hearing_role_name: p.hearing_role_name,
                display_name: p.display_name,
                linked_participants: p.linked_participant,
                id: `${i + 1}`
            });
        });

        component.ngOnInit();

        expect(component.sortedParticipants.length).toBe(10);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Judge').length).toBe(2);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Winger').length).toBe(2);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Panel Member').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Observer').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Litigant in Person').length).toBe(3);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Interpreter').length).toBe(1);
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

        participantsArr.forEach((p, i) => {
            component.participants.push({
                is_exist_person: true,
                is_judge: p.is_judge,
                hearing_role_name: p.hearing_role_name,
                display_name: p.display_name,
                interpreterFor: p.interpreterFor,
                email: p.email,
                id: `${i + 1}`
            });
        });
        component.ngOnInit();

        expect(component.sortedParticipants.length).toBe(3);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Judge').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Litigant in Person').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Interpreter').length).toBe(1);
    });
});
