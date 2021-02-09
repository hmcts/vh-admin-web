import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ParticipantEditResultModel } from 'src/app/common/model/participant-edit-result.model';
import { Logger } from 'src/app/services/logger';
import { ParticipantEditService } from 'src/app/services/participant-edit-service.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { EditParticipantComponent } from './edit-participant.component';

describe('EditParticipantComponent', () => {
    let component: EditParticipantComponent;
    const existingPerson = new ParticipantEditResultModel('123456789', 'John Doe', 'John', 'Doe', 'john.doe@hearing.com');

    let service: jasmine.SpyObj<ParticipantEditService>;
    let formBuilder: FormBuilder;
    const logger = jasmine.createSpyObj<Logger>('Logger', ['debug', 'info', 'error', 'warn']);
    let router: jasmine.SpyObj<Router>;

    beforeAll(async () => {
        formBuilder = new FormBuilder();
        service = jasmine.createSpyObj<ParticipantEditService>('ParticipantEditService', [
            'updateParticipantName',
            'retrieveParticipantToEdit'
        ]);
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    });

    beforeEach(() => {
        component = new EditParticipantComponent(service, router, formBuilder, logger);
        component.person = existingPerson;
        service.retrieveParticipantToEdit.and.returnValue(existingPerson);
    });

    it('should init form with existing participant to edit in service', () => {
        service.retrieveParticipantToEdit.and.returnValue(existingPerson);

        component.ngOnInit();

        expect(component.form).toBeDefined();
        expect(component.firstName.value).toBe(existingPerson.firstname);
        expect(component.lastName.value).toBe(existingPerson.lastName);
    });

    it('should return to edit search if participant is not selected', () => {
        service.retrieveParticipantToEdit.and.returnValue(null);

        component.ngOnInit();

        expect(component.form).toBeUndefined();
        expect(router.navigateByUrl).toHaveBeenCalledWith(PageUrls.EditParticipantSearch);
    });

    it('should return to dashboard on cancel', () => {
        component.cancelEdit();
        expect(router.navigateByUrl).toHaveBeenCalledWith(PageUrls.Dashboard);
    });

    it('should stop spinner when update fails', async () => {
        const error = { status: 401, isApiException: true };
        service.updateParticipantName.and.returnValue(Promise.reject(error));

        component.ngOnInit();
        await component.updateParticipant();

        expect(service.updateParticipantName).toHaveBeenCalledWith(
            existingPerson.personId,
            existingPerson.currentUsername,
            component.firstName.value,
            component.lastName.value
        );
        expect(component.showSpinner).toBeFalsy();
    });

    it('should show update sign on successful update', async () => {
        service.updateParticipantName.and.returnValue(Promise.resolve());
        component.ngOnInit();
        await component.updateParticipant();

        expect(service.updateParticipantName).toHaveBeenCalledWith(
            existingPerson.personId,
            existingPerson.currentUsername,
            component.firstName.value,
            component.lastName.value
        );
        expect(component.showSpinner).toBeFalsy();
        expect(component.updateComplete).toBeTruthy();
    });

    it('should not attempt to update when form is invalid', async () => {
        service.updateParticipantName.calls.reset();
        component.ngOnInit();
        component.firstName.setValue('');

        await component.updateParticipant();

        expect(service.updateParticipantName).toHaveBeenCalledTimes(0);
    });
});
