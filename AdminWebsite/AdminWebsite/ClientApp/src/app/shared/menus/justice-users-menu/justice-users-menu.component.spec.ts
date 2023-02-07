import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JusticeUsersMenuComponent } from './justice-users-menu.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { MockLogger } from '../../testing/mock-logger';
import { Logger } from '../../../services/logger';
import { of, throwError } from 'rxjs';
import { JusticeUserResponse } from '../../../services/clients/api-client';
import { JusticeUsersService } from 'src/app/services/justice-users.service';

describe('JusticeUsersMenuComponent', () => {
    let component: JusticeUsersMenuComponent;
    let fixture: ComponentFixture<JusticeUsersMenuComponent>;
    let justiceUsersServiceSpy: jasmine.SpyObj<JusticeUsersService>;

    beforeEach(async () => {
        justiceUsersServiceSpy = jasmine.createSpyObj('JusticeUsersService', ['retrieveJusticeUserAccounts']);
        justiceUsersServiceSpy.retrieveJusticeUserAccounts.and.returnValue(of([new JusticeUserResponse()]));

        await TestBed.configureTestingModule({
            declarations: [JusticeUsersMenuComponent],
            providers: [
                HttpClient,
                HttpHandler,
                FormBuilder,
                { provide: Logger, useValue: new MockLogger() },
                { provide: JusticeUsersService, useValue: justiceUsersServiceSpy }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(JusticeUsersMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render menu item', () => {
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.govuk-label').textContent).toContain('Allocated CSO');
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
            const expectedResponse = [new JusticeUserResponse()];
            component.loadItems();
            expect(justiceUsersServiceSpy.retrieveJusticeUserAccounts).toHaveBeenCalled();
            expect(component.users).toEqual(expectedResponse);
        });

        it('should call video hearing service, and catch thrown exception', () => {
            justiceUsersServiceSpy.retrieveJusticeUserAccounts.and.returnValue(throwError({ status: 404 }));

            const handleListErrorSpy = spyOn(component, 'handleListError');
            component.loadItems();
            expect(justiceUsersServiceSpy.retrieveJusticeUserAccounts).toHaveBeenCalled();
            expect(handleListErrorSpy).toHaveBeenCalled();
        });
    });
});
