export class OtherInformationModel {
    judgeEmail?: string;
    judgePhone?: string;
    otherInformation?: string;

    static init(otherInformation: string): OtherInformationModel {
        let otherInfo: OtherInformationModel = {};

        try {
            otherInfo = this.toCamel(JSON.parse(otherInformation));
        } catch (error) {
            otherInfo.judgeEmail = null;
            otherInfo.judgePhone = null;
            otherInfo.otherInformation = otherInformation;
        }
        return otherInfo;
    }

    static toCamel(objJson) {
        const newObject = {};
        for (const origKey in objJson) {
            if (objJson.hasOwnProperty(origKey)) {
                const newKey = (origKey.charAt(0).toLowerCase() + origKey.slice(1) || origKey).toString();
                newObject[newKey] = objJson[origKey];
            }
        }

        return newObject;
    }
}
