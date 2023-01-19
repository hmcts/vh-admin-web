import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CaseTypesMenuComponent } from './case-types-menu.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { MockLogger } from '../../testing/mock-logger';
import { Logger } from '../../../services/logger';
import { VideoHearingsService } from '../../../services/video-hearings.service';
import { of, throwError } from 'rxjs';
import { HearingTypeResponse } from '../../../services/clients/api-client';

describe('CaseTypesMenuComponent', () => {
    let component: CaseTypesMenuComponent;
    let fixture: ComponentFixture<CaseTypesMenuComponent>;
    let videoHearingServiceSpy: jasmine.SpyObj<VideoHearingsService>;

    beforeEach(async () => {
        videoHearingServiceSpy = jasmine.createSpyObj('VideoHearingsService', ['getHearingTypes']);
        videoHearingServiceSpy.getHearingTypes.and.returnValue(of([new HearingTypeResponse({ group: 'caseType1' })]));
        await TestBed.configureTestingModule({
            declarations: [CaseTypesMenuComponent],
            providers: [
                HttpClient,
                HttpHandler,
                FormBuilder,
                { provide: Logger, useValue: new MockLogger() },
                { provide: VideoHearingsService, useValue: videoHearingServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CaseTypesMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render menu item', () => {
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.govuk-label').textContent).toContain('Case types');
    });

    describe('loadItems', () => {
        it('should call video hearing service', () => {
            component.loadItems();
            expect(videoHearingServiceSpy.getHearingTypes).toHaveBeenCalled();
            expect(component.caseTypes).toContain('caseType1');
        });

        it('should call video hearing service, and catch thrown exception', () => {
            videoHearingServiceSpy.getHearingTypes.and.returnValue(throwError({ status: 404 }));

            const handleListErrorSpy = spyOn(component, 'handleListError');
            component.loadItems();
            expect(videoHearingServiceSpy.getHearingTypes).toHaveBeenCalled();
            expect(handleListErrorSpy).toHaveBeenCalled();
        });
    });
});
