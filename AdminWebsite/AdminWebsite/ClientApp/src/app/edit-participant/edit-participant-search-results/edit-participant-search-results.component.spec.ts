import { ParticipantEditResultModel } from 'src/app/common/model/participant-edit-result.model';
import { EditParticipantSearchResultsComponent } from './edit-participant-search-results.component';

const result = new ParticipantEditResultModel('123456789', 'John Doe', 'john.doe@hearing.com');

describe('EditParticipantSearchResultsComponent', () => {
    let component: EditParticipantSearchResultsComponent;

    beforeEach(async () => {
        component = new EditParticipantSearchResultsComponent();
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
});
