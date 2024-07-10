import { InterpreterSelectedDto } from 'src/app/booking/interpreter-form/interpreter-selected.model';
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

    InterpretationLanguage: InterpreterSelectedDto;

    get isJudge(): boolean {
        return this.roleCode === 'Judge';
    }
}
