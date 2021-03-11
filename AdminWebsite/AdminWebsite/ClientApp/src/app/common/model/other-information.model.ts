export class OtherInformationModel {
    JudgeEmail?: string;
    JudgePhone?: string;
    otherInformation?: string;

    static init(otherInformation: string): OtherInformationModel {
        let otherInfo: OtherInformationModel = {};

        try {
            otherInfo = JSON.parse(otherInformation);
        } catch (error) {
            otherInfo.JudgeEmail = null;
            otherInfo.JudgePhone = null;
            otherInfo.otherInformation = otherInformation;
        }
        return otherInfo;
    }
}
