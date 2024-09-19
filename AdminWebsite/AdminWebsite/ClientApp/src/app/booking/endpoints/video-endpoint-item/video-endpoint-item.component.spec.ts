import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoEndpointItemComponent } from './video-endpoint-item.component';
import { VideoAccessPointDto } from '../models/video-access-point.model';

describe('VideoEndpointItemComponent', () => {
    let component: VideoEndpointItemComponent;
    let fixture: ComponentFixture<VideoEndpointItemComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VideoEndpointItemComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(VideoEndpointItemComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit editEndpoint event when edit is called', () => {
        spyOn(component.editEndpoint, 'emit');
        const dto: VideoAccessPointDto = {
            displayName: 'Test',
            defenceAdvocate: null,
            interpretationLanguage: undefined,
            screening: undefined
        };
        component.videoEndpoint = dto;
        component.edit();
        expect(component.editEndpoint.emit).toHaveBeenCalledWith(dto);
    });

    it('should emit deleteEndpoint event when delete is called', () => {
        spyOn(component.deleteEndpoint, 'emit');
        const dto: VideoAccessPointDto = {
            displayName: 'Test',
            defenceAdvocate: null,
            interpretationLanguage: undefined,
            screening: undefined
        };
        component.videoEndpoint = dto;
        component.delete();
        expect(component.deleteEndpoint.emit).toHaveBeenCalledWith(dto);
    });
});
