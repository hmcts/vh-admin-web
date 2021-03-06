import { Router } from '@angular/router';
import { ParticipantEditResultModel } from 'src/app/common/model/participant-edit-result.model';
import { ParticipantEditService } from 'src/app/services/participant-edit-service.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { EditParticipantSearchResultsComponent } from './edit-participant-search-results.component';

const result = new ParticipantEditResultModel('123456789', 'John Doe', 'John', 'Doe', 'john.doe@hmcts.net');

describe('EditParticipantSearchResultsComponent', () => {
    let component: EditParticipantSearchResultsComponent;
    let service: jasmine.SpyObj<ParticipantEditService>;
    let router: jasmine.SpyObj<Router>;
    beforeEach(async () => {
        service = jasmine.createSpyObj<ParticipantEditService>('ParticipantEditService', ['assignParticipantToEdit']);
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

        component = new EditParticipantSearchResultsComponent(service, router);
        component.contactEmail = 'john@hmcts.net';
        component.result = result;
    });

    it('should return false when user exists', () => {
        expect(component.userNotFound).toBeFalsy();
    });

    it('should return true when user is not found', () => {
        component.result = null;
        expect(component.userNotFound).toBeTruthy();
    });

    it('should track participant selected for update', () => {
        component.editParticipant();

        expect(service.assignParticipantToEdit).toHaveBeenCalledWith(result);
        expect(router.navigateByUrl).toHaveBeenCalledWith(PageUrls.EditParticipant);
    });

    it('should return not found warning text', () => {
        component.isUnauthorisedSearch = false;
        // tslint:disable-next-line: quotemark
        expect(component.warningText).toContain("we can't find a user");
    });

    it('should return unauthorised warning text', () => {
        component.isUnauthorisedSearch = true;
        expect(component.warningText).toContain('Judge accounts cannot be edited');
    });
});
