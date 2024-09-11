export type ScreeningType = 'All' | 'Specific';

/**
 * A DTO for the booking model
 */
export interface ScreeningDto {
    measureType: ScreeningType;
    protectFrom: ProtectFrom[];
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
