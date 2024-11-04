import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VenuesMenuComponent } from './venues-menu.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MockLogger } from '../../testing/mock-logger';
import { Logger } from '../../../services/logger';
import { HearingVenueResponse } from '../../../services/clients/api-client';
import { of, throwError } from 'rxjs';
import { ReferenceDataService } from '../../../services/reference-data.service';
import { NgSelectModule } from '@ng-select/ng-select';

describe('VenuesMenuComponent', () => {
    let component: VenuesMenuComponent;
    let fixture: ComponentFixture<VenuesMenuComponent>;
    let refDataServiceSpy: jasmine.SpyObj<ReferenceDataService>;

    beforeEach(async () => {
        refDataServiceSpy = jasmine.createSpyObj('ReferenceDataService', ['getCourts']);
        refDataServiceSpy.getCourts.and.returnValue(of([new HearingVenueResponse()]));

        await TestBed.configureTestingModule({
            imports: [NgSelectModule, ReactiveFormsModule],
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
        component.selectedEmitter = jasmine.createSpyObj('selectedEmitter', ['emit']);
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
            component.enabled();
            expect(component.form.controls[component.formGroupName].enabled).toEqual(true);
        });
        it('should call base enable function, to disable this component', () => {
            component.disabled();
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

    describe('onSelect', () => {
        it('should select venue', () => {
            const venueId = 1;
            refDataServiceSpy.getCourts.and.returnValue(of([new HearingVenueResponse({ id: venueId, name: 'London' })]));
            component.loadItems();
            component.form.controls[component.formGroupName].setValue(venueId);
            component.onSelect();
            expect(component.selectedEmitter.emit).toHaveBeenCalledWith(venueId as any);
        });
    });
});
