import { TestBed } from '@angular/core/testing';

import { ParticipantMapperService } from './participant-mapper.service';

describe('ParticipantMapperService', () => {
  let service: ParticipantMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParticipantMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
