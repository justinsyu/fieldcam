import { Router } from 'express';
import { extractText } from '../services/ocr';
import { processWithLLM } from '../services/llm';
import { renderTemplate } from '../services/templateEngine';
import { deliverResult } from '../services/delivery';

export const processRouter = Router();

processRouter.post('/', async (req, res) => {
  try {
    const { image, profile, destination, cloudToken, location, folderName } = req.body;

    const extractedText = await extractText(image);

    const prompt = renderTemplate(profile.prompt, {
      extracted_text: extractedText,
      timestamp: new Date().toISOString(),
      location: location ?? '',
      folder_name: folderName ?? '',
    });

    const result = await processWithLLM(prompt);

    await deliverResult({
      text: result,
      destination,
      cloudToken,
      fileName: `processed_${Date.now()}.txt`,
    });

    res.json({ status: 'completed', result: { text: result } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    res.status(500).json({ status: 'failed', error: message });
  }
});
