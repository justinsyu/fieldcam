export async function extractText(imageBase64: string): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_VISION_API_KEY not set');

  const res = await fetch('https://vision.googleapis.com/v1/images:annotate?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{ image: { content: imageBase64 }, features: [{ type: 'TEXT_DETECTION' }] }],
    }),
  });

  const data = await res.json();
  return data.responses?.[0]?.textAnnotations?.[0]?.description ?? '';
}
