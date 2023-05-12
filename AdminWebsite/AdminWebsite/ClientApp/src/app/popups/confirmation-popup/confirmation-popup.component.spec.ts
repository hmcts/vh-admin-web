import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ConfirmationPopupComponent } from './confirmation-popup.component';

describe('ConfirmationPopupComponent', () => {
    let component: ConfirmationPopupComponent;
    let fixture: ComponentFixture<ConfirmationPopupComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ConfirmationPopupComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfirmationPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
