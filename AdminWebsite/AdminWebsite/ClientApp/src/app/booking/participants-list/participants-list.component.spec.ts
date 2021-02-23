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

function newParticipants(): any[] {
    const participants: ParticipantModel[] = [];
    let newParticipant = new ParticipantModel();
    newParticipant.title = 'Mr.';
    newParticipant.first_name = 'John';
    newParticipant.last_name = 'Doe';
    newParticipant.display_name = 'John Doe';
    newParticipant.hearing_role_name = 'Litigant in Person';
    newParticipant.email = 'John.Doe@email.com';
    newParticipant.interpreterFor = null;
    participants.push(newParticipant);
    newParticipant = new ParticipantModel();
    newParticipant.title = 'Mr.';
    newParticipant.first_name = 'James';
    newParticipant.last_name = 'Doe';
    newParticipant.display_name = 'James Doe';
    newParticipant.hearing_role_name = 'Interpreter';
    newParticipant.email = 'James.Doe@email.com';
    newParticipant.interpreterFor = 'John.Doe@email.com';
    participants.push(newParticipant);
    return participants;
}
function interpretee(): ParticipantModel {
    const currentParticipant = new ParticipantModel();
    currentParticipant.title = 'Mr';
    currentParticipant.first_name = 'John';
    currentParticipant.last_name = 'Doe';
    currentParticipant.hearing_role_name = 'Litigant in Person';
    currentParticipant.email = 'John.Doe@email.com';
    currentParticipant.linked_participants = [];
    return currentParticipant;
}
function interpreter(): ParticipantModel {
    const currentParticipant = new ParticipantModel();
    currentParticipant.title = 'Mr';
    currentParticipant.first_name = 'James';
    currentParticipant.last_name = 'Doe';
    currentParticipant.hearing_role_name = 'Interpreter';
    currentParticipant.email = 'James.Doe@email.com';
    currentParticipant.interpreterFor = 'John.Doe@email.com';
    currentParticipant.linked_participants = [];
    return currentParticipant;
}
function existingParticipants(): any[] {
    let linkedParticipants: LinkedParticipantModel[] = [];
    const participants: ParticipantModel[] = [];

    let linkedParticipant = new LinkedParticipantModel();
    linkedParticipant.linkType = LinkedParticipantType.Interpreter;
    linkedParticipant.id = '200';
    linkedParticipants.push(linkedParticipant);

    let newParticipant = new ParticipantModel();
    newParticipant.id = '100';
    newParticipant.title = 'Mr.';
    newParticipant.first_name = 'John';
    newParticipant.last_name = 'Doe';
    newParticipant.display_name = 'John Doe';
    newParticipant.hearing_role_name = 'Litigant in Person';
    newParticipant.email = 'John.Doe@email.com';
    newParticipant.interpreterFor = null;
    newParticipant.linked_participants = linkedParticipants;
    participants.push(newParticipant);

    linkedParticipants = [];
    linkedParticipant = new LinkedParticipantModel();
    linkedParticipant.linkType = LinkedParticipantType.Interpreter;
    linkedParticipant.id = '100';
    linkedParticipants.push(linkedParticipant);

    newParticipant = new ParticipantModel();
    newParticipant.id = '200';
    newParticipant.title = 'Mr.';
    newParticipant.first_name = 'James';
    newParticipant.last_name = 'Doe';
    newParticipant.display_name = 'James Doe';
    newParticipant.hearing_role_name = 'Interpreter';
    newParticipant.email = 'James.Doe@email.com';
    newParticipant.interpreterFor = '';
    newParticipant.linked_participants = linkedParticipants;
    participants.push(newParticipant);
    return participants;
}

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
    const participants: any[] = [pat1, pat2];

    const participantModel = new ParticipantModel();
    participantModel.title = 'Mr';
    participantModel.first_name = 'John';
    participantModel.last_name = 'Doe';

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
        component.editParticipant('email@hmcts.net');
        fixture.detectChanges();
        expect(bookingServiceSpy.setEditMode).toHaveBeenCalled();
        expect(component.isSummaryPage).toBeTruthy();
        expect(bookingServiceSpy.setEditMode).toHaveBeenCalledWith();
        expect(router.navigate).toHaveBeenCalled();
    });
    it('should emit on remove', () => {
        spyOn(component.$selectedForRemove, 'emit');
        component.removeParticipant('email@hmcts.net');
        expect(component.$selectedForRemove.emit).toHaveBeenCalled();
    });
    it('should return true if the participant is an interpreter', () => {
        component.ngOnInit();
        participantModel.hearing_role_name = 'Interpreter';
        const result = component.isInterpreter(participantModel);
        expect(result).toBe(true);
    });
    it('should return true if the participant is a representative', () => {
        component.ngOnInit();
        participantModel.hearing_role_name = 'Representative';
        const result = component.isRepresentative(participantModel);
        expect(result).toBe(true);
    });
    it('should return true if the participant is an interpretee in new mode', () => {
        component.ngOnInit();
        component.participants = newParticipants();

        const currentParticipant = interpretee();
        const result = component.isInterpretee(currentParticipant);
        expect(result).toBe(true);
    });
    it('should return true if the participant is an interpretee in edit mode', () => {
        component.ngOnInit();
        component.isEditMode = true;
        component.participants = existingParticipants();

        const _linkedParticipants: LinkedParticipantModel[] = [];
        const linkedParticipant = new LinkedParticipantModel();
        linkedParticipant.linkType = LinkedParticipantType.Interpreter;
        linkedParticipant.linkedParticipantId = '200';
        _linkedParticipants.push(linkedParticipant);

        const currentParticipant = interpretee();
        currentParticipant.linked_participants = _linkedParticipants;
        const result = component.isInterpretee(currentParticipant);
        expect(result).toBe(true);
    });
    it('should return display name of the interpretee', () => {
        component.ngOnInit();
        component.participants = newParticipants();

        const currentParticipant = interpreter();
        const result = component.getInterpreteeDisplayName(currentParticipant);
        expect(result).toBe('John Doe');
    });
    it('should return display name of the interpretee in edit mode', () => {
        component.ngOnInit();
        component.participants = existingParticipants();

        const _linkedParticipants: LinkedParticipantModel[] = [];
        const linkedParticipant = new LinkedParticipantModel();
        linkedParticipant.linkType = LinkedParticipantType.Interpreter;
        linkedParticipant.linkedParticipantId = '100';
        _linkedParticipants.push(linkedParticipant);

        const currentParticipant = interpreter();
        currentParticipant.interpreterFor = '';
        currentParticipant.linked_participants = _linkedParticipants;
        const result = component.getInterpreteeDisplayName(currentParticipant);
        expect(result).toBe('John Doe');
    });
});
