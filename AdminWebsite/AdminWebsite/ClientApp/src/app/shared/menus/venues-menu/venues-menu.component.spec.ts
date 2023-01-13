import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VenuesMenuComponent } from './venues-menu.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { MockLogger } from '../../testing/mock-logger';
import { Logger } from '../../../services/logger';

describe('VenuesMenuComponent', () => {
    let component: VenuesMenuComponent;
    let fixture: ComponentFixture<VenuesMenuComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [VenuesMenuComponent],
            providers: [HttpClient, HttpHandler, FormBuilder,
                {provide: Logger, useValue: new MockLogger}]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(VenuesMenuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
