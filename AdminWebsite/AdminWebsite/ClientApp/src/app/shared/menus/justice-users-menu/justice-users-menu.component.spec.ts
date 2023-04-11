import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JusticeUsersMenuComponent } from './justice-users-menu.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { MockLogger } from '../../testing/mock-logger';
import { Logger } from '../../../services/logger';
import { JusticeUsersService } from 'src/app/services/justice-users.service';
import { BehaviorSubject } from 'rxjs';
import { JusticeUserResponse } from '../../../services/clients/api-client';

describe('JusticeUsersMenuComponent', () => {
    let component: JusticeUsersMenuComponent;
    let fixture: ComponentFixture<JusticeUsersMenuComponent>;
    let justiceUsersServiceSpy: jasmine.SpyObj<JusticeUsersService>;

    beforeEach(async () => {
        justiceUsersServiceSpy = jasmine.createSpyObj('JusticeUsersService', ['allUsers$']);
        justiceUsersServiceSpy.allUsers$ = new BehaviorSubject<JusticeUserResponse[]>([]);
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
});
