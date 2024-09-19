import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreeningEnabledBageComponent } from './screening-enabled-badge.component';

describe('ScreeningEnabledBageComponent', () => {
    let component: ScreeningEnabledBageComponent;
    let fixture: ComponentFixture<ScreeningEnabledBageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ScreeningEnabledBageComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ScreeningEnabledBageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
