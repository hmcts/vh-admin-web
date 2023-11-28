import { SecurityService } from './security.service';

describe('SecurityService', () => {
    it('should create an instance', () => {
        expect(new SecurityService(null)).toBeTruthy();
    });
});
