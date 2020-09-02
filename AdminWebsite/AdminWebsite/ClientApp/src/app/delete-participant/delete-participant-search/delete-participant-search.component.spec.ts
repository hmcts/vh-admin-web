import { FormBuilder } from '@angular/forms';
import { HearingsByUsernameForDeletionResponse } from 'src/app/services/clients/api-client';
import { ParticipantDeleteServiceService } from 'src/app/services/participant-delete-service.service';
import { DeleteParticipantSearchComponent } from './delete-participant-search.component';

describe('DeleteParticipantComponent', () => {
    let component: DeleteParticipantSearchComponent;
    let service: jasmine.SpyObj<ParticipantDeleteServiceService>;
    let formBuilder: FormBuilder;

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

    beforeAll(async () => {
        service = jasmine.createSpyObj<ParticipantDeleteServiceService>('ParticipantDeleteServiceService', ['getHearingsForUsername']);
        formBuilder = new FormBuilder();
    });

    beforeEach(() => {
        component = new DeleteParticipantSearchComponent(formBuilder, service);
        service.getHearingsForUsername.and.returnValue(Promise.resolve(hearings));
        component.ngOnInit();
    });

    it('should init form', () => {
        const username = 'unit@test.com';
        component.form.setValue({ username: username });
        expect(component.username.value).toBe(username);

        expect(component.hasSearched).toBeFalsy();
        expect(component.loadingData).toBeFalsy();
        expect(component.results).toEqual([]);
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
