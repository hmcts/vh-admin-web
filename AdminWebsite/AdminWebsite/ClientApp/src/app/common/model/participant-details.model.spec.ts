import { ParticipantDetailsModel } from './participant-details.model';
import { ParticipantModel } from './participant.model';
import { HearingRoleCodes } from './hearing-roles.model';

describe('participant details model', () => {
    it('should get full Name', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'externalRefId',
            'title',
            'first_name',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'case_role_name',
            'hearing_role_name',
            'hearings_role_code',
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678',
            'interpretee',
            false,
            null
        );

        expect(model.fullName).toEqual('title first_name last_name');
    });

    it('should get full Name of judge without title when first name is judge', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'externalRefId',
            'Judge',
            'Judge',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'case_role_name',
            'hearing_role_name',
            'hearings_role_code',
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678',
            'interpretee',
            false,
            null
        );

        expect(model.fullName).toEqual('Judge last_name');
    });

    it('should get full Name of judge without title when last name is judge', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'externalRefId',
            'Judge',
            'first_name',
            'Judge',
            'user_role_name',
            'username',
            'contact_email',
            'case_role_name',
            'hearing_role_name',
            'hearings_role_code',
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678',
            'interpretee',
            false,
            null
        );

        expect(model.fullName).toEqual('first_name Judge');
    });

    it('should validate AAD Judge Email ', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'externalRefId',
            'Judge',
            'first_name',
            'Judge',
            'user_role_name',
            'username',
            'contact_email',
            'case_role_name',
            'hearing_role_name',
            'hearings_role_code',
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678',
            'interpretee',
            false,
            null
        );
        expect(ParticipantModel.IsEmailEjud(model.Email)).toBeFalsy();
    });
    it('should validate E-Judge email ', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'externalRefId',
            'Judge',
            'first_name',
            'Judge',
            'user_role_name',
            'username',
            'Judiciaryemail',
            'case_role_name',
            'hearing_role_name',
            'hearings_role_code',
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678',
            'interpretee',
            false,
            null
        );
        expect(ParticipantModel.IsEmailEjud(model.Email)).toBeTruthy();
    });
    it('should return true when user is representative', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'externalRefId',
            'title',
            'first_name',
            'last_name',
            'Representative',
            'username',
            'contact_email',
            'case_role_name',
            'Representative',
            HearingRoleCodes.Representative,
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678',
            'interpretee',
            false,
            null
        );

        expect(model.isRepresenting).toBeTruthy();
    });

    it('should return false when user is not representative', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'externalRefId',
            'title',
            'first_name',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'case_role_name',
            'Individual',
            HearingRoleCodes.Applicant,
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678',
            'interpretee',
            false,
            null
        );

        expect(model.isRepresenting).toBeFalsy();
    });
    it('should return false when case role is none', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'externalRefId',
            'title',
            'first_name',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'none',
            'Individual',
            HearingRoleCodes.Applicant,
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678',
            'interpretee',
            false,
            null
        );
        expect(model.showCaseRole()).toBeFalsy();
    });
    it('should return false when case role is staff member', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'externalRefId',
            'title',
            'first_name',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'Staff Member',
            'Individual',
            HearingRoleCodes.StaffMember,
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678',
            'staffmember',
            false,
            null
        );
        expect(model.showCaseRole()).toBeFalsy();
    });
    it('should return false when case role is observer', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'externalRefId',
            'title',
            'first_name',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'observer',
            'Individual',
            HearingRoleCodes.Observer,
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678',
            'interpretee',
            false,
            null
        );
        expect(model.showCaseRole()).toBeFalsy();
    });
    it('should return true when case role is representative', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'externalRefId',
            'title',
            'first_name',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'Representative',
            'Individual',
            HearingRoleCodes.Representative,
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678',
            'interpretee',
            false,
            null
        );
        expect(model.showCaseRole()).toBeTruthy();
    });
    it('should return true when hearing role is interpreter', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'externalRefId',
            'title',
            'first_name',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'Citizen',
            'Interpreter',
            HearingRoleCodes.Interpreter,
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678',
            'interpretee',
            false,
            null
        );
        expect(model.isInterpreter).toBeTruthy();
    });
    it('should return true when hearing role is interpreter', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'externalRefId',
            'title',
            'first_name',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            'Citizen',
            'Interpreter',
            HearingRoleCodes.Interpreter,
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678',
            'interpretee',
            false,
            null
        );
        expect(model.isRepOrInterpreter).toBeTruthy();
    });
    it('should not show case role when case role name is null', () => {
        const model = new ParticipantDetailsModel(
            'id',
            'externalRefId',
            'title',
            'first_name',
            'last_name',
            'user_role_name',
            'username',
            'contact_email',
            null,
            'Interpreter',
            HearingRoleCodes.Interpreter,
            'display_name',
            'middle_names',
            'organisation',
            'representee',
            '007867678678',
            'interpretee',
            false,
            null
        );
        expect(model.showCaseRole()).toBeFalsy();
    });
});
