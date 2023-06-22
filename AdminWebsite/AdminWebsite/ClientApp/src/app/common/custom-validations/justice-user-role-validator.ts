import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { JusticeUserRole } from '../../services/clients/api-client';
import { AvailableRole } from '../model/available-role.interface';
import { Constants } from '../constants';

export function justiceUserRoleValidator(availableRoles: AvailableRole[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const valuesArray: boolean[] = control.value;

        if (!valuesArray) {
            return null;
        }

        const roles: JusticeUserRole[] = [];
        availableRoles.forEach((item, i) => {
            if (valuesArray[i]) {
                roles.push(item.value);
            }
        });

        if (roles.length === 0) {
            return { errorMessage: Constants.Error.ManageJusticeUsers.RolesCheckBoxAtLeastOne };
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

        return { errorMessage: Constants.Error.ManageJusticeUsers.RolesCheckBoxCSOandAdmin };
    };
}
