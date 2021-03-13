import { OtherInformationModel } from './other-information.model';

describe('OtherInformationModel', () => {
    it('should convert properies of json object to camel case', () => {
        const jsonString = JSON.stringify({ JudgeEmail: 'email@test.com', JudgePhone: '1234567890' });
        const jsonObj = OtherInformationModel.init(jsonString);
        expect(jsonObj.JudgeEmail).toBe('email@test.com');
        expect(jsonObj.JudgePhone).toBe('1234567890');
    });
});
