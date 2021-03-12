import { PipeStringifierService } from "src/app/services/pipe-stringifier.service";

export class OtherInformationModel {
    judgeEmail?: string;
    judgePhone?: string;
    otherInformation?: string;

    static init(otherInformation: string): OtherInformationModel {
        let otherInfo: OtherInformationModel = {};
        const stringifier = new PipeStringifierService();
        try {
            otherInfo = stringifier.decode(otherInformation);
        } catch (error) {
            otherInfo.judgeEmail = null;
            otherInfo.judgePhone = null;
            otherInfo.otherInformation = otherInformation;
        }
        return otherInfo;
    }
}
