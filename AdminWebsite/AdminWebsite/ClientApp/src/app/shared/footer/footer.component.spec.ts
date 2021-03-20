import { Location } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { DashboardStubComponent } from 'src/app/testing/stubs/dashboard-stub';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
    let component: FooterComponent;
    let fixture: ComponentFixture<FooterComponent>;
    let location: Location;
    let router: Router;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [FooterComponent, DashboardStubComponent],
                imports: [RouterTestingModule.withRoutes([{ path: 'dashboard', component: DashboardStubComponent }])],
                schemas: [NO_ERRORS_SCHEMA]
            }).compileComponents();
        })
    );

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
