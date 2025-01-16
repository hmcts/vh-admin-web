export class CaseTypeModel {
    name: string;
    serviceId: string;
    isAudioRecordingAllowed: boolean;

    constructor(init?: Partial<CaseTypeModel>) {
        Object.assign(this, init);
    }
}
