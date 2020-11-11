// represents case role for a given hearing case type.
export class PartyModel {
    constructor(name: string) {
        this.name = name;
        this.hearingRoles = [];
    }

    name: string;
    hearingRoles: Array<string>;
}
