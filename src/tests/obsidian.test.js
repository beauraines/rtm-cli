const fs = require('fs');
const path = require('path');
const os = require('os');
const { exportDetails } = require('../cmd/obsidian');

describe('exportDetails', () => {
  const tmpDir = os.tmpdir();
  const idx = 'test123';
  const filePath = path.join(tmpDir, 'rtm', `${idx}.md`);

  afterEach(() => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  test('exports URL only', () => {
    exportDetails(idx, 'http://example.com', []);
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toBe('🔗 [http://example.com](http://example.com)\n\n---\n\n');
  });

  test('exports notes only', () => {
    const notes = [
        {
          id: 114947974,
          created: "2025-12-15T15:51:05.000Z",
          modified: "2025-12-15T15:51:05.000Z",
          title: undefined,
          body: "Duplicate model names from different connections don't display in the drop down"
        }
      ];
    exportDetails(idx, null, notes);
    const expected = `Duplicate model names from different connections don't display in the drop down\n\n---\n\n`;
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toBe(expected);
  });

  test('exports URL and notes', () => {
    const notes = [
        {
          id: 114947974,
          created: "2025-12-15T15:51:05.000Z",
          modified: "2025-12-15T15:51:05.000Z",
          title: undefined,
          body: "Duplicate model names from different connections don't display in the drop down"
        },
        {
          id: 114947974,
          created: "2025-12-15T15:51:05.000Z",
          modified: "2025-12-15T15:51:05.000Z",
          title: "Note 2",
          body: "note 2 body"
        }
      ];
    exportDetails(idx, 'http://ex.com', notes);
    const content = fs.readFileSync(filePath, 'utf-8');
    const expected = [];
    expected.push('🔗 [http://ex.com](http://ex.com)');
    expected.push('');
    expected.push('---');
    expected.push('');
    expected.push(`Duplicate model names from different connections don't display in the drop down`);
    expected.push('');
    expected.push('---');
    expected.push('');
    expected.push('Note 2');
    expected.push('note 2 body');
    expected.push('');
    expected.push('---');
    expected.push('');
    expect(content.split('\n')).toEqual(expected);
  });
});
