import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BookingService } from 'src/app/services/booking.service';
import { Logger } from 'src/app/services/logger';
import { ParticipantItemComponent } from './participant-item.component';

const router = {
    navigate: jasmine.createSpy('navigate'),
    url: '/summary'
};

const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['error', 'debug', 'warn']);
let bookingServiceSpy: jasmine.SpyObj<BookingService>;

describe('ParticipantItemComponent', () => {
    let component: ParticipantItemComponent;
    let fixture: ComponentFixture<ParticipantItemComponent>;
    let debugElement: DebugElement;

    bookingServiceSpy = jasmine.createSpyObj<BookingService>('BookingService', ['setEditMode', 'setParticipantEmail']);

    const participant: any = {
        title: 'Mrs',
        first_name: 'Sam'
    };

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [ParticipantItemComponent],
                providers: [
                    { provide: Router, useValue: router },
                    { provide: Logger, useValue: loggerSpy },
                    { provide: BookingService, useValue: bookingServiceSpy },
                    { provide: Router, useValue: router }
                ],
                imports: [RouterTestingModule]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ParticipantItemComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;

        fixture.detectChanges();
    });

    it('should create participants list component', () => {
        expect(component).toBeTruthy();
    });

    it('should edit judge details', () => {
        component.editJudge();
        fixture.detectChanges();
        expect(bookingServiceSpy.setEditMode).toHaveBeenCalled();
    });

    it('should edit participant details', () => {
        component.isSummaryPage = true;
        component.editParticipant({ email: 'email@hmcts.net', is_exist_person: false, is_judge: false });
        fixture.detectChanges();
        expect(bookingServiceSpy.setEditMode).toHaveBeenCalled();
        expect(bookingServiceSpy.setEditMode).toHaveBeenCalledWith();
        expect(router.navigate).toHaveBeenCalled();
    });
});
