import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreeningFormComponent as ScreeningFormComponent } from './screening-form.component';
import { Logger } from 'src/app/services/logger';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';

describe('ScreeningFormComponent', () => {
    let component: ScreeningFormComponent;
    let fixture: ComponentFixture<ScreeningFormComponent>;
    let loggerSpy: jasmine.SpyObj<Logger>;
    let hearing: HearingModel;

    beforeEach(async () => {
        hearing = new HearingModel();
        const participant1 = new ParticipantModel();
        participant1.id = '1';
        participant1.email = 'email1';
        participant1.display_name = 'Participant1';

        const participant2 = new ParticipantModel();
        participant2.id = '2';
        participant2.email = 'email2';
        participant2.display_name = 'Participant2';

        const endpoint1 = new EndpointModel();
        endpoint1.id = '3';
        endpoint1.displayName = 'Endpoint 1';

        const endpoint2 = new EndpointModel();
        endpoint2.id = '4';
        endpoint2.displayName = 'Endpoint 2';

        hearing.participants = [participant1, participant2];
        hearing.endpoints = [endpoint1, endpoint2];

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
    });

    it('init component from input on create', () => {
        expect(component).toBeTruthy();

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
            expect(component.displayMeasureType).toBeTrue();
        });
    });

    describe('on measureType value change and then save', () => {
        it('should not display protectFromList when value is All', () => {
            // Arrange
            spyOn(component.screeningSaved, 'emit');
            component.form.controls.displayName.setValue('Participant1');
            component.form.controls.measureType.setValue('All');

            // Assert
            expect(component.displayProtectFromList).toBeFalse();

            // Act
            component.onSave();

            // Assert
            expect(component.screeningSaved.emit).toHaveBeenCalledWith({
                participantDisplayName: 'Participant1',
                measureType: 'All',
                protectFrom: []
            });

            expect(component.selectedProtectParticipantFromList).toEqual([]);
            expect(component.displayMeasureType).toBeFalse();
            expect(component.displayProtectFromList).toBeFalse();
        });

        it('should display protectFromList when value is Specific', () => {
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
});
