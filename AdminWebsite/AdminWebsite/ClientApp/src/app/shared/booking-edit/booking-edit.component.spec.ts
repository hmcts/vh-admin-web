import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BookingService } from '../../services/booking.service';
import { BookingEditComponent } from './booking-edit.component';

describe('BookingEditComponent', () => {
    let component: BookingEditComponent;
    let fixture: ComponentFixture<BookingEditComponent>;
    let debugElement: DebugElement;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                imports: [RouterTestingModule],
                declarations: [BookingEditComponent],
                providers: [BookingService]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(BookingEditComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;

        fixture.detectChanges();
    });

    it('should create booking edit component', () => {
        expect(component).toBeTruthy();
    });
    it('should get the default url to edited page', () => {
        expect(component.editLink).toEqual('/');
    });
    it('should get the url to edited page', () => {
        component.editLink = 'summary';
        expect(component.editLink).toEqual('/summary');
    });
});
