import { mapScreeningResponseToScreeningDto, ScreeningDto } from './screening.model';
import {
    IScreeningResponse,
    ScreeningType as ApiScreeningType,
    ScreeningResponse,
    ProtectFromResponse
} from 'src/app/services/clients/api-client';

describe('Screening Model', () => {
    describe('mapScreeningResponseToScreeningDto', () => {
        it('should return undefined if response is null or undefined', () => {
            expect(mapScreeningResponseToScreeningDto(null)).toBeUndefined();
            expect(mapScreeningResponseToScreeningDto(undefined)).toBeUndefined();
        });

        it('should map IScreeningResponse to ScreeningDto correctly', () => {
            const response: IScreeningResponse = new ScreeningResponse({
                type: ApiScreeningType.All,
                protect_from_endpoints: [],
                protect_from_participants: []
            });

            const expectedDto: ScreeningDto = {
                measureType: 'All',
                protectFrom: []
            };

            const result = mapScreeningResponseToScreeningDto(response);
            expect(result).toEqual(expectedDto);
        });

        it('should map IScreeningResponse with Specific type to ScreeningDto correctly', () => {
            const response: IScreeningResponse = {
                type: ApiScreeningType.Specific,
                protect_from_endpoints: [
                    new ProtectFromResponse({ value: 'Endpoint1', id: '1' }),
                    new ProtectFromResponse({ value: 'Endpoint2', id: '2' })
                ],
                protect_from_participants: [
                    new ProtectFromResponse({ value: 'Participant1', id: '3' }),
                    new ProtectFromResponse({ value: 'Participant2', id: '4' })
                ]
            };

            const expectedDto: ScreeningDto = {
                measureType: 'Specific',
                protectFrom: [
                    { endpointDisplayName: 'Endpoint1', participantContactEmail: undefined },
                    { endpointDisplayName: 'Endpoint2', participantContactEmail: undefined },
                    { endpointDisplayName: undefined, participantContactEmail: 'Participant1' },
                    { endpointDisplayName: undefined, participantContactEmail: 'Participant2' }
                ]
            };

            const result = mapScreeningResponseToScreeningDto(response);
            expect(result).toEqual(expectedDto);
        });
    });
});
