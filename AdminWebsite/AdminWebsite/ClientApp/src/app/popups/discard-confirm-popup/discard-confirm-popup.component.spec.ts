import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DiscardConfirmPopupComponent } from './discard-confirm-popup.component';

describe('DiscardConfirmPopupComponent', () => {
    let component: DiscardConfirmPopupComponent;
    let fixture: ComponentFixture<DiscardConfirmPopupComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [DiscardConfirmPopupComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(DiscardConfirmPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create cancel pop up component', () => {
        expect(component).toBeTruthy();
    });
});
