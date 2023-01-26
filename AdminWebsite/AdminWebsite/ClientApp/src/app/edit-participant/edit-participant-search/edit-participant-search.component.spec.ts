import { FormBuilder } from '@angular/forms';
import { ParticipantEditResultModel } from 'src/app/common/model/participant-edit-result.model';
import { BookHearingException } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logger';
import { ParticipantEditService } from 'src/app/services/participant-edit-service.service';
import { EditParticipantSearchComponent } from './edit-participant-search.component';

const existingPerson = new ParticipantEditResultModel('123456789', 'John Doe', 'John', 'Doe', 'john.doe@hmcts.net');

describe('EditParticipantSearchComponent', () => {
    let component: EditParticipantSearchComponent;
    let service: jasmine.SpyObj<ParticipantEditService>;
    let formBuilder: FormBuilder;
    const logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'error', 'warn']);

    beforeAll(() => {
        service = jasmine.createSpyObj<ParticipantEditService>('ParticipantEditService', ['searchForPerson']);
        formBuilder = new FormBuilder();
    });

    beforeEach(() => {
        component = new EditParticipantSearchComponent(formBuilder, service, logger);
        service.searchForPerson.and.returnValue(Promise.resolve(existingPerson));
        component.ngOnInit();
    });

    it('should init form', () => {
        const contactEmail = 'unit@hmcts.net';
        component.form.setValue({ contactEmail: contactEmail });
        expect(component.contactEmail.value).toBe(contactEmail);

        expect(component.hasSearched).toBeFalsy();
        expect(component.loadingData).toBeFalsy();
        expect(component.result).toBeUndefined();
    });

    it('should not search when input is empty', async () => {
        const contactEmail = '';
        component.form.setValue({ contactEmail: contactEmail });

        await component.search();

        expect(service.searchForPerson).toHaveBeenCalledTimes(0);
    });

    it('should update result on successful search', async () => {
        const contactEmail = 'john@hmcts.net';
        component.form.setValue({ contactEmail: contactEmail });

        await component.search();

        expect(component.hasSearched).toBeTruthy();
        expect(component.result).toBe(existingPerson);
    });

    it('should update result on unsuccessful search', async () => {
        const contactEmail = 'john@hmcts.net';
        component.form.setValue({ contactEmail: contactEmail });
        service.searchForPerson.and.returnValue(Promise.resolve(null));

        await component.search();

        expect(component.hasSearched).toBeTruthy();
        expect(component.result).toBe(null);
    });

    it('should update result on unauthorised search', async () => {
        const contactEmail = 'john@hmcts.net';
        const exception = new BookHearingException('Unauthorized', 401, 'Only searches for non Judge persons are allowed', null, null);
        service.searchForPerson.and.callFake(() => {
            throw exception;
        });

        await component.getResults(contactEmail);
        expect(component.unauthorisedParticipant).toBeTruthy();
    });

    it('should reset search on clear', () => {
        component.hasSearched = true;
        component.result = existingPerson;

        component.clearSearch();

        expect(component.hasSearched).toBeFalsy();
        expect(component.result).toBeUndefined();
    });
});
