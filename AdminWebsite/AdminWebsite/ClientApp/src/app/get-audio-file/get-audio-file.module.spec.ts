import { GetAudioFileModule } from './get-audio-file.module';

describe('TestingModule', () => {
    let getAudioFileModule: GetAudioFileModule;

    beforeEach(() => {
        getAudioFileModule = new GetAudioFileModule();
    });

    it('should create an instance', () => {
        expect(getAudioFileModule).toBeTruthy();
    });
});
