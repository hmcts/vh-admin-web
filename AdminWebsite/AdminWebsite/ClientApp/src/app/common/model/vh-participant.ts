import { InterpreterSelectedDto } from 'src/app/booking/interpreter-form/interpreter-selected.model';
import { ScreeningDto } from 'src/app/booking/screening/screening.model';
import { LinkedParticipantModel } from './linked-participant.model';
import { HearingRoleCodes, HearingRoles } from './hearing-roles.model';
import { v4 as uuid } from 'uuid';
import { cloneWithGetters } from '../helpers/clone-with-getters';

export class VHParticipant {
    id?: string;
    externalReferenceId?: string;
    title?: string;
    firstName?: string;
    lastName?: string;
    middleNames?: string;
    displayName?: string;
    username?: string;
    email?: string;
    hearingRoleName?: string;
    hearingRoleCode?: string;
    phone?: string;
    representee?: string;
    company?: string;
    isExistPerson?: boolean;
    interpreterFor?: string;
    linkedParticipants?: LinkedParticipantModel[];
    interpreteeName?: string;
    isInterpretee?: boolean;
    userRoleName?: string;
    isCourtroomAccount?: boolean;
    addedDuringHearing?: boolean;
    contactEmail?: string;
    isJudiciaryMember?: boolean;
    interpretation_language: InterpreterSelectedDto;
    screening?: ScreeningDto;
    // flag to indicate if participant is the last in the list and don't need decoration bottom line
    flag?: boolean;

    // use to set unique id of the html element
    indexInList?: number;

    constructor(init?: Partial<VHParticipant>) {
        Object.assign(this, init);
        if (!this.externalReferenceId) {
            this.externalReferenceId = uuid();
        }
    }

    get fullName(): string {
        return `${this.title} ${this.firstName} ${this.lastName}`;
    }

    get isRepresenting() {
        return this.userRoleName && this.userRoleName.indexOf('Representative') > -1 && !!this.representee;
    }

    get isInterpreter(): boolean {
        return (
            (this.hearingRoleName && this.hearingRoleName.toLowerCase().trim() === HearingRoles.INTERPRETER) ||
            (this.hearingRoleCode && this.hearingRoleCode === HearingRoleCodes.Interpreter)
        );
    }

    get isRepOrInterpreter(): boolean {
        return (
            (this.hearingRoleName &&
                (this.hearingRoleName.toLowerCase().trim() === HearingRoles.INTERPRETER ||
                    this.hearingRoleName.toLowerCase().trim() === HearingRoles.REPRESENTATIVE)) ||
            (this.hearingRoleCode &&
                (this.hearingRoleCode === HearingRoleCodes.Interpreter || this.hearingRoleCode === HearingRoleCodes.Representative))
        );
    }

    get isStaffMember(): boolean {
        return this.hearingRoleCode && this.hearingRoleCode === HearingRoleCodes.StaffMember;
    }

    // Kept in for compatibility with the existing code
    get isJudge(): boolean {
        return this.hearingRoleName && this.hearingRoleName.toLowerCase().trim() === HearingRoles.JUDGE;
    }

    get IsEmailEjud(): boolean {
        return this.email?.toLowerCase().includes('judiciary') ?? false;
    }

    // Kept in from the migration to the consolidated models. Can replace with calls to the constructor in time
    static createForDetails(
        id: string,
        externalReferenceId: string,
        title: string,
        firstName: string,
        lastName: string,
        role: string,
        userName: string,
        email: string,
        hearingRoleName: string,
        hearingRoleCode: string,
        displayName: string,
        middleNames: string,
        organisation: string,
        representee: string,
        phone: string,
        interpretee: string,
        isInterpretee: boolean,
        linkedParticipants: LinkedParticipantModel[]
    ): VHParticipant {
        return new VHParticipant({
            id: id,
            externalReferenceId: externalReferenceId,
            title: title,
            firstName: firstName,
            lastName: lastName,
            userRoleName: role,
            username: userName,
            email: email,
            hearingRoleName: hearingRoleName,
            hearingRoleCode: hearingRoleCode,
            displayName: displayName,
            middleNames: middleNames,
            company: organisation,
            representee: representee,
            phone: phone,
            interpreteeName: interpretee,
            isInterpretee: isInterpretee,
            linkedParticipants: linkedParticipants
        });
    }

    clone(): this {
        return cloneWithGetters(this);
    }
}
