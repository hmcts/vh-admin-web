import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaseTypesMenuComponent } from './case-types-menu.component';

describe('CaseTypesMenuComponent', () => {
    let component: CaseTypesMenuComponent;
    let fixture: ComponentFixture<CaseTypesMenuComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CaseTypesMenuComponent]
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
