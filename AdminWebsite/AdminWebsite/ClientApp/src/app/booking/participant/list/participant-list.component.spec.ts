import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { Logger } from 'src/app/services/logger';
import { ParticipantListComponent } from './participant-list.component';
import { ParticipantItemComponent } from '../item/participant-item.component';

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
                declarations: [ParticipantListComponent, ParticipantItemComponent],
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
        component.hearing = { updated_date: new Date(), questionnaire_not_required: true, participants };
        fixture.detectChanges();
    });

    it('should create participants list component', () => {
        expect(component).toBeTruthy();
    });

    it('should display participants', done => {
        component.hearing.participants = participants;
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
        const participantsArr = [
            { is_judge: true, hearing_role_name: 'Judge' },
            { is_judge: true, hearing_role_name: 'Judge' },
            { is_judge: false, hearing_role_name: 'Winger' },
            { is_judge: false, hearing_role_name: 'Winger' },
            { is_judge: false, hearing_role_name: 'Panel Member' },
            { is_judge: false, hearing_role_name: 'Observer' },
            { is_judge: false, hearing_role_name: 'Litigant in Person' },
            { is_judge: false, hearing_role_name: 'Litigant in Person' },
            { is_judge: false, hearing_role_name: 'Litigant in Person' },
            { is_judge: false, hearing_role_name: 'Interpreter' }
        ];

        participantsArr.forEach((p, i) => {
            component.hearing.participants.push({
                is_exist_person: true,
                is_judge: p.is_judge,
                hearing_role_name: p.hearing_role_name,
                id: `${i + 1}`
            });
        });

        component.ngOnInit();

        expect(component.sortedParticipants.length).toBe(12);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Judge').length).toBe(2);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Winger').length).toBe(2);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Panel Member').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Observer').length).toBe(1);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Litigant in Person').length).toBe(3);
        expect(component.sortedParticipants.filter(p => p.hearing_role_name === 'Interpreter').length).toBe(1);
    });
});
