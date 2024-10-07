import { IScreeningResponse, ScreeningType as ApiScreeningType } from 'src/app/services/clients/api-client';

export type ScreeningType = 'All' | 'Specific';

/**
 * A DTO for the booking model
 */
export interface ScreeningDto {
    measureType: ScreeningType;
    protectFrom: ProtectFrom[];
}

export function mapScreeningResponseToScreeningDto(response: IScreeningResponse): ScreeningDto {
    if (!response) {
        return undefined;
    }

    const mappedProtectFrom = response.protect_from.map(protectFrom => ({
        externalReferenceId: protectFrom
    }));

    return {
        measureType: response.type === ApiScreeningType.All ? 'All' : 'Specific',
        protectFrom: mappedProtectFrom
    };
}

/**
 * A DTO for the selected screening measures between componnents
 */
export interface SelectedScreeningDto {
    participantDisplayName: string;
    measureType: ScreeningType;
    protectFrom: ProtectFrom[];
}

export interface ProtectFrom {
    externalReferenceId: string;
}
