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
            hearingRoleCode: 'RPTT',
            interpretation_language: undefined
        }),
        new VHParticipant({
            id: '2',
            firstName: 'Chris',
            lastName: 'Green',
            email: 'chris@green,com',
            displayName: 'Chris Green',
            userRoleName: 'Representative',
            hearingRoleCode: 'RPTT',
            interpretation_language: undefined
        }),
        new VHParticipant({
            id: '3',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@smith.com',
            displayName: 'Jane Smith',
            userRoleName: 'Individual',
            hearingRoleCode: 'APPL',
            interpretation_language: undefined
        }),
        new VHParticipant({
            id: '4',
            firstName: 'Will',
            lastName: 'Smith',
            email: 'will@smith.com',
            displayName: 'Will Smith',
            userRoleName: 'Individual',
            hearingRoleCode: 'INTE',
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
        component.availableParticipantPool = participants.filter(p => p.hearingRoleCode === 'INTE' || p.hearingRoleCode === 'RPTT');

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

    it('should have correct available participants when initialising existing endpoint', () => {
        const representative = participants[0];
        const otherRepresentative = participants[1];
        const intermediary = participants[3];
        component.availableParticipantPool = [otherRepresentative];
        component.existingVideoEndpoint = {
            displayName: 'Test',
            id: '1',
            screening: undefined,
            interpretationLanguage: undefined,
            externalReferenceId: '1',
            participantsLinked: [
                { displayName: representative.displayName, email: representative.email },
                { displayName: intermediary.displayName, email: intermediary.email }
            ]
        };
        fixture.detectChanges();
        //lists should contain otherRepresentative from availableParticipantPool aswell as the other two participants already linked to the JVS
        expect(component.availableRepresentatives.length).toBe(2);
        expect(component.availableRepresentatives[0].email).toBe(otherRepresentative.email);
        expect(component.availableRepresentatives[1].email).toBe(representative.email);

        expect(component.availableIntermediaries.length).toBe(1);
        expect(component.availableIntermediaries[0].email).toBe(intermediary.email);
    });

    describe('on form submit', () => {
        it('should emit endpointAdded event when onSubmit is called and form is valid', () => {
            spyOn(component.endpointAdded, 'emit');
            const dto: VideoAccessPointDto = {
                displayName: 'Test',
                participantsLinked: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: undefined
            };
            component.form.setValue({
                displayName: dto.displayName,
                representative: null,
                intermediary: null
            });
            component.onSubmit();
            expect(component.endpointAdded.emit).toHaveBeenCalledWith(dto);
        });

        it('should not emit endpointAdded event when onSubmit is called and form is invalid', () => {
            spyOn(component.endpointAdded, 'emit');
            component.form.setValue({
                displayName: null,
                representative: null,
                intermediary: null
            });
            component.onSubmit();
            expect(component.endpointAdded.emit).not.toHaveBeenCalled();
        });

        it('should emit endpointUpdated event when onSubmit is called, form is valid and editMode is true', () => {
            spyOn(component.endpointUpdated, 'emit');
            const originalDto: VideoAccessPointDto = {
                id: '1',
                displayName: 'Original',
                participantsLinked: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: undefined
            };
            const updatedDto: VideoAccessPointDto = {
                id: '1',
                displayName: 'Updated',
                participantsLinked: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: undefined
            };
            component.existingVideoEndpoint = originalDto;
            component.form.setValue({
                displayName: updatedDto.displayName,
                representative: null,
                intermediary: null
            });
            component.onSubmit();
            expect(component.saveButtonText).toBe('Update Access Point');
            expect(component.endpointUpdated.emit).toHaveBeenCalledWith({ original: originalDto, updated: updatedDto });
        });

        it('should find the correct participants when form fields set', () => {
            spyOn(component.endpointAdded, 'emit');

            const rep = component.availableRepresentatives[0];
            const int = component.availableIntermediaries[0];

            // update the input field with the email of the first participant via the debug fixture element
            const displayNameInput = fixture.nativeElement.querySelector('[id="displayName"]') as HTMLInputElement;
            displayNameInput.value = 'Test Endpoint';
            displayNameInput.dispatchEvent(new Event('input'));

            const linkedRepresentativeInput = fixture.nativeElement.querySelector('[id="representative"]') as HTMLSelectElement;
            linkedRepresentativeInput.value = rep.email;
            linkedRepresentativeInput.dispatchEvent(new Event('change'));

            const linkedIntermediaryInput = fixture.nativeElement.querySelector('[id="intermediary"]') as HTMLSelectElement;
            linkedIntermediaryInput.value = int.email;
            linkedIntermediaryInput.dispatchEvent(new Event('change'));

            component.onSubmit();
            expect(component.endpointAdded.emit).toHaveBeenCalledWith({
                displayName: 'Test Endpoint',
                participantsLinked: [
                    {
                        email: rep.email,
                        displayName: rep.displayName
                    },
                    {
                        email: int.email,
                        displayName: int.displayName
                    }
                ],
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: undefined
            });
        });

        it('should not emit endpointAdded event when onSubmit is called and form is invalid', () => {
            spyOn(component.endpointAdded, 'emit');
            component.form.setValue({
                displayName: null,
                representative: null,
                intermediary: null
            });
            component.onSubmit();
            expect(component.endpointAdded.emit).not.toHaveBeenCalled();
        });

        it('should fail validation when endpoint display name already exists', () => {
            component.existingVideoEndpoints = [
                {
                    id: '1',
                    displayName: 'Test',
                    participantsLinked: null,
                    interpretationLanguage: undefined,
                    screening: undefined,
                    externalReferenceId: undefined
                }
            ];
            component.videoEndpoint = {
                id: '2',
                displayName: 'Test',
                participantsLinked: null,
                interpretationLanguage: undefined,
                screening: undefined,
                externalReferenceId: undefined
            };
            component.form.setValue({
                displayName: 'Test',
                representative: null,
                intermediary: null
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
