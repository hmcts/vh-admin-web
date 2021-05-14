import { PipeStringifierService } from 'src/app/services/pipe-stringifier.service';

export class OtherInformationModel {
    JudgeEmail?: string;
    JudgePhone?: string;
    OtherInformation?: string;

    static init(otherInformation: string): OtherInformationModel {
        let otherInfo: OtherInformationModel = new OtherInformationModel();
        const stringifier = new PipeStringifierService();
        try {
            otherInfo = stringifier.decode(otherInformation);
            if (!otherInfo.JudgeEmail) {
                otherInfo.JudgeEmail = null;
            }
            if (!otherInfo.JudgePhone) {
                otherInfo.JudgePhone = null;
            }
            if (!otherInfo.OtherInformation) {
                otherInfo.OtherInformation = null;
            }
        } catch (error) {
            otherInfo.JudgeEmail = null;
            otherInfo.JudgePhone = null;
            otherInfo.OtherInformation = otherInformation;
        }
        return otherInfo;
    }
}
