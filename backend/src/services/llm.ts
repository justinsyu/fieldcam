import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function processWithLLM(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });
  const textBlock = message.content.find(b => b.type === 'text');
  return textBlock?.text ?? '';
}
