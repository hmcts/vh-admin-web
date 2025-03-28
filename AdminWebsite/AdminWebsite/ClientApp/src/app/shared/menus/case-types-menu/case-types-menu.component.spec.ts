import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseTypesMenuComponent } from './case-types-menu.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MockLogger } from '../../testing/mock-logger';
import { Logger } from '../../../services/logger';
import { of, throwError } from 'rxjs';
import { CaseTypeResponse } from '../../../services/clients/api-client';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReferenceDataService } from 'src/app/services/reference-data.service';

describe('CaseTypesMenuComponent', () => {
    let component: CaseTypesMenuComponent;
    let fixture: ComponentFixture<CaseTypesMenuComponent>;
    let refDataServiceSpy: jasmine.SpyObj<ReferenceDataService>;
    const caseType = 'caseType1';

    beforeEach(async () => {
        refDataServiceSpy = jasmine.createSpyObj('ReferenceDataService', ['getCaseTypes']);
        refDataServiceSpy.getCaseTypes.and.returnValue(of([new CaseTypeResponse({ name: caseType })]));
        await TestBed.configureTestingModule({
            imports: [NgSelectModule, ReactiveFormsModule],
            declarations: [CaseTypesMenuComponent],
            providers: [
                HttpClient,
                HttpHandler,
                FormBuilder,
                { provide: Logger, useValue: new MockLogger() },
                { provide: ReferenceDataService, useValue: refDataServiceSpy }
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
        expect(compiled.querySelector('.govuk-label').textContent).toContain('Services');
    });

    describe('enable', () => {
        it('should call base enable function, to enable this component', () => {
            component.enabled();
            expect(component.form.controls[component.formGroupName].enabled).toEqual(true);
        });
        it('should call base enable function, to disable this component', () => {
            component.disabled();
            expect(component.form.controls[component.formGroupName].enabled).toEqual(false);
        });
    });

    describe('loadItems', () => {
        it('should call video hearing service', () => {
            component.loadItems();
            expect(refDataServiceSpy.getCaseTypes).toHaveBeenCalled();
            expect(component.caseTypes).toContain('caseType1');
        });

        it('should call video hearing service, and catch thrown exception', () => {
            refDataServiceSpy.getCaseTypes.and.returnValue(throwError({ status: 404 }));

            const handleListErrorSpy = spyOn(component, 'handleListError');
            component.loadItems();
            expect(refDataServiceSpy.getCaseTypes).toHaveBeenCalled();
            expect(handleListErrorSpy).toHaveBeenCalled();
        });
    });

    describe('onSelect', () => {
        it('should select Service', () => {
            component.loadItems();
            component.form.controls[component.formGroupName].setValue(caseType);
            component.onSelect();
            expect(component.selectedEmitter.emit).toHaveBeenCalledWith(caseType as any);
        });
    });
});
