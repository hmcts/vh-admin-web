'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var BookingBaseComponent = /** @class */ (function () {
    function BookingBaseComponent(bookingService, router) {
        this.bookingService = bookingService;
        this.router = router;
        this.editMode = false;
    }
    BookingBaseComponent.prototype.ngOnInit = function () {
        var editModeParameter = this.bookingService.isEditMode();
        this.editMode = editModeParameter;
        this.buttonAction = this.editMode ? 'Save' : 'Next';
    };
    BookingBaseComponent.prototype.navigateToSummary = function () {
        this.resetEditMode();
        this.router.navigate([PageUrls.Summary]);
    };
    BookingBaseComponent.prototype.resetEditMode = function () {
        this.bookingService.resetEditMode();
        this.editMode = false;
    };
    return BookingBaseComponent;
})();
exports.BookingBaseComponent = BookingBaseComponent;
//# sourceMappingURL=booking-base.component.js.map
