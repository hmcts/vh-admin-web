import { Location } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { DashboardStubComponent } from 'src/app/testing/stubs/dashboard-stub';
import { FooterComponent } from './footer.component';
import { BHClient } from 'src/app/services/clients/api-client';
import { of } from 'rxjs';

describe('FooterComponent', () => {
    let component: FooterComponent;
    let fixture: ComponentFixture<FooterComponent>;
    let location: Location;
    let router: Router;
    let bhClientSpy: jasmine.SpyObj<BHClient>;

    beforeEach(waitForAsync(() => {
        bhClientSpy = jasmine.createSpyObj('BHClient', ['getAppVersion']);
        bhClientSpy.getAppVersion.and.returnValue(of({ app_version: '1.0.0', init: () => {}, toJSON: () => ({}) }));
        TestBed.configureTestingModule({
            declarations: [FooterComponent, DashboardStubComponent],
            imports: [RouterTestingModule.withRoutes([{ path: 'dashboard', component: DashboardStubComponent }])],
            providers: [{ provide: BHClient, useValue: bhClientSpy }],
            schemas: [NO_ERRORS_SCHEMA]
        }).compileComponents();
    }));

    beforeEach(() => {
        router = TestBed.inject(Router);
        location = TestBed.inject(Location);
        fixture = TestBed.createComponent(FooterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('navigate to dashboard you should see contact us link in the footer', fakeAsync(() => {
        router.navigate(['dashboard']);
        tick();
        expect(location.path()).toBe('/dashboard');
        expect(component.hideContactUsLink).toBeFalsy();
    }));
});
