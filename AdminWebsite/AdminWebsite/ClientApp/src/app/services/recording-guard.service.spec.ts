import { RecordingGuardService } from './recording-guard.service';

describe('RecordingGuardService', () => {
    const service = new RecordingGuardService();
    service.excludedCaseTypes = ['Service one', 'Service two'];

    it('should switch off recording for Service', () => {
        expect(service.switchOffRecording('Service one')).toBe(true);
    });
    it('should not switch off recording for Service', () => {
        expect(service.switchOffRecording('Service four')).toBe(false);
    });
});
