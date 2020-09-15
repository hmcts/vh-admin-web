import { CvpForAudioFileResponse } from '../../services/clients/api-client';

export class CvpAudioSearchModel {
    constructor(apiResponse: CvpForAudioFileResponse) {
        this.fileName = apiResponse.file_name;
        this.sasTokenUri = apiResponse.sas_token_uri;
        this.selected = false;
    }

    fileName: string;
    sasTokenUri: string;
    selected: boolean;
}
