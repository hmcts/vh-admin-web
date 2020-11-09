import { ParticipantDetailsModel } from './participant-details.model';

describe('participant details model', () => {
    it('should get full Name', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'title',
            'first_name',
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
            '007867678678'
        );

        expect(model.fullName).toEqual('title first_name last_name');
    });

    it('should get full Name of judge without title when first name is judge', () => {
        const model = new ParticipantDetailsModel(
            'id',
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
            '007867678678'
        );

        expect(model.fullName).toEqual('Judge last_name');
    });

    it('should get full Name of judge without title when last name is judge', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'Judge',
            'first_name',
            'Judge',
            'user_role_name',
            'username',
            'contact_email',
            'case_role_name',
            'hearing_role_name',
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678'
        );

        expect(model.fullName).toEqual('first_name Judge');
    });

    it('should return true when user is representative', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'title',
            'first_name',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'case_role_name',
            'Representative',
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678'
        );

        expect(model.isRepresenting).toBeTruthy();
    });

    it('should return false when user is not representative', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'title',
            'first_name',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'case_role_name',
            'Individual',
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678'
        );

        expect(model.isRepresenting).toBeFalsy();
    });
    it('should return false when case role is none', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'title',
            'first_name',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'none',
            'Individual',
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678'
        );
        expect(model.showCaseRole()).toBeFalsy();
    });
    it('should return false when case role is observer', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'title',
            'first_name',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'observer',
            'Individual',
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678'
        );
        expect(model.showCaseRole()).toBeFalsy();
    });
    it('should return true when case role is representative', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'title',
            'first_name',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'Representative',
            'Individual',
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678'
        );
        expect(model.showCaseRole()).toBeTruthy();
    });
});
