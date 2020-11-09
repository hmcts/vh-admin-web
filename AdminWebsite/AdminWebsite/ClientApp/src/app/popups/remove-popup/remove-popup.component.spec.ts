import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RemovePopupComponent } from './remove-popup.component';

describe('RemovePopupComponent', () => {
    let component: RemovePopupComponent;
    let fixture: ComponentFixture<RemovePopupComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [RemovePopupComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(RemovePopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create remove popup component', () => {
        expect(component).toBeTruthy();
    });
});
