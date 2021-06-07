import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetAudioFileRequestTimedoutWarningComponent } from './get-audio-file-request-timedout-warning.component';

describe('GetAudioFileRequestTimedoutWarningComponent', () => {
    let component: GetAudioFileRequestTimedoutWarningComponent;
    let fixture: ComponentFixture<GetAudioFileRequestTimedoutWarningComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [GetAudioFileRequestTimedoutWarningComponent]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GetAudioFileRequestTimedoutWarningComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
