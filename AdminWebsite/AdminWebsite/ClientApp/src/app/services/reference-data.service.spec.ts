import { ReferenceDataService } from './reference-data.service';
import { AvailableLanguageResponse, BHClient, CaseTypeResponse, InterprepretationType } from './clients/api-client';
import { of } from 'rxjs';

describe('ReferenceDataService', () => {
    let service: ReferenceDataService;
    let bhClientSpy: jasmine.SpyObj<BHClient>;

    beforeEach(() => {
        bhClientSpy = jasmine.createSpyObj('BHClient', ['getAvailableLanguages', 'getCaseTypes']);
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

    describe('getCaseTypes', () => {
        it('should return case types', () => {
            const expectedCaseTypes = [
                new CaseTypeResponse({ id: 1, name: 'Civil', service_id: 'CI', is_audio_recording_allowed: true }),
                new CaseTypeResponse({ id: 2, name: 'Family', service_id: 'FA', is_audio_recording_allowed: true }),
                new CaseTypeResponse({ id: 3, name: 'Criminal', service_id: 'CR', is_audio_recording_allowed: true })
            ];
            bhClientSpy.getCaseTypes.and.returnValue(of(expectedCaseTypes));

            service.getCaseTypes().subscribe(caseTypes => {
                expect(caseTypes).toEqual(expectedCaseTypes);
                expect(bhClientSpy.getCaseTypes).toHaveBeenCalled();
            });
        });
    });
});
