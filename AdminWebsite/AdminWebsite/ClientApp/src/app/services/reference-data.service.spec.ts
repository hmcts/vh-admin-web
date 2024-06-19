import { inject } from '@angular/core/testing';

import { ReferenceDataService } from './reference-data.service';
import { AvailableLanguageResponse, BHClient, InterprepretationType } from './clients/api-client';
import { of } from 'rxjs';

fdescribe('ReferenceDataService', () => {
    let service: ReferenceDataService;
    let bhClientSpy: jasmine.SpyObj<BHClient>;

    beforeEach(() => {
        bhClientSpy = jasmine.createSpyObj('BHClient', ['getAvailableLanguages']);
        service = new ReferenceDataService(bhClientSpy);
    });

    describe('getAvailableInterpreterLanguages', () => {
        it('should return an array of strings with "English" and "French"', () => {
            const expectedLanguages: AvailableLanguageResponse[] = [
                new AvailableLanguageResponse({ description: 'English', code: 'en', type: InterprepretationType.Verbal }),
                new AvailableLanguageResponse({ description: 'French', code: 'fr', type: InterprepretationType.Verbal }),
                new AvailableLanguageResponse({ description: 'British Sign Language', code: 'bsl', type: InterprepretationType.Sign })
            ];
            bhClientSpy.getAvailableLanguages.and.returnValue(of(expectedLanguages));

            service.getAvailableInterpreterLanguages().subscribe(languages => {
                expect(languages).toEqual(expectedLanguages);
                expect(bhClientSpy.getAvailableLanguages).toHaveBeenCalled();
            });
        });

        it('should return the existing observable if it has already been called', () => {
            const expectedLanguages: AvailableLanguageResponse[] = [
                new AvailableLanguageResponse({ description: 'English', code: 'en', type: InterprepretationType.Verbal }),
                new AvailableLanguageResponse({ description: 'French', code: 'fr', type: InterprepretationType.Verbal }),
                new AvailableLanguageResponse({ description: 'British Sign Language', code: 'bsl', type: InterprepretationType.Sign })
            ];
            bhClientSpy.getAvailableLanguages.and.returnValue(of(expectedLanguages));

            service.getAvailableInterpreterLanguages().subscribe(languages => {
                expect(languages).toEqual(expectedLanguages);
                expect(bhClientSpy.getAvailableLanguages).toHaveBeenCalledTimes(1);
            });

            service.getAvailableInterpreterLanguages().subscribe(languages => {
                expect(languages).toEqual(expectedLanguages);
                expect(bhClientSpy.getAvailableLanguages).toHaveBeenCalledTimes(1);
            });
        });
    });
});
