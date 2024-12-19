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
    first_name?: string;
    last_name?: string;
    middle_names?: string;
    display_name?: string;
    username?: string;
    email?: string;
    hearing_role_name?: string;
    hearing_role_code?: string;
    phone?: string;
    representee?: string;
    company?: string;
    is_exist_person?: boolean;
    interpreterFor?: string;
    linked_participants?: LinkedParticipantModel[];
    interpretee_name?: string;
    is_interpretee?: boolean;
    user_role_name?: string;
    is_courtroom_account?: boolean;
    addedDuringHearing?: boolean;
    contact_email?: string;
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
        return `${this.title} ${this.first_name} ${this.last_name}`;
    }

    get isRepresenting() {
        return this.user_role_name && this.user_role_name.indexOf('Representative') > -1 && !!this.representee;
    }

    get isInterpreter(): boolean {
        return (
            (this.hearing_role_name && this.hearing_role_name.toLowerCase().trim() === HearingRoles.INTERPRETER) ||
            (this.hearing_role_code && this.hearing_role_code === HearingRoleCodes.Interpreter)
        );
    }

    get isRepOrInterpreter(): boolean {
        return (
            (this.hearing_role_name &&
                (this.hearing_role_name.toLowerCase().trim() === HearingRoles.INTERPRETER ||
                    this.hearing_role_name.toLowerCase().trim() === HearingRoles.REPRESENTATIVE)) ||
            (this.hearing_role_code &&
                (this.hearing_role_code === HearingRoleCodes.Interpreter || this.hearing_role_code === HearingRoleCodes.Representative))
        );
    }

    get isStaffMember(): boolean {
        return this.hearing_role_code && this.hearing_role_code === HearingRoleCodes.StaffMember;
    }

    // Kept in for compatibility with the existing code
    get is_judge(): boolean {
        return this.hearing_role_name && this.hearing_role_name.toLowerCase().trim() === HearingRoles.JUDGE;
    }

    get IsEmailEjud(): boolean {
        return this.email?.toLowerCase().includes('judiciary') ?? false;
    }

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
            first_name: firstName,
            last_name: lastName,
            user_role_name: role,
            username: userName,
            email: email,
            hearing_role_name: hearingRoleName,
            hearing_role_code: hearingRoleCode,
            display_name: displayName,
            middle_names: middleNames,
            company: organisation,
            representee: representee,
            phone: phone,
            interpretee_name: interpretee,
            is_interpretee: isInterpretee,
            linked_participants: linkedParticipants
        });
    }

    clone(): this {
        return cloneWithGetters(this);
    }
}
