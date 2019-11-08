export function SanitizeInputText(inputValue: string): string {
  const replaceText = ['select', 'delete', 'trunc', 'update', 'insert', 'join', 'drop'];

  const pattern = /(&nbsp;|<([^>]+)>)/ig;
  if (inputValue) {
    let text = inputValue.replace(pattern, '');

    replaceText.forEach(x => {
      text = text.replace(x, '');
    });

    return text;
  }
  return null;
}
