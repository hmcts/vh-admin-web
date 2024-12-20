import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { EndpointsComponent } from './endpoints.component';
import { BookingService } from 'src/app/services/booking.service';
import { VideoHearingsService } from 'src/app/services/video-hearings.service';
import { Logger } from 'src/app/services/logger';
import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { VideoEndpointFormComponent } from './video-endpoint-form/video-endpoint-form.component';
import { VideoEndpointListComponent } from './video-endpoint-list/video-endpoint-list.component';
import { VideoEndpointItemComponent } from './video-endpoint-item/video-endpoint-item.component';
import { BreadcrumbStubComponent } from 'src/app/testing/stubs/breadcrumb-stub';
import { FeatureFlagDirective } from 'src/app/src/app/shared/feature-flag.directive';
import { VHBooking } from 'src/app/common/model/vh-booking';
import { VHParticipant } from 'src/app/common/model/vh-participant';

function initHearingRequest(): VHBooking {
    const newHearing = new VHBooking();
    newHearing.hearingVenueId = -1;
    newHearing.scheduledDuration = 0;
    newHearing.participants = [
        new VHParticipant({
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@doe.com',
            displayName: 'John Doe',
            userRoleName: 'Representative',
            interpretation_language: undefined
        }),
        new VHParticipant({
            id: '2',
            firstName: 'Chris',
            lastName: 'Green',
            email: 'chris@green,com',
            displayName: 'Chris Green',
            userRoleName: 'Representative',
            interpretation_language: undefined
        }),
        new VHParticipant({
            id: '3',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@smith.com',
            displayName: 'Jane Smith',
            userRoleName: 'Individual',
            interpretation_language: undefined
        })
    ];
    newHearing.endpoints = [
        {
            id: '1',
            displayName: 'Already Here',
            defenceAdvocate: null,
            sip: 'sip',
            pin: 'pin',
            username: 'test@existing.com',
            contactEmail: 'test@existing.com',
            interpretationLanguage: undefined,
            externalReferenceId: 'ex1'
        }
    ];
    return newHearing;
}

describe('EndpointsComponent', () => {
    let component: EndpointsComponent;
    let fixture: ComponentFixture<EndpointsComponent>;
    let bookingServiceSpy: jasmine.SpyObj<BookingService>;
    let videoHearingsServiceSpy: jasmine.SpyObj<VideoHearingsService>;
    let routerSpy: jasmine.SpyObj<Router>;
    let loggerSpy: jasmine.SpyObj<Logger>;
    let featureServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
    const newHearing = initHearingRequest();

    beforeEach(async () => {
        bookingServiceSpy = jasmine.createSpyObj('BookingService', ['removeEditMode', 'isEditMode', 'resetEditMode']);
        videoHearingsServiceSpy = jasmine.createSpyObj('VideoHearingsService', [
            'getCurrentRequest',
            'isHearingAboutToStart',
            'updateHearingRequest',
            'cancelRequest',
            'setBookingHasChanged',
            'unsetBookingHasChanged'
        ]);

        videoHearingsServiceSpy.getCurrentRequest.and.returnValue(newHearing);

        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        loggerSpy = jasmine.createSpyObj('Logger', ['debug']);
        featureServiceSpy = jasmine.createSpyObj('LaunchDarklyService', ['getFlag']);
        featureServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));
        featureServiceSpy.getFlag.withArgs(FeatureFlags.interpreterEnhancements).and.returnValue(of(false));
        featureServiceSpy.getFlag.withArgs(FeatureFlags.specialMeasures).and.returnValue(of(false));

        await TestBed.configureTestingModule({
            declarations: [
                EndpointsComponent,
                VideoEndpointFormComponent,
                VideoEndpointListComponent,
                VideoEndpointItemComponent,
                BreadcrumbStubComponent,
                FeatureFlagDirective
            ],
            providers: [
                { provide: BookingService, useValue: bookingServiceSpy },
                { provide: VideoHearingsService, useValue: videoHearingsServiceSpy },
                { provide: Router, useValue: routerSpy },
                { provide: Logger, useValue: loggerSpy },
                { provide: LaunchDarklyService, useValue: featureServiceSpy },

                FormBuilder
            ],
            imports: [ReactiveFormsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(EndpointsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return true for hearing about to start', () => {
        component.ngOnInit();
        videoHearingsServiceSpy.isHearingAboutToStart.and.returnValue(true);
        expect(component.isHearingAboutToStart).toBe(true);
    });

    it('should get booking data from storage', () => {
        component.ngOnInit();
        fixture.detectChanges();
        expect(component.hearing).toBeTruthy();
    });

    it('should show a confirmation popup if cancel clicked in new mode', () => {
        bookingServiceSpy.isEditMode.and.returnValue(false);
        component.ngOnInit();
        component.cancelBooking();
        expect(component.attemptingCancellation).toBeTruthy();
    });
    it('should show a confirmation popup if cancel clicked in edit mode', () => {
        bookingServiceSpy.isEditMode.and.returnValue(true);
        component.ngOnInit();
        component.cancelBooking();
        expect(component.attemptingCancellation).toBeFalsy();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/summary']);
    });
    it('should show a confirmation popup if cancel clicked in edit mode with updates', () => {
        bookingServiceSpy.isEditMode.and.returnValue(true);
        component.ngOnInit();
        component.form.markAsTouched();
        component.cancelBooking();
        expect(component.attemptingDiscardChanges).toBeTruthy();
    });
    it('should close the confirmation popup and stay on page in new mode and continue booking clicked', () => {
        bookingServiceSpy.isEditMode.and.returnValue(false);
        component.attemptingCancellation = true;
        component.continueBooking();
        expect(component.attemptingCancellation).toBeFalsy();
    });
    it('should close the confirmation popup and navigate to dashboard in new mode and discard changes clicked', () => {
        bookingServiceSpy.isEditMode.and.returnValue(false);
        component.attemptingCancellation = true;
        component.cancelEndpoints();
        expect(component.attemptingCancellation).toBeFalsy();
        expect(videoHearingsServiceSpy.cancelRequest).toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
    it('should close the confirmation popup and stay on page in edit mode and continue booking clicked', () => {
        bookingServiceSpy.isEditMode.and.returnValue(true);
        component.attemptingDiscardChanges = true;
        component.continueBooking();
        expect(component.attemptingDiscardChanges).toBeFalsy();
    });
    it('should close the confirmation popup and navigate to summary in edit mode and discard changes clicked', () => {
        bookingServiceSpy.isEditMode.and.returnValue(false);
        component.attemptingDiscardChanges = true;
        component.cancelChanges();
        expect(component.attemptingDiscardChanges).toBeFalsy();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/summary']);
    });

    describe('when booking is multi day', () => {
        beforeEach(() => {
            const booking = new VHBooking();
            booking.isMultiDay = true;
            videoHearingsServiceSpy.getCurrentRequest.and.returnValue(booking);
        });
        it('should navigate to the summary page when next clicked and multi day booking enhancements are enabled', () => {
            featureServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(true));
            component.ngOnInit();
            component.saveEndpoints();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/summary']);
        });
        it('should navigate to the other information page when next clicked and multi day booking enhancements are not enabled', () => {
            featureServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));
            component.ngOnInit();
            component.saveEndpoints();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/other-information']);
        });
    });
    describe('when booking is not multi day', () => {
        beforeEach(() => {
            const booking = new VHBooking();
            booking.isMultiDay = false;
            videoHearingsServiceSpy.getCurrentRequest.and.returnValue(booking);
        });

        it('should navigate to the other information page when next clicked and multi day booking enhancements are enabled', () => {
            featureServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(true));
            component.ngOnInit();
            component.videoEndpoints = [
                {
                    id: '1',
                    displayName: 'Test',
                    defenceAdvocate: null,
                    interpretationLanguage: undefined,
                    screening: undefined,
                    externalReferenceId: '1'
                }
            ];
            component.saveEndpoints();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/other-information']);
        });
        it('should navigate to the other information page when next clicked and multi day booking enhancements are not enabled', () => {
            featureServiceSpy.getFlag.withArgs(FeatureFlags.multiDayBookingEnhancements).and.returnValue(of(false));
            component.ngOnInit();
            component.saveEndpoints();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/other-information']);
        });
    });

    describe('onEndpoitnAdded', () => {
        it('should add endpoint', () => {
            const endpoint = {
                id: '1',
                displayName: 'Test',
                defenceAdvocate: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: '1'
            };
            component.onEndpointAdded(endpoint);
            expect(component.videoEndpoints).toContain(endpoint);
        });

        it('should not add an endpoint when the display name already exists', () => {
            const endpoint = {
                id: '1',
                displayName: 'Test',
                defenceAdvocate: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: '1'
            };
            component.videoEndpoints = [endpoint];
            component.onEndpointAdded(endpoint);
            expect(component.videoEndpoints.length).toBe(1);
        });
    });

    describe('onEndpointUpdated', () => {
        beforeEach(() => {
            component.videoEndpoints = [
                {
                    id: '1',
                    displayName: 'Test',
                    defenceAdvocate: null,
                    interpretationLanguage: undefined,
                    screening: undefined,
                    externalReferenceId: '1'
                },
                {
                    id: '2',
                    displayName: 'Test2',
                    defenceAdvocate: null,
                    interpretationLanguage: undefined,
                    screening: undefined,
                    externalReferenceId: '1'
                }
            ];
        });

        it('should update endpoint', () => {
            const endpoint = {
                id: '1',
                displayName: 'Test',
                defenceAdvocate: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: '1'
            };
            component.videoEndpoints = [endpoint];
            const updatedEndpoint = {
                id: '1',
                displayName: 'Updated',
                defenceAdvocate: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: '1'
            };
            component.onEndpointUpdated({ original: endpoint, updated: updatedEndpoint });
            expect(component.videoEndpoints).toContain(updatedEndpoint);
        });

        it('should not update endpoint when the original endpoint does not exist', () => {
            const endpoint = {
                id: '1',
                displayName: 'DoesNotExist',
                defenceAdvocate: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: '1'
            };
            const updatedEndpoint = {
                id: '1',
                displayName: 'Updated',
                defenceAdvocate: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: '1'
            };
            component.onEndpointUpdated({ original: endpoint, updated: updatedEndpoint });
            expect(component.videoEndpoints).not.toContain(endpoint);
        });
    });

    describe('onEndpointSelectedForDeletion', () => {
        beforeEach(() => {
            component.videoEndpoints = [
                {
                    id: '1',
                    displayName: 'Test',
                    defenceAdvocate: null,
                    interpretationLanguage: undefined,
                    screening: undefined,
                    externalReferenceId: '1'
                },
                {
                    id: '2',
                    displayName: 'Test2',
                    defenceAdvocate: null,
                    interpretationLanguage: undefined,
                    screening: undefined,
                    externalReferenceId: '1'
                }
            ];
        });

        it('should delete endpoint', () => {
            const endpoint = {
                id: '1',
                displayName: 'Test',
                defenceAdvocate: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: '1'
            };
            component.onEndpointSelectedForDeletion(endpoint);
            expect(component.videoEndpoints).not.toContain(endpoint);
        });

        it('should not delete endpoint when the endpoint does not exist', () => {
            const endpoint = {
                id: '3',
                displayName: 'Test3',
                defenceAdvocate: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: '1'
            };
            component.onEndpointSelectedForDeletion(endpoint);
            expect(component.videoEndpoints.length).toBe(2);
        });
    });

    describe('onEndpointSelectedForEdit', () => {
        it('should set endpoint to edit', () => {
            const endpoint = {
                id: '1',
                displayName: 'Test',
                defenceAdvocate: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: '1'
            };
            component.onEndpointSelectedForEdit(endpoint);
            expect(component.videoEndpointToEdit).toBe(endpoint);
        });
    });
});
