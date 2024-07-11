import { AvailableLanguageResponse, InterprepretationType } from 'src/app/services/clients/api-client';

export interface InterpreterSelectedDto {
    interpreterRequired: boolean;
    signLanguageCode?: string;
    signLanguageDescription?: string;
    spokenLanguageCode?: string;
    spokenLanguageCodeDescription?: string;
}

export class InterpreterSelectedDto {
    static fromAvailableLanguageResponse(response: AvailableLanguageResponse) {
        if (!response) {
            return null;
        }

        const dto: InterpreterSelectedDto = {
            interpreterRequired: true,
            spokenLanguageCode: null,
            spokenLanguageCodeDescription: null,
            signLanguageCode: null,
            signLanguageDescription: null
        };
        switch (response.type) {
            case InterprepretationType.Verbal:
                dto.spokenLanguageCode = response.code;
                dto.spokenLanguageCodeDescription = response.description;
                break;
            case InterprepretationType.Sign:
                dto.signLanguageCode = response.code;
                dto.signLanguageDescription = response.description;
                break;
            default:
                throw new Error(`Unknown interpretation type ${response.type}`);
        }

        return dto;
    }
}
