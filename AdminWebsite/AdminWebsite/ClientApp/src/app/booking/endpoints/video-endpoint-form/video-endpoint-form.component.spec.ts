import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { VideoEndpointFormComponent } from './video-endpoint-form.component';
import { VideoAccessPointDto } from '../models/video-access-point.model';
import { ParticipantModel } from 'src/app/common/model/participant.model';

describe('VideoEndpointFormComponent', () => {
    const participants: ParticipantModel[] = [
        {
            id: '1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@doe.com',
            display_name: 'John Doe',
            user_role_name: 'Representative'
        },
        {
            id: '2',
            first_name: 'Chris',
            last_name: 'Green',
            email: 'chris@green,com',
            display_name: 'Chris Green',
            user_role_name: 'Representative'
        },
        {
            id: '3',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@smith.com',
            display_name: 'Jane Smith',
            user_role_name: 'Individual'
        }
    ];

    let component: VideoEndpointFormComponent;
    let fixture: ComponentFixture<VideoEndpointFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VideoEndpointFormComponent],
            providers: [FormBuilder],
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

    describe('on form submit', () => {
        it('should emit endpointAdded event when onSubmit is called and form is valid', () => {
            spyOn(component.endpointAdded, 'emit');
            const dto: VideoAccessPointDto = {
                displayName: 'Test',
                defenceAdvocate: null
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
                defenceAdvocate: null
            };
            const updatedDto: VideoAccessPointDto = {
                id: '1',
                displayName: 'Updated',
                defenceAdvocate: null
            };
            component.existingVideoEndpoint = originalDto;
            component.form.setValue({
                displayName: updatedDto.displayName,
                linkedRepresentative: null
            });
            component.onSubmit();
            expect(component.endpointUpdated.emit).toHaveBeenCalledWith({ original: originalDto, updated: updatedDto });
        });

        it('should find the defence advocate when linkedRepresentative is set', () => {
            spyOn(component.endpointAdded, 'emit');

            const rep = component.availableRepresentatives[0];
            // update the input field with the email of the first participant via the debug fixture element
            const displayNameInput = fixture.nativeElement.querySelector('[id="displayName"') as HTMLInputElement;
            displayNameInput.value = 'Test Endpoint';
            displayNameInput.dispatchEvent(new Event('input'));

            const linkedRepresentativeInput = fixture.nativeElement.querySelector('[id="representative"') as HTMLSelectElement;
            linkedRepresentativeInput.value = rep.email;
            linkedRepresentativeInput.dispatchEvent(new Event('change'));

            component.onSubmit();
            expect(component.endpointAdded.emit).toHaveBeenCalledWith({
                displayName: 'Test Endpoint',
                defenceAdvocate: {
                    email: rep.email,
                    displayName: rep.display_name
                }
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
                    defenceAdvocate: null
                }
            ];
            component.videoEndpoint = {
                id: '2',
                displayName: 'Test',
                defenceAdvocate: null
            };
            component.form.setValue({
                displayName: 'Test',
                linkedRepresentative: null
            });
            component.onSubmit();
            expect(component.form.valid).toBeFalse();
        });
    });
});
