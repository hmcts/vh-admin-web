import { TestBed } from '@angular/core/testing';

import { PipeStringifierService } from './pipe-stringifier.service';

describe('PipeStringifierService', () => {
    let service: PipeStringifierService;
    const testString = '|name|test|height|100';
    const testObject = { name: 'test', height: '100' };
    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PipeStringifierService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should encode an object to a string', () => {
        expect(service.encode(testObject)).toEqual(testString);
    });

    it('should decode a string into an object', () => {
        expect(service.decode(testString)).toEqual(testObject);
    });
});
