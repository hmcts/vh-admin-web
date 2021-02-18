import { Component, DebugElement, Input } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';
import { BookingParticipantListComponent } from './booking-participant-list.component';

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
            '12345678'
        );
        const participantsList: Array<ParticipantDetailsModel> = [];
        participantsList.push(pr1);
        participantsList.push(pr1);
        participantsList.push(pr1);

        component.participants = participantsList;

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            const divElementRole = debugElement.queryAll(By.css('#participants-list > div'));
            expect(divElementRole.length).toBeGreaterThan(0);
            expect(divElementRole.length).toBe(3);
            done();
        });
    });
    it('should detect last item in the participants list', done => {
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
            '12345678'
        );
        const participantsList: Array<ParticipantDetailsModel> = [];
        participantsList.push(pr1);
        participantsList.push(pr1);
        participantsList.push(pr1);

        component.participants = participantsList;

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            expect(component.participants[2].Flag).toBeTruthy();
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
            '12345678'
        );
        const participantsList: Array<ParticipantDetailsModel> = [];
        participantsList.push(pr1);
        participantsList.push(pr1);

        component.judges = participantsList;

        fixture.whenStable().then(() => {
            fixture.detectChanges();
            const divElementRole = debugElement.queryAll(By.css('#judges-list > div'));
            expect(divElementRole.length).toBeGreaterThan(0);
            expect(divElementRole.length).toBe(2);
            done();
        });
    });
});
