import { RecordingGuardService } from './recording-guard.service';

describe('RecordingGuardService', () => {
    const service = new RecordingGuardService();
    service.excludedCaseTypes = ['case type one', 'case type two'];

    it('should switch off recording for case type', () => {
        expect(service.switchOffRecording('case type one')).toBe(true);
    });
    it('should not switch off recording for case type', () => {
        expect(service.switchOffRecording('case type four')).toBe(false);
    });
});
