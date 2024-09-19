import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreeningEnabledBageComponent } from './screening-enabled-badge.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { MockDirective } from 'ng-mocks';
import { TooltipDirective } from '../directives/tooltip.directive';

describe('ScreeningEnabledBageComponent', () => {
    let component: ScreeningEnabledBageComponent;
    let fixture: ComponentFixture<ScreeningEnabledBageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ScreeningEnabledBageComponent, MockDirective(TooltipDirective)],
            imports: [FontAwesomeModule, CommonModule]
        }).compileComponents();

        fixture = TestBed.createComponent(ScreeningEnabledBageComponent);
        component = fixture.componentInstance;
        component.screening = {
            measureType: 'All',
            protectFrom: []
        };
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
