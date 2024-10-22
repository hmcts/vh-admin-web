import { InterpreterSelectedDto } from 'src/app/booking/interpreter-form/interpreter-selected.model';
import { ScreeningDto } from 'src/app/booking/screening/screening.model';
import { v4 as uuid } from 'uuid';

export class EndpointModel {
    externalReferenceId: string;
    id?: string | undefined;

    constructor(externalReferenceId: string) {
        this.externalReferenceId = externalReferenceId || uuid();
    }
    displayName?: string | undefined;
    sip?: string | undefined;
    pin?: string | undefined;
    /**
     * Defence advocate email address, not their ID
     */
    defenceAdvocate?: string | undefined;
    username?: string | undefined;
    contactEmail?: string | undefined;
    interpretationLanguage: InterpreterSelectedDto;
    screening?: ScreeningDto;
}
