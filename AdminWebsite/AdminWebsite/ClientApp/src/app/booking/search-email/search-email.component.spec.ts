import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';

import { IParticipantRequest } from '../../services/clients/api-client';
import { SearchService } from '../../services/search.service';
import { SearchEmailComponent } from './search-email.component';

describe('SeachEmailComponent', () => {
  let component: SearchEmailComponent;
  let fixture: ComponentFixture<SearchEmailComponent>;
  const participantList: IParticipantRequest[] = JSON.parse(
    `
    [
      {
        "id": 1,
        "email": "vb.email1@go.couk",
        "role": "Appellant",
        "title": "Mrs",
        "firstName": "Alise",
        "lastName": "Smith",
        "phone": "1111222222",
        "organisationId": 3
      },
      {
        "id": 2,
        "email": "vb.email2@go.couk",
        "role": "Appellant",
        "title": "Mrs",
        "firstName": "Alise",
        "lastName": "Smith",
        "phone": "1111222222",
        "organisationId": 3
      }
    ]
    `
  );

  let searchServiceSpy: jasmine.SpyObj<SearchService>;

  beforeEach(() => {
    searchServiceSpy = jasmine.createSpyObj<SearchService>('SearchService', ['search']);
    searchServiceSpy.search.and.returnValue(of(participantList));

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
  }));

  it('should get serach term and email should be equal to term', async(() => {
    searchServiceSpy.search.and.returnValue(of(participantList));

    fixture.detectChanges();
    component.searchTerm.subscribe((term) => {
      expect(term).toBe('ema');
    });
    component.searchTerm.next('ema');
    expect(component.email).toEqual('ema');
   // expect(component.results).toBeTruthy();
  }));
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
  });
  it('should validate input email if email was not found in the list', () => {
    component.email = 'email@aa.aa';
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
});
