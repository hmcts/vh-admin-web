import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

import { HearingDetailsComponent } from './hearing-details.component';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';

describe('HearingDetailsComponent', () => {

  let component: HearingDetailsComponent;
  let fixture: ComponentFixture<HearingDetailsComponent>;
  let debugElement: DebugElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HearingDetailsComponent],
      imports: [RouterTestingModule],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingDetailsComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;

    fixture.detectChanges();
  });

  it('should create component', (() => {
    expect(component).toBeTruthy();
  }));

  it('should display hearing details', (done => {
    let h1 = new BookingsDetailsModel('1', new Date('2019-10-22 13:58:40.3730067'),
      120, 'XX3456234565', 'Smith vs Donner', 'Tax', 'JadgeGreen', '33A', 'Coronation Street',
      'Jhon Smith', new Date('2018-10-22 13:58:40.3730067'), 'Roy Ben', new Date('2018-10-22 13:58:40.3730067'));

    component.hearing = h1;

    fixture.whenStable().then(
      () => {
        fixture.detectChanges();
        const divElementRole = debugElement.queryAll(By.css('#hearing-name'));
        expect(divElementRole.length).toBeGreaterThan(0);
        expect(divElementRole.length).toBe(1);
        let el = divElementRole[0].nativeElement as HTMLElement;
        expect(el.innerHTML).toContain('Smith vs Donner');
        done();
      }
    );
  }));
});
