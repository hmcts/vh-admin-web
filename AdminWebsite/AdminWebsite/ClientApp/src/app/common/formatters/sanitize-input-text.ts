export function SanitizeInputText(inputValue: string): string {
    const pattern = /(&nbsp;|<([^>]+)>)/gi;
    return inputValue ? inputValue.replace(pattern, '') : null;
}
