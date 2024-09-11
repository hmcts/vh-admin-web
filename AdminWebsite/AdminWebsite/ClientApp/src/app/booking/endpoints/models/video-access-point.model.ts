import { InterpreterSelectedDto } from '../../interpreter-form/interpreter-selected.model';
import { ScreeningDto } from '../../screening/screening.model';

export interface VideoAccessPointDto {
    id?: string;
    displayName: string;
    defenceAdvocate?: EndpointLink;
    interpretationLanguage: InterpreterSelectedDto; // This should not be optional once the backend is implemented
    screening: ScreeningDto;
}

export interface EndpointLink {
    email: string;
    displayName: string;
}
