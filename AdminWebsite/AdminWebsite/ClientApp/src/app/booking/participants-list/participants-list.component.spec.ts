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
        const pat1 = new ParticipantModel();
        pat1.title = 'Mr';
        pat1.first_name = 'Oliver';
        pat1.last_name = 'Stone';
        pat1.hearing_role_name = 'Litigant in Person';
        pat1.email = 'oliver.stone@email.com';
        const pat2 = new ParticipantModel();
        pat2.title = 'Mr';
        pat2.first_name = 'Oliver';
        pat2.last_name = 'Styx';
        pat2.hearing_role_name = 'Interpreter';
        pat2.interpreterFor = 'oliver.stone@email.com';
        const participants: ParticipantModel[] = [pat1, pat2];
        component.ngOnInit();
        component.participants = participants;

        const participantModel = new ParticipantModel();
        participantModel.title = 'Mrs';
        participantModel.first_name = 'Sam';
        participantModel.hearing_role_name = 'Litigant in Person';
        participantModel.email = 'oliver.stone@email.com';
        const ret = component.isInterpretee(participantModel);
        expect(ret).toBe(true);
    });
    it('should return true if the participant is an interpretee in edit', () => {
        const _participants: ParticipantModel[] = [];
        const linkedParticipants: LinkedParticipantModel[] = [];
        let linkedParticipant = new LinkedParticipantModel();
        linkedParticipant.linkType = LinkedParticipantType.Interpreter;
        linkedParticipant.linkedParticipantId = '200';
        linkedParticipants.push(linkedParticipant);

        let participant = new ParticipantModel();
        participant.id = '100';
        participant.title = 'Mr';
        participant.first_name = 'Oliver';
        participant.last_name = 'Stone';
        participant.hearing_role_name = 'Litigant in Person';
        participant.email = 'oliver.stone@email.com';
        participant.linked_participants = linkedParticipants;
        _participants.push(participant);

        linkedParticipant = new LinkedParticipantModel();
        linkedParticipant.linkType = LinkedParticipantType.Interpreter;
        linkedParticipant.linkedParticipantId = '100';
        linkedParticipants.push(linkedParticipant);

        participant = new ParticipantModel();
        participant.id = '200';
        participant.title = 'Mr';
        participant.first_name = 'Oliver';
        participant.last_name = 'Styx';
        participant.hearing_role_name = 'Styx';
        participant.email = 'oliver.styx@email.com';
        participant.linked_participants = linkedParticipants;
        _participants.push(participant);

        component.ngOnInit();
        component.isEditMode = true;
        component.participants = _participants;

        const participantModel = new ParticipantModel();
        participant.id = '100';
        participantModel.title = 'Mrs';
        participantModel.first_name = 'Sam';
        participantModel.hearing_role_name = 'Litigant in Person';
        participantModel.email = 'oliver.stone@email.com';
        const ret = component.isInterpretee(participantModel);
        expect(ret).toBe(true);
    });
    it('should return the display name of the interpretee linked to the interpreter', () => {
        const pat1 = new ParticipantModel();
        pat1.title = 'Mr';
        pat1.first_name = 'Oliver';
        pat1.last_name = 'Stone';
        pat1.hearing_role_name = 'Litigant in Person';
        pat1.email = 'oliver.stone@email.com';
        pat1.display_name = 'Oliver Stone';
        const pat2 = new ParticipantModel();
        pat2.title = 'Mr';
        pat2.first_name = 'Oliver';
        pat2.last_name = 'Styx';
        pat2.hearing_role_name = 'Interpreter';
        pat2.interpreterFor = 'oliver.stone@email.com';
        pat2.display_name = 'Oliver Styx';
        const participants: ParticipantModel[] = [pat1, pat2];
        component.ngOnInit();
        component.participants = participants;

        const participantModel = new ParticipantModel();
        participantModel.title = 'Mr';
        participantModel.first_name = 'Oliver';
        participantModel.last_name = 'Styx';
        participantModel.hearing_role_name = 'Interpreter';
        participantModel.interpreterFor = 'oliver.stone@email.com';

        const ret = component.getInterpreteeDisplayName(participantModel);
        expect(ret).toBe('Oliver Stone');
    });
});
