import { EmailValidationService } from './email-validation.service';

describe('EmailValidationService', () => {
    const service = new EmailValidationService();

    it('should validate email and return true', () => {
        expect(service.validateEmail('correct.email@test.com', 'invalid.pattern')).toBe(true);
    });
    it('should validate email and return false if it has invalid pattern', () => {
        expect(service.validateEmail('invalid.email@invalid.pattern', 'invalid.pattern')).toBe(false);
    });
    it('should return false if email has not the courtroom account email pattern', () => {
        expect(service.hasCourtroomAccountPattern('correct.email@test.com', 'courtroom.pattern')).toBe(false);
    });
    it('should return true if email has courtroom account pattern', () => {
        expect(service.hasCourtroomAccountPattern('invalid.email@courtroom.pattern', '@courtroom.pattern')).toBe(true);
    });
});
