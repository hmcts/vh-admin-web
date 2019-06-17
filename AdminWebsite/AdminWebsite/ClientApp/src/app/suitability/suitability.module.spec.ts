import { SuitabilityModule } from './suitability.module';

describe('SuitabilityModule', () => {
  let suitabilityModule: SuitabilityModule;

  beforeEach(() => {
    suitabilityModule = new SuitabilityModule();
  });

  it('should create an instance', () => {
    expect(suitabilityModule).toBeTruthy();
  });
});
