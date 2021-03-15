import { TestBed } from '@angular/core/testing';

import { PipeStringifierService } from './pipe-stringifier.service';

describe('PipeStringifierService', () => {
    let service: PipeStringifierService;
    const testString = '|name|test|height|100';
    const testObject = { name: 'test', height: '100' };
    const testEmptyString = '|name||height|100';
    const testEmptyObject = { height: '100' };
    const testThreePropsString = '|name|test|height|100';
    const testThreePropsObject = { name: 'test', height: '100' };
    const testMissingValueString = '|name|height|100';
    const testMissingValueObject = { name: 'height' };
    const testPreserveCaseString = '|nAmE|tEst|height|100';
    const testPreserveCaseObject = { nAmE: 'tEst', height: '100' };
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

    it('should decode a string with an empty value into an object', () => {
        expect(service.decode(testEmptyString)).toEqual(testEmptyObject);
    });

    it('should decode a string with three values into an object', () => {
        expect(service.decode(testThreePropsString)).toEqual(testThreePropsObject);
    });

    it('should decode a string with a missing value into an object', () => {
        expect(service.decode(testMissingValueString)).toEqual(testMissingValueObject);
    });

    it('should decode a string and preserve case', () => {
        expect(service.decode(testPreserveCaseString)).toEqual(testPreserveCaseObject);
    });

    it('should encode an object to a string and preserve case', () => {
        expect(service.encode(testPreserveCaseObject)).toEqual(testPreserveCaseString);
    });
});
