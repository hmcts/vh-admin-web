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
    const protectFromEndpointList: ProtectFrom[] = response.protect_from_endpoints.map(protectFrom => ({
        endpointDisplayName: protectFrom.value,
        participantContactEmail: undefined
    }));

    const protectFromParticipantList: ProtectFrom[] = response.protect_from_participants.map(protectFrom => ({
        endpointDisplayName: undefined,
        participantContactEmail: protectFrom.value
    }));

    const combinedProtectFromList: ProtectFrom[] = [...protectFromEndpointList, ...protectFromParticipantList];
    return {
        measureType: response.type === ApiScreeningType.All ? 'All' : 'Specific',
        protectFrom: combinedProtectFromList
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
    participantContactEmail: string;
    endpointDisplayName: string;
}
