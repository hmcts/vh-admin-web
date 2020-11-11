import { PopupModule } from './popup.module';

describe('SharedModule', () => {
    let popupModule: PopupModule;

    beforeEach(() => {
        popupModule = new PopupModule();
    });

    it('should create an instance', () => {
        expect(popupModule).toBeTruthy();
    });
});
