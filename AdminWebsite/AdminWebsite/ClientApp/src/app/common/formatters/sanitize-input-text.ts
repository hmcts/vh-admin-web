export function SanitizeInputText(inputValue: string): string {
  const pattern = /(&nbsp;|<([^>]+)>)/ig;
  return inputValue ? inputValue.replace(pattern, '') : null;
}
