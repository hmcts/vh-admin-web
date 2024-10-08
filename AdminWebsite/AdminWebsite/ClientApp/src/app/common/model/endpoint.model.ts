import { InterpreterSelectedDto } from 'src/app/booking/interpreter-form/interpreter-selected.model';
import { ScreeningDto } from 'src/app/booking/screening/screening.model';

export class EndpointModel {
    id?: string | undefined;
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
