import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ParticipantModel } from '../../common/model/participant.model';
import { ParticipantsListComponent } from './participants-list.component';
import { RouterTestingModule } from '@angular/router/testing';
import { BookingService } from '../../services/booking.service';

const router = {
  navigate: jasmine.createSpy('navigate'),
  url: '/summary'
};

let bookingServiceSpy: jasmine.SpyObj<BookingService>;

describe('ParticipantsListComponent', () => {
  let component: ParticipantsListComponent;
  let fixture: ComponentFixture<ParticipantsListComponent>;
  let debugElement: DebugElement;
  bookingServiceSpy = jasmine.createSpyObj<BookingService>('BookingService', ['setEditMode', 'setParticipantEmail']);
  const pat1 = new ParticipantModel();
  pat1.title = 'Mrs';
  pat1.first_name = 'Sam';
  const participants: ParticipantModel[] = [
    pat1, pat1
  ];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ParticipantsListComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: BookingService, useValue: bookingServiceSpy },
        ],
        imports: [RouterTestingModule],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantsListComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;

    fixture.detectChanges();
  });

  it('should create participants list component', () => {
    expect(component).toBeTruthy();
  });
  it('should display participants and elements of class vhlink should be found', (done) => {
    component.participants = participants;
    fixture.whenStable().then(
      () => {
        fixture.detectChanges();
        const elementArray = debugElement.queryAll(By.css('.vhlink'));
        expect(elementArray.length).toBeGreaterThan(0);
        expect(elementArray.length).toBe(4);
        done();
      }
    );
  });
  it('previous url summary', () => {
    component.ngOnInit();
    expect(component.isSummaryPage).toBeTruthy();
    expect(component.isEditRemoveVisible).toBeTruthy();
  });
  it('should edit judge details', () => {
    component.editJudge();
    fixture.detectChanges();
    expect(bookingServiceSpy.setEditMode).toHaveBeenCalled();
  });
  it('should edit participant details', () => {
    component.editParticipant('email@aa.aa');
    fixture.detectChanges();
    expect(bookingServiceSpy.setEditMode).toHaveBeenCalled();
    expect(component.isSummaryPage).toBeTruthy();
    expect(bookingServiceSpy.setEditMode).toHaveBeenCalledWith();
    expect(router.navigate).toHaveBeenCalled();
  });
  it('should emit on remove', () => {
    spyOn(component.$selectedForRemove, 'emit');
    component.removeParticipant('email@aa.aa');
    expect(component.$selectedForRemove.emit).toHaveBeenCalled();
  });
});
