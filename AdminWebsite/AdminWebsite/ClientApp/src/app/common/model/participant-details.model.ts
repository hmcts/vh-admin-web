import { CaseRoles } from '../model/case-roles';
import { HearingRoles } from './hearing-roles.model';

export class ParticipantDetailsModel {
    constructor(
        participantId: string,
        title: string,
        firstName: string,
        lastName: string,
        role: string,
        userName: string,
        email: string,
        caseRoleName: string,
        hearingRoleName: string,
        displayName: string,
        middleNames: string,
        organisation: string,
        representee: string,
        phone: string,
        interpretee: string,
        isInterpretee: boolean
    ) {
        this.ParticipantId = participantId;
        this.FirstName = firstName === null ? '' : firstName;
        this.LastName = lastName === null ? '' : lastName;
        this.Title = title === null ? '' : title;
        this.UserRoleName = role;
        this.UserName = userName;
        this.Flag = false;
        this.Email = email;
        this.CaseRoleName = caseRoleName;
        this.HearingRoleName = hearingRoleName;
        this.DisplayName = displayName;
        this.MiddleNames = middleNames;
        this.Representee = representee;
        this.Company = organisation;
        this.Phone = phone;
        this.Interpretee = interpretee;
        this.IsInterpretee = isInterpretee;
    }

    ParticipantId: string;
    Title: string;
    FirstName: string;
    LastName: string;
    UserRoleName: string;
    UserName: string;
    Email: string;
    CaseRoleName: string;
    HearingRoleName: string;
    DisplayName: string;
    MiddleNames: string;
    Representee: string;
    Company: string;
    Phone: string;
    Interpretee: string;
    IsInterpretee: boolean;

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
        return this.CaseRoleName.toLowerCase() === CaseRoles.NONE.toLowerCase() ||
            this.CaseRoleName.toLowerCase() === CaseRoles.OBSERVER.toLowerCase() ||
            this.CaseRoleName.toLowerCase() === CaseRoles.PANEL_MEMBER.toLowerCase()
            ? false
            : true;
    }

    get isInterpreter(): boolean {
        return this.HearingRoleName && this.HearingRoleName.toLowerCase().trim() === HearingRoles.INTERPRETER;
    }

    get isJudge(): boolean {
        return this.HearingRoleName && this.HearingRoleName.toLowerCase().trim() === HearingRoles.JUDGE;
    }

    get isRepOrInterpreter(): boolean {
        return (
            this.HearingRoleName &&
            (this.HearingRoleName.toLowerCase().trim() === HearingRoles.INTERPRETER ||
                this.HearingRoleName.toLowerCase().trim() === HearingRoles.REPRESENTATIVE)
        );
    }

    get isInterpretee(): boolean {
        return this.IsInterpretee;
    }
}
