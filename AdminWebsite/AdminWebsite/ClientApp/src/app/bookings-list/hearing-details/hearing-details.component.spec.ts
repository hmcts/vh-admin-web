import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { ParticipantDetailsModel } from 'src/app/common/model/participant-details.model';
import { LongDatetimePipe } from '../../../app/shared/directives/date-time.pipe';
import { BookingsDetailsModel } from '../../common/model/bookings-list.model';
import { HearingDetailsComponent } from './hearing-details.component';
import { ActivatedRoute } from '@angular/router';
import { ClientSettingsResponse } from 'src/app/services/clients/api-client';
import { Logger } from '../../services/logger';
import { OtherInformationModel } from '../../common/model/other-information.model';
import { ConfigService } from 'src/app/services/config.service';
import { of } from 'rxjs';
import { FeatureFlags, LaunchDarklyService } from '../../services/launch-darkly.service';
import { SharedModule } from 'src/app/shared/shared.module';

const launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);

describe('HearingDetailsComponent', () => {
    launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.vhoWorkAllocation).and.returnValue(of(true));
    let component: HearingDetailsComponent;
    let fixture: ComponentFixture<HearingDetailsComponent>;
    let debugElement: DebugElement;
    const clientSettings = new ClientSettingsResponse({
        tenant_id: 'tenantid',
        client_id: 'clientid',
        post_logout_redirect_uri: '/dashboard',
        redirect_uri: '/dashboard',
        join_by_phone_from_date: '2019-10-22 13:58:40.3730067'
    });
    const configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getClientSettings', 'getConfig']);
    configServiceSpy.getConfig.and.returnValue(clientSettings);
    const h1 = new BookingsDetailsModel(
        '1',
        new Date('2019-10-22 13:58:40.3730067'),
        120,
        'XX3456234565',
        'Smith vs Donner',
        'Tax',
        'JadgeGreen',
        '33A',
        'Coronation Street',
        'Jhon Smith',
        new Date('2018-10-22 13:58:40.3730067'),
        'Roy Ben',
        new Date('2018-10-22 13:58:40.3730067'),
        null,
        null,
        'Booked',
        true,
        'reason1',
        'Financial Remedy',
        'judge.green@hmcts.net',
        '1234567',
        'true'
    );
    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [HearingDetailsComponent, LongDatetimePipe],
            imports: [RouterTestingModule, SharedModule],
            providers: [
                Logger,
                { provide: ConfigService, useValue: configServiceSpy },
                { provide: LaunchDarklyService, useValue: launchDarklyServiceSpy }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(HearingDetailsComponent);
        debugElement = fixture.debugElement;
        component = debugElement.componentInstance;
        component.hearing = h1;
        component.hearing.OtherInformation = JSON.stringify(OtherInformationModel.init(component.hearing.OtherInformation));

        fixture.detectChanges();
    });

    it('should create component', () => {
        expect(component).toBeTruthy();
    });

    it('should display hearing details', done => {
        const phoneDetails = '11111 (ID: 1234567)';
        fixture.whenStable().then(() => {
            fixture.detectChanges();
            console.log(component.hearing);
            const divElementRole = debugElement.queryAll(By.css('#hearing-name'));
            expect(divElementRole.length).toBeGreaterThan(0);
            expect(divElementRole.length).toBe(1);
            const el = divElementRole[0].nativeElement as HTMLElement;
            expect(el.innerHTML).toContain('Smith vs Donner');
            component.phoneDetails = phoneDetails;
            expect(component.phoneConferenceDetails).toBe(phoneDetails);
            done();
        });
    });

    it('it should display the participant and representee', () => {
        const participants: Array<ParticipantDetailsModel> = [];
        const participant = new ParticipantDetailsModel(
            '123-123',
            'Judge',
            'Judge',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'case_role_name',
            'hearing_role_name',
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '12345678',
            'interpretee',
            false,
            null
        );
        participants.push(participant);
        component.participants = participants;
        const result = component.getDefenceAdvocateByContactEmail(participant.Email);
        expect(result).toBe('display_name, representing representee');
    });
    it('it should display the participant and representee', () => {
        const participants: Array<ParticipantDetailsModel> = [];
        const participant = new ParticipantDetailsModel(
            '123-123',
            'Judge',
            'Judge',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'case_role_name',
            'hearing_role_name',
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '',
            'interpretee',
            false,
            null
        );
        participants.push(participant);
        component.participants = participants;
        const result = component.getDefenceAdvocateByContactEmail('madeup@doesnotexist.com');
        expect(result).toBe('');
    });
    describe('feature flag turn on and off ', () => {
        it('should not show allocated to label if work allocation feature flag is off', async () => {
            launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.vhoWorkAllocation).and.returnValue(of(false));
            await component.ngOnInit();
            fixture.detectChanges();
            const divToHide = fixture.debugElement.query(By.css('#hearing-allocated-to'));
            expect(divToHide).toBeFalsy();
        });

        it('should show allocated to label if work allocation feature flag is on', async () => {
            launchDarklyServiceSpy.getFlag.withArgs(FeatureFlags.vhoWorkAllocation).and.returnValue(of(true));
            await component.ngOnInit();
            fixture.detectChanges();
            const divToHide = fixture.debugElement.query(By.css('#hearing-allocated-to'));
            expect(divToHide).toBeTruthy();
        });
    });
});
describe('HearingDetailsComponent join by phone', () => {
    const clientSettings = new ClientSettingsResponse({
        tenant_id: 'tenantid',
        client_id: 'clientid',
        post_logout_redirect_uri: '/dashboard',
        redirect_uri: '/dashboard',
        join_by_phone_from_date: ''
    });
    const activatedRoute = new ActivatedRoute();
    const configServiceSpy = jasmine.createSpyObj<ConfigService>('ConfigService', ['getConfig']);
    configServiceSpy.getConfig.and.returnValue(clientSettings);
    const loggerSpy: jasmine.SpyObj<Logger> = jasmine.createSpyObj('Logger', ['error', 'event', 'debug', 'info', 'warn']);
    const hearing = new BookingsDetailsModel(
        '1',
        new Date('2019-10-22 13:58:40.3730067'),
        120,
        'XX3456234565',
        'Smith vs Donner',
        'Tax',
        'JadgeGreen',
        '33A',
        'Coronation Street',
        'Jhon Smith',
        new Date('2018-10-22 13:58:40.3730067'),
        'Roy Ben',
        new Date('2018-10-22 13:58:40.3730067'),
        null,
        new Date('2020-10-22 13:58:40.3730067'),
        'Booked',
        true,
        'reason1',
        'Financial Remedy',
        'judge.green@hmcts.net',
        '1234567'
    );
    it('should display option to join by phone if config has not the set date', () => {
        const component = new HearingDetailsComponent(activatedRoute, loggerSpy, configServiceSpy, launchDarklyServiceSpy);
        component.hearing = hearing;
        const result = component.isJoinByPhone();
        expect(result).toBe(true);
    });
    it('should not display option to join by phone if booking has not confirmation date', () => {
        clientSettings.join_by_phone_from_date = '2020-10-22';
        hearing.ConfirmedDate = null;
        const component = new HearingDetailsComponent(activatedRoute, loggerSpy, configServiceSpy, launchDarklyServiceSpy);
        component.hearing = hearing;
        const result = component.isJoinByPhone();
        expect(result).toBe(false);
    });
    it('should not display option to join by phone if booking confirmation date less than config date', () => {
        clientSettings.join_by_phone_from_date = '2020-10-22';
        hearing.ConfirmedDate = new Date('2020-10-21');
        const component = new HearingDetailsComponent(activatedRoute, loggerSpy, configServiceSpy, launchDarklyServiceSpy);
        component.hearing = hearing;
        const result = component.isJoinByPhone();
        expect(result).toBe(false);
    });
    it('should display option to join by phone if booking confirmation date greater than config date', () => {
        clientSettings.join_by_phone_from_date = '2020-10-22';
        hearing.ConfirmedDate = new Date('2020-10-23');
        const component = new HearingDetailsComponent(activatedRoute, loggerSpy, configServiceSpy, launchDarklyServiceSpy);
        component.hearing = hearing;
        const result = component.isJoinByPhone();
        expect(result).toBe(true);
    });
});
