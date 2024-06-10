import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HeaderComponent } from './header.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

describe('HeaderComponent', () => {
    let httpClient: jasmine.SpyObj<HttpClient>;

    describe('view', () => {
        let component: HeaderComponent;
        let fixture: ComponentFixture<HeaderComponent>;

        beforeEach(() => {
            httpClient = jasmine.createSpyObj<HttpClient>(['head']);

            TestBed.configureTestingModule({
                declarations: [HeaderComponent],
                providers: [
                    { provide: Router, useValue: jasmine.createSpyObj<Router>(['navigate']) },
                    { provide: HttpClient, useValue: httpClient }
                ],
                schemas: [NO_ERRORS_SCHEMA]
            }).compileComponents();
            fixture = TestBed.createComponent(HeaderComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('user should see Signout button once logged in', () => {
            // component.ngOnInit();
            component.loggedIn = true;
            fixture.detectChanges();
            const signOutElement = fixture.debugElement.queryAll(By.css('#linkSignOut'));
            expect(signOutElement.length).toBeGreaterThan(0);
            const el = signOutElement[0].nativeElement as HTMLElement;
            expect(el.innerHTML).toContain('Sign out');
        });

        it('user should not see Signout button if not logged in', () => {
            // component.ngOnInit();
            component.loggedIn = false;
            fixture.detectChanges();
            const signOutElement = fixture.debugElement.queryAll(By.css('#linkSignOut'));
            expect(signOutElement.length).toBe(0);
        });

        it('user should confirm logout when pressing logout', () => {
            // component.ngOnInit();
            component.loggedIn = true;
            fixture.detectChanges();
            const signOutElement = fixture.debugElement.query(By.css('#linkSignOut'));
            spyOn(component.$confirmLogout, 'emit');
            signOutElement.triggerEventHandler('click', null);
            expect(component.$confirmLogout.emit).toHaveBeenCalled();
        });
    });

    describe('functionality:', () => {
        let component: HeaderComponent;
        let router: jasmine.SpyObj<Router>;

        beforeEach(() => {
            router = jasmine.createSpyObj<Router>(['navigate']);

            TestBed.configureTestingModule({
                declarations: [HeaderComponent],
                providers: [
                    { provide: Router, useValue: router },
                    { provide: HttpClient, useValue: httpClient }
                ],
                schemas: [NO_ERRORS_SCHEMA]
            }).compileComponents();

            const fixture = TestBed.createComponent(HeaderComponent);
            component = fixture.componentInstance;
        });

        it('header component should have top menu items', () => {
            expect(component.topMenuItems.length).toBeGreaterThan(0);
        });

        it('selected top menu item has active property set to true, others item active set to false', () => {
            component.loggedIn = true;
            component.navigateToSelectedMenuItem(0);
            expect(component.topMenuItems[0].active).toBeTruthy();
            if (component.topMenuItems.length > 1) {
                for (const item of component.topMenuItems.slice(1)) {
                    expect(item.active).toBeFalsy();
                }
            }
        });

        it('user should navigate by selecting top menu item', () => {
            component.navigateToSelectedMenuItem(0);
            expect(router.navigate).toHaveBeenCalledWith([component.topMenuItems[0].url]);
        });
    });
});
