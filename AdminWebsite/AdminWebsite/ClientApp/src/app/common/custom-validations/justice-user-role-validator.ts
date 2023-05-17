import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { JusticeUserRole } from '../../services/clients/api-client';
import { Constants } from '../constants';

export function justiceUserRoleValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const roles: JusticeUserRole[] = control.value;

        if (!roles) {
            return null;
        }

        let userRoleValid = true;

        const isVho = roles.includes(JusticeUserRole.Vho);
        const isAdmin = roles.includes(JusticeUserRole.VhTeamLead);
        if (isVho && isAdmin) {
            userRoleValid = false;
        }

        if (userRoleValid) {
            return null;
        }

        return { userRoleInvalid: Constants.Error.ManageJusticeUsers.RolesCheckBox };
    };
}