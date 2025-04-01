import { InterpreterSelectedDto } from 'src/app/booking/interpreter-form/interpreter-selected.model';
import { ScreeningDto } from 'src/app/booking/screening/screening.model';
import { v4 as uuid } from 'uuid';

export class EndpointModel {
    externalReferenceId: string;
    id?: string;

    constructor(externalReferenceId: string) {
        this.externalReferenceId = externalReferenceId || uuid();
    }
    displayName?: string;
    sip?: string;
    pin?: string;
    participants_linked?: string[];
    username?: string;
    contactEmail?: string;
    interpretationLanguage: InterpreterSelectedDto;
    screening?: ScreeningDto;
}
