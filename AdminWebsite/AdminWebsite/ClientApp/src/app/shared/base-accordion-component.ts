/**
 * Base functionality to toggle the display fo some additional details
 */
export class BaseAccordionComponent {
    expanded: boolean;

    toggle() {
        this.expanded = !this.expanded;
    }
}
