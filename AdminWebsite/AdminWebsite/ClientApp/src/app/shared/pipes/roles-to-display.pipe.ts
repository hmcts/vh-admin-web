import { Pipe, PipeTransform } from '@angular/core';
import { JusticeUserRole } from '../../services/clients/api-client';
import { AvailableRoles } from '../../common/constants';

@Pipe({
    name: 'rolesToDisplay'
})
export class RolesToDisplayPipe implements PipeTransform {
    transform(roles: JusticeUserRole[]): string {
        let rolesToDisplay = '';
        if (roles.includes(AvailableRoles[0].value)) {
            rolesToDisplay += AvailableRoles[0].shortText + this.addComma(roles.length);
        }
        if (roles.includes(AvailableRoles[1].value)) {
            rolesToDisplay += AvailableRoles[1].shortText + this.addComma(roles.length);
        }
        if (roles.includes(AvailableRoles[2].value)) {
            rolesToDisplay += AvailableRoles[2].shortText;
        }
        return rolesToDisplay;
    }

    private addComma(length: number) {
        if (length > 1) {
            return ', ';
        }
        return '';
    }
}
