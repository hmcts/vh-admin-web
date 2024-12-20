import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreeningComponent } from './screening.component';
import { Router } from '@angular/router';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { EndpointModel } from 'src/app/common/model/endpoint.model';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MockComponent } from 'ng-mocks';
import { ScreeningFormComponent } from './screening-form.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { ScreeningListComponent } from './screening-list.component';
import { VHParticipant } from 'src/app/common/model/vh-participant';

function initHearingRequest(): VHBooking {
    const hearing = new VHBooking();
    hearing.hearingId = '';
    hearing.participants = [
        new VHParticipant({
            display_Name: 'Jane',
            email: 'jane@doe.com',
            externalReferenceId: '1Jane'
        }),
        new VHParticipant({
            display_Name: 'Johnny',
            email: 'john@doe.com',
            externalReferenceId: '2John'
        }),
        new VHParticipant({
            display_Name: 'Greeno',
            email: 'james@green.com',
            externalReferenceId: '3Green'
        })
    ];
    hearing.judiciaryParticipants = [];
    hearing.endpoints = [
        {
            displayName: 'Silver',
            externalReferenceId: '4Silver'
        } as EndpointModel
    ];

    return hearing;
}

describe('ScreeningComponent', () => {
    let component: ScreeningComponent;
    let fixture: ComponentFixture<ScreeningComponent>;

    let bookingServiceSpy: jasmine.SpyObj<BookingService>;
    let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    beforeEach(async () => {
        bookingServiceSpy = jasmine.createSpyObj<BookingService>('BookingService', ['isEditMode', 'resetEditMode']);
        videoHearingsServiceSpy = jasmine.createSpyObj<VideoHearingsService>('VideoHearingsService', [
            'getCurrentRequest',
            'updateHearingRequest'
        ]);
        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(initHearingRequest());
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        loggerSpy = jasmine.createSpyObj('Logger', ['debug']);
        await TestBed.configureTestingModule({
            declarations: [
                ScreeningComponent,
                MockComponent(BreadcrumbComponent),
                MockComponent(ScreeningFormComponent),
                MockComponent(ScreeningListComponent)
            ],
            providers: [
                { provide: BookingService, useValue: bookingServiceSpy },
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: Logger, useValue: loggerSpy },
                FormBuilder
            ],
            imports: [ReactiveFormsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(ScreeningComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('onScreeningSaved', () => {
        it('should save screening All for participant', () => {
            // Arrange
            const hearing = initHearingRequest();
            const participant = hearing.participants[0];

            component.hearing = initHearingRequest();

            // Act
            component.onScreeningSaved({
                participantDisplayName: participant.display_Name,
                measureType: 'All',
                protectFrom: []
            });

            // Assert
            expect(component.hearing.participants[0].screening).toEqual({
                measureType: 'All',
                protectFrom: []
            });
        });

        it('should save screening Specific for participant', () => {
            // Arrange
            const hearing = initHearingRequest();
            const participant = hearing.participants[0];

            component.hearing = initHearingRequest();

            // Act
            component.onScreeningSaved({
                participantDisplayName: participant.display_Name,
                measureType: 'Specific',
                protectFrom: [{ externalReferenceId: '4Silver' }, { externalReferenceId: '2John' }]
            });

            // Assert
            expect(component.hearing.participants[0].screening).toEqual({
                measureType: 'Specific',
                protectFrom: [{ externalReferenceId: '4Silver' }, { externalReferenceId: '2John' }]
            });
        });

        it('should save screening All for endpoint', () => {
            // Arrange
            const hearing = initHearingRequest();
            const endpoint = hearing.endpoints[0];

            component.hearing = initHearingRequest();

            // Act
            component.onScreeningSaved({
                participantDisplayName: endpoint.displayName,
                measureType: 'All',
                protectFrom: []
            });

            // Assert
            expect(component.hearing.endpoints[0].screening).toEqual({
                measureType: 'All',
                protectFrom: []
            });
        });

        it('should save screening Specific for endpoint', () => {
            // Arrange
            const hearing = initHearingRequest();
            const endpoint = hearing.endpoints[0];

            component.hearing = initHearingRequest();

            // Act
            component.onScreeningSaved({
                participantDisplayName: endpoint.displayName,
                measureType: 'Specific',
                protectFrom: [{ externalReferenceId: '4Silver' }, { externalReferenceId: '2John' }]
            });

            // Assert
            expect(component.hearing.endpoints[0].screening).toEqual({
                measureType: 'Specific',
                protectFrom: [{ externalReferenceId: '4Silver' }, { externalReferenceId: '2John' }]
            });
        });
    });

    describe('onDeleteEndpointScreening', () => {
        it('should delete endpoint screening', () => {
            // Arrange
            const hearing = initHearingRequest();
            const endpoint = hearing.endpoints[0];
            endpoint.screening = {
                measureType: 'All',
                protectFrom: []
            };

            component.hearing = initHearingRequest();

            // Act
            component.onDeleteEndpointScreening(endpoint);

            // Assert
            expect(component.hearing.endpoints[0].screening).toBeFalsy();
        });
    });

    describe('onDeleteParticipantScreening', () => {
        it('should delete participant screening', () => {
            // Arrange
            const hearing = initHearingRequest();
            const participant = hearing.participants[0];
            participant.screening = {
                measureType: 'All',
                protectFrom: []
            };

            component.hearing = initHearingRequest();

            // Act
            component.onDeleteParticipantScreening(participant);

            // Assert
            expect(component.hearing.participants[0].screening).toBeFalsy();
        });
    });

    describe('onContinue', () => {
        it('should navigate back to summary if in edit mode', () => {
            // Arrange
            bookingServiceSpy.isEditMode.and.returnValue(true);

            // Act
            component.onContinue();

            // Assert
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/summary']);
        });

        it('should navigate to other information if not in edit mode', () => {
            // Arrange
            bookingServiceSpy.isEditMode.and.returnValue(false);

            // Act
            component.onContinue();

            // Assert
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/other-information']);
        });
    });
});
