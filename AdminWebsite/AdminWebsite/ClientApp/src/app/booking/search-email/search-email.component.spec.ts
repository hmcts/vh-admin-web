import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';

import { PersonResponse } from '../../services/clients/api-client';
import { SearchService } from '../../services/search.service';
import { SearchEmailComponent } from './search-email.component';
import { ParticipantModel } from '../../common/model/participant.model';
import { By } from '@angular/platform-browser';

describe('SeachEmailComponent', () => {
  let component: SearchEmailComponent;
  let fixture: ComponentFixture<SearchEmailComponent>;
  const participantList: PersonResponse[] = JSON.parse(
    `
    [
      {
        "id": 1,
        "contact_email": "vb.email1@go.couk",
        "role": "Appellant",
        "title": "Mrs",
        "first_name": "Alisa",
        "middle_names":"No",
        "last_name": "Smith",
        "photelephone_numberne": "1111222222",
        "username": "vb.email1@go.couk"
      },
      {
        "id": 2,
        "contact_email": "vb.email2@go.couk",
        "role": "Appellant",
        "title": "Mrs",
        "first_name": "Alisa",
        "middle_names":"No",
        "last_name": "Smith",
        "telephone_number": "1111222222",
        "username": "vb.email2@go.couk"
      }
    ]
    `
  );

  const participantModel = new ParticipantModel();
  participantModel.email = 'aa@aa.aa';
  participantModel.first_name = 'Ann';
  participantModel.last_name = 'Smith';
  participantModel.title = 'Mrs';
  participantModel.case_role_name = 'Defendant';
  participantModel.hearing_role_name = 'Defendant LIP';
  participantModel.phone = '12345678';
  participantModel.display_name = 'Ann';

  let searchServiceSpy: jasmine.SpyObj<SearchService>;

  beforeEach(() => {
    searchServiceSpy = jasmine.createSpyObj<SearchService>('SearchService', ['search']);

    TestBed.configureTestingModule({
      declarations: [SearchEmailComponent],
      imports: [SharedModule],
      providers: [{ provide: SearchService, useValue: searchServiceSpy }]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SearchEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create participant email search component', async(() => {
    expect(component).toBeTruthy();
    expect(component.searchService).toBeTruthy();
  }));
  it('should detect emailInput element', async(() => {
    expect(component.emailInput).toBeTruthy();
    expect(component.emailInput.nativeElement).toBeTruthy();

  }));
  it('should have empty list of participant models', async(() => {
    expect(component.results).toBeTruthy();
    expect(component.results.length).toBe(0);
  }));
  it('should search service return list of person and map it to result list', (done) => {
    searchServiceSpy.search.and.returnValue(of(participantList));
    component.ngOnInit();
    fixture.detectChanges();

    done();

    expect(component.results).toBeTruthy();
    expect(component.results.length).toEqual(0);
  });

  it('should validate email', () => {
    component.email = 'email@aa.aa';
    component.validateEmail();
    expect(component.isValidEmail).toBeTruthy();
  });
  it('should validate email and return false for invalid email', () => {
    component.email = 'email.aa.aa';
    component.validateEmail();
    expect(component.isValidEmail).toBeFalsy();
  });
  it('should clear email', () => {
    component.email = 'email@aa.aa';
    component.clearEmail();
    expect(component.email).toEqual('');
    expect(component.isValidEmail).toBeTruthy();
    expect(component.notFoundParticipant).toBeFalsy();
  });
  it('should validate input email if email was not found in the list', () => {
    component.email = 'email@aa.aa';
    fixture.detectChanges();
    component.blurEmail();
    expect(component.isValidEmail).toBeTruthy();
    expect(component.notFoundParticipant).toBeFalsy();
  });
  it('should close drop down on the click outside', () => {
    component.isShowResult = true;
    const elem = fixture.debugElement.nativeElement.querySelector('document');
    component.clickedOutside(elem);
    expect(component.isShowResult).toBeFalsy();
  });
  it('select item should emit event participant found', () => {
    spyOn(component.findParticipant, 'emit');

    component.selectItemClick(participantModel);
    fixture.detectChanges();
    expect(component.isShowResult).toBeFalsy();
    expect(component.findParticipant.emit).toHaveBeenCalled();

  });
  it('should disable email address', fakeAsync(() => {
    fixture.detectChanges();

    const emailEl = fixture.debugElement.query(By.css('#participantEmail'));

    component.setEmailDisabled(true);
    tick(600);
    fixture.detectChanges();
    expect(emailEl.nativeElement.disabled).toBeTruthy();
  }));
  it('should enable email address', fakeAsync(() => {
    fixture.detectChanges();
    const emailEl = fixture.debugElement.query(By.css('#participantEmail'));
    component.setEmailDisabled(true);
    tick(600);
    fixture.detectChanges();
    component.setEmailDisabled(false);
    tick(600);
    fixture.detectChanges();
    expect(emailEl.nativeElement.disabled).toBeFalsy();
  }));
  it('should show message not found participant for given email', () => {
    component.results = null;
    spyOn(component.emailChanged, 'emit');
    component.blurEmail();
    fixture.detectChanges();

    expect(component.notFoundParticipant).toBeFalsy();
    expect(component.emailChanged.emit).toHaveBeenCalled();

  });
  it('should map PersonResponse to ParticipantModel', () => {
    const person = new PersonResponse({
      contact_email: 'aa@aa.aa',
      first_name: 'Sam',
      last_name: 'Green',
      title: 'Ms',
      middle_names: 'No',
      telephone_number: '11111111',
      username: 'aa@aa.aa'
    });

    const model = component.mapPersonResponseToParticipantModel(person);

    expect(model.email).toEqual(person.contact_email);
    expect(model.first_name).toEqual(person.first_name);
    expect(model.last_name).toEqual(person.last_name);
    expect(model.middle_names).toEqual(person.middle_names);
    expect(model.title).toEqual(person.title);
    expect(model.phone).toEqual(person.telephone_number);
    expect(model.username).toEqual(person.username);

  });
  it('should mapping return empty ParticipantModel if  PersonResponse is null', () => {
    const person = null;
    const model = component.mapPersonResponseToParticipantModel(person);
    expect(model).toEqual(undefined);
  });
  it('should find data and set notFoundParticipant to false', () => {
    component.getData(participantList);
    expect(component.isShowResult).toBeTruthy();
    expect(component.isValidEmail).toBeTruthy();
    expect(component.notFoundParticipant).toBeFalsy();
  });
  it('should set notFoundParticipant to true', () => {
    spyOn(component.participantsNotFound, 'emit');
    component.noDataFound();
    expect(component.isShowResult).toBeFalsy();
    expect(component.notFoundParticipant).toBeTruthy();
    expect(component.participantsNotFound.emit).toHaveBeenCalled();
  });
});
