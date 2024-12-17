export class CaseModel {
    constructor(name?: string, number?: string) {
        this.name = name;
        this.number = number;
    }

    number?: string;
    name?: string;
    isLeadCase?: boolean;
}
