import { WindowRef, WindowLocation } from './window-ref';

describe('WindowRef', () => {
  it('should get url from browser', () => {
    const window = new WindowRef();
    // the jasmine test url
    expect(window.getLocation().href).toBe('/context.html');
  });
});

describe('WindowLocation', () => {
    it('should concatenate to url', () => {
        const location = new WindowLocation('/url', '?param=value1', '#anchor');
        expect(location.href).toBe('/url?param=value1#anchor');
    });

    it('should concatenate to url without search and hash', () => {
        const location = new WindowLocation('/url');
        expect(location.href).toBe('/url');
    });
});
