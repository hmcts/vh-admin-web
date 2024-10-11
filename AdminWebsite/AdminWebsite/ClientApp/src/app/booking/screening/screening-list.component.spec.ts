import { ComponentFixture, TestBed, tick } from '@angular/core/testing';

import { ScreeningListComponent } from './screening-list.component';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { SimpleChange, SimpleChanges } from '@angular/core';

describe('ScreeningListComponent', () => {
    let component: ScreeningListComponent;
    let fixture: ComponentFixture<ScreeningListComponent>;
    let hearing: HearingModel;

    beforeEach(async () => {
        hearing = new HearingModel();
        const participantWithoutScreening = new ParticipantModel();
        participantWithoutScreening.id = '1';
        participantWithoutScreening.display_name = 'Participant No Screening';

        const participantWithScreening = new ParticipantModel();
        participantWithScreening.id = '2';
        participantWithScreening.display_name = 'Participant With Screening';
        participantWithScreening.screening = {
            measureType: 'All',
            protectFrom: []
        };
        hearing.participants = [participantWithoutScreening, participantWithScreening];

        const endpointWithoutScreening = new EndpointModel();
        endpointWithoutScreening.id = '3';
        endpointWithoutScreening.displayName = 'Endpoint No Screening';

        const endpointWithScreening = new EndpointModel();
        endpointWithScreening.id = '4';
        endpointWithScreening.displayName = 'Endpoint With Screening';
        endpointWithScreening.screening = {
            measureType: 'Specific',
            protectFrom: [{ externalReferenceId: endpointWithoutScreening.externalReferenceId }]
        };
        hearing.endpoints = [endpointWithoutScreening, endpointWithScreening];

        await TestBed.configureTestingModule({
            declarations: [ScreeningListComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ScreeningListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('ngOnChanges', () => {
        it('should populate participantsWithScreening and endpointsWithScreening when hearing is changed', () => {
            // Arrange
            const changes: SimpleChanges = {
                hearing: new SimpleChange(null, hearing, true)
            };

            // Act
            component.ngOnChanges(changes);

            // Assert
            expect(component.participantsWithScreening.length).toBe(1);
            expect(component.endpointsWithScreening.length).toBe(1);
        });
    });

    describe('onEndpointScreeningDeleted', () => {
        it('should emit deleteEndpointScreening event', () => {
            // Arrange
            const endpoint = new EndpointModel();
            spyOn(component.deleteEndpointScreening, 'emit');

            // Act
            component.onEndpointScreeningDeleted(endpoint);

            // Assert
            expect(component.deleteEndpointScreening.emit).toHaveBeenCalledWith(endpoint);
        });
    });

    describe('onParticipantScreeningDeleted', () => {
        it('should emit deleteParticipantScreening event', () => {
            // Arrange
            const participant = new ParticipantModel();
            spyOn(component.deleteParticipantScreening, 'emit');

            // Act
            component.onParticipantScreeningDeleted(participant);

            // Assert
            expect(component.deleteParticipantScreening.emit).toHaveBeenCalledWith(participant);
        });
    });
});
