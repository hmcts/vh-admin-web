import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreeningFormComponent as ScreeningFormComponent } from './screening-form.component';

describe('ScreeningFormComponent', () => {
    let component: ScreeningFormComponent;
    let fixture: ComponentFixture<ScreeningFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ScreeningFormComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ScreeningFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
