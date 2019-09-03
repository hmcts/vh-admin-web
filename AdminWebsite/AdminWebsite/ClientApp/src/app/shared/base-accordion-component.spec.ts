import { BaseAccordionComponent } from './base-accordion-component';

describe('BaseAccordionComponent', () => {
    it('should be collapsed by default', () => {
        const accordion = new BaseAccordionComponent();
        expect(accordion.expanded).toBeFalsy();
    });

    it('should toggle when pressed', () => {
        const accordion = new BaseAccordionComponent();
        accordion.toggle();
        expect(accordion.expanded).toBeTruthy();
        accordion.toggle();
        expect(accordion.expanded).toBeFalsy();
    });
});
