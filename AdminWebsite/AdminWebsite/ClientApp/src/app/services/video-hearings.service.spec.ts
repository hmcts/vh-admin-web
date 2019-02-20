import { TestBed, inject } from '@angular/core/testing';
import { HttpClientModule } from '@angular/common/http';
import { VideoHearingsService } from './video-hearings.service';

describe('Hearing Request Storage', () => {
  const newRequestKey = 'bh-newRequest';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [VideoHearingsService]
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create new hearing when persistence storage is empty', inject([VideoHearingsService], (service: VideoHearingsService) => {
    const currentRequest = service.getCurrentRequest();
    const cachedRequest = sessionStorage.getItem(newRequestKey);
    expect(currentRequest).toBeDefined();
    expect(cachedRequest).toBeNull();
  }));

  it('should persist hearing request on update and remove on cancellation',
    inject([VideoHearingsService], (service: VideoHearingsService) => {
    const currentRequest = service.getCurrentRequest();
    service.updateHearingRequest(currentRequest);
    let cachedRequest = sessionStorage.getItem(newRequestKey);
    expect(cachedRequest).toBeDefined();
    service.cancelRequest();
    cachedRequest = sessionStorage.getItem(newRequestKey);
    expect(cachedRequest).toBeNull();
  }));
});
