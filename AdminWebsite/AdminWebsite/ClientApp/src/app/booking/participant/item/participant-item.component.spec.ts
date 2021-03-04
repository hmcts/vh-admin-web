import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { ParticipantListComponent } from '../list/participant-list.component';
import { ParticipantItemComponent } from './participant-item.component';

const router = {
    navigate: jasmine.createSpy('navigate'),
    url: '/summary'
};

const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
let bookingServiceSpy: jasmine.SpyObj<BookingService>;

describe('ParticipantItemComponent', () => {
    let component: ParticipantItemComponent;
    let fixture: ComponentFixture<ParticipantItemComponent>;
    let debugElement: DebugElement;

    bookingServiceSpy = jasmine.createSpyObj<BookingService>('BookingService', ['setEditMode', 'setParticipantEmail']);

    const participant: any = {
        title: 'Mrs',
        first_name: 'Sam'
    };

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [ParticipantItemComponent],
                providers: [
                    { provide: Router, useValue: router },
                    { provide: Logger, useValue: loggerSpy },
                    { provide: BookingService, useValue: bookingServiceSpy },
                    { provide: Router, useValue: router }
                ],
                imports: [RouterTestingModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantItemComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;
        const other_information = { judgeEmail: 'James.Doe@email.com', judgePhone: '123456789' };
        component.hearing = {
            updated_date: new Date(),
            questionnaire_not_required: true,
            other_information: JSON.stringify(other_information)
        };

        fixture.detectChanges();
    });

    it('should create participants list component', () => {
        expect(component).toBeTruthy();
    });

    it('should edit judge details', () => {
        component.editJudge();
        fixture.detectChanges();
        expect(bookingServiceSpy.setEditMode).toHaveBeenCalled();
    });

    it('should edit participant details', () => {
        component.isSummaryPage = true;
        component.editParticipant({ email: 'email@hmcts.net', is_exist_person: false, is_judge: false });
        fixture.detectChanges();
        expect(bookingServiceSpy.setEditMode).toHaveBeenCalled();
        expect(bookingServiceSpy.setEditMode).toHaveBeenCalledWith();
        expect(router.navigate).toHaveBeenCalled();
    });

    it('should return true if participant has a representative', () => {
        component.participant = { representee: 'rep', is_judge: false, is_exist_person: false };
        fixture.detectChanges();
        expect(component.isRepresentative).toBeTruthy();
    });

    it('should return true if participant is a judge', () => {
        participant.is_judge = true;
        participant.is_exist_person = true;
        component.participant = participant;
        fixture.detectChanges();
        expect(component.isJudge).toBeTruthy();
    });

    it('should return false if participant`s case role is None', () => {
        component.participant = { case_role_name: 'None', is_judge: true, is_exist_person: false };
        fixture.detectChanges();
        expect(component.hasCaseRole).toBeFalsy();
    });

    it('should return true if participant is an observer', () => {
        component.participant = { hearing_role_name: 'Observer', is_judge: true, is_exist_person: false };
        fixture.detectChanges();
        expect(component.isObserverOrPanelMember).toBeTruthy();
    });

    it('should return true if participant is a panel member', () => {
        component.participant = { hearing_role_name: 'Panel Member', is_judge: true, is_exist_person: false };
        fixture.detectChanges();
        expect(component.isObserverOrPanelMember).toBeTruthy();
    });

    it('should return true if participant has a case role and is not a Panel Member', () => {
        component.participant = { hearing_role_name: 'Judge', case_role_name: 'Judge', is_judge: true, is_exist_person: false };
        fixture.detectChanges();
        expect(component.displayCaseRole).toBeTruthy();
    });
    it('should get judge email', () => {
        component.participant = { hearing_role_name: 'Judge', case_role_name: 'Judge', is_judge: true, is_exist_person: false };
        const email = component.getJudgeEmail(component.participant);
        expect(email).toBe('James.Doe@email.com');
    });
    it('should get judge phone', () => {
        component.participant = { hearing_role_name: 'Judge', case_role_name: 'Judge', is_judge: true, is_exist_person: false };
        const phone = component.getJudgePhone(component.participant);
        expect(phone).toBe('123456789');
    });

    it('should return true if participant is an interpreter', () => {
        component.participant = { hearing_role_name: 'Interpreter', is_judge: true, is_exist_person: false };
        fixture.detectChanges();
        expect(component.isInterpreter).toBeTruthy();
    });
});
