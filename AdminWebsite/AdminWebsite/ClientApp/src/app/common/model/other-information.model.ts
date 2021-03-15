import { PipeStringifierService } from 'src/app/services/pipe-stringifier.service';

export class OtherInformationModel {
    JudgeEmail?: string;
    JudgePhone?: string;
    OtherInformation?: string;

    static init(otherInformation: string): OtherInformationModel {
        let otherInfo: OtherInformationModel = {};
        const stringifier = new PipeStringifierService();
        try {
            otherInfo = stringifier.decode(otherInformation);
        } catch (error) {
            otherInfo.JudgeEmail = null;
            otherInfo.JudgePhone = null;
            otherInfo.OtherInformation = otherInformation;
        }
        return otherInfo;
    }
}
