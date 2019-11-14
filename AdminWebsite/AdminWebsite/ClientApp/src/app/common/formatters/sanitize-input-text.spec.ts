import { SanitizeInputText } from './sanitize-input-text';

describe('SanitizeInputText', () => {
  it('should remove html tags', () => {

    const textTest = '<scrpt>test goes here</script>';
    expect(SanitizeInputText(textTest)).toBe('test goes here');

    const textTest1 = '<div>test goes here';
    expect(SanitizeInputText(textTest1)).toBe('test goes here');
  });
});
