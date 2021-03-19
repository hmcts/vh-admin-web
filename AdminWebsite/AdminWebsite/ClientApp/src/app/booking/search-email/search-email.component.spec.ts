import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';
import { ParticipantModel } from '../../common/model/participant.model';
import { ClientSettingsResponse, PersonResponse } from '../../services/clients/api-client';
import { ConfigService } from '../../services/config.service';
import { Logger } from '../../services/logger';
import { SearchService } from '../../services/search.service';
import { SearchEmailComponent } from './search-email.component';

describe('SeachEmailComponent', () => {
    let component: SearchEmailComponent;
    let fixture: ComponentFixture<SearchEmailComponent>;
    const participantList: PersonResponse[] = JSON.parse(
        `
    [
      {
        "id": 1,
        "contact_email": "vb.email1@hmcts.net",
        "role": "Appellant",
        "title": "Mrs",
        "first_name": "Alisa",
        "middle_names":"No",
        "last_name": "Smith",
        "photelephone_numberne": "1111222222",
        "username": "vb.email1@hmcts.net"
      },
      {
        "id": 2,
        "contact_email": "vb.email2@hmcts.net",
        "role": "Appellant",
        "title": "Mrs",
        "first_name": "Alisa",
        "middle_names":"No",
        "last_name": "Smith",
        "telephone_number": "1111222222",
        "username": "vb.email2@hmcts.net"
      }
    ]
    `
    );

    const participantModel = new ParticipantModel();
    participantModel.email = 'aa@hmcts.net';
    participantModel.first_name = 'Ann';
    participantModel.last_name = 'Smith';
    participantModel.title = 'Mrs';
    participantModel.case_role_name = 'Respondent';
    participantModel.hearing_role_name = 'Litigant in person';
    participantModel.phone = '12345678';
    participantModel.display_name = 'Ann';

    const configSettings = new ClientSettingsResponse();
    configSettings.test_username_stem = '@hmcts.net';

    let searchServiceSpy: jasmine.SpyObj<SearchService>;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    beforeEach(() => {
        searchServiceSpy = jasmine.createSpyObj<SearchService>('SearchService', ['search']);
        configServiceSpy = jasmine.createSpyObj<ConfigService>('CongigService', ['getClientSettings']);
        configServiceSpy.getClientSettings.and.returnValue(of(configSettings));
        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['info', 'error']);

        TestBed.configureTestingModule({
            declarations: [SearchEmailComponent],
            imports: [SharedModule],
            providers: [
                { provide: SearchService, useValue: searchServiceSpy },
                { provide: ConfigService, useValue: configServiceSpy },
                { provide: Logger, useValue: loggerSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SearchEmailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });
    it(
        'should have empty list of participant models',
        waitForAsync(() => {
            expect(component.results).toBeTruthy();
            expect(component.results.length).toBe(0);
        })
    );
    it('should search service return list of person and map it to result list', done => {
        searchServiceSpy.search.and.returnValue(of(participantList));
        component.ngOnInit();
        fixture.detectChanges();

        done();

        expect(component.results).toBeTruthy();
        expect(component.results.length).toEqual(0);
    });
    it('should validate email', () => {
        component.email = 'email@hmcts.tt.net';
        component.invalidPattern = '@hmcts.net';
        component.validateEmail();
        expect(component.isValidEmail).toBeTruthy();
    });
    it('should validate email and return false for invalid email', () => {
        component.email = 'email.aa.aa';
        component.invalidPattern = '@hmcts.net';

        component.validateEmail();
        expect(component.isValidEmail).toBeFalsy();
    });
    it('should clear email', () => {
        component.email = 'email@hmcts.net';
        component.clearEmail();
        expect(component.email).toEqual('');
        expect(component.isValidEmail).toBeTruthy();
        expect(component.notFoundParticipant).toBeFalsy();
    });
    it('should validate input email if email was not found in the list', () => {
        component.email = 'email@hmcts.tt.net';
        fixture.detectChanges();
        component.blurEmail();
        expect(component.isValidEmail).toBeTruthy();
        expect(component.notFoundParticipant).toBeFalsy();
    });
    it('should close drop down on the click outside', () => {
        component.isShowResult = true;
        component.blur();
        expect(component.isShowResult).toBeFalsy();
    });
    it('select item should emit event participant found', () => {
        spyOn(component.findParticipant, 'emit');

        component.selectItemClick(participantModel);
        fixture.detectChanges();
        expect(component.isShowResult).toBeFalsy();
        expect(component.findParticipant.emit).toHaveBeenCalled();
    });
    it('select item should emit event participant found on navigating away from email field', () => {
        spyOn(component.findParticipant, 'emit');
        const participantsList: ParticipantModel[] = [];
        const participant = new ParticipantModel();
        participant.email = 'citizen.one@hmcts.net';
        participant.first_name = 'citizen';
        participant.last_name = 'one';
        participantModel.title = 'Mr.';
        participantModel.case_role_name = 'Respondent';
        participantModel.hearing_role_name = 'Litigant in person';
        participantModel.phone = '12345678';
        participantModel.display_name = 'Citizen One';
        participantsList.push(participant);
        component.results = participantsList;

        component.populateParticipantInfo('citizen.one@hmcts.net');
        fixture.detectChanges();
        expect(component.isShowResult).toBeFalsy();
        expect(component.findParticipant.emit).toHaveBeenCalled();
    });
    it('select item should emit event participant found on navigating away from email field', () => {
        spyOn(component.findParticipant, 'emit');
        const participantsList: ParticipantModel[] = [];
        component.results = participantsList;

        component.populateParticipantInfo('citizen.one@hmcts.net');
        fixture.detectChanges();
        expect(component.isShowResult).toBeFalsy();
        expect(component.findParticipant.emit).not.toHaveBeenCalled();
    });
    it('should disable email address', fakeAsync(() => {
        fixture.detectChanges();

        const emailEl = fixture.debugElement.query(By.css('#participantEmail'));

        component.disabled = true;
        tick(600);
        fixture.detectChanges();
        expect(emailEl.nativeElement.disabled).toBeTruthy();
    }));
    it('should enable email address', fakeAsync(() => {
        fixture.detectChanges();
        const emailEl = fixture.debugElement.query(By.css('#participantEmail'));
        component.disabled = true;
        tick(600);
        fixture.detectChanges();
        component.disabled = false;
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
    it('should emit event email is changed if searched emails array is empty', () => {
        component.results = [];
        spyOn(component.emailChanged, 'emit');
        component.blurEmail();
        fixture.detectChanges();

        expect(component.notFoundParticipant).toBeFalsy();
        expect(component.emailChanged.emit).toHaveBeenCalled();
    });
    it('should map PersonResponse to ParticipantModel', () => {
        const person = new PersonResponse({
            contact_email: 'aa@hmcts.net',
            first_name: 'Sam',
            last_name: 'Green',
            title: 'Ms',
            middle_names: 'No',
            telephone_number: '11111111',
            username: 'aa@hmcts.net',
            organisation: 'Name of a company'
        });

        const model = component.mapPersonResponseToParticipantModel(person);

        expect(model.email).toEqual(person.contact_email);
        expect(model.first_name).toEqual(person.first_name);
        expect(model.last_name).toEqual(person.last_name);
        expect(model.middle_names).toEqual(person.middle_names);
        expect(model.title).toEqual(person.title);
        expect(model.phone).toEqual(person.telephone_number);
        expect(model.username).toEqual(person.username);
        expect(model.company).toEqual(person.organisation);
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
    it('should set notFoundParticipant to false if less that 3 letters input', () => {
        component.lessThanThreeLetters();
        expect(component.isShowResult).toBeFalsy();
        expect(component.notFoundParticipant).toBeFalsy();
    });
    it('should unsubscribe subscription on destroy', () => {
        component.ngOnDestroy();
        expect(component.$subscriptions[0].closed).toBe(true);
        expect(component.$subscriptions[1].closed).toBe(true);
    });
});

describe('SearchEmailComponent email validate', () => {
    let component: SearchEmailComponent;
    const configSettings = new ClientSettingsResponse();
    configSettings.test_username_stem = '@hmcts.net';

    let searchServiceSpy: jasmine.SpyObj<SearchService>;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    searchServiceSpy = jasmine.createSpyObj<SearchService>('SearchService', ['search']);
    configServiceSpy = jasmine.createSpyObj<ConfigService>('CongigService', ['getClientSettings']);
    configServiceSpy.getClientSettings.and.returnValue(of(configSettings));
    loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['info', 'error']);

    component = new SearchEmailComponent(searchServiceSpy, configServiceSpy, loggerSpy);
    it('should config service return email pattern for validation', fakeAsync(() => {
        configServiceSpy.getClientSettings.and.returnValue(of(configSettings));
        component.getEmailPattern();
        tick();
        expect(component.invalidPattern).toBe('@hmcts.net');
        expect(loggerSpy.info).toHaveBeenCalled();
    }));
    it('should log error if config service return no email pattern for validation', fakeAsync(() => {
        configSettings.test_username_stem = '';
        configServiceSpy.getClientSettings.and.returnValue(of(configSettings));
        component.getEmailPattern();
        tick();
        expect(component.invalidPattern).toBe('');
        expect(loggerSpy.error).toHaveBeenCalled();
    }));
});
