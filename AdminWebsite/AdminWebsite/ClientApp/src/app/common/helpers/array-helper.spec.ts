import { convertToNumberArray } from './array-helper';

describe('Array Helper', () => {
    describe('convertToNumberArray', () => {
        it('should convert a string array to a number array', () => {
            const stringArray = ['1', '00', 'hello', ''];
            const expected = [1, 0, NaN, NaN];

            const actual = convertToNumberArray(stringArray);

            expect(expected).toEqual(actual);
        });
    });
});
