import { InterpreterSelectedDto } from '../../interpreter-form/interpreter-selected.model';
import { ScreeningDto } from '../../screening/screening.model';

export interface VideoAccessPointDto {
    id?: string;
    displayName: string;
    participantsLinked?: EndpointLink[];
    interpretationLanguage: InterpreterSelectedDto; // This should not be optional once the backend is implemented
    screening: ScreeningDto;
    externalReferenceId: string;
}

export interface EndpointLink {
    email: string;
    displayName: string;
}
