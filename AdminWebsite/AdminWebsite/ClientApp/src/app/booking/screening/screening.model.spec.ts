import { mapScreeningResponseToScreeningDto, ScreeningDto } from './screening.model';
import { IScreeningResponse, ScreeningType as ApiScreeningType, ScreeningResponse } from 'src/app/services/clients/api-client';

describe('Screening Model', () => {
    describe('mapScreeningResponseToScreeningDto', () => {
        it('should return undefined if response is null or undefined', () => {
            expect(mapScreeningResponseToScreeningDto(null)).toBeUndefined();
            expect(mapScreeningResponseToScreeningDto(undefined)).toBeUndefined();
        });

        it('should map IScreeningResponse to ScreeningDto correctly', () => {
            const response: IScreeningResponse = new ScreeningResponse({
                type: ApiScreeningType.All,
                protect_from: []
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
                protect_from: ['123', '456', 'abc', 'def']
            };

            const expectedDto: ScreeningDto = {
                measureType: 'Specific',
                protectFrom: [
                    { externalReferenceId: '123' },
                    { externalReferenceId: '456' },
                    { externalReferenceId: 'abc' },
                    { externalReferenceId: 'def' }
                ]
            };

            const result = mapScreeningResponseToScreeningDto(response);
            expect(result).toEqual(expectedDto);
        });
    });
});
