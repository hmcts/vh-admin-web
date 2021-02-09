import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { LinkedParticipantModel, LinkedParticipantType } from 'src/app/common/model/linked-participant.model';
import { Logger } from 'src/app/services/logger';
import { ParticipantModel } from '../../common/model/participant.model';
import { BookingService } from '../../services/booking.service';
import { ParticipantsListComponent } from './participants-list.component';

const router = {
    navigate: jasmine.createSpy('navigate'),
    url: '/summary'
};

let bookingServiceSpy: jasmine.SpyObj<BookingService>;
const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);

describe('ParticipantsListComponent', () => {
    let component: ParticipantsListComponent;
    let fixture: ComponentFixture<ParticipantsListComponent>;
    let debugElement: DebugElement;
    bookingServiceSpy = jasmine.createSpyObj<BookingService>('BookingService', ['setEditMode', 'setParticipantEmail']);
    const pat1 = new ParticipantModel();
    pat1.title = 'Mrs';
    pat1.first_name = 'Sam';
    pat1.hearing_role_name = 'Observer';
    const pat2 = new ParticipantModel();
    pat2.title = 'Mrs';
    pat2.first_name = 'Sam';
    pat2.hearing_role_name = 'LIP';
    const participants: ParticipantModel[] = [pat1, pat1];

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [ParticipantsListComponent],
                providers: [
                    { provide: Router, useValue: router },
                    { provide: BookingService, useValue: bookingServiceSpy },
                    { provide: Logger, useValue: loggerSpy }
                ],
                imports: [RouterTestingModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantsListComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;

        fixture.detectChanges();
    });

    it('should create participants list component', () => {
        expect(component).toBeTruthy();
    });
    it('should display participants and elements of class vhlink should be found', done => {
        component.participants = participants;
        fixture.whenStable().then(() => {
            fixture.detectChanges();
            const elementArray = debugElement.queryAll(By.css('.vhlink'));
            expect(elementArray.length).toBeGreaterThan(0);
            expect(elementArray.length).toBe(4);
            done();
        });
    });
    it('previous url summary', () => {
        component.ngOnInit();
        expect(component.isSummaryPage).toBeTruthy();
        expect(component.isEditRemoveVisible).toBeTruthy();
    });
    it('should edit judge details', () => {
        component.editJudge();
        fixture.detectChanges();
        expect(bookingServiceSpy.setEditMode).toHaveBeenCalled();
    });
    it('should edit participant details', () => {
        component.editParticipant('email@aa.aa');
        fixture.detectChanges();
        expect(bookingServiceSpy.setEditMode).toHaveBeenCalled();
        expect(component.isSummaryPage).toBeTruthy();
        expect(bookingServiceSpy.setEditMode).toHaveBeenCalledWith();
        expect(router.navigate).toHaveBeenCalled();
    });
    it('should emit on remove', () => {
        spyOn(component.$selectedForRemove, 'emit');
        component.removeParticipant('email@aa.aa');
        expect(component.$selectedForRemove.emit).toHaveBeenCalled();
    });
    it('should return true if the participant is an interpreter', () => {
        component.ngOnInit();
        const participantModel = new ParticipantModel();
        participantModel.title = 'Mrs';
        participantModel.first_name = 'Sam';
        participantModel.hearing_role_name = 'Interpreter';
        const ret = component.isInterpreter(participantModel);
        expect(ret).toBe(true);
    });
    it('should return true if the participant is an representative', () => {
        component.ngOnInit();
        const participantModel = new ParticipantModel();
        participantModel.title = 'Mrs';
        participantModel.first_name = 'Sam';
        participantModel.hearing_role_name = 'Representative';
        const ret = component.isRepresentative(participantModel);
        expect(ret).toBe(true);
    });
    it('should return true if the participant is an interpretee', () => {
        const pat01 = new ParticipantModel();
        pat01.title = 'Mr';
        pat01.first_name = 'Oliver';
        pat01.last_name = 'Stone';
        pat01.hearing_role_name = 'Litigant in Person';
        pat01.email = 'oliver.stone@email.com';
        const pat02 = new ParticipantModel();
        pat02.title = 'Mr';
        pat02.first_name = 'Oliver';
        pat02.last_name = 'Styx';
        pat02.hearing_role_name = 'Interpreter';
        pat02.interpreterFor = 'oliver.stone@email.com';
        const _participants: ParticipantModel[] = [pat01, pat02];
        component.ngOnInit();
        component.participants = _participants;

        const participantModel = new ParticipantModel();
        participantModel.title = 'Mrs';
        participantModel.first_name = 'Sam';
        participantModel.hearing_role_name = 'Litigant in Person';
        participantModel.email = 'oliver.stone@email.com';
        const ret = component.isInterpretee(participantModel);
        expect(ret).toBe(true);
    });
    it('should return true if the participant is an interpretee in edit', () => {
        let linkedParticipant = new LinkedParticipantModel();
        linkedParticipant.linkType = LinkedParticipantType.Interpreter;
        linkedParticipant.linkedParticipantId = '200';
        const participant1 = new ParticipantModel();
        participant1.id = '100';
        participant1.first_name = 'Oliver';
        participant1.last_name = 'Stone';
        participant1.hearing_role_name = 'Litigant in Person';
        participant1.email = 'oliver.stone@email.com';
        const lp1: LinkedParticipantModel[] = [linkedParticipant];
        participant1.linked_participants = lp1;

        linkedParticipant = new LinkedParticipantModel();
        linkedParticipant.linkType = LinkedParticipantType.Interpreter;
        linkedParticipant.linkedParticipantId = '100';
        const participant2 = new ParticipantModel();
        participant2.id = '200';
        participant2.first_name = 'Oliver';
        participant2.last_name = 'Styx';
        participant2.hearing_role_name = 'Interpreter';
        participant2.email = 'oliver.styx@email.com';
        const lp2: LinkedParticipantModel[] = [linkedParticipant];
        participant2.linked_participants = lp2;

        const _hearparticipants: ParticipantModel[] = [participant1, participant2];
        component.ngOnInit();
        component.isEditMode = true;
        component.participants = _hearparticipants;

        const participantModel = new ParticipantModel();
        const linkedParticipant1 = new LinkedParticipantModel();
        linkedParticipant1.linkType = LinkedParticipantType.Interpreter;
        linkedParticipant1.linkedParticipantId = '100';
        const lp: LinkedParticipantModel[] = [linkedParticipant1];
        participantModel.linked_participants = lp;

        const ret = component.isInterpretee(participantModel);
        expect(ret).toBe(true);
    });
    it('should return the display name of the interpretee linked to the interpreter', () => {
        const party01 = new ParticipantModel();
        party01.title = 'Mr';
        party01.first_name = 'Oliver';
        party01.last_name = 'Stone';
        party01.hearing_role_name = 'Litigant in Person';
        party01.email = 'oliver.stone@email.com';
        party01.display_name = 'Oliver Stone';
        const party02 = new ParticipantModel();
        party02.title = 'Mr';
        party02.first_name = 'Oliver';
        party02.last_name = 'Styx';
        party02.hearing_role_name = 'Interpreter';
        party02.interpreterFor = 'oliver.stone@email.com';
        party02.display_name = 'Oliver Styx';
        const participantsModel: ParticipantModel[] = [party01, party02];
        component.ngOnInit();
        component.participants = participantsModel;

        const participantModel = new ParticipantModel();
        participantModel.title = 'Mr';
        participantModel.first_name = 'Oliver';
        participantModel.last_name = 'Styx';
        participantModel.hearing_role_name = 'Interpreter';
        participantModel.interpreterFor = 'oliver.stone@email.com';

        const ret = component.getInterpreteeDisplayName(participantModel);
        expect(ret).toBe('Oliver Stone');
    });
    it('should return the display name of the interpretee linked to the interpreter in edit', () => {
        let linkedParticipant = new LinkedParticipantModel();
        linkedParticipant.linkType = LinkedParticipantType.Interpreter;
        linkedParticipant.linkedParticipantId = '200';

        const _pat1 = new ParticipantModel();
        _pat1.id = '100';
        _pat1.title = 'Mr';
        _pat1.first_name = 'Oliver';
        _pat1.last_name = 'Stone';
        _pat1.hearing_role_name = 'Litigant in Person';
        _pat1.email = 'oliver.stone@email.com';
        _pat1.display_name = 'Oliver Stone';
        const lp1: LinkedParticipantModel[] = [linkedParticipant];
        _pat1.linked_participants = lp1;

        linkedParticipant = new LinkedParticipantModel();
        linkedParticipant.linkType = LinkedParticipantType.Interpreter;
        linkedParticipant.linkedParticipantId = '100';

        const _pat2 = new ParticipantModel();
        _pat2.id = '200';
        _pat2.title = 'Mr';
        _pat2.first_name = 'Oliver';
        _pat2.last_name = 'Styx';
        _pat2.hearing_role_name = 'Interpreter';
        _pat2.interpreterFor = 'oliver.stone@email.com';
        _pat2.email = 'oliver.styx@email.com';
        _pat2.display_name = 'Oliver Styx';
        const lp2: LinkedParticipantModel[] = [linkedParticipant];
        pat1.linked_participants = lp2;

        const _hearingParticipants: ParticipantModel[] = [_pat1, _pat2];
        component.ngOnInit();
        component.isEditMode = true;
        component.participants = _hearingParticipants;

        const participantModel = new ParticipantModel();
        const linkedParticipant1 = new LinkedParticipantModel();
        linkedParticipant1.linkType = LinkedParticipantType.Interpreter;
        linkedParticipant1.linkedParticipantId = '100';
        const lp: LinkedParticipantModel[] = [linkedParticipant1];
        participantModel.linked_participants = lp;
        participantModel.email = 'oliver.styx@email.com';
        participantModel.hearing_role_name = 'Interpreter';

        const ret = component.getInterpreteeDisplayName(participantModel);
        expect(ret).toBe('Oliver Stone');
    });
});
