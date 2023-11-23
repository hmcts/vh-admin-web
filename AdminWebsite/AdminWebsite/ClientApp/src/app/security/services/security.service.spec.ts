import { SecurityConfigService } from './security-config.service';

describe('SecurityService', () => {
  it('should create an instance', () => {
    expect(new SecurityConfigService(null)).toBeTruthy();
  });
});
