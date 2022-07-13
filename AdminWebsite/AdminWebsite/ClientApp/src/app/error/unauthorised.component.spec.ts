import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UnauthorisedComponent } from './unauthorised.component';

describe('UnauthorisedComponent', () => {
    let component: UnauthorisedComponent;
    let fixture: ComponentFixture<UnauthorisedComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [UnauthorisedComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(UnauthorisedComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
