import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { SharedModule } from 'src/app/shared/shared.module';
import { ParticipantModel } from '../../common/model/participant.model';
import { ClientSettingsResponse } from '../../services/clients/api-client';
import { ConfigService } from '../../services/config.service';
import { Logger } from '../../services/logger';
import { SearchService } from '../../services/search.service';
import { SearchEmailComponent } from './search-email.component';
import { DebugElement, ElementRef } from '@angular/core';
import { LaunchDarklyService } from 'src/app/services/launch-darkly.service';

describe('SearchEmailComponent', () => {
    let component: SearchEmailComponent;
    let debugElement: DebugElement;
    let fixture: ComponentFixture<SearchEmailComponent>;
    let searchField: ElementRef;

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
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;

    beforeEach(() => {
        searchServiceSpy = jasmine.createSpyObj<SearchService>('SearchService', ['participantSearch']);
        configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);

        configServiceSpy.getClientSettings.and.returnValue(of(configSettings));
        loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['info', 'error']);

        TestBed.configureTestingModule({
            declarations: [SearchEmailComponent],
            imports: [SharedModule],
            providers: [
                { provide: SearchService, useValue: searchServiceSpy },
                { provide: ConfigService, useValue: configServiceSpy },
                { provide: Logger, useValue: loggerSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SearchEmailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        debugElement = fixture.debugElement;
    });
    it('should have have an email field with locator participantEmail by default', () => {
        searchField = debugElement.query(By.css(`#${component.locator}`));
        expect(searchField.nativeElement).toBeTruthy();
    });
    it('should have have an email field with locator judgeEmail for judge detail search', () => {
        component.locator = 'judge-email';
        fixture.detectChanges();
        searchField = debugElement.query(By.css(`#${component.locator}`));
        expect(searchField.nativeElement).toBeTruthy();
    });
    it('should have have an email field with locator staffMemberEmail for staff member detail search', () => {
        component.locator = 'staff-member-email';
        fixture.detectChanges();
        searchField = debugElement.query(By.css(`#${component.locator}`));
        expect(searchField.nativeElement).toBeTruthy();
    });
    it('should have empty list of participant models', () => {
        expect(component.results).toBeTruthy();
        expect(component.results.length).toBe(0);
    });
    it('should set up intial properties', () => {
        expect(component.isValidEmail).toBeTruthy();
        expect(component.$subscriptions.length).toBeGreaterThan(0);
        expect(component.isErrorEmailAssignedToJudge).toBeFalsy();
        expect(component.isJoh).toBeFalsy();
        expect(component.disabled).toBeTruthy();
    });
    it('should return true if participant is a judge', () => {
        component.hearingRoleParticipant = 'Judge';
        expect(component.isJudge).toBeTruthy();
    });
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

    it('should show showCreateNewUserWarning when EJudFeature flag is OFF and no results found from search service', () => {
        component.notFoundParticipant = true;

        component.ngOnInit();
        fixture.detectChanges();
        component.hearingRoleParticipant = 'Panel Member';
        expect(component.showCreateNewUserWarning).toBe(true);
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
    it('select item should not emit on navigating away from email field when email is changed but role is not judge', () => {
        spyOn(component.findParticipant, 'emit');
        const participantsList: ParticipantModel[] = [];
        component.results = participantsList;
        component.hearingRoleParticipant = 'NotJudge';
        const email = 'citizen.one@hmcts.net';
        const changedEmail = 'citizen.two@hmcts.net';
        component.initialValue = email;

        component.populateParticipantInfo(changedEmail);
        fixture.detectChanges();
        expect(component.isShowResult).toBeFalsy();
        expect(component.findParticipant.emit).not.toHaveBeenCalled();
    });
    it('select item should not emit on navigating away from email field when email is unchanged and role is not judge', () => {
        spyOn(component.findParticipant, 'emit');
        const participantsList: ParticipantModel[] = [];
        component.results = participantsList;
        component.hearingRoleParticipant = 'NotJudge';
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
    it('should emit event email is changed if searched email does not exist in non-empty results', () => {
        const existingParticipant = new ParticipantModel({
            email: 'YOSXJDKSD@hmcts.net',
            first_name: 'YOSXJDKSD',
            last_name: 'YOSXJDKSD'
        });

        const existingParticipants: ParticipantModel[] = [];
        existingParticipants.push(existingParticipant);

        component.results = existingParticipants;
        component.email = 'sd@hmcts.net';
        component.invalidPattern = '@hearings.reform.hmcts.net';
        spyOn(component.emailChanged, 'emit');
        component.blurEmail();
        fixture.detectChanges();

        expect(component.emailChanged.emit).toHaveBeenCalled();
    });
    it('should not emit event email is changed if searched email is invalid and does not exist in non-empty results', () => {
        const existingParticipant = new ParticipantModel({
            email: 'YOSXJDKSD@hmcts.net',
            first_name: 'YOSXJDKSD',
            last_name: 'YOSXJDKSD'
        });

        const existingParticipants: ParticipantModel[] = [];
        existingParticipants.push(existingParticipant);

        component.results = existingParticipants;
        component.email = 'sds';
        component.invalidPattern = '@hearings.reform.hmcts.net';
        spyOn(component.emailChanged, 'emit');
        component.blurEmail();
        fixture.detectChanges();

        expect(component.emailChanged.emit).toHaveBeenCalledTimes(0);
    });
    it('should find data and set notFoundParticipant to false', () => {
        component.setData(participantList);
        expect(component.results).toEqual(participantList);
        expect(component.isShowResult).toBeTruthy();
        expect(component.isValidEmail).toBeTruthy();
        expect(component.notFoundParticipant).toBeFalsy();
    });
    it('should set notFoundParticipant to true', () => {
        spyOn(component.emailNotFoundEvent, 'next');
        component.noDataFound();
        expect(component.isShowResult).toBeFalsy();
        expect(component.notFoundParticipant).toBeTruthy();
        expect(component.emailNotFoundEvent.next).toHaveBeenCalled();
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

    describe('searchTerm', () => {
        it('should set correct errors when too few characters', fakeAsync(() => {
            component.isShowResult = true;
            component.notFoundParticipant = true;
            component.emailNotFoundEvent.next();

            const subscription = component.emailFoundEvent.subscribe(() => {
                expect(component.isShowResult).toBe(false);
                expect(component.notFoundParticipant).toBe(false);

                subscription.unsubscribe();
            });

            component.searchTerm.next('a');
            tick(2000);
        }));
    });
});

describe('SearchEmailComponent email validate', () => {
    const configSettings = new ClientSettingsResponse();
    configSettings.test_username_stem = '@hmcts.net';

    const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
    const searchServiceSpy = jasmine.createSpyObj<SearchService>('SearchService', ['participantSearch']);
    const configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings']);
    configServiceSpy.getClientSettings.and.returnValue(of(configSettings));

    const loggerSpy = jasmine.createSpyObj<Logger>('Logger', ['info', 'error']);

    const component = new SearchEmailComponent(searchServiceSpy, configServiceSpy, loggerSpy);
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
