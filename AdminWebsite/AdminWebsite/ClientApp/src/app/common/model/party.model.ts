import { HearingRoleModel } from './hearing-role.model';

// represents case role for a given hearing Service.
export class PartyModel {
    constructor(name: string) {
        this.name = name;
        this.hearingRoles = [];
    }

    name: string;
    hearingRoles: Array<HearingRoleModel>;
}
