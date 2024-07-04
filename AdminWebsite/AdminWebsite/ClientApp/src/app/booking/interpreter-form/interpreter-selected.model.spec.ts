import { AvailableLanguageResponse, InterprepretationType } from 'src/app/services/clients/api-client';
import { InterpreterSelectedDto } from './interpreter-selected.model';

describe('InterpreterSelectedDto', () => {
    describe('fromAvailableLanguageResponse', () => {
        it('should map when response is null', () => {
            // arrange
            const response: AvailableLanguageResponse = null;

            // act
            const result = InterpreterSelectedDto.fromAvailableLanguageResponse(response);

            // assert
            expect(result).toBeNull();
        });

        it('should map when language type is verbal', () => {
            // arrange
            const response = new AvailableLanguageResponse({
                code: 'spa',
                description: 'Spanish',
                type: InterprepretationType.Verbal
            });

            // act
            const result = InterpreterSelectedDto.fromAvailableLanguageResponse(response);

            // assert
            expect(result).not.toBeNull();
            expect(result.spokenLanguageCode).toBe(response.code);
            expect(result.spokenLanguageCodeDescription).toBe(response.description);
            expect(result.signLanguageCode).toBeNull();
            expect(result.signLanguageDescription).toBeNull();
            expect(result.interpreterRequired).toBeTrue();
        });

        it('should map when language type is sign', () => {
            // arrange
            const response = new AvailableLanguageResponse({
                code: 'bfi',
                description: 'British Sign Language (BSL)',
                type: InterprepretationType.Sign
            });

            // act
            const result = InterpreterSelectedDto.fromAvailableLanguageResponse(response);

            // assert
            expect(result).not.toBeNull();
            expect(result.spokenLanguageCode).toBeNull();
            expect(result.spokenLanguageCodeDescription).toBeNull();
            expect(result.signLanguageCode).toBe(response.code);
            expect(result.signLanguageDescription).toBe(response.description);
            expect(result.interpreterRequired).toBeTrue();
        });
    });
});
