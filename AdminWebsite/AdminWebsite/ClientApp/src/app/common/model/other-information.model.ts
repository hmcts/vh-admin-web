export class OtherInformationModel {
    judgeEmail?: string;
    judgePhone?: string;
    otherInformation?: string;

    static init(otherInformation: string): OtherInformationModel {
        let otherInfo: OtherInformationModel = {};

        try {
            otherInfo = JSON.parse(otherInformation);
        } catch (error) {
            otherInfo.judgeEmail = null;
            otherInfo.judgePhone = null;
            otherInfo.otherInformation = otherInformation;
        }
        return otherInfo;
    }
}
