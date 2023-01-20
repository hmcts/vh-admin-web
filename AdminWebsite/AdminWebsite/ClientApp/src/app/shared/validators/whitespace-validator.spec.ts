import { ValidateForWhiteSpace } from './whitespace-validator';
import { UntypedFormControl } from '@angular/forms';

describe('ValidateForWhiteSpace', () => {
    it('should be a valid input', () => {
        const result = ValidateForWhiteSpace(new UntypedFormControl('123456'));
        expect(result).toBe(null);
    });
    it('should be an invalid input for characters less than 3', () => {
        const result = ValidateForWhiteSpace(new UntypedFormControl('12'));
        expect(result.validInput).toBe(true);
    });
    it('should be an invalid input for white space only input', () => {
        const result = ValidateForWhiteSpace(new UntypedFormControl('     '));
        expect(result.validInput).toBe(true);
    });
    it('should be a valid input with leading white spaces', () => {
        const result = ValidateForWhiteSpace(new UntypedFormControl('    123456'));
        expect(result).toBe(null);
    });
    it('should be an invalid input with leading  and trailing white spaces, but with less than 3 characters', () => {
        const result = ValidateForWhiteSpace(new UntypedFormControl('    12    '));
        expect(result.validInput).toBe(true);
    });
    it('should be an invalid input with leading white spaces, but with 3 characters', () => {
        const result = ValidateForWhiteSpace(new UntypedFormControl('    123    '));
        expect(result).toBe(null);
    });
});
