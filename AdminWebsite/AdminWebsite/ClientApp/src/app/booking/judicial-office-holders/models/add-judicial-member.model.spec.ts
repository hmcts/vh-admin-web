import { AvailableLanguageResponse, InterprepretationType, JudiciaryParticipantResponse } from 'src/app/services/clients/api-client';
import { JudicialMemberDto } from './add-judicial-member.model';

function createJudiciaryParticipantResponse() {
    return new JudiciaryParticipantResponse({
        title: 'Mr',
        first_name: 'Dan',
        last_name: 'Smith',
        display_name: 'Judge Dan Smith',
        email: 'joh@judge.com',
        full_name: 'Dan Smith',
        personal_code: '1234',
        work_phone: '123123123',
        role_code: 'Judge',
        is_generic: true,
        optional_contact_telephone: '123',
        optional_contact_email: 'optional@email.com',
        interpreter_language: null
    });
}

describe('JudicialMemberDto', () => {
    describe('fromJudiciaryParticipantResponse', () => {
        it('should map judicial member dto from judiciary participant response', () => {
            // arrange
            const response = createJudiciaryParticipantResponse();

            // act
            const result = JudicialMemberDto.fromJudiciaryParticipantResponse(response);

            // assert
            expect(result.firstName).toBe(response.first_name);
            expect(result.lastName).toBe(response.last_name);
            expect(result.fullName).toBe(response.full_name);
            expect(result.email).toBe(response.email);
            expect(result.telephone).toBe(response.work_phone);
            expect(result.personalCode).toBe(response.personal_code);
            expect(result.isGeneric).toBe(response.is_generic);
            expect(result.optionalContactNumber).toBe(response.optional_contact_telephone);
            expect(result.optionalContactEmail).toBe(response.optional_contact_email);
            expect(result.roleCode).toBe(response.role_code);
            expect(result.displayName).toBe(response.display_name);
            expect(result.interpretationLanguage).toBeNull();
        });

        it('should map when judiciary participant has spoken interpreter language', () => {
            // arrange
            const response = createJudiciaryParticipantResponse();
            response.interpreter_language = new AvailableLanguageResponse({
                code: 'spa',
                description: 'Spanish',
                type: InterprepretationType.Verbal
            });

            // act
            const result = JudicialMemberDto.fromJudiciaryParticipantResponse(response);

            // assert
            expect(result.interpretationLanguage).not.toBeNull();
            expect(result.interpretationLanguage.spokenLanguageCode).toBe(response.interpreter_language.code);
            expect(result.interpretationLanguage.spokenLanguageCodeDescription).toBe(response.interpreter_language.description);
            expect(result.interpretationLanguage.signLanguageCode).toBeNull();
            expect(result.interpretationLanguage.signLanguageDescription).toBeNull();
            expect(result.interpretationLanguage.interpreterRequired).toBeTrue();
        });

        it('should map when judiciary participant has sign interpreter language', () => {
            // arrange
            const response = createJudiciaryParticipantResponse();
            response.interpreter_language = new AvailableLanguageResponse({
                code: 'bfi',
                description: 'British Sign Language (BSL)',
                type: InterprepretationType.Sign
            });

            // act
            const result = JudicialMemberDto.fromJudiciaryParticipantResponse(response);

            // assert
            expect(result.interpretationLanguage).not.toBeNull();
            expect(result.interpretationLanguage.signLanguageCode).toBe(response.interpreter_language.code);
            expect(result.interpretationLanguage.signLanguageDescription).toBe(response.interpreter_language.description);
            expect(result.interpretationLanguage.spokenLanguageCode).toBeNull();
            expect(result.interpretationLanguage.spokenLanguageCodeDescription).toBeNull();
            expect(result.interpretationLanguage.interpreterRequired).toBeTrue();
        });
    });
});
