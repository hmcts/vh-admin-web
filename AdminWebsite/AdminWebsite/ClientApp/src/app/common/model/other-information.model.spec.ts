import { OtherInformationModel } from './other-information.model';

describe('OtherInformationModel', () => {
    it('should convert properies of json object to camel case', () => {
        const jsonString = JSON.stringify({ JudgeEmail: 'email@test.com', JudgePhone: '1234567890' });
        const jsonObj = OtherInformationModel.init(jsonString);
        expect(jsonObj.judgeEmail).toBe('email@test.com');
        expect(jsonObj.judgePhone).toBe('1234567890');
    });
});
