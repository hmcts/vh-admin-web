export function SanitizeInputText(inputValue: string): string {
    const pattern = /(&nbsp;|<([^>]+)>)/gi;
    return inputValue ? inputValue.replace(pattern, '') : null;
}

export function removeSpecialCharacters(value: string): string {
    return value.replace(/[^a-zA-Z0-9_ ]/g, '');
}
