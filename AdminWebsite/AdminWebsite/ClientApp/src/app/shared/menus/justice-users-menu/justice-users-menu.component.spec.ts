import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JusticeUsersMenuComponent } from './justice-users-menu.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import { MockLogger } from '../../testing/mock-logger';
import { Logger } from '../../../services/logger';
import { JusticeUsersService } from 'src/app/services/justice-users.service';
import { BehaviorSubject } from 'rxjs';
import { JusticeUserResponse } from '../../../services/clients/api-client';
import {NgSelectModule} from "@ng-select/ng-select";

describe('JusticeUsersMenuComponent', () => {
    let component: JusticeUsersMenuComponent;
    let fixture: ComponentFixture<JusticeUsersMenuComponent>;
    let justiceUsersServiceSpy: jasmine.SpyObj<JusticeUsersService>;
    const users: JusticeUserResponse[] = [];
    const user1 = new JusticeUserResponse({
        id: '123',
        full_name: 'Test User'
    });
    users.push(user1);

    beforeEach(async () => {
        justiceUsersServiceSpy = jasmine.createSpyObj('JusticeUsersService', ['allUsers$']);
        justiceUsersServiceSpy.allUsers$ = new BehaviorSubject<JusticeUserResponse[]>(users);
        await TestBed.configureTestingModule({
            declarations: [JusticeUsersMenuComponent],
            imports: [NgSelectModule, ReactiveFormsModule],
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

    describe('ngOnInit', () => {
        it('should load items', () => {
            component.ngOnInit();
            expect(component.items.length).toBe(users.length);
            expect(component.items[0].id).toBe(user1.id);
            expect(component.items[0].full_name).toBe(user1.full_name);
        });
    });
});
