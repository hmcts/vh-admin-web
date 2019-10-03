import { ConsoleLogger } from './console-logger';

describe('ConsoleLogger', () => {
  const logger: ConsoleLogger = new ConsoleLogger();

  it('can log events', () => {
    logger.trackEvent('testEvent');
  });

  it('can log events with properties', () => {
    logger.trackEvent('testEvent', { property: 'value' });
  });

  it('can log error', () => {
    logger.trackException('this is a test error', new Error('this is a test error'));
  });

  it('can log error with properties', () => {
    logger.trackException('this is a test error', new Error('this is a test error'), { property: 'value' });
  });
});
