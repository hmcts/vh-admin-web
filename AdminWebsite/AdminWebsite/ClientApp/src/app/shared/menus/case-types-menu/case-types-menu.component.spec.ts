import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseTypesMenuComponent } from './case-types-menu.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MockLogger } from '../../testing/mock-logger';
import { Logger } from '../../../services/logger';
import { VideoHearingsService } from '../../../services/video-hearings.service';
import { of, throwError } from 'rxjs';
import { HearingTypeResponse } from '../../../services/clients/api-client';
import { NgSelectModule } from '@ng-select/ng-select';

describe('CaseTypesMenuComponent', () => {
    let component: CaseTypesMenuComponent;
    let fixture: ComponentFixture<CaseTypesMenuComponent>;
    let videoHearingServiceSpy: jasmine.SpyObj<VideoHearingsService>;
    const caseType = 'caseType1';

    beforeEach(async () => {
        videoHearingServiceSpy = jasmine.createSpyObj('VideoHearingsService', ['getHearingTypes']);
        videoHearingServiceSpy.getHearingTypes.and.returnValue(of([new HearingTypeResponse({ group: caseType })]));
        await TestBed.configureTestingModule({
            imports: [NgSelectModule, ReactiveFormsModule],
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
        component.selectedEmitter = jasmine.createSpyObj('selectedEmitter', ['emit']);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render menu item', () => {
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.govuk-label').textContent).toContain('Case types');
    });

    describe('enable', () => {
        it('should call base enable function, to enable this component', () => {
            component.enabled(true);
            expect(component.form.controls[component.formGroupName].enabled).toEqual(true);
        });
        it('should call base enable function, to disable this component', () => {
            component.enabled(false);
            expect(component.form.controls[component.formGroupName].enabled).toEqual(false);
        });
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

    describe('onSelect', () => {
        it('should select case type', () => {
            component.loadItems();
            component.form.controls[component.formGroupName].setValue(caseType);
            component.onSelect();
            expect(component.selectedEmitter.emit).toHaveBeenCalledWith(caseType as any);
        });
    });
});
