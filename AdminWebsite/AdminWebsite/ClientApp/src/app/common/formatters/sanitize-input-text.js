"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function SanitizeInputText(inputValue) {
    var replaceText = ['select', 'delete', 'trunc', 'update', 'insert', 'join', 'drop'];
    var pattern = /(&nbsp;|<([^>]+)>)/ig;
    if (inputValue) {
        var text_1 = inputValue.replace(pattern, '');
        replaceText.forEach(function (x) {
            text_1 = text_1.replace(x, '');
        });
        return text_1;
    }
    return null;
}
exports.SanitizeInputText = SanitizeInputText;
//# sourceMappingURL=sanitize-input-text.js.map