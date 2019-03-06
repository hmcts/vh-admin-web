import { DebugElement } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { ParticipantDetailsComponent } from './participant-details.component';
import { ParticipantDetailsModel } from '../../common/model/participant-details.model';

describe('ParticipantDetailsComponent', () => {

  let component: ParticipantDetailsComponent;
  let fixture: ComponentFixture<ParticipantDetailsComponent>;
  let debugElement: DebugElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ParticipantDetailsComponent],
      imports: [RouterTestingModule],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantDetailsComponent);
    debugElement = fixture.debugElement;
    component = debugElement.componentInstance;

    fixture.detectChanges();
  });

  it('should create component', (() => {
    expect(component).toBeTruthy();
  }));

  it('should display participant details', (done => {
    let pr = new ParticipantDetailsModel('1', 'Mrs', 'Alan', 'Brake', 'Citizen', 'email.p1@email.com', 'email@ee.ee');

    component.participant = pr;

    fixture.whenStable().then(
      () => {
        fixture.detectChanges();
        const divElementRole = debugElement.queryAll(By.css('#participant_role'));
        expect(divElementRole.length).toBeGreaterThan(0);
        expect(divElementRole.length).toBe(1);
        let el = divElementRole[0].nativeElement as HTMLElement;
        expect(el.innerHTML).toContain('Citizen');
        done();
      }
    );
  }));
});
