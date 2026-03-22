import { renderTemplate } from '../templateEngine';

describe('renderTemplate', () => {
  it('substitutes variables', () => {
    expect(renderTemplate('Hello {{name}}, text: {{extracted_text}}', { name: 'World', extracted_text: 'sample' }))
      .toBe('Hello World, text: sample');
  });
  it('leaves unknown variables as-is', () => {
    expect(renderTemplate('{{known}} and {{unknown}}', { known: 'yes' }))
      .toBe('yes and {{unknown}}');
  });
  it('handles empty template', () => {
    expect(renderTemplate('', {})).toBe('');
  });
  it('handles template with no variables', () => {
    expect(renderTemplate('plain text', { foo: 'bar' })).toBe('plain text');
  });
});
