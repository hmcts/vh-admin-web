import { TestBed, inject } from '@angular/core/testing';
import { ChecklistService } from './checklist.service';
import { BHClient } from '../services/clients/api-client';

const client = {
};

describe('ChecklistService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChecklistService,
        { provide: BHClient, useValue: client }
      ]
    });
  });

  it('should be created', inject([ChecklistService], (service: ChecklistService) => {
    expect(service).toBeTruthy();
  }));
});
