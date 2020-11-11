import { fakeAsync, flushMicrotasks, tick, waitForAsync } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { HearingsByUsernameForDeletionResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logger';
import { ParticipantDeleteService } from 'src/app/services/participant-delete-service.service';
import { DeleteParticipantSearchComponent } from './delete-participant-search.component';

const hearings = [
    new HearingsByUsernameForDeletionResponse({
        hearing_id: '11111',
        case_name: 'case1',
        case_number: '123',
        scheduled_date_time: new Date(),
        venue: 'venue1'
    }),
    new HearingsByUsernameForDeletionResponse({
        hearing_id: '22222',
        case_name: 'case2',
        case_number: '234',
        scheduled_date_time: new Date(),
        venue: 'venue2'
    }),
    new HearingsByUsernameForDeletionResponse({
        hearing_id: '33333',
        case_name: 'case3',
        case_number: '345',
        scheduled_date_time: new Date(),
        venue: 'venue1'
    })
];

let component: DeleteParticipantSearchComponent;
let service: jasmine.SpyObj<ParticipantDeleteService>;
let formBuilder: FormBuilder;
const logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'error', 'warn']);

describe('DeleteParticipantComponent user exists in query params', () => {
    const username = 'test@exists.com';
    const activatedRoute: any = { queryParams: of({ username }) };

    beforeAll(async () => {
        service = jasmine.createSpyObj<ParticipantDeleteService>('ParticipantDeleteServiceService', ['getHearingsForUsername']);
        formBuilder = new FormBuilder();
    });

    beforeEach(fakeAsync(() => {
        component = new DeleteParticipantSearchComponent(formBuilder, service, activatedRoute, logger);
        service.getHearingsForUsername.and.returnValue(Promise.resolve(hearings));
        component.ngOnInit();
        flushMicrotasks();
    }));

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should init form with username in query params and search', fakeAsync(() => {
        expect(component.username.value).toBe(username);
        expect(component.form.valid).toBeTruthy();
        expect(component.hasSearched).toBeTruthy();
        expect(component.results.length).toBe(hearings.length);
    }));
});

describe('DeleteParticipantComponent no user in query params', () => {
    const activatedRoute: any = { queryParams: of() };

    beforeAll(async () => {
        service = jasmine.createSpyObj<ParticipantDeleteService>('ParticipantDeleteServiceService', ['getHearingsForUsername']);
        formBuilder = new FormBuilder();
    });

    beforeEach(() => {
        component = new DeleteParticipantSearchComponent(formBuilder, service, activatedRoute, logger);
        service.getHearingsForUsername.and.returnValue(Promise.resolve(hearings));
        component.ngOnInit();
    });

    afterEach(() => {
        component.ngOnDestroy();
    });

    it('should init form', () => {
        const username = 'unit@test.com';
        component.form.setValue({ username: username });
        expect(component.username.value).toBe(username);

        expect(component.hasSearched).toBeFalsy();
        expect(component.loadingData).toBeFalsy();
        expect(component.results).toEqual([]);
    });

    it('should not search when input is empty', async () => {
        const username = '';
        component.form.setValue({ username: username });

        await component.search();

        expect(service.getHearingsForUsername).toHaveBeenCalledTimes(0);
    });

    it('should map hearings', async () => {
        const username = 'unit@test.com';
        component.form.setValue({ username: username });

        await component.search();

        expect(component.hasSearched).toBeTruthy();
        expect(component.results.length).toBe(hearings.length);
    });

    it('should not map for non-existent account', async () => {
        const username = 'unit@test.com';
        component.form.setValue({ username: username });
        service.getHearingsForUsername.and.returnValue(Promise.resolve(null));
        await component.search();

        expect(component.hasSearched).toBeTruthy();
        expect(component.results).toBeNull();
    });
});
