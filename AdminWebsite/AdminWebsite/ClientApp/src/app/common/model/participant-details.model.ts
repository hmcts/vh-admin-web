import { CaseRoles } from './case-roles';
import { HearingRoleCodes, HearingRoles } from './hearing-roles.model';
import { LinkedParticipant } from '../../services/clients/api-client';
import { InterpreterSelectedDto } from 'src/app/booking/interpreter-form/interpreter-selected.model';
import { ScreeningDto } from 'src/app/booking/screening/screening.model';

export class ParticipantDetailsModel {
    constructor(
        participantId: string,
        externalReferenceId: string,
        title: string,
        firstName: string,
        lastName: string,
        role: string,
        userName: string,
        email: string,
        caseRoleName: string,
        hearingRoleName: string,
        hearingRoleCode: string,
        displayName: string,
        middleNames: string,
        organisation: string,
        representee: string,
        phone: string,
        interpretee: string,
        isInterpretee: boolean,
        linkedParticipants: LinkedParticipant[]
    ) {
        this.ParticipantId = participantId;
        this.ExternalReferenceId = externalReferenceId;
        this.FirstName = firstName ?? '';
        this.LastName = lastName ?? '';
        this.Title = title ?? '';
        this.UserRoleName = role;
        this.UserName = userName;
        this.Flag = false;
        this.Email = email;
        this.CaseRoleName = caseRoleName;
        this.HearingRoleName = hearingRoleName;
        this.HearingRoleCode = hearingRoleCode;
        this.DisplayName = displayName;
        this.MiddleNames = middleNames;
        this.Representee = representee;
        this.Company = organisation;
        this.Phone = phone;
        this.Interpretee = interpretee;
        this.IsInterpretee = isInterpretee;
        this.LinkedParticipants = linkedParticipants;
    }

    ParticipantId: string;
    ExternalReferenceId: string;
    Title: string;
    FirstName: string;
    LastName: string;
    UserRoleName: string;
    UserName: string;
    Email: string;
    CaseRoleName: string;
    HearingRoleName: string;
    HearingRoleCode: string;
    DisplayName: string;
    MiddleNames: string;
    Representee: string;
    Company: string;
    Phone: string;
    Interpretee: string;
    IsInterpretee: boolean;
    InterpretationLanguage: InterpreterSelectedDto;
    Screening: ScreeningDto;
    LinkedParticipants: LinkedParticipant[];
    // flag to indicate if participant is the last in the list and don't need decoration bottom line
    Flag: boolean;

    // use to set unique id of the html element
    IndexInList: number;

    get fullName(): string {
        let fullName = `${this.Title} ${this.FirstName} ${this.LastName}`;
        if (this.Title === 'Judge' && (this.FirstName.indexOf('Judge') > -1 || this.LastName.indexOf('Judge') > -1)) {
            fullName = `${this.FirstName} ${this.LastName}`;
        }
        return fullName;
    }

    get isRepresenting() {
        return this.UserRoleName && this.UserRoleName.indexOf('Representative') > -1 && !!this.Representee;
    }

    showCaseRole(): boolean {
        if (!this.CaseRoleName) {
            return false;
        }

        return !(
            this.CaseRoleName.toLowerCase() === CaseRoles.NONE.toLowerCase() ||
            this.CaseRoleName.toLowerCase() === CaseRoles.OBSERVER.toLowerCase() ||
            this.CaseRoleName.toLowerCase() === CaseRoles.PANEL_MEMBER.toLowerCase() ||
            this.CaseRoleName.toLowerCase() === CaseRoles.STAFF_MEMBER.toLowerCase()
        );
    }

    get isInterpreter(): boolean {
        return (
            (this.HearingRoleName && this.HearingRoleName.toLowerCase().trim() === HearingRoles.INTERPRETER) ||
            (this.HearingRoleCode && this.HearingRoleCode === HearingRoleCodes.Interpreter)
        );
    }

    get isJudge(): boolean {
        return this.HearingRoleName && this.HearingRoleName.toLowerCase().trim() === HearingRoles.JUDGE;
    }

    get isRepOrInterpreter(): boolean {
        return (
            (this.HearingRoleName &&
                (this.HearingRoleName.toLowerCase().trim() === HearingRoles.INTERPRETER ||
                    this.HearingRoleName.toLowerCase().trim() === HearingRoles.REPRESENTATIVE)) ||
            (this.HearingRoleCode &&
                (this.HearingRoleCode === HearingRoleCodes.Interpreter || this.HearingRoleCode === HearingRoleCodes.Representative))
        );
    }

    get isInterpretee(): boolean {
        return this.IsInterpretee;
    }
}
