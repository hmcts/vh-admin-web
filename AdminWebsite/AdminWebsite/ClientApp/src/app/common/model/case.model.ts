export class CaseModel {
    number?: string;
    name?: string;
    isLeadCase?: boolean;

    constructor(name?: string, number?: string) {
        this.name = name;
        this.number = number;
    }
}
