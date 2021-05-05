import { OtherInformationModel } from './other-information.model';

describe('OtherInformationModel', () => {
    it('should set values to null if nothing provided', () => {
        const model = OtherInformationModel.init('');

        expect(model.JudgeEmail).toBeNull();
        expect(model.JudgePhone).toBeNull();
        expect(model.OtherInformation).toBeNull();
    });

    it('should set values to null if nothing provided', () => {
        const judgeEmail = 'test@test.com';
        const judgePhone = '123';
        const otherInformation = 'otherInfo';

        const model = OtherInformationModel.init(`|JudgeEmail|${judgeEmail}|JudgePhone|${judgePhone}|OtherInformation|${otherInformation}`);

        expect(model.JudgeEmail).toEqual(judgeEmail);
        expect(model.JudgePhone).toEqual(judgePhone);
        expect(model.OtherInformation).toEqual(otherInformation);
    });
});
