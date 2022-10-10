import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { SharedModule } from './shared.module';

describe('SharedModule', () => {
    let sharedModule: SharedModule;

    beforeEach(() => {
        const library = new FaIconLibrary();
        sharedModule = new SharedModule(library);
    });

    it('should create an instance', () => {
        expect(sharedModule).toBeTruthy();
    });
});
