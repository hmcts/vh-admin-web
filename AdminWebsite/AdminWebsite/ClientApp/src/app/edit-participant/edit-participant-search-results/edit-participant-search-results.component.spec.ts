import { Router } from '@angular/router';
import { ParticipantEditResultModel } from 'src/app/common/model/participant-edit-result.model';
import { Logger } from 'src/app/services/logger';
import { ParticipantEditService } from 'src/app/services/participant-edit-service.service';
import { PageUrls } from 'src/app/shared/page-url.constants';
import { EditParticipantSearchResultsComponent } from './edit-participant-search-results.component';

const result = new ParticipantEditResultModel('123456789', 'John Doe', 'John', 'Doe', 'john.doe@hearing.com');

describe('EditParticipantSearchResultsComponent', () => {
    let component: EditParticipantSearchResultsComponent;
    let service: jasmine.SpyObj<ParticipantEditService>;
    let router: jasmine.SpyObj<Router>;
    beforeEach(async () => {
        service = jasmine.createSpyObj<ParticipantEditService>('ParticipantEditService', ['assignParticipantToEdit']);
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

        component = new EditParticipantSearchResultsComponent(service, router);
        component.contactEmail = 'john@doe.com';
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
});
