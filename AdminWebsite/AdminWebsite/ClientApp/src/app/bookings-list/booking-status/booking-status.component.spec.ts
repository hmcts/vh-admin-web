import { BookingStatusComponent } from './booking-status.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MomentModule } from 'ngx-moment';
import { VHBooking } from 'src/app/common/model/vh-booking';

describe('BookingStatusComponent', () => {
    let component: BookingStatusComponent;
    let fixture: ComponentFixture<BookingStatusComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BookingStatusComponent],
            imports: [MomentModule]
        }).compileComponents();

        fixture = TestBed.createComponent(BookingStatusComponent);
        component = fixture.componentInstance;
        component.bookingDetails = {} as any;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('statusMessage', () => {
        it('should return Confirmed when status is Created', () => {
            component.bookingDetails = { status: 'Created' } as VHBooking;
            expect(component.statusMessage).toBe('Confirmed');
        });
        it('should return Confirmed when status is ConfirmedWithoutJudge', () => {
            component.bookingDetails = { status: 'ConfirmedWithoutJudge' } as VHBooking;
            expect(component.statusMessage).toBe('Confirmed');
        });
        it('should return Cancelled when status is Cancelled', () => {
            component.bookingDetails = { status: 'Cancelled' } as VHBooking;
            expect(component.statusMessage).toBe('Cancelled');
        });
        it('should return Failed when status is Failed', () => {
            component.bookingDetails = { status: 'Failed' } as VHBooking;
            expect(component.statusMessage).toBe('Failed');
        });
        it('should return null when status is anything else', () => {
            component.bookingDetails = { status: 'anything else' } as VHBooking;
            expect(component.statusMessage).toBe(null);
        });
    });

    describe('hasNoJudge', () => {
        it('should return true when status is BookedWithoutJudge', () => {
            component.bookingDetails = { status: 'BookedWithoutJudge' } as VHBooking;
            expect(component.hasNoJudge).toBe(true);
        });

        it('should return false when status is ConfirmedWithoutJudge', () => {
            component.bookingDetails = { status: 'ConfirmedWithoutJudge' } as VHBooking;
            expect(component.hasNoJudge).toBe(true);
        });
    });
});
