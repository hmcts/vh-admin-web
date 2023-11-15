import { JudicaryRoleCode } from 'src/app/booking/judicial-office-holders/models/add-judicial-member.model';

export class JudiciaryParticipantDetailsModel {
    constructor(
        public title: string,
        public firstName: string,
        public lastName: string,
        public fullName: string,
        public email: string,
        public telephone: string,
        public personalCode: string,
        public roleCode: JudicaryRoleCode,
        public displayName: string
    ) {}

    get isJudge(): boolean {
        return this.roleCode === 'Judge';
    }
}
