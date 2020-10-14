import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { WaitPopupComponent } from './wait-popup.component';

describe('WaitPopupComponent', () => {
    let component: WaitPopupComponent;
    let fixture: ComponentFixture<WaitPopupComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [WaitPopupComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(WaitPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create wait pop up component', () => {
        expect(component).toBeTruthy();
    });
});
