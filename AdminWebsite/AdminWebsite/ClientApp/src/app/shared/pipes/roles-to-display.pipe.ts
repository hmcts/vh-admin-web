import { Pipe, PipeTransform } from '@angular/core';
import { JusticeUserRole } from '../../services/clients/api-client';

@Pipe({
    name: 'rolesToDisplay'
})
export class RolesToDisplayPipe implements PipeTransform {
    transform(roles: JusticeUserRole[]): string {
        let rolesToDisplay = '';
        if (roles.includes(JusticeUserRole.Vho)) {
            rolesToDisplay += 'CSO' + this.addComma(roles.length);
        }
        if (roles.includes(JusticeUserRole.VhTeamLead)) {
            rolesToDisplay += 'ADMIN' + this.addComma(roles.length);
        }
        if (roles.includes(JusticeUserRole.StaffMember)) {
            rolesToDisplay += 'SM';
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
