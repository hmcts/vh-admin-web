import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';
import { ParticipantDetailsComponent } from './participant-details.component';

describe('ParticipantDetailsComponent', () => {
    let component: ParticipantDetailsComponent;
    let fixture: ComponentFixture<ParticipantDetailsComponent>;
    let debugElement: DebugElement;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [ParticipantDetailsComponent],
                imports: [RouterTestingModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantDetailsComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;
    });

    it('should display participant details', () => {
        const pr = new ParticipantDetailsModel(
            '1',
            'Mrs',
            'Alan',
            'Brake',
            'Citizen',
            'email.p1@hmcts.net',
            'email@hmcts.net',
            'Respondent',
            'Respondent LIP',
            'Alan Brake',
            '',
            'ABC Solicitors',
            'Respondent',
            '12345678'
        );
        pr.IndexInList = 0;
        component.participant = pr;

        fixture.detectChanges();
        const divElementRole = debugElement.queryAll(By.css(`#participant-${pr.ParticipantId}-hearing-role-name`));
        expect(divElementRole.length).toBeGreaterThan(0);
        expect(divElementRole.length).toBe(1);
        const el = divElementRole[0].nativeElement as HTMLElement;
        expect(el.innerHTML).toContain('Respondent');
    });
});
