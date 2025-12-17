'use strict';

const { humanizeDuration, humanizeRecurrence } = require('../utils/format');

describe('humanizeDuration', () => {
  test('parses hours and minutes', () => {
    expect(humanizeDuration('PT1H30M')).toBe('1 hour 30 minutes');
  });

  test('parses days and seconds', () => {
    expect(humanizeDuration('P2DT15S')).toBe('2 days 15 seconds');
  });

  test('returns input for invalid strings', () => {
    expect(humanizeDuration('invalid')).toBe('invalid');
  });

  test('returns empty for non-string', () => {
    expect(humanizeDuration(123)).toBe('');
  });
});

describe('humanizeRecurrence', () => {
  test('parses daily recurrence', () => {
    const rawRule = { $t: 'FREQ=DAILY;INTERVAL=1' };
    expect(humanizeRecurrence(rawRule)).toMatch(/every day/i);
  });

  test('parses weekly recurrence with interval', () => {
    const rawRule = { $t: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE' };
    const result = humanizeRecurrence(rawRule);
    expect(result).toMatch(/every 2 weeks on Monday, Wednesday/i);
  });

  test('parses default weekly recurrence', () => {
    const rawRule = { every: '0', $t: 'FREQ=WEEKLY;INTERVAL=1;WKST=SU' };
    expect(humanizeRecurrence(rawRule)).toMatch(/every week/i);
  });

  test('returns raw for invalid rule', () => {
    const rawRule = { $t: 'invalid' };
    expect(humanizeRecurrence(rawRule)).toBe('invalid');
  });

  test('empty when no $t', () => {
    expect(humanizeRecurrence({ every: '1' })).toBe('');
  });
});

describe('humanizeRecurrence additional input types', () => {
  test('parses recurrence from stringified JSON', () => {
    const str = '{"$t":"FREQ=WEEKLY;INTERVAL=1;WKST=SU"}';
    expect(humanizeRecurrence(str)).toMatch(/every week/i);
  });

  test('parses recurrence from raw rule string', () => {
    const raw = 'FREQ=DAILY;INTERVAL=1';
    expect(humanizeRecurrence(raw)).toMatch(/every day/i);
  });

  test('returns empty for non-rule string without JSON', () => {
    expect(humanizeRecurrence('not a rule')).toBe('');
  });
});