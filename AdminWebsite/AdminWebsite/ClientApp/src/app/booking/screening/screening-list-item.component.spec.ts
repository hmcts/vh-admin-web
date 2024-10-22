import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreeningListItemComponent } from './screening-list-item.component';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { HearingModel } from 'src/app/common/model/hearing.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';
import { SimpleChange, SimpleChanges } from '@angular/core';

describe('ScreeningListItemComponent', () => {
    let component: ScreeningListItemComponent;
    let fixture: ComponentFixture<ScreeningListItemComponent>;
    let hearing: HearingModel;

    beforeEach(async () => {
        hearing = new HearingModel();
        const participantWithoutScreening = new ParticipantModel();
        participantWithoutScreening.id = '1';
        participantWithoutScreening.display_name = 'Participant No Screening';
        participantWithoutScreening.email = 'email1@partipant.com';

        const participantWithScreening = new ParticipantModel();
        participantWithScreening.id = '2';
        participantWithScreening.display_name = 'Participant With Screening';
        participantWithScreening.email = 'email2@partipant.com';
        participantWithScreening.screening = {
            measureType: 'All',
            protectFrom: []
        };
        hearing.participants = [participantWithoutScreening, participantWithScreening];

        const endpointWithoutScreening = new EndpointModel(null);
        endpointWithoutScreening.id = '3';
        endpointWithoutScreening.displayName = 'Endpoint No Screening';

        const endpointWithScreening = new EndpointModel(null);
        endpointWithScreening.id = '4';
        endpointWithScreening.displayName = 'Endpoint With Screening';
        endpointWithScreening.screening = {
            measureType: 'Specific',
            protectFrom: [
                {
                    externalReferenceId: endpointWithoutScreening.externalReferenceId
                },
                {
                    externalReferenceId: participantWithoutScreening.externalReferenceId
                }
            ]
        };
        hearing.endpoints = [endpointWithoutScreening, endpointWithScreening];

        await TestBed.configureTestingModule({
            declarations: [ScreeningListItemComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ScreeningListItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('ngOnChanges', () => {
        it('should init model for a partipant', () => {
            // Arrange
            component.hearing = hearing;
            component.participant = hearing.participants[1];
            const changes: SimpleChanges = {
                hearing: new SimpleChange(null, hearing, true),
                participant: new SimpleChange(null, hearing.participants[1], true)
            };

            // Act
            component.ngOnChanges(changes);

            // Assert

            expect(component.model.displayName).toBe('Participant With Screening');
            expect(component.model.measureType).toBe('All');
            expect(component.model.protectFrom.length).toBe(0);
        });

        it('should init model for an endpoint', () => {
            // Arrange
            component.hearing = hearing;
            component.endpoint = hearing.endpoints[1];
            const changes: SimpleChanges = {
                hearing: new SimpleChange(null, hearing, true),
                endpoint: new SimpleChange(null, hearing.endpoints[1], true)
            };

            // Act
            component.ngOnChanges(changes);

            // Assert

            expect(component.model.displayName).toBe('Endpoint With Screening');
            expect(component.model.measureType).toBe('Specific');
            expect(component.model.protectFrom.length).toBe(2);
            expect(component.model.protectFrom[0].displayName).toBe('Endpoint No Screening');
            expect(component.model.protectFrom[1].displayName).toBe('Participant No Screening');
        });
    });

    describe('delete', () => {
        it('should emit deleteScreening event', () => {
            // Arrange
            spyOn(component.deleteScreening, 'emit');

            // Act
            component.delete();

            // Assert
            expect(component.deleteScreening.emit).toHaveBeenCalled();
        });
    });
});
