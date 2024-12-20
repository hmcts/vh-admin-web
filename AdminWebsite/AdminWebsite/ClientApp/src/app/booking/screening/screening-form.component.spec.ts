import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreeningFormComponent as ScreeningFormComponent } from './screening-form.component';
import { Logger } from 'src/app/services/logger';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { VHParticipant } from 'src/app/common/model/vh-participant';

describe('ScreeningFormComponent', () => {
    let component: ScreeningFormComponent;
    let fixture: ComponentFixture<ScreeningFormComponent>;
    let loggerSpy: jasmine.SpyObj<Logger>;
    let hearing: VHBooking;

    beforeEach(async () => {
        hearing = new VHBooking();
        const participant1 = new VHParticipant();
        participant1.id = '1';
        participant1.email = 'email1';
        participant1.display_Name = 'Participant1';

        const participant2 = new VHParticipant();
        participant2.id = '2';
        participant2.email = 'email2';
        participant2.display_Name = 'Participant2';

        const endpoint1 = new EndpointModel(null);
        endpoint1.id = '3';
        endpoint1.displayName = 'Endpoint 1';
        endpoint1.sip = 'sip1';

        const endpoint2 = new EndpointModel(null);
        endpoint2.id = '4';
        endpoint2.displayName = 'Endpoint 2';
        endpoint2.sip = 'sip2';

        hearing.participants = [participant1, participant2];
        hearing.endpoints = [endpoint1, endpoint2];
        hearing.hearingId = null; //new hearing

        loggerSpy = jasmine.createSpyObj('Logger', ['debug']);
        await TestBed.configureTestingModule({
            declarations: [ScreeningFormComponent],
            providers: [{ provide: Logger, useValue: loggerSpy }, FormBuilder],
            imports: [ReactiveFormsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(ScreeningFormComponent);
        component = fixture.componentInstance;
        component.hearing = hearing;
        fixture.detectChanges();
        component.newParticipantRemovedFromOptions = false;
    });

    it('init component from input on create', () => {
        expect(component).toBeTruthy();

        expect(component.isEditMode).toBeFalse();
        expect(component.allParticipants.length).toBe(4);
        expect(component.allParticipants[0].displayName).toBe('Participant1');
        expect(component.allParticipants[1].displayName).toBe('Participant2');
        expect(component.allParticipants[2].displayName).toBe('Endpoint 1');
        expect(component.allParticipants[3].displayName).toBe('Endpoint 2');
    });

    describe('on displayName value change', () => {
        it('should clear availableProtectParticipantFromList and displayMeasureType when value is null', () => {
            // Arrange
            component.form.controls.displayName.setValue('null');

            // Act
            component.form.controls.displayName.setValue(null);

            // Assert
            expect(component.availableProtectParticipantFromList.length).toBe(0);
            expect(component.displayMeasureType).toBeFalse();
        });

        it('should call onParticipantSelected when value is not null', () => {
            component.form.controls.displayName.setValue('Participant1');

            // Assert
            expect(component.displayMeasureType).toBeFalse();
        });

        it('should display protectFromList when participant is selected', () => {
            // Arrange
            spyOn(component.screeningSaved, 'emit');
            component.form.controls.displayName.setValue('Participant1');
            component.form.controls.measureType.setValue('Specific');

            const entity1 = component.availableProtectParticipantFromList[0];
            const entity2 = component.availableProtectParticipantFromList[1];

            // Assert
            expect(component.displayProtectFromList).toBeTrue();
            expect(component.availableProtectParticipantFromList.length).toBe(3);
            expect(component.availableProtectParticipantFromList.includes(component.allParticipants[0])).toBeFalse();
            expect(component.selectedProtectParticipantFromList.length).toBe(0);

            // Act
            component.selectedProtectParticipantFromList = [
                component.availableProtectParticipantFromList[0],
                component.availableProtectParticipantFromList[1]
            ];

            component.onSave();

            // Assert
            expect(component.screeningSaved.emit).toHaveBeenCalledWith({
                participantDisplayName: 'Participant1',
                measureType: 'Specific',
                protectFrom: [{ externalReferenceId: entity1.externalReferenceId }, { externalReferenceId: entity2.externalReferenceId }]
            });

            expect(component.displayMeasureType).toBeFalse();
            expect(component.displayProtectFromList).toBeFalse();
        });
    });

    describe('filtering selectable participants for screening', () => {
        it('should exclude newly added participants from screening options', () => {
            // Arrange
            hearing.hearingId = '1'; // isEditMode = true
            const newlyAddedParticipant = hearing.participants[0];
            const newlyAddedEndpoint = hearing.endpoints[0];
            newlyAddedParticipant.id = undefined;
            newlyAddedEndpoint.id = undefined;

            // Act
            component.hearing = hearing;

            // Assert
            expect(component.isEditMode).toBeTrue();
            expect(component.allParticipants.filter(p => p.displayName === newlyAddedParticipant.display_Name)).toEqual([]);
            expect(component.allParticipants.filter(p => p.displayName === newlyAddedEndpoint.displayName)).toEqual([]);
            expect(component.allParticipants.length).toBe(2);
            expect(component.newParticipantRemovedFromOptions).toBeTrue();
        });

        it('should include existing participant in screening options', () => {
            // Arrange
            hearing.hearingId = '1'; // isEditMode = true
            // Act
            component.hearing = hearing;
            // Assert
            expect(component.isEditMode).toBeTrue();
            expect(component.allParticipants.length).toBe(4);
            expect(component.newParticipantRemovedFromOptions).toBeFalse();
        });
    });
});
