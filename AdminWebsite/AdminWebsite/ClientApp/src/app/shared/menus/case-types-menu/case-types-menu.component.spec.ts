import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseTypesMenuComponent } from './case-types-menu.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { MockLogger } from '../../testing/mock-logger';
import { Logger } from '../../../services/logger';

describe('CaseTypesMenuComponent', () => {
    let component: CaseTypesMenuComponent;
    let fixture: ComponentFixture<CaseTypesMenuComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CaseTypesMenuComponent],
            providers: [HttpClient, HttpHandler, FormBuilder, { provide: Logger, useValue: new MockLogger() }]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(CaseTypesMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
