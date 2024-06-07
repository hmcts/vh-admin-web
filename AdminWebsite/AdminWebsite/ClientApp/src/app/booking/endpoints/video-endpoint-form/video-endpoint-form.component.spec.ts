import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { VideoEndpointFormComponent } from './video-endpoint-form.component';
import { VideoAccessPointDto } from '../models/video-access-point.model';

describe('VideoEndpointFormComponent', () => {
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
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should create form on initialization', () => {
        expect(component.form).toBeDefined();
    });

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
});
