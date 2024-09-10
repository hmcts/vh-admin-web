export type SpecialMeasureType = 'All' | 'Specific';

export interface SpecialMeasuresuremensDto {
    measureType: SpecialMeasureType;
    protectFrom: {
        contactEmail: string;
    }[];
}

export interface SelectedSpecialMeasuresuremensDto {
    participantDisplayName: string;
    measureType: SpecialMeasureType;
    protectFrom: {
        contactEmail: string;
    }[];
}
