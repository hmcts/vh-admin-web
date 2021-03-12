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

    static toCamel(objJson) {
        const newObject = {};
        for (const origKey in objJson) {
            if (objJson.hasOwnProperty(origKey)) {
                const newKey = (origKey.charAt(0).toUpperCase() + origKey.slice(1) || origKey).toString();
                newObject[newKey] = objJson[origKey];
            }
        }

        return newObject;
    }
}
