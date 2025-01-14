import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { VideoEndpointFormComponent } from './video-endpoint-form.component';
import { VideoAccessPointDto } from '../models/video-access-point.model';
import { InterpreterFormComponent } from '../../interpreter-form/interpreter-form.component';
import { FeatureFlagDirective } from 'src/app/src/app/shared/feature-flag.directive';
import { FeatureFlags, LaunchDarklyService } from 'src/app/services/launch-darkly.service';
import { of } from 'rxjs';
import { InterpreterSelectedDto } from '../../interpreter-form/interpreter-selected.model';
import { MockComponent } from 'ng-mocks';
import { VHParticipant } from 'src/app/common/model/vh-participant';

describe('VideoEndpointFormComponent', () => {
    const participants: VHParticipant[] = [
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

    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
    let component: VideoEndpointFormComponent;
    let fixture: ComponentFixture<VideoEndpointFormComponent>;

    beforeEach(async () => {
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.interpreterEnhancements).and.returnValue(of(false));
        launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.specialMeasures).and.returnValue(of(false));

        await TestBed.configureTestingModule({
            declarations: [VideoEndpointFormComponent, MockComponent(InterpreterFormComponent), FeatureFlagDirective],
            providers: [FormBuilder, { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy }],
            imports: [ReactiveFormsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(VideoEndpointFormComponent);
        component = fixture.componentInstance;
        component.participants = participants;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should create form on initialization', () => {
        expect(component.form).toBeDefined();
    });

    it('should set button text when input is falsy', () => {
        component.existingVideoEndpoint = null;
        expect(component.saveButtonText).toBe('Save Access Point');
    });

    describe('on form submit', () => {
        it('should emit endpointAdded event when onSubmit is called and form is valid', () => {
            spyOn(component.endpointAdded, 'emit');
            const dto: VideoAccessPointDto = {
                displayName: 'Test',
                defenceAdvocate: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: undefined
            };
            component.form.setValue({
                displayName: dto.displayName,
                linkedRepresentative: null
            });
            component.onSubmit();
            expect(component.endpointAdded.emit).toHaveBeenCalledWith(dto);
        });

        it('should not emit endpointAdded event when onSubmit is called and form is invalid', () => {
            spyOn(component.endpointAdded, 'emit');
            component.form.setValue({
                displayName: null,
                linkedRepresentative: null
            });
            component.onSubmit();
            expect(component.endpointAdded.emit).not.toHaveBeenCalled();
        });

        it('should emit endpointUpdated event when onSubmit is called, form is valid and editMode is true', () => {
            spyOn(component.endpointUpdated, 'emit');
            const originalDto: VideoAccessPointDto = {
                id: '1',
                displayName: 'Original',
                defenceAdvocate: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: undefined
            };
            const updatedDto: VideoAccessPointDto = {
                id: '1',
                displayName: 'Updated',
                defenceAdvocate: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: undefined
            };
            component.existingVideoEndpoint = originalDto;
            component.form.setValue({
                displayName: updatedDto.displayName,
                linkedRepresentative: null
            });
            component.onSubmit();
            expect(component.saveButtonText).toBe('Update Access Point');
            expect(component.endpointUpdated.emit).toHaveBeenCalledWith({ original: originalDto, updated: updatedDto });
        });

        it('should find the defence advocate when linkedRepresentative is set', () => {
            spyOn(component.endpointAdded, 'emit');

            const rep = component.availableRepresentatives[0];
            // update the input field with the email of the first participant via the debug fixture element
            const displayNameInput = fixture.nativeElement.querySelector('[id="displayName"]') as HTMLInputElement;
            displayNameInput.value = 'Test Endpoint';
            displayNameInput.dispatchEvent(new Event('input'));

            const linkedRepresentativeInput = fixture.nativeElement.querySelector('[id="representative"]') as HTMLSelectElement;
            linkedRepresentativeInput.value = rep.email;
            linkedRepresentativeInput.dispatchEvent(new Event('change'));

            component.onSubmit();
            expect(component.endpointAdded.emit).toHaveBeenCalledWith({
                displayName: 'Test Endpoint',
                defenceAdvocate: {
                    email: rep.email,
                    displayName: rep.displayName
                },
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: undefined
            });
        });

        it('should not emit endpointAdded event when onSubmit is called and form is invalid', () => {
            spyOn(component.endpointAdded, 'emit');
            component.form.setValue({
                displayName: null,
                linkedRepresentative: null
            });
            component.onSubmit();
            expect(component.endpointAdded.emit).not.toHaveBeenCalled();
        });

        it('should fail validation when endpoint display name already exists', () => {
            component.existingVideoEndpoints = [
                {
                    id: '1',
                    displayName: 'Test',
                    defenceAdvocate: null,
                    interpretationLanguage: undefined,
                    screening: undefined,
                    externalReferenceId: undefined
                }
            ];
            component.videoEndpoint = {
                id: '2',
                displayName: 'Test',
                defenceAdvocate: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: undefined
            };
            component.form.setValue({
                displayName: 'Test',
                linkedRepresentative: null
            });
            component.onSubmit();
            expect(component.form.valid).toBeFalse();
        });
    });

    describe('with interpreter enhancements', () => {
        beforeEach(() => {
            launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.interpreterEnhancements).and.returnValue(of(true));
            fixture = TestBed.createComponent(VideoEndpointFormComponent);
            component = fixture.componentInstance;
            component.participants = participants;

            fixture.detectChanges();
        });

        it('should show interpreter form when interpreter flag is enabled', () => {
            expect(component.interpreterForm).toBeDefined();
        });

        it('should set the interpreterSelection when onInterpreterLanguageSelected is called', () => {
            const interpreterSelection: InterpreterSelectedDto = {
                interpreterRequired: true,
                signLanguageCode: 'BSL',
                spokenLanguageCode: undefined
            };
            component.onInterpreterLanguageSelected(interpreterSelection);
            expect(component.interpreterSelection).toEqual(interpreterSelection);
        });

        it('should reset interpreterSelection when no interpreter is required', () => {
            component.interpreterSelection = {
                interpreterRequired: true,
                signLanguageCode: 'BSL',
                spokenLanguageCode: undefined
            };

            const newSelection: InterpreterSelectedDto = {
                interpreterRequired: false,
                signLanguageCode: undefined,
                spokenLanguageCode: undefined
            };

            component.onInterpreterLanguageSelected(newSelection);
            expect(component.interpreterSelection).toBeNull();
        });
    });
});
