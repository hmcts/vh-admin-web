import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subscription } from 'rxjs';
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

    const participant1 = new ParticipantModel();
    participant1.first_name = 'FirstName1';
    participant1.last_name = 'LastName1';
    participant1.display_name = 'DisplayName1';
    participant1.email = 'Email1';
    participant1.username = 'Username1';
    participant1.title = 'Title1';

    const participant2 = new ParticipantModel();
    participant2.first_name = 'FirstName2';
    participant2.last_name = 'LastName2';
    participant2.display_name = 'DisplayName2';
    participant2.email = 'Email2';
    participant2.username = 'Username2';
    participant2.title = 'Title2';

    const participantList: ParticipantModel[] = [participant1, participant2];

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
        searchServiceSpy = jasmine.createSpyObj<SearchService>('SearchService', ['participantSearch']);
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
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
    it('should set email to initialEmail', () => {
        const emailValue = 'email@value.com';
        component.initialValue = emailValue;
        component.ngOnInit();
        fixture.detectChanges();

        expect(component.email).toEqual(emailValue);
    });
    it('should search service return list of person and map it to result list', done => {
        searchServiceSpy.participantSearch.and.returnValue(of(participantList));
        component.ngOnInit();
        fixture.detectChanges();

        done();

        expect(component.results).toBeTruthy();
        expect(component.results.length).toEqual(0);
    });
    it('should validate email', () => {
        component.invalidPattern = 'courtroom.net';
        component.email = 'email@hmcts.net';
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
        component.invalidPattern = 'courtroom.net';
        component.email = 'email@hmcts.net';
        fixture.detectChanges();
        component.blurEmail();
        expect(component.isValidEmail).toBeTruthy();
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
    it('select item should not emit event participant found on navigating away from email field', () => {
        spyOn(component.findParticipant, 'emit');
        const participantsList: ParticipantModel[] = [];
        component.results = participantsList;

        component.populateParticipantInfo('citizen.one@hmcts.net');
        fixture.detectChanges();
        expect(component.isShowResult).toBeFalsy();
        expect(component.findParticipant.emit).not.toHaveBeenCalled();
    });
    it('select item should emit null on navigating away from email field when hearing role is judge', () => {
        spyOn(component.findParticipant, 'emit');
        const participantsList: ParticipantModel[] = [];
        component.results = participantsList;
        component.hearingRoleParticipant = 'Judge';

        component.populateParticipantInfo('citizen.one@hmcts.net');
        fixture.detectChanges();
        expect(component.isShowResult).toBeFalsy();
        expect(component.findParticipant.emit).toHaveBeenCalled();
        expect(component.findParticipant.emit).toHaveBeenCalledWith(null);
    });
    it('select item should not emit on navigating away from email field when hearing role is judge but email is unchanged', () => {
        spyOn(component.findParticipant, 'emit');
        const participantsList: ParticipantModel[] = [];
        component.results = participantsList;
        component.hearingRoleParticipant = 'Judge';
        const email = 'citizen.one@hmcts.net';
        component.initialValue = email;

        component.populateParticipantInfo(email);
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

    it('should find data and set notFoundParticipant to false', () => {
        component.getData(participantList);
        expect(component.results).toEqual(participantList);
        expect(component.isShowResult).toBeTruthy();
        expect(component.isValidEmail).toBeTruthy();
        expect(component.notFoundParticipant).toBeFalsy();
    });
    it('should set notFoundParticipant to true', () => {
        spyOn(component.notFoundEmailEvent, 'next');
        component.noDataFound();
        expect(component.isShowResult).toBeFalsy();
        expect(component.notFoundParticipant).toBeTruthy();
        expect(component.notFoundEmailEvent.next).toHaveBeenCalled();
    });
    it('should set notFoundParticipant to false if less that 3 letters input', () => {
        component.lessThanThreeLetters();
        expect(component.isShowResult).toBeFalsy();
        expect(component.notFoundParticipant).toBeFalsy();
    });
    it('should set isErrorEmailAssignedToJudge  to false if onChange is called', () => {
        component.isErrorEmailAssignedToJudge = true;
        component.onChange();
        expect(component.isErrorEmailAssignedToJudge).toBe(false);
    });
    it('should unsubscribe subscription on destroy', () => {
        component.ngOnDestroy();
        expect(component.$subscriptions[0].closed).toBe(true);
        expect(component.$subscriptions[1].closed).toBe(true);
    });

    describe('getData', () => {});

    describe('searchTerm', () => {
        it('should set correct errors when too few characters', fakeAsync(() => {
            component.isShowResult = true;
            component.notFoundParticipant = true;
            component.notFoundEmailEvent.next(true);

            const subscription = component.notFoundEmailEvent.subscribe(emailEvent => {
                expect(emailEvent).toBe(false);
                expect(component.isShowResult).toBe(false);
                expect(component.notFoundParticipant).toBe(false);

                subscription.unsubscribe();
            });

            component.searchTerm.next('a');
            tick(500);
        }));
    });
});

describe('SearchEmailComponent email validate', () => {
    let component: SearchEmailComponent;
    const configSettings = new ClientSettingsResponse();
    configSettings.test_username_stem = '@hmcts.net';

    let searchServiceSpy: jasmine.SpyObj<SearchService>;
    let configServiceSpy: jasmine.SpyObj<ConfigService>;
    let loggerSpy: jasmine.SpyObj<Logger>;

    searchServiceSpy = jasmine.createSpyObj<SearchService>('SearchService', ['participantSearch']);
    configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
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
