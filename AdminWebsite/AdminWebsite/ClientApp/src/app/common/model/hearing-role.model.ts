export class HearingRoleModel {
    name: string;
    userRole: string;
    code: string;
    welshName: string;

    constructor(name: string, userRole: string, code?: string) {
        this.name = name;
        this.userRole = userRole;
        this.code = code;
    }
}
