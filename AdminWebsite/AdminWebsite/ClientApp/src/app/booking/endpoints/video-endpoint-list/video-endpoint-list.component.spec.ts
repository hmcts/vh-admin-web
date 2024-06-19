import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoEndpointListComponent } from './video-endpoint-list.component';
import { VideoAccessPointDto } from '../models/video-access-point.model';

describe('VideoEndpointListComponent', () => {
    let component: VideoEndpointListComponent;
    let fixture: ComponentFixture<VideoEndpointListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VideoEndpointListComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(VideoEndpointListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit editEndpoint event when editEndpoint is called', () => {
        spyOn(component.editEndpoint, 'emit');
        const dto: VideoAccessPointDto = {
            displayName: 'Test',
            defenceAdvocate: null,
            interpretationLanguage: undefined
        };
        component.editEndpoint.emit(dto);
        expect(component.editEndpoint.emit).toHaveBeenCalledWith(dto);
    });

    it('should emit deleteEndpoint event when deleteEndpoint is called', () => {
        spyOn(component.deleteEndpoint, 'emit');
        const dto: VideoAccessPointDto = {
            displayName: 'Test',
            defenceAdvocate: null,
            interpretationLanguage: undefined
        };
        component.deleteEndpoint.emit(dto);
        expect(component.deleteEndpoint.emit).toHaveBeenCalledWith(dto);
    });
});
