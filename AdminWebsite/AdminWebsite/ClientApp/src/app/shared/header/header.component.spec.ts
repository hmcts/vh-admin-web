import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, Event, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './header.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ReplaySubject } from 'rxjs';

describe('HeaderComponent', () => {
    let httpClient: jasmine.SpyObj<HttpClient>;
    let routerEventReplaySubject = new ReplaySubject<Event>(1);
    const routerMock = {
        url: '',
        navigate: jasmine.createSpy('navigate'),
        events: routerEventReplaySubject.asObservable()
    };
    describe('view', () => {
        let component: HeaderComponent;
        let fixture: ComponentFixture<HeaderComponent>;

        beforeEach(() => {
            routerEventReplaySubject = new ReplaySubject<Event>(1);
            routerMock.events = routerEventReplaySubject.asObservable();
            httpClient = jasmine.createSpyObj<HttpClient>(['head']);

            TestBed.configureTestingModule({
                declarations: [HeaderComponent],
                providers: [
                    { provide: Router, useValue: routerMock },
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

        beforeEach(() => {
            routerEventReplaySubject = new ReplaySubject<Event>(1);
            routerMock.events = routerEventReplaySubject.asObservable();
            TestBed.configureTestingModule({
                declarations: [HeaderComponent],
                providers: [
                    { provide: Router, useValue: routerMock },
                    { provide: HttpClient, useValue: httpClient }
                ],
                schemas: [NO_ERRORS_SCHEMA]
            }).compileComponents();

            const fixture = TestBed.createComponent(HeaderComponent);
            fixture.detectChanges();
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
            expect(routerMock.navigate).toHaveBeenCalledWith([component.topMenuItems[0].url]);
        });

        it('should update the active menu item when the router matches the menu item url', () => {
            const navigationEndEvent = new NavigationEnd(0, '/dashboard', '/dashboard');
            routerMock.url = '/dashboard';
            component.topMenuItems[0].active = false;
            routerEventReplaySubject.next(navigationEndEvent);
            expect(component.topMenuItems[0].active).toBeTruthy();
        });
    });
});
