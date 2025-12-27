/**
 * Tests for centralized logging utility
 */

import { Logger, logger } from '@/lib/utils/logger';

describe('Logger', () => {
  let consoleSpy: {
    debug: jest.SpyInstance;
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: jest.spyOn(console, 'debug').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('singleton logger', () => {
    it('should be exported as a singleton', () => {
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('log levels', () => {
    it('should log debug messages', () => {
      const testLogger = new Logger();
      testLogger.debug('Debug message');

      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      const testLogger = new Logger();
      testLogger.info('Info message');

      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      const testLogger = new Logger();
      testLogger.warn('Warning message');

      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      const testLogger = new Logger();
      testLogger.error('Error message');

      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('should include error details when provided', () => {
      const testLogger = new Logger();
      const error = new Error('Test error');
      testLogger.error('Something failed', error);

      expect(consoleSpy.error).toHaveBeenCalled();
      const logOutput = consoleSpy.error.mock.calls[0][0];
      expect(logOutput).toContain('Test error');
    });
  });

  describe('context', () => {
    it('should include context in log output', () => {
      const testLogger = new Logger();
      testLogger.info('Message with context', { userId: '123', action: 'login' });

      expect(consoleSpy.info).toHaveBeenCalled();
      const logOutput = consoleSpy.info.mock.calls[0][0];
      expect(logOutput).toContain('123');
      expect(logOutput).toContain('login');
    });

    it('should create child logger with additional context', () => {
      const parentLogger = new Logger({ service: 'api' });
      const childLogger = parentLogger.withContext({ route: '/users' });

      childLogger.info('Request received');

      expect(consoleSpy.info).toHaveBeenCalled();
      const logOutput = consoleSpy.info.mock.calls[0][0];
      expect(logOutput).toContain('api');
      expect(logOutput).toContain('/users');
    });
  });

  describe('factory methods', () => {
    it('should create logger for route', () => {
      const testLogger = new Logger();
      const routeLogger = testLogger.forRoute('/api/analysis');

      routeLogger.info('Handling request');

      expect(consoleSpy.info).toHaveBeenCalled();
      const logOutput = consoleSpy.info.mock.calls[0][0];
      expect(logOutput).toContain('/api/analysis');
    });

    it('should create logger for service', () => {
      const testLogger = new Logger();
      const serviceLogger = testLogger.forService('AnalysisService');

      serviceLogger.info('Processing');

      expect(consoleSpy.info).toHaveBeenCalled();
      const logOutput = consoleSpy.info.mock.calls[0][0];
      expect(logOutput).toContain('AnalysisService');
    });

    it('should create logger for analysis', () => {
      const testLogger = new Logger();
      const analysisLogger = testLogger.forAnalysis('analysis-123');

      analysisLogger.info('Step completed');

      expect(consoleSpy.info).toHaveBeenCalled();
      const logOutput = consoleSpy.info.mock.calls[0][0];
      expect(logOutput).toContain('analysis-123');
    });
  });

  describe('time method', () => {
    it('should log start and completion with duration', () => {
      const testLogger = new Logger();
      const done = testLogger.time('Operation');

      // Simulate some work
      done();

      expect(consoleSpy.debug).toHaveBeenCalled();
      expect(consoleSpy.info).toHaveBeenCalled();

      const startLog = consoleSpy.debug.mock.calls[0][0];
      const endLog = consoleSpy.info.mock.calls[0][0];

      expect(startLog).toContain('Starting: Operation');
      expect(endLog).toContain('Completed: Operation');
      expect(endLog).toContain('durationMs');
    });
  });

  describe('min level filtering', () => {
    it('should respect minimum log level', () => {
      const testLogger = new Logger();
      testLogger.setMinLevel('warn');

      testLogger.debug('Should not appear');
      testLogger.info('Should not appear');
      testLogger.warn('Should appear');
      testLogger.error('Should appear');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });
});
