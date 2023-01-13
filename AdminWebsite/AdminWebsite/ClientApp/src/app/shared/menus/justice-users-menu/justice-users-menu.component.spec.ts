import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JusticeUsersMenuComponent } from './justice-users-menu.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { MockLogger } from '../../testing/mock-logger';
import { Logger } from '../../../services/logger';

describe('JusticeUsersMenuComponent', () => {
    let component: JusticeUsersMenuComponent;
    let fixture: ComponentFixture<JusticeUsersMenuComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [JusticeUsersMenuComponent],
            providers: [HttpClient, HttpHandler, FormBuilder,
                {provide: Logger, useValue: new MockLogger}]
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

});
