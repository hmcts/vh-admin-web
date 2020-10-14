import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SignOutPopupComponent } from './sign-out-popup.component';

describe('CancelPopupComponent', () => {
    let component: SignOutPopupComponent;
    let fixture: ComponentFixture<SignOutPopupComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [SignOutPopupComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(SignOutPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create sign out popup component', () => {
        expect(component).toBeTruthy();
    });
});
