const sanitizeTag = require('../utils/sanitizeTag');

describe('sanitizeTag', () => {
  test('replaces leading @ with context/', () => {
    expect(sanitizeTag('@home')).toBe('context/home');
  });

  test('leaves tags without @ unchanged', () => {
    expect(sanitizeTag('work')).toBe('work');
  });

  test('returns context/ for standalone @', () => {
    expect(sanitizeTag('@')).toBe('context/');
  });

  test('handles empty string', () => {
    expect(sanitizeTag('')).toBe('');
  });

  test('non-string inputs are returned as-is', () => {
    expect(sanitizeTag(123)).toBe(123);
    expect(sanitizeTag(null)).toBe(null);
  });
});
