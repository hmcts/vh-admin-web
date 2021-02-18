export class OtherInformationModel {
    constructor() {
        this.judgeEmail = '';
        this.judgePhone = '';
        this.otherInformation = '';
    }
    judgeEmail?: string | undefined;
    judgePhone?: string | undefined;
    otherInformation?: string | undefined;

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
