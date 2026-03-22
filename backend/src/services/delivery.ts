interface DeliveryOptions {
  text: string;
  destination: { provider: string; folderId?: string; email?: string };
  cloudToken: string;
  fileName: string;
}

export async function deliverResult(options: DeliveryOptions): Promise<void> {
  const { text, destination, cloudToken, fileName } = options;

  // Upload to cloud storage if folderId provided
  if (destination.folderId) {
    await uploadTextToCloud(text, fileName, destination.provider, destination.folderId, cloudToken);
  }

  // Send email if email provided (placeholder - needs SendGrid)
  if (destination.email) {
    console.log(`[EMAIL] Would send to ${destination.email}: ${fileName}`);
    // TODO: Integrate SendGrid
  }
}

async function uploadTextToCloud(text: string, fileName: string, provider: string, folderId: string, token: string): Promise<void> {
  if (provider !== 'gdrive' && provider !== 'google') {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  const metadata = JSON.stringify({ name: fileName, parents: [folderId], mimeType: 'text/plain' });
  const boundary = 'fieldcam_delivery';
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: text/plain\r\n\r\n${text}\r\n` +
    `--${boundary}--`;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) throw new Error(`Cloud delivery failed: ${res.status}`);
}
