import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VenuesMenuComponent } from './venues-menu.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { MockLogger } from '../../testing/mock-logger';
import { Logger } from '../../../services/logger';
import { HearingVenueResponse } from '../../../services/clients/api-client';
import { of, throwError } from 'rxjs';
import { ReferenceDataService } from '../../../services/reference-data.service';

describe('VenuesMenuComponent', () => {
    let component: VenuesMenuComponent;
    let fixture: ComponentFixture<VenuesMenuComponent>;
    let refDataServiceSpy: jasmine.SpyObj<ReferenceDataService>;

    beforeEach(async () => {
        refDataServiceSpy = jasmine.createSpyObj('ReferenceDataService', ['getCourts']);
        refDataServiceSpy.getCourts.and.returnValue(of([new HearingVenueResponse()]));

        await TestBed.configureTestingModule({
            declarations: [VenuesMenuComponent],
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
        fixture = TestBed.createComponent(VenuesMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render menu item', () => {
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.govuk-label').textContent).toContain('Venues');
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
        it('should call reference data service', () => {
            const expectedResponse = [new HearingVenueResponse()];
            component.loadItems();
            expect(refDataServiceSpy.getCourts).toHaveBeenCalled();
            expect(component.venues).toEqual(expectedResponse);
        });

        it('should call reference data service, and catch thrown exception', () => {
            refDataServiceSpy.getCourts.and.returnValue(throwError({ status: 404 }));

            const handleListErrorSpy = spyOn(component, 'handleListError');
            component.loadItems();
            expect(refDataServiceSpy.getCourts).toHaveBeenCalled();
            expect(handleListErrorSpy).toHaveBeenCalled();
        });
    });
});
