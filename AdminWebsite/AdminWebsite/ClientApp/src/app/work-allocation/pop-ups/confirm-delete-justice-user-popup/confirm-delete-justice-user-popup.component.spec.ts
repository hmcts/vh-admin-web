import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDeleteJusticeUserPopupComponent } from './confirm-delete-justice-user-popup.component';

describe('ConfirmDeleteJusticeUserPopupComponent', () => {
    let component: ConfirmDeleteJusticeUserPopupComponent;
    let fixture: ComponentFixture<ConfirmDeleteJusticeUserPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfirmDeleteJusticeUserPopupComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ConfirmDeleteJusticeUserPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
