import { escapeHtml } from './escape-html';

describe('escapeHtml', () => {
  it('neutralises tags, attributes and entities', () => {
    expect(escapeHtml('<a href="https://evil.test" onclick=\'x()\'>Win & claim</a>')).toBe(
      '&lt;a href=&quot;https://evil.test&quot; onclick=&#39;x()&#39;&gt;Win &amp; claim&lt;/a&gt;',
    );
  });

  it('leaves plain text untouched and handles empty values', () => {
    expect(escapeHtml('Anna Petrosyan')).toBe('Anna Petrosyan');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(null)).toBe('');
  });
});
